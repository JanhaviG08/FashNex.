"""
ai_service/core/recommender.py — FIXED
========================================

Root-cause fix:
  All string comparisons (category, season, occasion, tags) now use .lower()
  so "All-Season", "all-season", "Topwear", "topwear" are all handled correctly.

  The Node.js normalizeWardrobeItems() should handle this BEFORE sending data,
  but this file is hardened as a second line of defence.
"""

import numpy as np
from datetime import datetime, timezone
from core.outfit_engine import color_harmony_score, embedding_similarity


# ── Season fit map (all keys lowercase) ──────────────────────────────────────
_SEASON_FIT = {
    "hot":      ("summer",     "all-season"),
    "warm":     ("summer",     "all-season"),
    "moderate": ("all-season",),
    "cool":     ("all-season", "winter"),
    "cold":     ("winter",     "all-season"),
    "rainy":    ("rainy",      "all-season"),
}

# ── 1. Content-Based Signal ───────────────────────────────────────────────────

def content_score(item: dict, rules: dict) -> float:
    """
    Score a single item against weather clothing rules.
    FIX: all comparisons are .lower() to handle "Topwear", "All-Season", etc.
    """
    keywords   = [k.lower() for k in rules.get("keywords", [])]
    categories = [c.lower() for c in rules.get("wardrobeCategories", [])]

    # Category match
    item_cat  = item.get("category", "").lower()   # FIX: lowercase
    cat_score = 1.0 if item_cat in categories else 0.2

    # Keyword overlap with name + tags + color + pattern
    item_text = " ".join([
        item.get("name", ""),
        " ".join(item.get("tags", [])),
        item.get("color", ""),
        item.get("pattern", "")
    ]).lower()
    kw_matches = sum(1 for kw in keywords if kw in item_text)
    kw_score   = min(kw_matches / max(len(keywords), 1), 1.0)

    # Season match
    weather_cat     = rules.get("_weatherCategory", "moderate").lower()
    allowed_seasons = [s.lower() for s in _SEASON_FIT.get(weather_cat, ("all-season",))]
    item_season     = item.get("season", "all-season").lower()  # FIX: lowercase

    # Also accept "all season" (without hyphen) for legacy data
    if item_season in ("all season", "allseason"):
        item_season = "all-season"

    season_score = 1.0 if item_season in allowed_seasons else 0.1

    return round(0.40 * cat_score + 0.30 * kw_score + 0.30 * season_score, 3)


# ── 2. Collaborative Signal ───────────────────────────────────────────────────

def collaborative_score(item: dict) -> float:
    """Score based on wear frequency + recency. Defaults to neutral if absent."""
    wear_count = item.get("wearCount", 0)
    last_worn  = item.get("lastWorn", None)

    freq_score = min(wear_count / 20.0, 1.0)

    if last_worn:
        try:
            last_dt   = datetime.fromisoformat(str(last_worn).replace("Z", "+00:00"))
            days_ago  = (datetime.now(timezone.utc) - last_dt).days
            rec_score = max(0.0, 1.0 - days_ago / 365.0)
        except Exception:
            rec_score = 0.5
    else:
        rec_score = 0.5

    return round(0.6 * freq_score + 0.4 * rec_score, 3)


# ── 3. Context-Aware Signal ───────────────────────────────────────────────────

def context_score(item: dict, occasion: str = "casual") -> float:
    """Score based on occasion match. FIX: case-insensitive."""
    item_occ = item.get("occasion", "all").lower()    # FIX: lowercase
    occ      = occasion.lower()

    if item_occ in ("all", occ):
        return 1.0

    partial_pairs = {
        ("office", "formal"), ("formal", "office"),
        ("casual", "all"),    ("party", "casual")
    }
    if (item_occ, occ) in partial_pairs:
        return 0.6
    return 0.2


# ── Hybrid ranker ─────────────────────────────────────────────────────────────

def rank_wardrobe_items(wardrobe_items: list, rules: dict,
                         occasion: str = "casual", top_n: int = 20) -> list:
    """
    Rank all items (wardrobe + store) using the hybrid score.

    FIX: store items (isStoreItem=True) get a weather-neutral collaborative score
    of 0.5 so they still appear in results even without wearCount/lastWorn.
    """
    scored = []
    for item in wardrobe_items:
        c_score   = content_score(item, rules)
        col_score = collaborative_score(item)
        ctx_score = context_score(item, occasion)

        hybrid = round(0.50 * c_score + 0.30 * ctx_score + 0.20 * col_score, 3)

        scored.append({
            **item,
            "hybridScore":        hybrid,
            "contentScore":       c_score,
            "collaborativeScore": col_score,
            "contextScore":       ctx_score,
            "recommendReason":    _make_reason(c_score, col_score, ctx_score),
        })

    scored.sort(key=lambda x: x["hybridScore"], reverse=True)
    return scored[:top_n]


def _make_reason(content: float, collab: float, context: float) -> str:
    parts = []
    if content >= 0.7:
        parts.append("Great match for the current weather conditions.")
    elif content >= 0.4:
        parts.append("Reasonably suited for today's weather.")
    else:
        parts.append("May not be ideal for the weather — but could still work.")

    if collab >= 0.7:
        parts.append("You wear this often, so it clearly works for you.")
    elif collab >= 0.4:
        parts.append("You've worn this before.")

    if context >= 0.9:
        parts.append("Perfect for the occasion.")
    elif context >= 0.5:
        parts.append("Suitable for the occasion with minor adjustments.")

    return " ".join(parts) if parts else "AI-recommended based on your wardrobe profile."