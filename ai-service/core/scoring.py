"""
core/scoring.py
===============
Generates synthetic ground-truth labels for (top, bottom, shoe) outfit
triples using fashion domain rules.  These labels are used to train the ML
model since we have no real user-rating dataset.

Score components (each 0–1):
  1. season_match      — do the pieces suit the requested season?
  2. occasion_match    — do the pieces suit the requested occasion?
  3. color_harmony     — do the colours work together?
  4. completeness      — is the outfit a "complete look"?

Final score = weighted mean, clamped to [0, 1].

The module also produces a human-readable explanation dict used for
explainability output in API responses.
"""

from typing import Dict, Tuple, List


# ── Color compatibility matrix ────────────────────────────────────────────────

# Classic pairs that always look great (bidirectional)
_CLASSIC_PAIRS = frozenset([
    ('white', 'black'), ('white', 'navy'), ('white', 'blue'), ('white', 'grey'),
    ('white', 'green'), ('beige', 'brown'), ('beige', 'black'), ('beige', 'navy'),
    ('cream', 'brown'), ('black', 'red'), ('grey', 'white'), ('grey', 'pink'),
    ('navy', 'beige'), ('khaki', 'navy'), ('camel', 'black'), ('olive', 'white'),
    ('brown', 'red'), ('brown', 'cream'), ('burgundy', 'grey'), ('mustard', 'navy'),
])

_COLOR_FAMILY: Dict[str, str] = {
    # Warm
    'red': 'warm', 'orange': 'warm', 'yellow': 'warm', 'pink': 'warm',
    'coral': 'warm', 'salmon': 'warm', 'maroon': 'warm', 'burgundy': 'warm',
    'brown': 'warm', 'peach': 'warm', 'gold': 'warm', 'rust': 'warm',
    # Cool
    'blue': 'cool', 'navy': 'cool', 'teal': 'cool', 'cyan': 'cool',
    'green': 'cool', 'purple': 'cool', 'violet': 'cool', 'indigo': 'cool',
    'grey': 'cool', 'gray': 'cool', 'mint': 'cool', 'lavender': 'cool',
    'olive': 'cool',
    # Neutral
    'white': 'neutral', 'black': 'neutral', 'beige': 'neutral', 'cream': 'neutral',
    'ivory': 'neutral', 'khaki': 'neutral', 'tan': 'neutral', 'camel': 'neutral',
    'charcoal': 'neutral',
}


def _get_family(color: str) -> str:
    c = (color or '').lower().strip()
    for key, fam in _COLOR_FAMILY.items():
        if key in c:
            return fam
    return 'neutral'


def _color_harmony_score(top: Dict, bottom: Dict, shoe: Dict) -> Tuple[float, str]:
    """Returns (score 0–1, explanation)."""
    colors = [
        (top.get('color', ''),    _get_family(top.get('colorFamily', '')    or top.get('color', ''))),
        (bottom.get('color', ''), _get_family(bottom.get('colorFamily', '') or bottom.get('color', ''))),
        (shoe.get('color', ''),   _get_family(shoe.get('colorFamily', '')   or shoe.get('color', ''))),
    ]

    # Check classic pairs between each pair of pieces
    pairs = [
        (colors[0], colors[1]),  # top–bottom
        (colors[1], colors[2]),  # bottom–shoe
        (colors[0], colors[2]),  # top–shoe
    ]

    score = 0.0
    reasons = []
    for (ca, fam_a), (cb, fam_b) in pairs:
        key = (ca.lower(), cb.lower())
        rev = (cb.lower(), ca.lower())
        if key in _CLASSIC_PAIRS or rev in _CLASSIC_PAIRS:
            score += 1.0
            reasons.append(f"{ca.capitalize()} and {cb.capitalize()} are a classic pair")
        elif fam_a == 'neutral' or fam_b == 'neutral':
            score += 0.8
            reasons.append(f"Neutral tones ({ca or cb}) complement everything")
        elif fam_a == fam_b:
            score += 0.6
            reasons.append(f"Tonal harmony in {fam_a} palette")
        else:
            score += 0.3  # contrasting — can work but not optimal
            reasons.append(f"Colour contrast between {ca} and {cb}")

    final = min(1.0, score / 3.0)
    explanation = "; ".join(reasons[:2]) if reasons else "Colours are compatible"
    return final, explanation


def _season_match_score(top: Dict, bottom: Dict, shoe: Dict, target_season: str) -> Tuple[float, str]:
    """
    Each piece can have season = summer | winter | rainy | all-season.
    all-season is always compatible.
    Returns (score 0–1, reason).
    """
    items = [top, bottom, shoe]
    matches = 0
    for item in items:
        s = (item.get('season') or 'all-season').lower()
        if s == 'all-season' or s == target_season:
            matches += 1

    score = matches / len(items)
    if score == 1.0:
        reason = f"All pieces suit {target_season} weather"
    elif score >= 0.67:
        reason = f"Most pieces are appropriate for {target_season}"
    else:
        reason = f"Some pieces may not suit {target_season} weather"
    return score, reason


def _occasion_match_score(top: Dict, bottom: Dict, shoe: Dict, target_occasion: str) -> Tuple[float, str]:
    """
    Occasion compatibility scoring.
    Direct match = 1.0; 'all' = 0.8; close match (office↔formal) = 0.6; mismatch = 0.2
    """
    _compat = {
        ('office', 'formal'): 0.9, ('formal', 'office'): 0.9,
        ('party',  'casual'): 0.7, ('casual',  'party'): 0.5,
        ('all',    'any'):    0.8,
    }

    items = [top, bottom, shoe]
    total = 0.0
    for item in items:
        occ = (item.get('occasion') or 'all').lower()
        if occ == target_occasion:
            total += 1.0
        elif occ == 'all':
            total += 0.8
        else:
            compat_score = _compat.get((occ, target_occasion), 0.2)
            total += compat_score

    score = total / len(items)
    if score >= 0.9:
        reason = f"All pieces are perfectly suited for {target_occasion}"
    elif score >= 0.7:
        reason = f"Pieces are appropriate for {target_occasion} with minor variations"
    else:
        reason = f"Some pieces may not be ideal for {target_occasion}"
    return min(1.0, score), reason


def _completeness_score(top: Dict, bottom: Dict, shoe: Dict) -> Tuple[float, str]:
    """
    Rewards complete outfits. Penalises missing categories.
    """
    has_top    = top.get('category') in ('topwear', 'dress', 'outerwear')
    has_bottom = bottom.get('category') == 'bottomwear' or top.get('category') == 'dress'
    has_shoe   = shoe.get('category') == 'footwear'

    count = sum([has_top, has_bottom, has_shoe])
    score = count / 3.0
    if count == 3:
        reason = "Complete look: top, bottom and footwear covered"
    elif count == 2:
        reason = "Two-thirds complete — adding the third piece would elevate the outfit"
    else:
        reason = "Incomplete outfit combination"
    return score, reason


# Scoring weights (must sum to 1.0)
_WEIGHTS = {
    'color':       0.35,
    'occasion':    0.30,
    'season':      0.20,
    'completeness':0.15,
}


def score_outfit(
    top: Dict,
    bottom: Dict,
    shoe: Dict,
    target_season:   str = 'all-season',
    target_occasion: str = 'casual',
) -> Dict:
    """
    Score a (top, bottom, shoe) outfit triple.

    Returns:
    {
      "score":       0.87,          # 0–1 float
      "score_1_5":   4.4,           # 1–5 scale for display
      "breakdown": {                 # component scores
        "color":       0.90,
        "occasion":    0.85,
        "season":      1.00,
        "completeness":0.67,
      },
      "explanation": "White and black are a classic pair; ...",
      "label":       "Casual Summer Look"
    }
    """
    color_s,  color_r  = _color_harmony_score(top, bottom, shoe)
    season_s, season_r = _season_match_score(top, bottom, shoe, target_season)
    occ_s,    occ_r    = _occasion_match_score(top, bottom, shoe, target_occasion)
    comp_s,   comp_r   = _completeness_score(top, bottom, shoe)

    weighted = (
        _WEIGHTS['color']        * color_s  +
        _WEIGHTS['season']       * season_s +
        _WEIGHTS['occasion']     * occ_s    +
        _WEIGHTS['completeness'] * comp_s
    )
    final_score = round(min(1.0, max(0.0, weighted)), 4)
    score_1_5   = round(1.0 + final_score * 4.0, 1)  # map [0,1] → [1,5]

    reasons = [r for r in [color_r, occ_r, season_r] if r]
    explanation = ". ".join(reasons) + "."

    # Human label
    occ_label    = target_occasion.capitalize()
    season_label = target_season.replace('-', ' ').title()
    top_type     = top.get('category', 'top').capitalize()
    label        = f"{occ_label} {season_label} Look"

    return {
        'score':      final_score,
        'score_1_5':  score_1_5,
        'breakdown':  {
            'color':        round(color_s,  3),
            'season':       round(season_s, 3),
            'occasion':     round(occ_s,    3),
            'completeness': round(comp_s,   3),
        },
        'explanation': explanation,
        'label':       label,
    }


def generate_training_labels(outfits: List[Dict]) -> 'np.ndarray':
    """
    Given a list of outfit dicts (each with keys: top, bottom, shoe,
    target_season, target_occasion), return an array of float scores.
    Used by model.py to create training targets.
    """
    import numpy as np
    labels = []
    for outfit in outfits:
        result = score_outfit(
            outfit['top'],
            outfit['bottom'],
            outfit['shoe'],
            outfit.get('target_season',   'all-season'),
            outfit.get('target_occasion', 'casual'),
        )
        labels.append(result['score'])
    return np.array(labels, dtype=np.float32)