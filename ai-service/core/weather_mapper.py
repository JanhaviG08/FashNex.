"""
core/weather_mapper.py
======================
Single source of truth for weather → clothing rules.

This module solves Problem 1 at its root: all filtering and scoring
decisions key off the WeatherProfile returned by map_weather_to_profile().

Design:
  - allowed_sub_categories  → MongoDB $in query  (STRICT pre-filter)
  - allowed_keywords        → text match on product name+description
  - avoid_keywords          → products containing these are EXCLUDED
  - preferred_colors        → scoring bonus
  - preferred_fabrics       → scoring bonus (matched against name/description)
  - avoid_fabrics           → scoring penalty

Public API:
    map_weather_to_profile(temp: float, condition: str) → dict
    score_product_for_weather(product: dict, profile: dict) → dict
      Returns { score: 0–100, reason: str, matched: [str], excluded: bool }
"""

from typing import Dict, List


# ── Internal profile table ────────────────────────────────────────────────────
# Keys must match getWeatherCategory() output in weatherController.js exactly.

_PROFILES: Dict[str, dict] = {

    # ── HOT ≥32°C or Clear/Sunny ──────────────────────────────────────────────
    "hot": {
        "label":   "Hot & Sunny",
        "emoji":   "☀️",
        "season":  "summer",

        # STRICT: only these subCategories pass the DB pre-filter
        # Must match your Product.subCategory values exactly (case-insensitive)
        "allowed_sub_categories": ["TopWear", "Dresses"],

        # After DB fetch, keep products whose name/description contains ≥1 of these
        # (empty list = no keyword filter — all DB results pass)
        "allowed_keywords": [
            "cotton", "linen", "sleeveless", "short sleeve", "short-sleeve",
            "shorts", "sundress", "casual", "light", "summer", "breathable",
            "tee", "t-shirt", "crop", "tank", "floral", "maxi", "midi",
        ],

        # Products containing ANY of these are EXCLUDED entirely
        "avoid_keywords": [
            "wool", "jacket", "hoodie", "coat", "sweater", "thermal",
            "fleece", "blazer", "trench", "puffer", "waterproof",
        ],

        # Used for scoring bonus (+1 each match)
        "preferred_colors": [
            "white", "cream", "beige", "light blue", "yellow",
            "mint", "coral", "pink", "pastel",
        ],
        "preferred_fabrics": ["cotton", "linen", "rayon", "modal", "chambray"],
        "avoid_fabrics":     ["wool", "denim", "leather", "polyester"],

        # Fallback subCategories if initial DB query returns < 3 results
        "fallback_sub_categories": ["TopWear", "BottomWear", "Dresses"],

        # Style tips (8 per category)
        "tips": [
            {"icon": "🌬️", "title": "Choose Breathable Fabrics",
             "text": "Cotton, linen, and rayon allow air to circulate — keeping you cool naturally all day."},
            {"icon": "🤍", "title": "Stick to Light Colours",
             "text": "White and pastels reflect sunlight instead of absorbing it. You'll feel up to 5°C cooler."},
            {"icon": "👗", "title": "Go Loose and Flowy",
             "text": "Loose silhouettes trap less heat than fitted clothes and let your skin breathe freely."},
            {"icon": "🕶️", "title": "Accessorise for UV Protection",
             "text": "A wide-brim hat and UV-protective sunglasses are fashion essentials on hot days."},
            {"icon": "👡", "title": "Open-Toe Footwear Wins",
             "text": "Sandals and open-toe shoes prevent sweaty, uncomfortable feet — a small change that matters."},
            {"icon": "🚫", "title": "Avoid Dark Colours",
             "text": "Black, navy, and dark brown absorb heat — save them for cooler weather."},
            {"icon": "💧", "title": "Lightweight Layers Only",
             "text": "If you need a layer, choose a sheer kimono or linen shirt — never a thick jacket."},
            {"icon": "🌸", "title": "Floral Prints Are Your Friend",
             "text": "Floral and tropical prints are seasonally perfect and instantly elevate a summer outfit."},
        ],
    },

    # ── WARM 26–31°C ──────────────────────────────────────────────────────────
    "warm": {
        "label":   "Warm & Pleasant",
        "emoji":   "🌤️",
        "season":  "summer",
        "allowed_sub_categories":  ["TopWear", "Dresses", "BottomWear"],
        "allowed_keywords": [
            "cotton", "casual", "light", "tee", "t-shirt", "shirt",
            "dress", "linen", "summer", "chino", "trouser",
        ],
        "avoid_keywords": ["wool", "puffer", "thermal", "heavy", "coat"],
        "preferred_colors":  ["white", "light blue", "yellow", "coral", "beige", "pink"],
        "preferred_fabrics": ["cotton", "linen", "jersey", "rayon"],
        "avoid_fabrics":     ["wool", "thick denim"],
        "fallback_sub_categories": ["TopWear", "BottomWear"],
        "tips": [
            {"icon": "👔", "title": "Light Layers Work Best",
             "text": "A single breathable layer is all you need. Keep a cardigan for air-conditioned spaces."},
            {"icon": "🎨", "title": "Embrace Summer Tones",
             "text": "Coral, yellow, and soft blue are seasonally appropriate and instantly elevate any look."},
            {"icon": "🧴", "title": "Cotton First",
             "text": "Cotton blends offer the best balance of comfort and style for warm weather outings."},
            {"icon": "👜", "title": "Go Minimal on Bags",
             "text": "A small crossbody or tote keeps you light — perfect for a warm day out."},
            {"icon": "👟", "title": "Lightweight Footwear",
             "text": "Loafers and canvas sneakers are breathable, stylish, and won't weigh you down."},
            {"icon": "🌿", "title": "Try Linen",
             "text": "Linen wrinkles but breathes beautifully — perfect for warm casual days."},
            {"icon": "🚫", "title": "Skip the Heavy Denim",
             "text": "Heavy jeans trap heat. Opt for lightweight chinos or linen trousers instead."},
            {"icon": "✨", "title": "One Statement Piece",
             "text": "Warm weather means minimal layering — let one strong piece do the talking."},
        ],
    },

    # ── MODERATE 18–25°C ──────────────────────────────────────────────────────
    "moderate": {
        "label":   "Mild & Breezy",
        "emoji":   "⛅",
        "season":  "all-season",
        "allowed_sub_categories":  ["TopWear", "BottomWear", "Dresses"],
        "allowed_keywords": [
            "casual", "denim", "cotton", "jeans", "shirt", "tee",
            "cardigan", "layer", "blouse", "trouser", "chino",
        ],
        "avoid_keywords": ["puffer", "heavy wool", "thermal", "waterproof"],
        "preferred_colors":  ["navy", "grey", "white", "olive", "burgundy", "camel"],
        "preferred_fabrics": ["cotton", "denim", "light knit"],
        "avoid_fabrics":     ["heavy wool", "thick fur"],
        "fallback_sub_categories": ["TopWear", "BottomWear"],
        "tips": [
            {"icon": "🧥", "title": "Master the Layer",
             "text": "Start with a light tee, add a denim jacket. Remove it as the day warms up."},
            {"icon": "🎨", "title": "Earth Tones Shine",
             "text": "Olive, camel, and navy are perfect for mild weather and pair with almost anything."},
            {"icon": "🧣", "title": "Scarf as Style Tool",
             "text": "A lightweight scarf doubles as warmth and a style statement — one of the most versatile pieces."},
            {"icon": "👟", "title": "Sneakers Do the Job",
             "text": "Clean white sneakers or leather loafers hit the sweet spot between comfort and polish."},
            {"icon": "👖", "title": "Denim is Your Ally",
             "text": "Jeans are perfectly weighted for mild days — not too heavy, not too light."},
            {"icon": "⚡", "title": "Versatility is Key",
             "text": "Pick pieces that work both indoors and outdoors — mild weather shifts through the day."},
            {"icon": "🌿", "title": "Neutral Base, Bold Accent",
             "text": "Build a neutral base outfit, then add a colourful scarf or bag for visual interest."},
            {"icon": "🧢", "title": "Cap or Beret",
             "text": "A casual cap or beret is both practical and stylish for breezy mild days."},
        ],
    },

    # ── COOL 12–17°C ──────────────────────────────────────────────────────────
    "cool": {
        "label":   "Cool & Windy",
        "emoji":   "🌬️",
        "season":  "all-season",
        "allowed_sub_categories":  ["TopWear", "WinterWear", "BottomWear"],
        "allowed_keywords": [
            "jacket", "hoodie", "sweater", "cardigan", "sweatshirt",
            "knit", "layer", "long sleeve", "long-sleeve", "pullover",
            "fleece", "denim jacket", "bomber",
        ],
        "avoid_keywords": ["sleeveless", "shorts", "crop top", "tank"],
        "preferred_colors":  ["navy", "grey", "brown", "olive", "burgundy", "dark green"],
        "preferred_fabrics": ["fleece", "knit", "denim", "corduroy"],
        "avoid_fabrics":     ["linen", "thin cotton", "sheer"],
        "fallback_sub_categories": ["TopWear", "WinterWear"],
        "tips": [
            {"icon": "🧅", "title": "Layer Like a Pro",
             "text": "Base layer + mid layer + outer layer = the layering formula that stylists swear by."},
            {"icon": "🟤", "title": "Rich Tones Elevate",
             "text": "Burgundy, rust, and forest green look incredible in cool weather — lean into the season's palette."},
            {"icon": "🧤", "title": "Add Warm Accessories",
             "text": "A chunky knit scarf and beanie can transform a simple outfit into a complete seasonal look."},
            {"icon": "🥾", "title": "Ankle Boots Are Ideal",
             "text": "They bridge the gap between seasons — warm enough for cool days, stylish for any occasion."},
            {"icon": "🧶", "title": "Embrace Knits",
             "text": "Chunky knit sweaters are cosy, effortlessly stylish, and a staple of cool-weather dressing."},
            {"icon": "🧥", "title": "Denim Jacket as Go-To",
             "text": "A denim jacket is the perfect mid-layer for cool days — versatile and always stylish."},
            {"icon": "🚫", "title": "Avoid Thin Fabrics Alone",
             "text": "A single thin cotton layer won't cut it — always have a jacket or hoodie to hand."},
            {"icon": "🌿", "title": "Olive and Khaki Work",
             "text": "Earth tones like olive and khaki are naturally suited to cool autumn and spring days."},
        ],
    },

    # ── COLD < 12°C ───────────────────────────────────────────────────────────
    "cold": {
        "label":   "Cold & Chilly",
        "emoji":   "❄️",
        "season":  "winter",
        "allowed_sub_categories":  ["WinterWear", "TopWear", "BottomWear"],
        "allowed_keywords": [
            "wool", "coat", "jacket", "sweater", "thermal", "warm",
            "fleece", "puffer", "down", "knit", "winter", "hoodie",
            "turtleneck", "full sleeve", "full-sleeve", "long",
        ],
        "avoid_keywords": ["sleeveless", "shorts", "mini", "crop top", "linen", "tank"],
        "preferred_colors":  ["navy", "charcoal", "black", "burgundy", "dark green", "camel"],
        "preferred_fabrics": ["wool", "cashmere", "fleece", "down", "thick knit"],
        "avoid_fabrics":     ["linen", "rayon", "sheer", "cotton only"],
        "fallback_sub_categories": ["WinterWear", "TopWear"],
        "tips": [
            {"icon": "🔥", "title": "Thermal Base is Non-Negotiable",
             "text": "A good thermal base layer is invisible under your outfit but makes a huge warmth difference."},
            {"icon": "🐑", "title": "Wool Over Everything",
             "text": "Merino wool regulates temperature, resists odour, and is softer than you'd expect — the ultimate cold-weather fabric."},
            {"icon": "🧣", "title": "Scarf + Hat = Half the Battle",
             "text": "Your head and neck lose the most heat — covering them properly keeps your whole body warmer."},
            {"icon": "🖤", "title": "Dark Palette is Practical",
             "text": "Dark colours absorb more heat from sunlight and hide the inevitable salt stains of winter."},
            {"icon": "🥾", "title": "Boots Are Mandatory",
             "text": "Insulated boots keep your feet warm. Cold feet ruin any outfit, no matter how great it looks."},
            {"icon": "🧥", "title": "Invest in a Quality Coat",
             "text": "One great coat transforms any outfit. It's the most visible piece you'll wear all winter."},
            {"icon": "🚫", "title": "Never Skip Layers",
             "text": "No single piece is enough in the cold. Three thin layers are warmer than one thick one."},
            {"icon": "✨", "title": "Textures Add Interest",
             "text": "Mix cable-knit, faux fur, and denim textures — winter is the season for tactile, layered dressing."},
        ],
    },

    # ── RAINY (rain/drizzle/shower) ───────────────────────────────────────────
    "rainy": {
        "label":   "Rainy Day",
        "emoji":   "🌧️",
        "season":  "rainy",
        "allowed_sub_categories":  ["TopWear", "WinterWear", "BottomWear"],
        "allowed_keywords": [
            "waterproof", "jacket", "hoodie", "coat", "dark", "quick-dry",
            "rain", "trench", "anorak", "windproof", "denim", "trouser",
        ],
        "avoid_keywords": ["suede", "velvet", "linen", "sheer", "white", "light", "floral"],
        "preferred_colors":  ["black", "navy", "dark grey", "dark green", "charcoal"],
        "preferred_fabrics": ["nylon", "polyester", "gore-tex", "quick-dry", "rubber"],
        "avoid_fabrics":     ["suede", "velvet", "linen", "raw cotton"],
        "fallback_sub_categories": ["TopWear", "WinterWear"],
        "tips": [
            {"icon": "💧", "title": "Waterproof is Priority One",
             "text": "A waterproof jacket is the single most important piece in your rain-day wardrobe."},
            {"icon": "🖤", "title": "Wear Darks Confidently",
             "text": "Dark colours don't show water spots or mud — you'll look sharp even after navigating puddles."},
            {"icon": "☂️", "title": "Match Your Umbrella",
             "text": "A statement umbrella that complements your outfit is an underrated style move."},
            {"icon": "🚫", "title": "Avoid Suede at All Costs",
             "text": "Suede is ruined by water — save it for dry days and opt for leather or rubber instead."},
            {"icon": "🩱", "title": "Quick-Dry Fabrics Win",
             "text": "Nylon and polyester blends dry quickly even when wet — far more comfortable than soggy cotton."},
            {"icon": "👢", "title": "Waterproof Boots Only",
             "text": "Your feet will thank you. Wet socks are miserable — rubber or waterproofed leather boots are essential."},
            {"icon": "🎒", "title": "Waterproof Your Bag Too",
             "text": "A waterproof backpack or bag protects your belongings. Look for waxed canvas or nylon options."},
            {"icon": "🌑", "title": "Roll-Up Trousers",
             "text": "Rolling your trousers up slightly keeps them dry from puddle splash — both practical and stylish."},
        ],
    },
}


# ── Public API ────────────────────────────────────────────────────────────────

def map_weather_to_profile(temp: float, condition: str) -> dict:
    """
    Convert raw weather values into a structured clothing preference profile.

    Args:
        temp:      Temperature in Celsius (from OpenWeatherMap)
        condition: Condition string e.g. "Clear", "Rain", "Clouds", "Drizzle"

    Returns:
        Full profile dict with allowed_sub_categories, keywords, tips etc.
        The _type key holds the internal category string.

    This is the SINGLE GATE through which weather maps to clothing.
    Every downstream module (recommender, route, controller) reads from this.
    """
    cond = condition.lower()

    # Rain check first — rain overrides temperature rules
    if any(k in cond for k in ("rain", "drizzle", "shower", "storm", "thunder")):
        cat = "rainy"
    elif temp >= 32:
        cat = "hot"
    elif temp >= 26:
        cat = "warm"
    elif temp >= 18:
        cat = "moderate"
    elif temp >= 12:
        cat = "cool"
    else:
        cat = "cold"

    profile = _PROFILES[cat].copy()
    profile["_type"] = cat   # internal key, used by recommender
    return profile


def score_product_for_weather(product: dict, profile: dict) -> dict:
    """
    Score a single product against a weather profile.

    Scoring (raw max = 8, normalised to 0–100):
      +2  subCategory in allowed_sub_categories
      +2  name/description contains ≥1 allowed_keyword
      +1  name/description contains ≥1 preferred_fabric
      +1  name/description contains ≥1 preferred_color
      +1  name/description contains ≥2 allowed_keywords (bonus)
      +1  bestseller == True

    Exclusion:
      excluded = True if name/description contains ANY avoid_keyword

    Returns:
      {
        "score":    0–100,
        "reason":   str,
        "matched":  [str],   # which criteria matched
        "excluded": bool
      }
    """
    name_desc = (
        (product.get("name", "") or "") + " " +
        (product.get("description", "") or "")
    ).lower()

    sub_cat = (product.get("subCategory", "") or "").lower()
    matched  = []
    raw      = 0

    # ── Exclusion check (hard gate) ───────────────────────────────────────────
    avoid_kw = [k.lower() for k in profile.get("avoid_keywords", [])]
    if any(k in name_desc for k in avoid_kw):
        hit = next(k for k in avoid_kw if k in name_desc)
        return {
            "score":    0,
            "reason":   f"Not suitable — contains '{hit}' which is not recommended for {profile['label']} weather.",
            "matched":  [],
            "excluded": True,
        }

    # ── Positive scoring ──────────────────────────────────────────────────────
    allowed_subs = [s.lower() for s in profile.get("allowed_sub_categories", [])]
    if sub_cat in allowed_subs:
        raw += 2
        matched.append(f"Category match ({product.get('subCategory', '')})")

    allowed_kw = [k.lower() for k in profile.get("allowed_keywords", [])]
    kw_hits    = [k for k in allowed_kw if k in name_desc]
    if kw_hits:
        raw += 2
        matched.append(f"Style match ({kw_hits[0]})")
    if len(kw_hits) >= 2:
        raw += 1   # bonus for double keyword match
        matched.append("Strong style match")

    pref_fabrics = [f.lower() for f in profile.get("preferred_fabrics", [])]
    fab_hits     = [f for f in pref_fabrics if f in name_desc]
    if fab_hits:
        raw += 1
        matched.append(f"Preferred fabric ({fab_hits[0]})")

    pref_colors = [c.lower() for c in profile.get("preferred_colors", [])]
    col_hits    = [c for c in pref_colors if c in name_desc]
    if col_hits:
        raw += 1
        matched.append(f"Preferred colour ({col_hits[0]})")

    if product.get("bestseller"):
        raw += 1
        matched.append("Bestseller")

    # Normalise to 0–100
    MAX_RAW = 8.0
    score   = round(min(100, (raw / MAX_RAW) * 100))

    # Dynamic reason string
    if score >= 80:
        reason = f"Excellent choice for {profile['label']} — {', '.join(matched[:2])}."
    elif score >= 50:
        reason = f"Good match for {profile['label']} conditions — {matched[0]}."
    elif score > 0:
        reason = f"Suitable for {profile['label']} weather."
    else:
        reason = f"May work for {profile['label']} with the right styling."

    return {"score": score, "reason": reason, "matched": matched, "excluded": False}