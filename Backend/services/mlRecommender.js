/**
 * Backend/services/mlRecommender.js
 * ===================================
 * Node.js client that calls the Python AI service for ML-based outfit
 * recommendations.  Sits between wardrobeController.js and the Python
 * FastAPI service running on port 8000.
 *
 * Responsibilities:
 *   - Serialize wardrobe items for the Python API
 *   - Handle timeouts and service-unavailable gracefully
 *   - Return null on failure so the controller falls back to the rule-based engine
 *   - Invalidate the Python model cache after wardrobe mutations
 */

import axios from 'axios'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
const ML_TIMEOUT_MS  = parseInt(process.env.ML_TIMEOUT_MS || '12000', 10)

/**
 * Serialize a MongoDB WardrobeItem document into the shape expected by
 * the Python FastAPI /recommend endpoint.
 *
 * We only send fields the ML model actually uses — no Cloudinary publicId,
 * no timestamps, no internal Mongo metadata.
 */
const serializeItem = (item) => ({
  _id:         item._id?.toString() || '',
  category:    (item.category    || 'other').toLowerCase(),
  color:       (item.color       || 'unknown').toLowerCase(),
  colorFamily: (item.colorFamily || 'neutral').toLowerCase(),
  season:      (item.season      || 'all-season').toLowerCase(),
  occasion:    (item.occasion    || 'all').toLowerCase(),
  name:        item.name         || '',
  imageUrl:    item.imageUrl     || '',
})

/**
 * getMLRecommendations
 * ---------------------
 * Calls POST http://localhost:8000/recommend
 *
 * @param {Array}  wardrobe  - MongoDB WardrobeItem documents
 * @param {string} season    - 'summer' | 'winter' | 'rainy' | 'all-season'
 * @param {string} occasion  - 'casual' | 'formal' | 'party' | 'office' | 'all'
 * @param {string} userId    - MongoDB user _id (for model caching)
 * @param {number} topN      - max outfits to return
 *
 * @returns {Object|null}  Python service response, or null if unavailable
 *
 * Return shape on success:
 * {
 *   outfits: [
 *     {
 *       items:       [ { _id, category, color, name, imageUrl, season, occasion } ],
 *       score:       0.87,       // 0–1
 *       score_1_5:   4.5,        // 1–5 (for display)
 *       label:       "Casual Summer Look",
 *       explanation: "White and black are a classic pair. ...",
 *       breakdown:   { color: 0.9, season: 1.0, occasion: 0.8, completeness: 0.67 }
 *     },
 *     ...
 *   ],
 *   model_info: { scorer, combos_generated, elapsed_ms, tf_available },
 *   message:    "Found 5 outfit combinations for casual / all-season."
 * }
 */
export const getMLRecommendations = async (
  wardrobe,
  season   = 'all-season',
  occasion = 'casual',
  userId   = 'anonymous',
  topN     = 5,
) => {
  try {
    const payload = {
      wardrobe: wardrobe.map(serializeItem),
      season:   season.toLowerCase(),
      occasion: occasion.toLowerCase(),
      user_id:  userId.toString(),
      top_n:    topN,
      use_ml:   true,
    }

    const response = await axios.post(
      `${ML_SERVICE_URL}/recommend`,
      payload,
      {
        timeout: ML_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    return response.data
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn('[ML] Python AI service is offline — using rule-based fallback')
    } else if (err.code === 'ECONNABORTED') {
      console.warn('[ML] Python AI service timed out — using rule-based fallback')
    } else {
      console.error('[ML] Unexpected error:', err.response?.data || err.message)
    }
    return null
  }
}

/**
 * invalidateMLCache
 * ------------------
 * Tells the Python service to drop the cached model for this user.
 * Call after uploadWardrobeItem or deleteWardrobeItem.
 *
 * @param {string} userId
 */
export const invalidateMLCache = async (userId) => {
  try {
    await axios.post(
      `${ML_SERVICE_URL}/invalidate`,
      { user_id: userId.toString() },
      { timeout: 3000 }
    )
    console.info('[ML] Cache invalidated for user:', userId)
  } catch {
    // Non-critical — if the Python service is down, the cache will just expire
    // naturally on the next successful request
  }
}

/**
 * checkMLHealth
 * --------------
 * Returns true if the Python AI service is reachable.
 */
export const checkMLHealth = async () => {
  try {
    const res = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 2000 })
    return res.data?.status === 'ok'
  } catch {
    return false
  }
}