"""
core/combinator.py
==================
Generates all valid outfit combinations from a user's wardrobe.

Rules:
  - A valid outfit needs at least one "top" and one "bottom" piece.
  - A "dress" counts as both top AND bottom (it is self-contained).
  - Footwear is optional but boosts the completeness score.
  - Accessories and outerwear are NOT part of the scored triple
    (they're included in output metadata but not the feature vector).

This module is intentionally decoupled from ML — it returns plain dicts
that are then passed to preprocessing.py and scoring.py.
"""

from itertools import product as iterproduct
from typing import List, Dict, Tuple, Optional


# Categories that can serve as the "top" slot in an outfit
_TOP_CATS    = {'topwear', 'outerwear', 'dress'}
_BOTTOM_CATS = {'bottomwear'}
_SHOE_CATS   = {'footwear'}

# A dummy placeholder used when a slot has no item
_EMPTY_ITEM: Dict = {
    'category': 'other', 'color': 'other', 'colorFamily': 'neutral',
    'season': 'all-season', 'occasion': 'all', 'name': '', 'imageUrl': '',
    '_id': None,
}


def _split_wardrobe(items: List[Dict]) -> Tuple[List, List, List, List]:
    """
    Split wardrobe items into role buckets.

    Returns (tops, bottoms, shoes, accessories)
    Note: 'dress' items go into BOTH tops and serve as their own bottom.
    """
    tops         = []
    bottoms      = []
    shoes        = []
    accessories  = []

    for item in items:
        cat = (item.get('category') or '').lower()
        if cat in _TOP_CATS:
            tops.append(item)
        if cat in _BOTTOM_CATS:
            bottoms.append(item)
        if cat in _SHOE_CATS:
            shoes.append(item)
        if cat in ('accessories',):
            accessories.append(item)

    return tops, bottoms, shoes, accessories


def generate_combos(
    items: List[Dict],
    max_combos: int = 200,
) -> List[Dict]:
    """
    Generate all valid (top, bottom, shoe) triples from the user's wardrobe.

    Each returned dict has shape:
    {
      "top":    {...item},
      "bottom": {...item},   # may be _EMPTY_ITEM for dress outfits
      "shoe":   {...item},   # may be _EMPTY_ITEM if no footwear
      "extras": [...items],  # accessories / outerwear
    }

    Args:
      items:      list of wardrobe item dicts from MongoDB
      max_combos: safety cap to avoid explosion with large wardrobes

    Returns list of combo dicts — may be empty if wardrobe is too sparse.
    """
    tops, bottoms, shoes, extras = _split_wardrobe(items)

    combos = []

    # ── Case 1: dress outfits (dress = top + bottom in one) ──────────────────
    dresses = [t for t in tops if t.get('category') == 'dress']
    for dress in dresses:
        shoe_pool = shoes if shoes else [_EMPTY_ITEM]
        for shoe in shoe_pool:
            combos.append({
                'top':    dress,
                'bottom': _EMPTY_ITEM,  # dress covers bottom
                'shoe':   shoe,
                'extras': extras,
            })
            if len(combos) >= max_combos:
                return combos

    # ── Case 2: topwear × bottomwear × footwear ──────────────────────────────
    non_dress_tops = [t for t in tops if t.get('category') != 'dress']
    shoe_pool = shoes if shoes else [_EMPTY_ITEM]

    for top, bottom, shoe in iterproduct(non_dress_tops, bottoms, shoe_pool):
        combos.append({
            'top':    top,
            'bottom': bottom,
            'shoe':   shoe,
            'extras': extras,
        })
        if len(combos) >= max_combos:
            return combos

    return combos


def filter_combos_by_context(
    combos: List[Dict],
    target_season:   Optional[str] = None,
    target_occasion: Optional[str] = None,
) -> List[Dict]:
    """
    Pre-filter combinations by season / occasion before scoring.
    This reduces the search space dramatically for large wardrobes.

    An item passes if its field matches the target OR is 'all' / 'all-season'.
    A combo passes if ALL three pieces pass (or if target is None/any).
    """
    if not target_season and not target_occasion:
        return combos

    def item_ok(item: Dict) -> bool:
        s = (item.get('season')   or 'all-season').lower()
        o = (item.get('occasion') or 'all').lower()
        season_ok   = (not target_season)   or s in ('all-season', target_season)
        occasion_ok = (not target_occasion) or o in ('all', target_occasion) or \
                      _cross_occasion_ok(o, target_occasion)
        return season_ok and occasion_ok

    def _cross_occasion_ok(item_occ: str, target: str) -> bool:
        cross = {
            ('formal', 'office'), ('office', 'formal'),
            ('casual', 'party'),
        }
        return (item_occ, target) in cross

    filtered = [
        c for c in combos
        if item_ok(c['top']) and
           (c['bottom'] is _EMPTY_ITEM or item_ok(c['bottom'])) and
           (c['shoe']   is _EMPTY_ITEM or item_ok(c['shoe']))
    ]

    # Fallback: if filtering removed everything, return all combos
    return filtered if filtered else combos