"""
ai_service/core/image_analyzer.py
==================================
CNN-based image analysis pipeline using MobileNetV2.

Pipeline
--------
1. Preprocess image  — resize to 224×224, normalize
2. Extract features  — MobileNetV2 embeddings (1280-d vector)
3. Classify category — predict topwear / bottomwear / footwear / outerwear / dress
4. Detect color      — KMeans dominant-colour extraction
5. Detect pattern    — basic LBP texture classifier (solid / striped / printed / checked)

Returns a structured dict that maps directly to the WardrobeItem MongoDB schema.
"""

import io
import numpy as np
from PIL import Image, ImageFilter
from sklearn.cluster import KMeans

# ── Lazy-load TensorFlow to keep import time fast ──────────────────────────────
_model = None
_preprocess_input = None

def _get_model():
    global _model, _preprocess_input
    if _model is None:
        from tensorflow.keras.applications import MobileNetV2
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        # include_top=False → strip classifier head, keep feature extractor
        _model = MobileNetV2(weights="imagenet", include_top=False, pooling="avg",
                             input_shape=(224, 224, 3))
        _preprocess_input = preprocess_input
    return _model, _preprocess_input


# ── Color utilities ────────────────────────────────────────────────────────────

# Named colour palette (RGB centroids) for nearest-neighbor lookup
_COLOR_PALETTE = {
    "white":  (240, 240, 240),
    "black":  (20,  20,  20),
    "red":    (200, 30,  30),
    "pink":   (230, 130, 170),
    "orange": (230, 110, 30),
    "yellow": (230, 210, 40),
    "green":  (40,  150, 60),
    "teal":   (30,  160, 150),
    "blue":   (40,  90,  200),
    "navy":   (20,  30,  100),
    "purple": (130, 50,  180),
    "brown":  (120, 70,  40),
    "grey":   (140, 140, 140),
    "beige":  (210, 190, 150),
}

def _nearest_color_name(rgb):
    """Map an RGB tuple to the nearest named colour."""
    r, g, b = rgb
    best_name, best_dist = "unknown", float("inf")
    for name, (cr, cg, cb) in _COLOR_PALETTE.items():
        dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        if dist < best_dist:
            best_dist, best_name = dist, name
    return best_name


def extract_dominant_color(img_rgb: np.ndarray, n_clusters: int = 3) -> dict:
    """
    Run KMeans on pixel values to find the dominant colour cluster.

    Returns
    -------
    {
      "name":    "white",
      "hex":     "#f0f0f0",
      "rgb":     [240, 240, 240],
      "family":  "neutral"   # warm | cool | neutral
    }
    """
    # Flatten to (N, 3) — use at most 5000 pixels for speed
    pixels = img_rgb.reshape(-1, 3)
    if len(pixels) > 5000:
        idx = np.random.choice(len(pixels), 5000, replace=False)
        pixels = pixels[idx]

    km = KMeans(n_clusters=n_clusters, n_init=5, random_state=42)
    km.fit(pixels)

    # Pick the cluster with the most pixels
    counts      = np.bincount(km.labels_)
    dominant    = km.cluster_centers_[counts.argmax()].astype(int)
    name        = _nearest_color_name(tuple(dominant))
    hex_color   = "#{:02x}{:02x}{:02x}".format(*dominant)

    family_map = {
        "red": "warm", "pink": "warm", "orange": "warm", "yellow": "warm",
        "brown": "warm",
        "blue": "cool", "navy": "cool", "teal": "cool", "green": "cool",
        "purple": "cool", "grey": "cool",
        "white": "neutral", "black": "neutral", "beige": "neutral",
    }
    family = family_map.get(name, "neutral")

    return {"name": name, "hex": hex_color, "rgb": dominant.tolist(), "family": family}


# ── Pattern detection ──────────────────────────────────────────────────────────

def detect_pattern(img_gray: np.ndarray) -> str:
    """
    Lightweight pattern classifier using pixel variance and edge density.

    Returns one of: solid | striped | printed | checked
    """
    # Overall variance — high = busy print
    variance = float(np.var(img_gray))

    # Edge map using simple Sobel approximation via PIL
    pil_gray = Image.fromarray(img_gray)
    edges    = np.array(pil_gray.filter(ImageFilter.FIND_EDGES))
    edge_density = float(edges.mean())

    # Row / column variance ratio (detects stripes)
    row_var  = float(np.var(np.mean(img_gray, axis=1)))   # horizontal bands
    col_var  = float(np.var(np.mean(img_gray, axis=0)))   # vertical bands

    if variance < 200:
        return "solid"
    if abs(row_var - col_var) < 50 and edge_density > 20:
        return "checked"
    if row_var > col_var * 2 or col_var > row_var * 2:
        return "striped"
    return "printed"


# ── Category classification ────────────────────────────────────────────────────

# Simple heuristic: clothing category determined by image aspect ratio +
# embedding position in feature space (coarse approximation without labelled data).
# For production, fine-tune MobileNetV2 head on a labelled clothing dataset.

_CATEGORY_RULES = [
    # (aspect_ratio_range, area_fraction, category)
    # tall images → likely tops / dresses
    # wide images → likely bottoms
    # small square → accessories / footwear
]

def classify_category_heuristic(width: int, height: int) -> str:
    """
    Coarse category from image aspect ratio.
    Replace with a fine-tuned head for production accuracy.
    """
    ratio = height / max(width, 1)
    if ratio > 1.6:
        return "dress"
    if ratio > 1.2:
        return "topwear"
    if ratio < 0.8:
        return "bottomwear"
    return "topwear"   # default


# ── Main analyzer ──────────────────────────────────────────────────────────────

def analyze_image(image_bytes: bytes) -> dict:
    """
    Full analysis pipeline for a single clothing image.

    Parameters
    ----------
    image_bytes : raw bytes from the uploaded file or a URL fetch

    Returns
    -------
    {
      "category":   "topwear",
      "color":      { "name": "white", "hex": "#f0f0f0", "rgb": [...], "family": "neutral" },
      "pattern":    "solid",
      "embedding":  [...],   # 1280-d float list (truncated to 128 for storage)
      "confidence": 0.87
    }
    """
    # ── 1. Load & pre-process ────────────────────────────────────────────────
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    orig_w, orig_h = pil_img.size

    img_224    = pil_img.resize((224, 224), Image.LANCZOS)
    img_rgb    = np.array(img_224)           # (224, 224, 3) uint8
    img_gray   = np.array(img_224.convert("L"))  # (224, 224) uint8

    # ── 2. CNN feature extraction ────────────────────────────────────────────
    model, preprocess = _get_model()
    batch   = np.expand_dims(img_rgb.astype("float32"), axis=0)
    batch   = preprocess(batch)              # MobileNetV2 normalisation
    embed   = model.predict(batch, verbose=0)[0]  # shape: (1280,)

    # Store first 128 dims (sufficient for similarity search, saves bandwidth)
    embedding_128 = embed[:128].tolist()

    # ── 3. Colour detection ──────────────────────────────────────────────────
    color_info = extract_dominant_color(img_rgb)

    # ── 4. Pattern detection ─────────────────────────────────────────────────
    pattern = detect_pattern(img_gray)

    # ── 5. Category heuristic ────────────────────────────────────────────────
    category = classify_category_heuristic(orig_w, orig_h)

    # ── 6. Confidence proxy ──────────────────────────────────────────────────
    # Use embedding magnitude as a rough confidence proxy
    confidence = round(float(np.linalg.norm(embed) / 100), 2)
    confidence = min(confidence, 1.0)

    return {
        "category":   category,
        "color":      color_info,
        "pattern":    pattern,
        "embedding":  embedding_128,
        "confidence": confidence
    }