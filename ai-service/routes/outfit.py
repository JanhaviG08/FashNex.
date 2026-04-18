"""
ai_service/routes/outfit.py
============================
POST /outfit-score

Score compatibility for a set of wardrobe items using the outfit engine.

Request (application/json):
  {
    "items":           [ { wardrobe item dicts } ],
    "weatherCategory": "hot"    // hot|warm|moderate|cool|cold|rainy
  }

Response:
  {
    "score":        0.84,
    "colorScore":   0.90,
    "styleScore":   0.78,
    "weatherScore": 0.85,
    "combos": [
      {
        "type":          "Complete Look",
        "items":         [...],
        "score":         0.84,
        "label":         "white topwear + navy bottomwear + brown footwear",
        "weatherReason": "...",
        "aiInsight":     { "colorMatch": "excellent", "reason": "..." }
      }
    ]
  }
"""

from flask import Blueprint, request, jsonify
from core.outfit_engine import generate_outfit_combos, score_outfit

outfit_bp = Blueprint("outfit", __name__)


@outfit_bp.post("/outfit-score")
def outfit_score():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    body             = request.get_json()
    items            = body.get("items", [])
    weather_category = body.get("weatherCategory", "moderate")

    if not items:
        return jsonify({"error": "Provide at least one item in 'items'."}), 400

    try:
        # Score the full set as a group
        group_score = score_outfit(items, weather_category)

        # Generate individual outfit combos (top + bottom + shoe combos)
        combos = generate_outfit_combos(items, weather_category, max_combos=5)

        return jsonify({
            **group_score,
            "combos": combos
        }), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500