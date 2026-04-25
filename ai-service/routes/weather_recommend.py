"""
routes/weather_recommend.py
============================
NEW FastAPI router — mounts at /recommend/weather in app.py.

Endpoint:
    POST /recommend/weather

Input (JSON body):
    {
      "weather":  { "temp": 32, "condition": "Clear" },
      "products": [ ...list of product dicts from MongoDB... ],
      "top_n":    8   (optional, default 8)
    }

Output:
    {
      "recommendations": [
        {
          "product":   { ...original product fields... },
          "score":     0.87,
          "scorePct":  87,
          "reason":    "Perfect for hot weather — breathable and lightweight.",
          "matchTags": ["Weather Category", "Colour Match (White)"]
        },
        ...
      ],
      "weatherProfile": { ...WeatherProfile fields... },
      "styleTips":      [ { "icon": "🌬️", "title": "...", "body": "...", "category": "fabric" }, ... ],
      "message":        "Found 8 products for Hot & Sunny weather."
    }

Uses ONLY existing core modules:
    weather_mapper.py → map_weather(), get_style_tips()
    recommender.py    → recommend_by_weather()
    explainer.py      → ExplanationResult (imported for type reference, not called here)
"""

import logging
from typing import List, Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from core.weather_mapper import map_weather, get_style_tips, profile_to_dict, tips_to_list
from core.recommender    import recommend_by_weather, recommended_product_to_dict

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# REQUEST / RESPONSE SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class WeatherInput(BaseModel):
    """Raw weather values from OpenWeatherMap (or any source)."""
    temp:      float = Field(...,  description="Temperature in Celsius")
    condition: str   = Field(...,  description="OpenWeatherMap condition: 'Clear'|'Rain'|'Clouds' etc.")


class ProductInput(BaseModel):
    """
    A single product from MongoDB. Extra fields (images, sizes etc.) are
    allowed and passed through unchanged in the response.
    """
    class Config:
        extra = 'allow'


class WeatherRecommendRequest(BaseModel):
    weather:  WeatherInput
    products: List[Dict[str, Any]]   # raw dicts — avoids strict schema on Mongo docs
    top_n:    int = Field(default=8, ge=1, le=20)
    tips_count: int = Field(default=4, ge=1, le=6)


class RecommendationItem(BaseModel):
    product:   Dict[str, Any]
    score:     float
    scorePct:  int
    reason:    str
    matchTags: List[str]


class WeatherRecommendResponse(BaseModel):
    recommendations: List[RecommendationItem]
    weatherProfile:  Dict[str, Any]
    styleTips:       List[Dict[str, str]]
    message:         str


# ─────────────────────────────────────────────────────────────────────────────
# POST /recommend/weather
# ─────────────────────────────────────────────────────────────────────────────

@router.post('/recommend/weather', response_model=WeatherRecommendResponse)
async def weather_recommend(req: WeatherRecommendRequest):
    """
    Weather-aware product ranking endpoint.

    Pipeline:
      1. weather_mapper.map_weather()    → WeatherProfile
      2. recommender.recommend_by_weather() → ranked RecommendedProduct list
      3. weather_mapper.get_style_tips() → shuffled StyleTip list
      4. Serialize and return
    """
    # ── Step 1: Map weather to structured profile ─────────────────────────────
    try:
        profile = map_weather(
            temp      = req.weather.temp,
            condition = req.weather.condition,
        )
    except Exception as exc:
        logger.error('weather_mapper.map_weather failed: %s', exc)
        raise HTTPException(status_code=500, detail=f'Weather mapping failed: {exc}')

    logger.info(
        'Weather profile: %s | temp=%.1f | condition=%s | products=%d',
        profile.label, req.weather.temp, req.weather.condition, len(req.products)
    )

    # ── Step 2: Rank products ─────────────────────────────────────────────────
    if not req.products:
        return WeatherRecommendResponse(
            recommendations=[],
            weatherProfile=profile_to_dict(profile),
            styleTips=tips_to_list(get_style_tips(profile, req.tips_count)),
            message=f'No products provided to rank for {profile.label} weather.'
        )

    try:
        ranked = recommend_by_weather(req.products, profile, top_n=req.top_n)
    except Exception as exc:
        logger.error('recommend_by_weather failed: %s', exc)
        raise HTTPException(status_code=500, detail=f'Product ranking failed: {exc}')

    # ── Step 3: Style tips ───────────────────────────────────────────────────
    tips = get_style_tips(profile, req.tips_count)

    # ── Step 4: Serialize ────────────────────────────────────────────────────
    recommendations = [recommended_product_to_dict(r) for r in ranked]

    return WeatherRecommendResponse(
        recommendations=[RecommendationItem(**r) for r in recommendations],
        weatherProfile=profile_to_dict(profile),
        styleTips=tips_to_list(tips),
        message=f'Found {len(ranked)} product(s) matched to {profile.label} ({profile.emoji}) weather.'
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /recommend/weather/profile?temp=32&condition=Clear
# Lightweight helper — just returns the profile + tips without products.
# Useful for the frontend to pre-fetch style guidance before products load.
# ─────────────────────────────────────────────────────────────────────────────

@router.get('/recommend/weather/profile')
async def weather_profile(temp: float, condition: str, tips_count: int = 4):
    """
    Returns just the WeatherProfile + style tips for given temp/condition.
    No products needed — call this immediately after fetching weather data.
    """
    profile = map_weather(temp, condition)
    tips    = get_style_tips(profile, tips_count)
    return {
        'weatherProfile': profile_to_dict(profile),
        'styleTips':      tips_to_list(tips),
    }