import express from 'express'
import multer from 'multer'
import {
  uploadWardrobeItem,
  getUserWardrobe,
  deleteWardrobeItem,
  getWardrobeRecommendations
} from '../controller/wardrobeController.js'
import { userAuth } from '../middleware/userAuth.js'

const router = express.Router()

// Multer — store in memory so we can stream to Cloudinary
const storage = multer.memoryStorage()
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'), false)
  }
})

// POST /api/wardrobe/upload   — upload clothing image
router.post('/upload',    userAuth, upload.single('image'), uploadWardrobeItem)

// GET  /api/wardrobe/user     — get all wardrobe items for logged-in user
router.get('/user', userAuth, getUserWardrobe)

// DELETE /api/wardrobe/:id   — remove a wardrobe item
router.delete('/:id', userAuth, deleteWardrobeItem)

// GET /api/wardrobe/recommend — get AI outfit combos
router.get('/recommend', userAuth, getWardrobeRecommendations)

export default router