/**
 * productModel.js — FIXED
 * ========================
 *
 * Added three new fields so store products can participate in
 * the AI recommendation engine:
 *   - season     : default "all-season"
 *   - tags       : auto-populated by admin or productController
 *   - colorFamily: "warm" | "cool" | "neutral"
 *
 * All new fields have safe defaults so existing documents are unaffected.
 */

import mongoose from 'mongoose'

const productschema = new mongoose.Schema({
  name: {
    type: String, required: true
  },
  image1: { type: String, required: true },
  image2: { type: String, required: true },
  image3: { type: String, required: true },
  image4: { type: String, required: true },
  description: {
    type: String, required: true
  },
  price: {
    type: Number, required: true
  },
  gender: {
    type: String, required: true
  },
  category: {
    type: String, required: true
  },
  subCategory: {
    type: String, required: true
  },
  sizes: {
    type: Array, required: true
  },
  date: {
    type: Number, required: true
  },
  bestseller: {
    type: Boolean
  },

  // ── NEW FIELDS for AI recommendation engine ───────────────────────────────
  season: {
    type:    String,
    enum:    ['summer', 'winter', 'rainy', 'all-season'],
    default: 'all-season'       // safe default — all-season works for any weather
  },
  tags: {
    type:    [String],
    default: []                 // e.g. ["cotton", "casual", "summer"]
  },
  colorFamily: {
    type:    String,
    enum:    ['warm', 'cool', 'neutral'],
    default: 'neutral'          // safe default for store items
  }

}, { timestamps: true })

const Product = mongoose.model("Product", productschema)
export default Product