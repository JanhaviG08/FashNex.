"""
ai_service/routes/analyze.py
==============================
POST /analyze

Accepts a clothing image (multipart file OR base64 JSON) and runs the full
CNN analysis pipeline.

Request (multipart/form-data):
  file   : image file

Request (application/json):
  {
    "imageBase64": "<base64 string>",
    "mimeType":    "image/jpeg"           (optional, default image/jpeg)
  }

Response:
  {
    "category":   "topwear",
    "color":      { "name": "white", "hex": "#f0f0f0", "rgb": [...], "family": "neutral" },
    "pattern":    "solid",
    "embedding":  [...],
    "confidence": 0.87
  }
"""

import base64
from flask import Blueprint, request, jsonify
from core.image_analyzer import analyze_image

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.post("/analyze")
def analyze():
    image_bytes = None

    # ── Multipart upload ────────────────────────────────────────────────────
    if "file" in request.files:
        image_bytes = request.files["file"].read()

    # ── Base64 JSON body ────────────────────────────────────────────────────
    elif request.is_json:
        body = request.get_json()
        b64  = body.get("imageBase64", "")
        if not b64:
            return jsonify({"error": "No image provided. Send 'file' or 'imageBase64'."}), 400
        # Strip data-URL prefix if present (data:image/jpeg;base64,...)
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        image_bytes = base64.b64decode(b64)

    else:
        return jsonify({"error": "Send image as multipart 'file' or JSON 'imageBase64'."}), 400

    # ── Run pipeline ────────────────────────────────────────────────────────
    try:
        result = analyze_image(image_bytes)
        return jsonify(result), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500