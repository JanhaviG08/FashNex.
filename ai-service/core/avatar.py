"""
core/avatar.py
==============
Builds the avatar layer data for the frontend to render.

Approach: Layered image compositing in the browser.
  The frontend stacks absolutely-positioned <img> tags:
    1. Base silhouette  (SVG vector body outline — no real person, works for all)
    2. Topwear image    (user's actual Cloudinary photo, object-fit: contain)
    3. Bottomwear image (user's actual Cloudinary photo)
    4. Footwear image   (user's actual Cloudinary photo)
    5. Accessories      (optional)

Why this approach vs ReadyPlayerMe:
  - No API key needed
  - Works with user's own photos (real clothes, not cartoons)
  - Zero latency — just structured JSON, browser does the rendering
  - The "base silhouette" is a simple SVG body outline that acts as a
    clothing mannequin (no real person, no gender controversy)

This module returns structured layer data.
The frontend (OutfitPreviewModal.jsx) handles the actual rendering.

Public API:
    build_avatar_data(combo, gender='neutral') → AvatarData
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict


# ─────────────────────────────────────────────────────────────────
# LAYER POSITION CONFIG
# ─────────────────────────────────────────────────────────────────
# Each layer defines where and how the image sits on the mannequin.
# Values are percentages relative to the avatar container.
# Tuned for a standard fashion mannequin aspect ratio (2:3).

LAYER_CONFIG = {
    'dress': {
        'top':     '12%',
        'left':    '5%',
        'width':   '90%',
        'height':  '65%',
        'z_index': 3,
        'object_fit': 'contain',
    },
    'topwear': {
        'top':     '10%',
        'left':    '5%',
        'width':   '90%',
        'height':  '42%',
        'z_index': 3,
        'object_fit': 'contain',
    },
    'outerwear': {
        'top':     '8%',
        'left':    '2%',
        'width':   '96%',
        'height':  '46%',
        'z_index': 4,   # over topwear
        'object_fit': 'contain',
    },
    'bottomwear': {
        'top':     '48%',
        'left':    '8%',
        'width':   '84%',
        'height':  '36%',
        'z_index': 2,
        'object_fit': 'contain',
    },
    'footwear': {
        'top':     '80%',
        'left':    '15%',
        'width':   '70%',
        'height':  '18%',
        'z_index': 2,
        'object_fit': 'contain',
    },
    'accessories': {
        'top':     '5%',
        'left':    '60%',
        'width':   '35%',
        'height':  '15%',
        'z_index': 5,
        'object_fit': 'contain',
    },
}

# Order in which layers should be rendered (back to front)
RENDER_ORDER = ['bottomwear', 'dress', 'topwear', 'outerwear', 'footwear', 'accessories']


# ─────────────────────────────────────────────────────────────────
# RESULT TYPE
# ─────────────────────────────────────────────────────────────────

@dataclass
class AvatarLayer:
    slot:       str           # 'topwear' | 'bottomwear' | 'footwear' | etc.
    image_url:  str           # Cloudinary URL of the actual clothing photo
    color:      str
    name:       str
    position:   Dict          # CSS position dict from LAYER_CONFIG
    z_index:    int


@dataclass
class AvatarData:
    base:       str           # 'neutral' (SVG mannequin — rendered by frontend)
    layers:     List[AvatarLayer]
    has_top:    bool
    has_bottom: bool
    has_shoe:   bool
    palette:    List[str]     # dominant colors for UI accent


# ─────────────────────────────────────────────────────────────────
# MAIN FUNCTION
# ─────────────────────────────────────────────────────────────────

def build_avatar_data(combo: Dict, gender: str = 'neutral') -> AvatarData:
    """
    Build structured layer data for avatar rendering.

    Args:
        combo:  outfit combo dict with keys: top, bottom, shoe, extras
        gender: 'neutral' | 'male' | 'female' (affects base silhouette choice)

    Returns:
        AvatarData with ordered layers and position config.
    """
    layers: List[AvatarLayer] = []
    palette: List[str] = []

    has_top    = False
    has_bottom = False
    has_shoe   = False

    # ── Process each slot in render order ────────────────────────────────────
    slot_map = {
        'topwear':    combo.get('top',    {}),
        'bottomwear': combo.get('bottom', {}),
        'footwear':   combo.get('shoe',   {}),
    }

    # Reroute dress to the dress slot
    top_item = combo.get('top', {})
    if top_item.get('category') == 'dress':
        slot_map = {
            'dress':    top_item,
            'footwear': combo.get('shoe', {}),
        }

    # Outerwear from extras
    for extra in combo.get('extras', []):
        cat = (extra.get('category') or '').lower()
        if cat == 'outerwear':
            slot_map['outerwear'] = extra
        elif cat == 'accessories':
            slot_map['accessories'] = extra

    # Build layers in render order
    for slot in RENDER_ORDER:
        item = slot_map.get(slot)
        if not item or not item.get('imageUrl') or item.get('category') == 'other':
            continue

        category = (item.get('category') or slot).lower()
        config   = LAYER_CONFIG.get(category, LAYER_CONFIG.get(slot, LAYER_CONFIG['topwear']))
        color    = item.get('color', 'unknown')

        layer = AvatarLayer(
            slot=slot,
            image_url=item.get('imageUrl', ''),
            color=color,
            name=item.get('name', '') or category.capitalize(),
            position={
                'top':       config['top'],
                'left':      config['left'],
                'width':     config['width'],
                'height':    config['height'],
                'objectFit': config['object_fit'],
            },
            z_index=config['z_index'],
        )
        layers.append(layer)

        if color and color != 'unknown':
            palette.append(color)

        # Track slot presence
        if slot in ('topwear', 'dress', 'outerwear'):
            has_top = True
        if slot in ('bottomwear', 'dress'):
            has_bottom = True
        if slot == 'footwear':
            has_shoe = True

    return AvatarData(
        base=gender,
        layers=layers,
        has_top=has_top,
        has_bottom=has_bottom,
        has_shoe=has_shoe,
        palette=palette[:4],
    )


def avatar_data_to_dict(avatar: AvatarData) -> Dict:
    """Serialize AvatarData to a plain dict for JSON response."""
    return {
        'base': avatar.base,
        'layers': [
            {
                'slot':      l.slot,
                'imageUrl':  l.image_url,
                'color':     l.color,
                'name':      l.name,
                'position':  l.position,
                'zIndex':    l.z_index,
            }
            for l in avatar.layers
        ],
        'hasTop':    avatar.has_top,
        'hasBottom': avatar.has_bottom,
        'hasShoe':   avatar.has_shoe,
        'palette':   avatar.palette,
    }