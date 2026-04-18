"""
core/preprocessing.py
=====================
Converts raw FashNex wardrobe items (MongoDB documents) into fixed-length
numeric feature vectors suitable for ML models.

Schema being encoded (matches wardrobeModel.js exactly):
  category : topwear | bottomwear | footwear | accessories | outerwear | dress | other
  color    : white | black | blue | navy | red | pink | green | yellow |
             beige | grey | brown | orange | purple | other
  colorFamily : warm | cool | neutral
  season   : summer | winter | rainy | all-season
  occasion : casual | formal | party | office | all

Outfit feature vector = concatenation of item vectors for each slot:
  [top_vector | bottom_vector | shoe_vector]  →  total = 3 × ITEM_DIM
"""

import numpy as np
from typing import Dict, List, Any

# ── Vocabulary definitions (must match wardrobeModel.js enums exactly) ────────

CATEGORIES   = ['topwear', 'bottomwear', 'footwear', 'accessories', 'outerwear', 'dress', 'other']
COLORS       = ['white', 'black', 'blue', 'navy', 'red', 'pink', 'green',
                'yellow', 'beige', 'grey', 'brown', 'orange', 'purple', 'other']
COLOR_FAMILIES = ['warm', 'cool', 'neutral']
SEASONS      = ['summer', 'winter', 'rainy', 'all-season']
OCCASIONS    = ['casual', 'formal', 'party', 'office', 'all']

# Computed once, reused everywhere
ITEM_DIM = len(CATEGORIES) + len(COLORS) + len(COLOR_FAMILIES) + len(SEASONS) + len(OCCASIONS)
# = 7 + 14 + 3 + 4 + 5 = 33
OUTFIT_DIM = ITEM_DIM * 3   # top + bottom + shoe = 99


def _one_hot(value: str, vocab: List[str]) -> np.ndarray:
    """
    Return a one-hot encoded vector for `value` within `vocab`.
    Falls back to the last index ('other' / 'all') if value not found.
    """
    vec = np.zeros(len(vocab), dtype=np.float32)
    val = (value or '').lower().strip()

    # Exact match first
    if val in vocab:
        vec[vocab.index(val)] = 1.0
        return vec

    # Partial match (e.g. "navy blue" → matches "navy")
    for i, v in enumerate(vocab):
        if v in val or val in v:
            vec[i] = 1.0
            return vec

    # Default: last element of vocab (usually 'other' or 'all')
    vec[-1] = 1.0
    return vec


def item_to_vector(item: Dict[str, Any]) -> np.ndarray:
    """
    Convert a single wardrobe item dict → ITEM_DIM float32 vector.

    Input keys (all strings, matching MongoDB document):
      category, color, colorFamily, season, occasion
    """
    cat_vec    = _one_hot(item.get('category',    'other'),     CATEGORIES)
    color_vec  = _one_hot(item.get('color',       'other'),     COLORS)
    family_vec = _one_hot(item.get('colorFamily', 'neutral'),   COLOR_FAMILIES)
    season_vec = _one_hot(item.get('season',      'all-season'),SEASONS)
    occ_vec    = _one_hot(item.get('occasion',    'all'),       OCCASIONS)

    return np.concatenate([cat_vec, color_vec, family_vec, season_vec, occ_vec])


def outfit_to_vector(top: Dict, bottom: Dict, shoe: Dict) -> np.ndarray:
    """
    Concatenate three item vectors into one outfit feature vector.
    Shape: (OUTFIT_DIM,)  = (99,)
    """
    return np.concatenate([
        item_to_vector(top),
        item_to_vector(bottom),
        item_to_vector(shoe),
    ])


def items_to_matrix(items: List[Dict]) -> np.ndarray:
    """
    Convert a list of items → matrix of shape (N, ITEM_DIM).
    Useful for batch operations.
    """
    return np.stack([item_to_vector(i) for i in items], axis=0)


# Expose dims so other modules don't need to recompute
__all__ = [
    'CATEGORIES', 'COLORS', 'COLOR_FAMILIES', 'SEASONS', 'OCCASIONS',
    'ITEM_DIM', 'OUTFIT_DIM',
    'item_to_vector', 'outfit_to_vector', 'items_to_matrix',
]