// models/wardrobeModel.js  — FashNex (adds uploadedAt for recency boosting)
import mongoose from 'mongoose'

const wardrobeItemSchema = new mongoose.Schema({
  userId: {
    type: String, required: true, index: true
  },
  imageUrl: {
    type: String, required: true
  },
  publicId: {
    type: String, required: true
  },

  // ── Classification ─────────────────────────────────────────────────────────
  category: {
    type:    String,
    enum:    ['topwear', 'bottomwear', 'footwear', 'accessories', 'outerwear', 'dress', 'other'],
    default: 'other'
  },
  color:    { type: String, default: 'unknown' },
  season:   {
    type:    String,
    enum:    ['summer', 'winter', 'rainy', 'all-season'],
    default: 'all-season'
  },
  occasion: {
    type:    String,
    enum:    ['casual', 'formal', 'party', 'office', 'all'],
    default: 'all'
  },
  tags:     { type: [String], default: [] },

  // ── Color AI ───────────────────────────────────────────────────────────────
  colorFamily: { type: String, default: 'neutral' },

  // ── CNN fields ─────────────────────────────────────────────────────────────
  pattern: {
    type:    String,
    enum:    ['solid', 'striped', 'printed', 'checked', 'unknown'],
    default: 'unknown'
  },
  embedding:    { type: [Number], default: [] },   // 128-d MobileNetV2
  aiConfidence: { type: Number,   default: null },

  // ── Usage tracking ────────────────────────────────────────────────────────
  wearCount: { type: Number, default: 0 },
  lastWorn:  { type: Date,   default: null },

  // ── Display ───────────────────────────────────────────────────────────────
  name: { type: String, default: '' },

  // ── ADDED: explicit upload timestamp for recency boosting ─────────────────
  // Separate from createdAt so it survives data migrations.
  // Set to Date.now() on upload — never mutated after that.
  uploadedAt: { type: Date, default: Date.now },

}, { timestamps: true })

// Indexes
wardrobeItemSchema.index({ userId: 1, category: 1, season: 1 })
wardrobeItemSchema.index({ userId: 1, uploadedAt: -1 })   // for recency queries

const WardrobeItem = mongoose.model('WardrobeItem', wardrobeItemSchema)
export default WardrobeItem