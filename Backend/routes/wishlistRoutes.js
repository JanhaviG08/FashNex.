/**
 * Backend/routes/wishlistRoutes.js
 * ==================================
 * All routes are protected by the existing userAuth middleware
 * (JWT from cookie — matches the pattern used by cartRoutes etc.)
 *
 * Mount in index.js:
 *   import wishlistRoutes from './routes/wishlistRoutes.js'
 *   app.use('/api/wishlist', wishlistRoutes)
 */

import express from 'express'
import { userAuth } from '../middleware/userAuth.js'
import {
  toggleWishlist,
  getWishlist,
  getWishlistIds,
} from '../controller/wishlistController.js'

const router = express.Router()

router.post('/toggle', userAuth, toggleWishlist)   // add or remove
router.get('/',        userAuth, getWishlist)       // full products (populated)
router.get('/ids',     userAuth, getWishlistIds)    // just the id array (fast)

export default router