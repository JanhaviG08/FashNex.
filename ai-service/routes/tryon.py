"""
ai-service/routes/tryon.py
==========================
Virtual Try-On endpoint using MediaPipe Pose + OpenCV overlay.

POST /try-on
  Body : { image: "data:image/jpeg;base64,...", product: { image_url, category, name, id } }
  Returns: { tryOnImage: "data:image/jpeg;base64,...", sizeRecommendation, poseScore, suggestions }

Install deps (add to requirements.txt):
  mediapipe>=0.10.0
  opencv-python-headless>=4.8.0
  numpy>=1.24.0
  httpx>=0.25.0
  Pillow>=10.0.0
"""

from __future__ import annotations

import base64
import io
import logging
import math
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import cv2
import httpx
import mediapipe as mp
import numpy as np
from fastapi import APIRouter, HTTPException
from PIL import Image
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# MediaPipe initialisation (shared, lazy-loaded once)
# ─────────────────────────────────────────────────────────────────────────────
_mp_pose    = mp.solutions.pose
_pose_model = _mp_pose.Pose(
    static_image_mode=True,
    model_complexity=1,          # 0=lite 1=full 2=heavy
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

# ─────────────────────────────────────────────────────────────────────────────
# Size estimation thresholds (shoulder_width / frame_width ratio)
# ─────────────────────────────────────────────────────────────────────────────
SIZE_THRESHOLDS = [
    (0.22, "XS"),
    (0.27, "S"),
    (0.32, "M"),
    (0.37, "L"),
    (0.43, "XL"),
    (1.00, "XXL"),
]

# Category → what to pair with
PAIR_CATEGORIES: Dict[str, List[str]] = {
    "top":     ["bottom", "footwear", "accessories"],
    "shirt":   ["bottom", "footwear", "accessories"],
    "bottom":  ["top", "shirt", "footwear"],
    "pants":   ["top", "shirt", "footwear"],
    "dress":   ["footwear", "accessories", "bag"],
    "skirt":   ["top", "shirt", "footwear"],
    "default": ["top", "bottom", "footwear"],
}

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────
class ProductPayload(BaseModel):
    image_url: str
    category:  str          # top / bottom / dress / shirt / pants …
    name:      Optional[str] = ""
    id:        Optional[str] = ""

class TryOnRequest(BaseModel):
    image:   str            # data-URI or raw base64
    product: ProductPayload

class SuggestionItem(BaseModel):
    _id:          str = ""
    name:         str = ""
    price:        float = 0.0
    image1:       str = ""
    pairingReason: str = ""

class TryOnResponse(BaseModel):
    tryOnImage:         str
    sizeRecommendation: str
    poseScore:          float
    suggestions:        List[Dict[str, Any]] = []

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _decode_base64_image(b64: str) -> np.ndarray:
    """Decode a data-URI or raw base64 string → BGR numpy array."""
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    raw   = base64.b64decode(b64)
    arr   = np.frombuffer(raw, np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Could not decode image")
    return frame


def _encode_to_b64(frame: np.ndarray, quality: int = 82) -> str:
    """Encode BGR numpy array → JPEG data-URI base64."""
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise ValueError("cv2.imencode failed")
    return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode()


def _fetch_clothing_image(url: str) -> Optional[np.ndarray]:
    """Download clothing image from URL, return BGRA numpy array (with alpha)."""
    try:
        resp = httpx.get(url, timeout=6.0, follow_redirects=True)
        resp.raise_for_status()
        pil  = Image.open(io.BytesIO(resp.content)).convert("RGBA")
        arr  = np.array(pil, dtype=np.uint8)
        # RGBA → BGRA for OpenCV
        return cv2.cvtColor(arr, cv2.COLOR_RGBA2BGRA)
    except Exception as exc:
        logger.warning("Could not fetch clothing image %s: %s", url, exc)
        return None


def _run_pose(frame_bgr: np.ndarray):
    """Run MediaPipe Pose on a BGR frame, return (results, confidence)."""
    rgb     = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    results = _pose_model.process(rgb)
    if not results.pose_landmarks:
        return None, 0.0

    # Compute mean visibility as a proxy confidence
    vis_scores = [lm.visibility for lm in results.pose_landmarks.landmark]
    confidence = float(np.mean(vis_scores))
    return results, confidence


def _get_pixel(lm, idx: int, w: int, h: int) -> Tuple[int, int]:
    """Convert normalised landmark to pixel coords."""
    pt = lm.landmark[idx]
    return int(pt.x * w), int(pt.y * h)


# ─────────────────────────────────────────────────────────────────────────────
# Size estimation
# ─────────────────────────────────────────────────────────────────────────────

def _estimate_size(landmarks, frame_w: int) -> str:
    """
    Measure shoulder width from LEFT_SHOULDER (11) → RIGHT_SHOULDER (12)
    and map to clothing size.
    """
    lm = landmarks.landmark
    try:
        lsx, _  = int(lm[11].x * frame_w), 0
        rsx, _  = int(lm[12].x * frame_w), 0
        shoulder_px   = abs(rsx - lsx)
        shoulder_ratio = shoulder_px / frame_w

        for threshold, label in SIZE_THRESHOLDS:
            if shoulder_ratio <= threshold:
                return label
        return "XXL"
    except Exception:
        return "M"


# ─────────────────────────────────────────────────────────────────────────────
# Clothing overlay
# ─────────────────────────────────────────────────────────────────────────────

def _overlay_top(frame: np.ndarray, cloth_bgra: np.ndarray, landmarks) -> np.ndarray:
    """
    Overlay a top/shirt garment on the detected torso region.
    Uses shoulders + hips to define the target rectangle, then warps
    the clothing image into that quad.
    """
    h, w = frame.shape[:2]
    lm   = landmarks.landmark
    PL   = _mp_pose.PoseLandmark

    try:
        # ── key points ──
        ls = (int(lm[PL.LEFT_SHOULDER].x  * w), int(lm[PL.LEFT_SHOULDER].y  * h))
        rs = (int(lm[PL.RIGHT_SHOULDER].x * w), int(lm[PL.RIGHT_SHOULDER].y * h))
        lh = (int(lm[PL.LEFT_HIP].x       * w), int(lm[PL.LEFT_HIP].y       * h))
        rh = (int(lm[PL.RIGHT_HIP].x      * w), int(lm[PL.RIGHT_HIP].y      * h))

        # ── expand bounding box ──
        shoulder_w = abs(rs[0] - ls[0])
        pad_x      = int(shoulder_w * 0.25)         # side padding
        pad_top    = int(shoulder_w * 0.20)          # neck room
        pad_bottom = int(shoulder_w * 0.10)

        x_min = min(ls[0], rs[0], lh[0], rh[0]) - pad_x
        x_max = max(ls[0], rs[0], lh[0], rh[0]) + pad_x
        y_min = min(ls[1], rs[1])                - pad_top
        y_max = max(lh[1], rh[1])                + pad_bottom

        x_min = max(0, x_min)
        y_min = max(0, y_min)
        x_max = min(w, x_max)
        y_max = min(h, y_max)

        if x_max <= x_min or y_max <= y_min:
            return frame

        target_w = x_max - x_min
        target_h = y_max - y_min

        # ── resize cloth to target box ──
        cloth_h, cloth_w = cloth_bgra.shape[:2]
        cloth_resized = cv2.resize(cloth_bgra, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)

        # ── alpha composite ──
        roi = frame[y_min:y_max, x_min:x_max]
        if roi.shape[:2] != cloth_resized.shape[:2]:
            return frame

        alpha  = cloth_resized[:, :, 3:4].astype(np.float32) / 255.0
        cloth3 = cloth_resized[:, :, :3].astype(np.float32)
        roi_f  = roi.astype(np.float32)

        blended = (cloth3 * alpha + roi_f * (1.0 - alpha)).astype(np.uint8)
        frame[y_min:y_max, x_min:x_max] = blended

    except Exception as exc:
        logger.warning("_overlay_top failed: %s", exc)

    return frame


def _overlay_bottom(frame: np.ndarray, cloth_bgra: np.ndarray, landmarks) -> np.ndarray:
    """Overlay a bottom garment (pants/skirt) on the hip-to-ankle region."""
    h, w = frame.shape[:2]
    lm   = landmarks.landmark
    PL   = _mp_pose.PoseLandmark

    try:
        lh = (int(lm[PL.LEFT_HIP].x   * w), int(lm[PL.LEFT_HIP].y   * h))
        rh = (int(lm[PL.RIGHT_HIP].x  * w), int(lm[PL.RIGHT_HIP].y  * h))
        la = (int(lm[PL.LEFT_ANKLE].x  * w), int(lm[PL.LEFT_ANKLE].y  * h))
        ra = (int(lm[PL.RIGHT_ANKLE].x * w), int(lm[PL.RIGHT_ANKLE].y * h))

        hip_w  = abs(rh[0] - lh[0])
        pad_x  = int(hip_w * 0.30)

        x_min = min(lh[0], rh[0]) - pad_x
        x_max = max(lh[0], rh[0]) + pad_x
        y_min = min(lh[1], rh[1]) - int(hip_w * 0.05)
        y_max = max(la[1], ra[1]) + int(hip_w * 0.10)

        x_min = max(0, x_min)
        y_min = max(0, y_min)
        x_max = min(w, x_max)
        y_max = min(h, y_max)

        if x_max <= x_min or y_max <= y_min:
            return frame

        target_w = x_max - x_min
        target_h = y_max - y_min

        cloth_resized = cv2.resize(cloth_bgra, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
        roi = frame[y_min:y_max, x_min:x_max]
        if roi.shape[:2] != cloth_resized.shape[:2]:
            return frame

        alpha  = cloth_resized[:, :, 3:4].astype(np.float32) / 255.0
        cloth3 = cloth_resized[:, :, :3].astype(np.float32)
        blended = (cloth3 * alpha + roi.astype(np.float32) * (1.0 - alpha)).astype(np.uint8)
        frame[y_min:y_max, x_min:x_max] = blended

    except Exception as exc:
        logger.warning("_overlay_bottom failed: %s", exc)

    return frame


def _overlay_dress(frame: np.ndarray, cloth_bgra: np.ndarray, landmarks) -> np.ndarray:
    """Full-body dress: shoulder → ankle."""
    h, w = frame.shape[:2]
    lm   = landmarks.landmark
    PL   = _mp_pose.PoseLandmark

    try:
        ls = (int(lm[PL.LEFT_SHOULDER].x  * w), int(lm[PL.LEFT_SHOULDER].y  * h))
        rs = (int(lm[PL.RIGHT_SHOULDER].x * w), int(lm[PL.RIGHT_SHOULDER].y * h))
        la = (int(lm[PL.LEFT_ANKLE].x     * w), int(lm[PL.LEFT_ANKLE].y     * h))
        ra = (int(lm[PL.RIGHT_ANKLE].x    * w), int(lm[PL.RIGHT_ANKLE].y    * h))

        sh_w   = abs(rs[0] - ls[0])
        pad_x  = int(sh_w * 0.30)
        pad_top = int(sh_w * 0.20)

        x_min = min(ls[0], rs[0]) - pad_x
        x_max = max(ls[0], rs[0]) + pad_x
        y_min = min(ls[1], rs[1]) - pad_top
        y_max = max(la[1], ra[1]) + int(sh_w * 0.10)

        x_min = max(0, x_min)
        y_min = max(0, y_min)
        x_max = min(w, x_max)
        y_max = min(h, y_max)

        if x_max <= x_min or y_max <= y_min:
            return frame

        cloth_resized = cv2.resize(cloth_bgra, (x_max - x_min, y_max - y_min), interpolation=cv2.INTER_LANCZOS4)
        roi = frame[y_min:y_max, x_min:x_max]
        if roi.shape[:2] != cloth_resized.shape[:2]:
            return frame

        alpha  = cloth_resized[:, :, 3:4].astype(np.float32) / 255.0
        cloth3 = cloth_resized[:, :, :3].astype(np.float32)
        blended = (cloth3 * alpha + roi.astype(np.float32) * (1.0 - alpha)).astype(np.uint8)
        frame[y_min:y_max, x_min:x_max] = blended

    except Exception as exc:
        logger.warning("_overlay_dress failed: %s", exc)

    return frame


def _apply_overlay(frame: np.ndarray, cloth_bgra: np.ndarray, category: str, landmarks) -> np.ndarray:
    """Route to the correct overlay function based on category."""
    cat = category.lower().strip()
    if cat in ("top", "shirt", "tshirt", "t-shirt", "jacket", "hoodie", "sweater", "kurta", "blouse"):
        return _overlay_top(frame, cloth_bgra, landmarks)
    elif cat in ("bottom", "pants", "jeans", "skirt", "shorts", "trousers", "leggings"):
        return _overlay_bottom(frame, cloth_bgra, landmarks)
    elif cat in ("dress", "gown", "saree", "jumpsuit", "romper"):
        return _overlay_dress(frame, cloth_bgra, landmarks)
    else:
        # fallback: treat as top
        return _overlay_top(frame, cloth_bgra, landmarks)


# ─────────────────────────────────────────────────────────────────────────────
# Outfit suggestion (from MongoDB via Node API, fallback: empty)
# ─────────────────────────────────────────────────────────────────────────────
NODE_API = os.getenv("NODE_API_URL", "http://localhost:5000")

async def _fetch_suggestions(category: str, product_id: str) -> List[Dict[str, Any]]:
    """
    Call the Node.js product API to find complementary items.
    Falls back to [] if the call fails or the endpoint doesn't exist yet.
    Endpoint expected: GET /api/products/suggest?category=top&exclude=<id>&limit=6
    """
    pair_cats  = PAIR_CATEGORIES.get(category.lower(), PAIR_CATEGORIES["default"])
    suggestions: List[Dict[str, Any]] = []

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            for pair_cat in pair_cats[:2]:          # max 2 categories to keep it fast
                url = f"{NODE_API}/api/products/suggest"
                params = {"category": pair_cat, "exclude": product_id, "limit": 4}
                try:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data if isinstance(data, list) else data.get("products", [])
                        for item in items[:4]:
                            item["pairingReason"] = f"Pairs with {category}"
                        suggestions.extend(items)
                except Exception:
                    pass
    except Exception as exc:
        logger.warning("Suggestion fetch failed: %s", exc)

    # Deduplicate by _id
    seen, unique = set(), []
    for s in suggestions:
        sid = str(s.get("_id", ""))
        if sid and sid not in seen:
            seen.add(sid)
            unique.append(s)

    return unique[:8]


# ─────────────────────────────────────────────────────────────────────────────
# Main endpoint
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/try-on", response_model=TryOnResponse)
async def try_on(payload: TryOnRequest):
    t0 = time.perf_counter()

    # 1. Decode the webcam frame
    try:
        frame = _decode_base64_image(payload.image)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}")

    # 2. Mirror horizontally (webcam is already mirrored on frontend via CSS)
    #    We un-mirror for MediaPipe so left/right landmarks are correct.
    frame_orig = frame.copy()
    frame      = cv2.flip(frame, 1)

    h, w = frame.shape[:2]

    # 3. Run pose detection
    pose_results, pose_score = _run_pose(frame)

    if pose_results is None or pose_score < 0.25:
        # No pose detected — return the original frame with a note
        logger.info("No pose detected (score=%.2f)", pose_score)
        out_b64 = _encode_to_b64(cv2.flip(frame, 1))   # re-mirror back for display
        return TryOnResponse(
            tryOnImage=out_b64,
            sizeRecommendation="M",
            poseScore=float(pose_score),
            suggestions=[],
        )

    # 4. Estimate size from shoulder landmarks
    size_rec = _estimate_size(pose_results.pose_landmarks, w)

    # 5. Fetch & overlay clothing image
    cloth_bgra = _fetch_clothing_image(payload.product.image_url)

    if cloth_bgra is not None:
        frame = _apply_overlay(frame, cloth_bgra, payload.product.category, pose_results.pose_landmarks)

    # 6. Re-mirror so it matches the CSS-mirrored camera feed on the frontend
    frame_out = cv2.flip(frame, 1)

    # 7. Encode output
    out_b64 = _encode_to_b64(frame_out)

    # 8. Fetch outfit suggestions (async, non-blocking)
    suggestions = await _fetch_suggestions(
        payload.product.category,
        payload.product.id or ""
    )

    elapsed = time.perf_counter() - t0
    logger.info(
        "try-on done in %.0fms | size=%s | pose=%.2f | suggestions=%d",
        elapsed * 1000, size_rec, pose_score, len(suggestions)
    )

    return TryOnResponse(
        tryOnImage=out_b64,
        sizeRecommendation=size_rec,
        poseScore=round(pose_score, 3),
        suggestions=suggestions,
    )