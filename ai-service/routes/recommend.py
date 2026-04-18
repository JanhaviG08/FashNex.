"""
routes/recommend.py  — UPDATED
================================
Changes vs previous version:
  1. OutfitResult now includes:
       - explanation_data: { paragraph, bullets, highlights, confidence }
       - avatar:           { base, layers, hasTop, hasBottom, hasShoe, palette }
  2. _build_outfit_result() calls generate_explanation() and build_avatar_data()
  3. RecommendRequest accepts optional gender field ('neutral'|'male'|'female')
  4. All other logic (ML scoring, caching, fallback) is UNCHANGED.
"""

import logging
import time
from typing import List, Optional

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from core.preprocessing import outfit_to_vector
from core.scoring       import score_outfit
from core.combinator    import generate_combos, filter_combos_by_context
from core.model         import registry, NeuralNetScorer
from core.explainer     import generate_explanation   # ← NEW
from core.avatar        import build_avatar_data, avatar_data_to_dict  # ← NEW

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────

class WardrobeItem(BaseModel):
    _id:         Optional[str] = None
    category:    str           = 'other'
    color:       str           = 'unknown'
    colorFamily: str           = 'neutral'
    season:      str           = 'all-season'
    occasion:    str           = 'all'
    name:        Optional[str] = ''
    imageUrl:    Optional[str] = ''
    publicId:    Optional[str] = ''
    class Config:
        extra = 'allow'


class RecommendRequest(BaseModel):
    wardrobe: List[WardrobeItem]
    season:   str  = Field(default='all-season')
    occasion: str  = Field(default='casual')
    user_id:  str  = Field(default='anonymous')
    top_n:    int  = Field(default=5, ge=1, le=20)
    use_ml:   bool = Field(default=True)
    gender:   str  = Field(default='neutral',
                           description="'neutral' | 'male' | 'female' — affects avatar base")


class ExplanationData(BaseModel):
    paragraph:  str
    bullets:    List[str]
    highlights: List[str]
    confidence: str          # 'excellent' | 'good' | 'fair'


class AvatarLayer(BaseModel):
    slot:     str
    imageUrl: str
    color:    str
    name:     str
    position: dict
    zIndex:   int


class AvatarData(BaseModel):
    base:      str
    layers:    List[AvatarLayer]
    hasTop:    bool
    hasBottom: bool
    hasShoe:   bool
    palette:   List[str]


class OutfitResult(BaseModel):
    items:            List[dict]
    score:            float
    score_1_5:        float
    label:            str
    explanation:      str           # ← kept for backwards compat (plain text)
    explanation_data: ExplanationData  # ← NEW: rich explanation
    breakdown:        dict
    avatar:           AvatarData      # ← NEW: layered avatar data


class RecommendResponse(BaseModel):
    outfits:    List[OutfitResult]
    model_info: dict
    message:    str


class InvalidateRequest(BaseModel):
    user_id: str


# ─────────────────────────────────────────────────────────────────
# HELPER — item dict
# ─────────────────────────────────────────────────────────────────

def _item_to_dict(item: WardrobeItem) -> dict:
    return item.model_dump()


def _build_outfit_items(combo: dict) -> list:
    items = []
    for slot in ('top', 'bottom', 'shoe'):
        item = combo.get(slot, {})
        if item and item.get('category') != 'other':
            items.append({
                '_id':      str(item.get('_id') or ''),
                'category': item.get('category', ''),
                'color':    item.get('color', ''),
                'name':     item.get('name', ''),
                'imageUrl': item.get('imageUrl', ''),
                'season':   item.get('season', ''),
                'occasion': item.get('occasion', ''),
            })
    for extra in combo.get('extras', []):
        items.append({
            '_id':      str(extra.get('_id') or ''),
            'category': extra.get('category', ''),
            'color':    extra.get('color', ''),
            'name':     extra.get('name', ''),
            'imageUrl': extra.get('imageUrl', ''),
            'season':   extra.get('season', ''),
            'occasion': extra.get('occasion', ''),
        })
    return items


# ─────────────────────────────────────────────────────────────────
# CORE RESULT BUILDER — called for every combo
# ─────────────────────────────────────────────────────────────────

def _build_outfit_result(
    combo:           dict,
    final_score:     float,
    rule:            dict,
    target_season:   str,
    target_occasion: str,
    gender:          str = 'neutral',
) -> dict:
    """
    Build the full outfit result dict, including:
      - existing fields (items, score, label, breakdown)
      - NEW: explanation_data (rich multi-part explanation)
      - NEW: avatar (layered image data)
    """
    score_1_5    = round(1.0 + min(1.0, final_score) * 4.0, 1)
    outfit_items = _build_outfit_items(combo)

    # ── Feature 1: Rich explanation ────────────────────────────────────────
    explanation_result = generate_explanation(
        top             = combo.get('top',    {}),
        bottom          = combo.get('bottom', {}),
        shoe            = combo.get('shoe',   {}),
        breakdown       = rule['breakdown'],
        target_season   = target_season,
        target_occasion = target_occasion,
    )

    # ── Feature 2: Avatar layer data ──────────────────────────────────────
    avatar_result = build_avatar_data(combo, gender=gender)
    avatar_dict   = avatar_data_to_dict(avatar_result)

    return {
        'items':       outfit_items,
        'score':       round(final_score, 4),
        'score_1_5':   score_1_5,
        'label':       rule['label'],
        # Backwards-compatible plain text explanation
        'explanation': explanation_result.paragraph,
        # New rich explanation
        'explanation_data': {
            'paragraph':  explanation_result.paragraph,
            'bullets':    explanation_result.bullets,
            'highlights': explanation_result.highlights,
            'confidence': explanation_result.confidence,
        },
        'breakdown': rule['breakdown'],
        # New avatar data
        'avatar': avatar_dict,
    }


# ─────────────────────────────────────────────────────────────────
# POST /recommend
# ─────────────────────────────────────────────────────────────────

@router.post('/recommend', response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    t_start = time.perf_counter()

    wardrobe_dicts = [_item_to_dict(i) for i in req.wardrobe]
    if len(wardrobe_dicts) < 2:
        raise HTTPException(
            status_code=422,
            detail='Upload at least 2 wardrobe items to get recommendations.'
        )

    season   = req.season.lower().strip()
    occasion = req.occasion.lower().strip()
    gender   = req.gender.lower().strip()

    # Step 1: Generate combos
    combos = generate_combos(wardrobe_dicts, max_combos=300)
    combos = filter_combos_by_context(combos, season, occasion)
    if not combos:
        return RecommendResponse(
            outfits=[],
            model_info={'scorer': 'none', 'combos_generated': 0},
            message=f'No outfits found for {occasion} / {season}. Try uploading more items.'
        )

    # Step 2: Get scorer
    scorer_name = 'rule-based'
    scorer      = None
    if req.use_ml:
        try:
            scorer = registry.get_or_train(
                user_id=req.user_id,
                wardrobe=wardrobe_dicts,
                season=season,
                occasion=occasion,
            )
            scorer_name = 'ensemble (DT + NN)' if scorer.nn.is_trained else 'decision-tree'
        except Exception as e:
            logger.error("ML scorer failed, falling back: %s", e)
            scorer = None

    # Step 3: Score combos
    results = []

    if scorer is not None and scorer.is_trained:
        X_rows, valid_combos = [], []
        for combo in combos:
            try:
                X_rows.append(outfit_to_vector(combo['top'], combo['bottom'], combo['shoe']))
                valid_combos.append(combo)
            except Exception:
                pass

        if X_rows:
            X         = np.stack(X_rows, axis=0)
            ml_scores = scorer.predict(X)

            for combo, ml_score in zip(valid_combos, ml_scores):
                rule        = score_outfit(combo['top'], combo['bottom'], combo['shoe'], season, occasion)
                final_score = float(ml_score) * 0.7 + rule['score'] * 0.3
                final_score = round(min(1.0, max(0.0, final_score)), 4)

                results.append(_build_outfit_result(
                    combo, final_score, rule, season, occasion, gender
                ))
    else:
        scorer_name = 'rule-based'
        for combo in combos:
            rule = score_outfit(combo['top'], combo['bottom'], combo['shoe'], season, occasion)
            results.append(_build_outfit_result(
                combo, rule['score'], rule, season, occasion, gender
            ))

    # Step 4: Sort and return
    results.sort(key=lambda r: r['score'], reverse=True)
    top_results  = results[:req.top_n]
    elapsed_ms   = round((time.perf_counter() - t_start) * 1000, 1)

    return RecommendResponse(
        outfits=[OutfitResult(**r) for r in top_results],
        model_info={
            'scorer':           scorer_name,
            'combos_generated': len(combos),
            'combos_scored':    len(results),
            'elapsed_ms':       elapsed_ms,
            'tf_available':     NeuralNetScorer.TF_AVAILABLE,
        },
        message=f'Found {len(top_results)} outfit combination(s) for {occasion} / {season}.'
    )


# ─────────────────────────────────────────────────────────────────
# POST /invalidate
# ─────────────────────────────────────────────────────────────────

@router.post('/invalidate')
async def invalidate_cache(req: InvalidateRequest):
    registry.invalidate(req.user_id)
    return {'message': f'Cache invalidated for user {req.user_id}'}


# ─────────────────────────────────────────────────────────────────
# GET /health
# ─────────────────────────────────────────────────────────────────

@router.get('/health')
async def health():
    return {
        'status':       'ok',
        'tf_available': NeuralNetScorer.TF_AVAILABLE,
        'cached_users': len(registry._scorers),
    }