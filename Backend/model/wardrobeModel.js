import mongoose from 'mongoose'

/**
 * WardrobeItem — stores a single clothing item uploaded by a user.
 *
 * Changes from v1:
 * - Added `pattern`     (solid | striped | printed | checked) — from Flask CNN
 * - Added `embedding`   (128-d float array)                   — from MobileNetV2
 * - Added `aiConfidence` (float 0-1)                          — CNN confidence
 * - Added `wearCount`   (int)                                 — for collaborative scoring
 * - Added `lastWorn`    (Date)                                — for recency scoring
 */

const wardrobeItemSchema = new mongoose.Schema({
  userId: {
    type: String, required: true, index: true
  },
  imageUrl: {
    type: String, required: true  // Cloudinary secure_url
  },
  publicId: {
    type: String, required: true  // Cloudinary public_id (needed for deletion)
  },

  // ── Classification ─────────────────────────────────────────────────────────
  category: {
    type:    String,
    enum:    ['topwear', 'bottomwear', 'footwear', 'accessories', 'outerwear', 'dress', 'other'],
    default: 'other'
  },
  color: {
    type: String, default: 'unknown'   // e.g. "white", "navy blue"
  },
  season: {
    type:    String,
    enum:    ['summer', 'winter', 'rainy', 'all-season'],
    default: 'all-season'
  },
  occasion: {
    type:    String,
    enum:    ['casual', 'formal', 'party', 'office', 'all'],
    default: 'all'
  },
  tags: {
    type: [String], default: []   // e.g. ["casual", "formal", "summer"]
  },

  // ── Color AI fields ────────────────────────────────────────────────────────
  colorFamily: {
    type: String, default: 'neutral'  // "warm" | "cool" | "neutral"
  },

  // ── CNN-extracted fields (NEW) ─────────────────────────────────────────────
  pattern: {
    type:    String,
    enum:    ['solid', 'striped', 'printed', 'checked', 'unknown'],
    default: 'unknown'
  },
  embedding: {
    type:    [Number],  // 128-d float vector from MobileNetV2
    default: []
  },
  aiConfidence: {
    type:    Number,    // 0-1 confidence from CNN analysis
    default: null
  },

  // ── Collaborative scoring fields (NEW) ────────────────────────────────────
  wearCount: {
    type: Number, default: 0   // incremented each time item is used in an outfit
  },
  lastWorn: {
    type: Date, default: null  // set when user marks an outfit as worn
  },

  // ── Display ───────────────────────────────────────────────────────────────
  name: {
    type: String, default: ''  // optional user-given name
  }
}, { timestamps: true })

// Index for similarity queries (compound)
wardrobeItemSchema.index({ userId: 1, category: 1, season: 1 })

const WardrobeItem = mongoose.model('WardrobeItem', wardrobeItemSchema)
export default WardrobeItem