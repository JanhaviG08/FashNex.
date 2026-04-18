"""
core/explainer.py
=================
Generates rich, dynamic, human-readable explanations for outfit recommendations.

This module is the sole source of truth for explanation text.
It reads from the score breakdown produced by scoring.py and constructs
a multi-part natural language explanation that feels genuinely written,
not template-filled.

Key design rules:
  1. Every sentence is conditional on the actual score values.
  2. Color, season, occasion, and completeness each produce their own phrase.
  3. Phrases vary by score band (excellent / good / fair / poor).
  4. The final explanation is one fluent paragraph, never a bullet list.
  5. No hardcoded outfit names — everything comes from item data.

Public API:
    generate_explanation(outfit_combo, breakdown, target_season, target_occasion)
    → ExplanationResult (dataclass with .paragraph, .bullets, .highlights)
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import random


# ─────────────────────────────────────────────────────────────────
# RESULT TYPE
# ─────────────────────────────────────────────────────────────────

@dataclass
class ExplanationResult:
    """
    Full explanation package returned for each outfit.

    paragraph:  One fluent paragraph (used as the main explanation).
    bullets:    List of short bullet points (used in the detail modal).
    highlights: Key strengths as short phrases for UI badge display.
    confidence: 'excellent' | 'good' | 'fair' — overall confidence label.
    """
    paragraph:  str
    bullets:    List[str]
    highlights: List[str]
    confidence: str


# ─────────────────────────────────────────────────────────────────
# INTERNAL PHRASE BANKS
# ─────────────────────────────────────────────────────────────────

# Color harmony phrases keyed by score band
_COLOR_PHRASES = {
    'excellent': [  # score >= 0.85
        "The {top_color} and {bottom_color} combination is a timeless classic that always looks polished.",
        "{top_color} and {bottom_color} are one of fashion's most trusted colour pairings.",
        "This {top_color} and {bottom_color} combination is visually balanced and immediately eye-catching.",
    ],
    'good': [       # 0.65 <= score < 0.85
        "The neutral tones across the outfit keep everything effortlessly cohesive.",
        "A {family} palette ties these pieces together naturally.",
        "The colours share a tonal harmony that makes the outfit feel intentional.",
    ],
    'fair': [       # 0.45 <= score < 0.65
        "The colours complement each other well within a similar tonal family.",
        "This palette works well for everyday wear, with colours that don't compete.",
        "The combination shows a relaxed but considered approach to colour.",
    ],
    'low': [        # score < 0.45
        "The colours create a bold contrast that works best with confident styling.",
        "The strong colour contrast gives the outfit a distinctive, statement feel.",
    ],
}

# Season match phrases
_SEASON_PHRASES = {
    'perfect': [    # all pieces match
        "Every piece is perfectly suited to {season} conditions.",
        "The outfit is built for {season} — fabrics and silhouettes align with the season.",
        "All three pieces are optimally chosen for {season} wear.",
    ],
    'good': [       # most pieces match
        "The outfit is largely suitable for {season}, with versatile all-season pieces rounding it out.",
        "The core pieces are {season}-appropriate, with supporting items that work across seasons.",
    ],
    'fair': [
        "The outfit can work for {season} with mindful layering or accessorising.",
        "While not exclusively a {season} outfit, it can adapt to the conditions.",
    ],
}

# Occasion match phrases
_OCCASION_PHRASES = {
    'perfect': {
        'casual': [
            "The relaxed styling of each piece reads as genuinely casual and comfortable.",
            "Every item in this outfit is perfectly dialled in for a casual day.",
        ],
        'office': [
            "The outfit strikes the right balance between professional and approachable — perfect for the workplace.",
            "Clean lines and a composed palette make this a confident office choice.",
        ],
        'formal': [
            "The refined styling and considered palette make this outfit ideal for a formal occasion.",
            "Each piece has the elevated, structured quality that a formal setting demands.",
        ],
        'party': [
            "The combination has the visual interest and energy that makes a party outfit memorable.",
            "Bold enough to stand out, cohesive enough to look intentional — a perfect party look.",
        ],
        'all': [
            "The outfit's versatility means it transitions effortlessly across occasions.",
        ],
    },
    'good': {
        'casual':  ["The outfit leans casual with just enough structure to be versatile."],
        'office':  ["The outfit reads as office-appropriate, with pieces that suit a professional environment."],
        'formal':  ["The outfit is appropriate for formal settings, though some pieces offer flexibility."],
        'party':   ["The outfit has enough personality for a party while staying wearable."],
        'all':     ["The outfit adapts comfortably to multiple occasions."],
    },
    'fair': {
        'casual':  ["The outfit has a relaxed feel that suits casual contexts."],
        'office':  ["The outfit works in office settings with the right accessories."],
        'formal':  ["With the right accessories, this outfit can meet formal expectations."],
        'party':   ["The outfit can work for a more relaxed party setting."],
        'all':     ["The outfit is flexible enough to work across different occasions."],
    },
}

# Completeness phrases
_COMPLETENESS_PHRASES = {
    'full': [
        "The outfit is complete — top, bottom, and footwear are all covered.",
        "With topwear, bottomwear, and footwear included, this is a head-to-toe look.",
        "A complete outfit from head to toe with no missing essentials.",
    ],
    'partial': [
        "The outfit covers the core essentials, and footwear from your wardrobe completes the look.",
        "Paired with footwear, this combination forms a strong core outfit.",
    ],
    'minimal': [
        "A strong foundation — adding footwear and accessories will complete the look.",
        "The key pieces are here; footwear would make this a complete outfit.",
    ],
}

# Opening connector phrases
_OPENERS = [
    "This outfit was selected because",
    "Our AI chose this combination because",
    "This look earned a high score because",
    "This outfit ranks highly because",
]


# ─────────────────────────────────────────────────────────────────
# HELPER UTILITIES
# ─────────────────────────────────────────────────────────────────

def _band(score: float) -> str:
    if score >= 0.85: return 'excellent'
    if score >= 0.65: return 'good'
    if score >= 0.45: return 'fair'
    return 'low'


def _season_band(score: float) -> str:
    if score >= 0.95: return 'perfect'
    if score >= 0.65: return 'good'
    return 'fair'


def _occasion_band(score: float) -> str:
    if score >= 0.85: return 'perfect'
    if score >= 0.65: return 'good'
    return 'fair'


def _cap(s: str) -> str:
    return s.capitalize() if s else ''


def _color_family(color: str) -> str:
    warm    = ['red','orange','yellow','pink','coral','brown','gold','rust','burgundy']
    cool    = ['blue','navy','teal','cyan','green','purple','violet','grey','gray','mint','olive']
    neutral = ['white','black','beige','cream','ivory','khaki','tan','camel']
    c = (color or '').lower()
    if any(w in c for w in warm):    return 'warm'
    if any(w in c for w in cool):    return 'cool'
    if any(w in c for w in neutral): return 'neutral'
    return 'neutral'


def _pick(phrases: List[str], **fmt) -> str:
    """Pick a random phrase from the list and format it."""
    try:
        return random.choice(phrases).format(**fmt)
    except (KeyError, IndexError):
        return phrases[0] if phrases else ''


# ─────────────────────────────────────────────────────────────────
# BULLET GENERATOR
# ─────────────────────────────────────────────────────────────────

def _build_bullets(
    top: Dict, bottom: Dict, shoe: Dict,
    breakdown: Dict,
    target_season: str, target_occasion: str,
) -> List[str]:
    """
    Build 3–5 short bullet points for the detail panel.
    Each bullet covers one scoring dimension with specific values.
    """
    bullets = []
    top_color    = _cap(top.get('color', 'item'))
    bottom_color = _cap(bottom.get('color', '')) if bottom.get('category') != 'other' else ''
    shoe_color   = _cap(shoe.get('color', ''))   if shoe.get('category')   != 'other' else ''

    # Color bullet
    cs = breakdown.get('color', 0)
    if cs >= 0.85:
        bullets.append(f"🎨 {top_color} and {bottom_color or shoe_color} are a classic colour pairing")
    elif cs >= 0.65:
        bullets.append(f"🎨 Neutral tones make {top_color} complement everything in this outfit")
    else:
        bullets.append(f"🎨 The colour palette creates a {_color_family(top.get('color',''))} tonal look")

    # Season bullet
    ss = breakdown.get('season', 0)
    season_label = target_season.replace('-', ' ')
    if ss >= 0.95:
        bullets.append(f"🌤️ Every piece is specifically suited to {season_label} conditions")
    elif ss >= 0.65:
        bullets.append(f"🌤️ The outfit is largely appropriate for {season_label}")
    else:
        bullets.append(f"🌤️ The outfit can work for {season_label} with the right layering")

    # Occasion bullet
    os_ = breakdown.get('occasion', 0)
    if os_ >= 0.85:
        bullets.append(f"✅ All pieces are tagged for {target_occasion} — a perfect match")
    elif os_ >= 0.65:
        bullets.append(f"✅ The outfit is appropriate for {target_occasion} settings")
    else:
        bullets.append(f"✅ The outfit can work for {target_occasion} with some styling")

    # Completeness bullet
    comp = breakdown.get('completeness', 0)
    if comp >= 0.95:
        bullets.append("👟 Complete look: top, bottom, and footwear all included")
    elif comp >= 0.65:
        bullets.append("👟 Core pieces covered — add accessories to finish the look")
    else:
        bullets.append("👟 Foundation pieces selected — footwear will complete this outfit")

    # Score summary bullet
    score = breakdown.get('color', 0) * 0.35 + breakdown.get('occasion', 0) * 0.30 + \
            breakdown.get('season', 0) * 0.20 + breakdown.get('completeness', 0) * 0.15
    score_1_5 = round(1.0 + min(1.0, score) * 4.0, 1)
    bullets.append(f"⭐ AI Compatibility Score: {score_1_5}/5.0")

    return bullets


# ─────────────────────────────────────────────────────────────────
# HIGHLIGHTS GENERATOR
# ─────────────────────────────────────────────────────────────────

def _build_highlights(breakdown: Dict, target_season: str, target_occasion: str) -> List[str]:
    """
    Short badges for the outfit card (max 3).
    E.g. ["Classic Colours", "Season Match", "Complete Look"]
    """
    highlights = []
    if breakdown.get('color', 0) >= 0.85:
        highlights.append("Classic Colours")
    elif breakdown.get('color', 0) >= 0.65:
        highlights.append("Colour Harmony")

    if breakdown.get('season', 0) >= 0.9:
        highlights.append(f"{target_season.replace('-',' ').title()} Perfect")
    elif breakdown.get('season', 0) >= 0.65:
        highlights.append("Season Friendly")

    if breakdown.get('occasion', 0) >= 0.85:
        highlights.append(f"{target_occasion.capitalize()} Ready")

    if breakdown.get('completeness', 0) >= 0.95:
        highlights.append("Complete Look")

    return highlights[:3]  # max 3 badges


# ─────────────────────────────────────────────────────────────────
# MAIN FUNCTION — generate_explanation
# ─────────────────────────────────────────────────────────────────

def generate_explanation(
    top: Dict,
    bottom: Dict,
    shoe: Dict,
    breakdown: Dict,
    target_season: str   = 'all-season',
    target_occasion: str = 'casual',
) -> ExplanationResult:
    """
    Generate a full, dynamic explanation for a (top, bottom, shoe) outfit.

    Args:
        top:             wardrobe item dict for the top piece
        bottom:          wardrobe item dict for the bottom piece (may be empty for dresses)
        shoe:            wardrobe item dict for the shoe piece (may be empty)
        breakdown:       score components dict from score_outfit()
                         { color, season, occasion, completeness } — all 0–1
        target_season:   user-selected season
        target_occasion: user-selected occasion

    Returns:
        ExplanationResult with paragraph, bullets, highlights, confidence
    """
    top_color    = top.get('color', 'item').lower()
    bottom_color = bottom.get('color', '') if bottom.get('category') != 'other' else ''
    shoe_color   = shoe.get('color', '')   if shoe.get('category')   != 'other' else ''
    family       = _color_family(top_color)
    season_label = target_season.replace('-', ' ')

    cs   = breakdown.get('color',        0.5)
    ss   = breakdown.get('season',       0.5)
    os_  = breakdown.get('occasion',     0.5)
    comp = breakdown.get('completeness', 0.5)

    # ── Build each phrase segment ─────────────────────────────────────────────
    color_band   = _band(cs)
    color_phrase = _pick(
        _COLOR_PHRASES.get(color_band, _COLOR_PHRASES['fair']),
        top_color=_cap(top_color),
        bottom_color=_cap(bottom_color) or _cap(shoe_color) or 'the supporting piece',
        family=family,
    )

    season_band   = _season_band(ss)
    season_phrase = _pick(
        _SEASON_PHRASES.get(season_band, _SEASON_PHRASES['fair']),
        season=season_label,
    )

    occ_band   = _occasion_band(os_)
    occ_dict   = _OCCASION_PHRASES.get(occ_band, _OCCASION_PHRASES['fair'])
    occ_phrase = _pick(
        occ_dict.get(target_occasion, occ_dict.get('all', ['The outfit suits your selected occasion.'])),
    )

    comp_level  = 'full' if comp >= 0.95 else ('partial' if comp >= 0.65 else 'minimal')
    comp_phrase = _pick(_COMPLETENESS_PHRASES[comp_level])

    # ── Assemble paragraph ────────────────────────────────────────────────────
    opener  = random.choice(_OPENERS)

    # Pick 2 highest-scoring dimensions for the opener clause
    scores_named = [
        ('colour compatibility', cs),
        ('season suitability',   ss),
        ('occasion match',       os_),
        ('outfit completeness',  comp),
    ]
    scores_named.sort(key=lambda x: x[1], reverse=True)
    top_two = ' and '.join(n for n, _ in scores_named[:2])

    paragraph_parts = [
        f"{opener} of its strong {top_two}.",
        color_phrase,
        season_phrase,
        occ_phrase,
        comp_phrase,
    ]
    paragraph = ' '.join(paragraph_parts)

    # ── Confidence label ──────────────────────────────────────────────────────
    overall = cs * 0.35 + ss * 0.20 + os_ * 0.30 + comp * 0.15
    if overall >= 0.80:
        confidence = 'excellent'
    elif overall >= 0.60:
        confidence = 'good'
    else:
        confidence = 'fair'

    bullets    = _build_bullets(top, bottom, shoe, breakdown, target_season, target_occasion)
    highlights = _build_highlights(breakdown, target_season, target_occasion)

    return ExplanationResult(
        paragraph=paragraph,
        bullets=bullets,
        highlights=highlights,
        confidence=confidence,
    )