"""
ai_service/core/outfit_engine.py — FIXED
==========================================

Root-cause fixes:
  1. `dict | None` union syntax requires Python 3.10+. Changed to
     `Optional[dict]` for Python 3.9 compatibility.
  2. All category comparisons use .lower() so "Topwear", "topwear",
     "TopWear" are all treated equally.
  3. generate_outfit_combos() now falls back to returning the top-ranked
     individual items as single-item "outfit" cards when no tops/bottoms
     exist, so the UI never shows empty results just because of category gaps.
"""

import numpy as np
from typing import Optional, List
from itertools import product as cart_product


# ── Color harmony rules ────────────────────────────────────────────────────────

def color_harmony_score(family_a: str, family_b: str) -> float:
    if family_a == "neutral" or family_b == "neutral":
        return 1.0
    if family_a == family_b:
        return 0.8
    return 0.5


# ── Embedding similarity ───────────────────────────────────────────────────────

def embedding_similarity(emb_a: list, emb_b: list) -> float:
    a, b = np.array(emb_a, dtype="float32"), np.array(emb_b, dtype="float32")
    if a.size == 0 or b.size == 0:
        return 0.5
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.5
    return float(np.dot(a, b) / denom)


# ── Weather suitability ────────────────────────────────────────────────────────

_WEATHER_SEASON_MAP = {
    "hot":      {"summer", "all-season"},
    "warm":     {"summer", "all-season"},
    "moderate": {"all-season"},
    "cool":     {"all-season", "winter"},
    "cold":     {"winter", "all-season"},
    "rainy":    {"rainy", "all-season"},
}

def weather_suitability_score(item_season: str, weather_category: str) -> float:
    # FIX: normalize both sides to lowercase before comparison
    season   = (item_season or "all-season").lower()
    wc       = (weather_category or "moderate").lower()
    suitable = _WEATHER_SEASON_MAP.get(wc, {"all-season"})
    # Accept "all season" without hyphen as legacy fallback
    if season in ("all season", "allseason"):
        season = "all-season"
    return 1.0 if season in suitable else 0.3


# ── Composite outfit scoring ───────────────────────────────────────────────────

def score_outfit(items: list, weather_category: str = "moderate") -> dict:
    if not items:
        return {"score": 0.0}

    families = [i.get("colorFamily", "neutral") for i in items]
    color_scores = []
    for i in range(len(families)):
        for j in range(i + 1, len(families)):
            color_scores.append(color_harmony_score(families[i], families[j]))
    avg_color = float(np.mean(color_scores)) if color_scores else 0.8

    embeddings = [i.get("embedding", []) for i in items]
    style_scores = []
    for i in range(len(embeddings)):
        for j in range(i + 1, len(embeddings)):
            if embeddings[i] and embeddings[j]:
                style_scores.append(embedding_similarity(embeddings[i], embeddings[j]))
    avg_style = float(np.mean(style_scores)) if style_scores else 0.5

    w_scores = [weather_suitability_score(i.get("season", "all-season"), weather_category) for i in items]
    avg_weather = float(np.mean(w_scores))

    composite = round(0.45 * avg_color + 0.30 * avg_weather + 0.25 * avg_style, 3)

    return {
        "score":        composite,
        "colorScore":   round(avg_color, 3),
        "styleScore":   round(avg_style, 3),
        "weatherScore": round(avg_weather, 3),
        "breakdown": {
            "colorWeight":   0.45,
            "weatherWeight": 0.30,
            "styleWeight":   0.25,
        }
    }


# ── Outfit combination generator ──────────────────────────────────────────────

def generate_outfit_combos(wardrobe_items: list, weather_category: str = "moderate",
                           max_combos: int = 5) -> list:
    """
    FIX #1: All category lookups use .lower() to handle "Topwear" / "topwear".
    FIX #2: Fallback to individual items when no valid top+bottom pairs exist.
    """

    def cat(item: dict) -> str:
        # FIX: normalize to lowercase
        return (item.get("category") or "other").lower()

    tops      = [i for i in wardrobe_items if cat(i) in ("topwear",)]
    dresses   = [i for i in wardrobe_items if cat(i) == "dress"]
    bottoms   = [i for i in wardrobe_items if cat(i) == "bottomwear"]
    footwear  = [i for i in wardrobe_items if cat(i) == "footwear"]
    outerwear = [i for i in wardrobe_items if cat(i) == "outerwear"]

    combos = []

    # ── Dress outfits ─────────────────────────────────────────────────────────
    for dress in dresses:
        shoe        = footwear[0] if footwear else None
        outfit_items = [dress] + ([shoe] if shoe else [])
        scored       = score_outfit(outfit_items, weather_category)
        combos.append({
            "type":          "Dress Outfit",
            "items":         outfit_items,
            **scored,
            "label":         _make_label(outfit_items),
            "weatherReason": _weather_reason(outfit_items, weather_category),
            "aiInsight":     _ai_insight(scored),
        })

    # ── Top + Bottom combos ───────────────────────────────────────────────────
    for top, bottom in cart_product(tops, bottoms):
        shoe  = _best_shoe(footwear, bottom)
        outer = outerwear[0] if outerwear and weather_category in ("cool", "cold", "rainy") else None
        outfit_items = [i for i in [top, bottom, shoe, outer] if i]
        scored       = score_outfit(outfit_items, weather_category)
        combos.append({
            "type":          "Complete Look",
            "items":         outfit_items,
            **scored,
            "label":         _make_label(outfit_items),
            "weatherReason": _weather_reason(outfit_items, weather_category),
            "aiInsight":     _ai_insight(scored),
        })

    # FIX #3 — Fallback: if no combos were generated (e.g. only tops, no bottoms)
    # surface top-ranked individual items as single-piece "outfits"
    if not combos and wardrobe_items:
        for item in wardrobe_items[:max_combos]:
            scored = score_outfit([item], weather_category)
            combos.append({
                "type":          "Single Piece",
                "items":         [item],
                **scored,
                "label":         _make_label([item]),
                "weatherReason": _weather_reason([item], weather_category),
                "aiInsight":     _ai_insight(scored),
            })

    combos.sort(key=lambda c: c["score"], reverse=True)
    return combos[:max_combos]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _best_shoe(footwear: list, bottom: dict) -> Optional[dict]:
    """FIX: Python 3.9-compatible return type annotation."""
    if not footwear:
        return None
    bottom_family = bottom.get("colorFamily", "neutral")
    return max(footwear, key=lambda f: color_harmony_score(f.get("colorFamily", "neutral"), bottom_family))


def _make_label(items: list) -> str:
    parts = []
    for item in items:
        color = item.get("color", "")
        c     = (item.get("category") or "").lower()
        parts.append(f"{color} {c}".strip())
    return " + ".join(parts)


def _weather_reason(items: list, weather_category: str) -> str:
    reasons = {
        "hot":      "Light colours and breathable fabrics keep you cool in the heat.",
        "warm":     "A comfortable single-layer outfit for warm pleasant weather.",
        "moderate": "Layering works well — easy to adapt as the day changes.",
        "cool":     "This combo provides warmth without being too heavy.",
        "cold":     "Thick fabrics and layering are essential for cold temperatures.",
        "rainy":    "Dark tones hide splashes — and the jacket keeps you dry.",
    }
    return reasons.get((weather_category or "moderate").lower(), "A well-balanced outfit for current conditions.")


def _ai_insight(scored: dict) -> dict:
    cs = scored.get("colorScore", 0)
    ws = scored.get("weatherScore", 0)

    if cs >= 0.9:
        color_match = "excellent"
        reason = "These colours are perfectly harmonious."
    elif cs >= 0.7:
        color_match = "good"
        reason = "The colour combination works well together."
    else:
        color_match = "acceptable"
        reason = "The contrast is bold — works if that's the look you're going for."

    if ws < 0.5:
        reason += " Note: some items may not be ideal for the current weather."

    return {"colorMatch": color_match, "reason": reason}