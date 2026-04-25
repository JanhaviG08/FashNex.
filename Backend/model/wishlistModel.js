/**
 * Backend/model/wishlistModel.js
 * ================================
 * One document per user — holds an array of product ObjectIds.
 * Using $addToSet / $pull in the controller means we never need
 * to load the whole list just to check membership.
 */

import mongoose from 'mongoose'

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,   // one wishlist doc per user
      index: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
)

const Wishlist = mongoose.model('Wishlist', wishlistSchema)
export default Wishlist