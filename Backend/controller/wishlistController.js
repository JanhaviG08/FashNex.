/**
 * Backend/controller/wishlistController.js
 * ==========================================
 * Uses req.userId which is set by the existing userAuth middleware
 * (reads JWT from cookie or Authorization header).
 *
 * Routes:
 *   POST /api/wishlist/toggle   → add or remove a single product
 *   GET  /api/wishlist          → fetch all wishlisted products (populated)
 */

import Wishlist from '../model/wishlistModel.js'
import Product  from '../model/productModel.js'
import mongoose from 'mongoose'

// ── POST /api/wishlist/toggle ─────────────────────────────────────────────────
export const toggleWishlist = async (req, res) => {
  try {
    const userId    = req.userId                       // set by userAuth middleware
    const { productId } = req.body

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid productId' })
    }

    // Confirm product actually exists
    const productExists = await Product.exists({ _id: productId })
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Upsert: create wishlist doc for user if it doesn't exist yet
    let wishlist = await Wishlist.findOne({ userId })
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: [] })
    }

    const alreadySaved = wishlist.products.some(
      id => id.toString() === productId
    )

    if (alreadySaved) {
      // ── Remove ────────────────────────────────────────────────────────────
      await Wishlist.updateOne(
        { userId },
        { $pull: { products: productId } }
      )
      return res.json({ message: 'Removed from wishlist', wishlisted: false })
    } else {
      // ── Add ───────────────────────────────────────────────────────────────
      await Wishlist.updateOne(
        { userId },
        { $addToSet: { products: productId } }
      )
      return res.json({ message: 'Added to wishlist', wishlisted: true })
    }
  } catch (error) {
    console.error('[wishlistController] toggleWishlist:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ── GET /api/wishlist ─────────────────────────────────────────────────────────
export const getWishlist = async (req, res) => {
  try {
    const userId = req.userId

    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'products',
        model: 'Product',
        // Return exactly the fields the ProductCard needs
        select: '_id name image1 price category subCategory gender bestseller',
      })

    if (!wishlist) {
      return res.json({ products: [] })
    }

    return res.json({ products: wishlist.products })
  } catch (error) {
    console.error('[wishlistController] getWishlist:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ── GET /api/wishlist/ids ─────────────────────────────────────────────────────
// Lightweight endpoint — returns only the array of product ID strings.
// Used on page load to quickly mark which cards have a filled heart.
export const getWishlistIds = async (req, res) => {
  try {
    const userId  = req.userId
    const wishlist = await Wishlist.findOne({ userId }).select('products')
    const ids      = wishlist ? wishlist.products.map(id => id.toString()) : []
    return res.json({ ids })
  } catch (error) {
    console.error('[wishlistController] getWishlistIds:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}