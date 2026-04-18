/**
 * Backend/controller/wardrobeController.js
 * ==========================================
 * REPLACES the existing wardrobeController.js.
 *
 * Changes vs original:
 *  - uploadWardrobeItem:       calls invalidateMLCache() after save
 *  - deleteWardrobeItem:       calls invalidateMLCache() after delete
 *  - getWardrobeRecommendations: tries ML service first, falls back to
 *                               existing rule-based engine if ML is offline
 *
 * The rule-based engine is PRESERVED exactly as it was — the ML layer is
 * purely additive.  If the Python service is down, users get the same
 * quality they had before.
 */

import cloudinary from '../config/cloudinary.js'
import WardrobeItem from '../model/wardrobeModel.js'
import Product      from '../model/productModel.js'
import streamifier  from 'streamifier'
import {
  getMLRecommendations,
  invalidateMLCache,
} from '../services/mlRecommender.js'

// ── Color → family mapping ────────────────────────────────────────────────────

const COLOR_FAMILY = {
  red:'warm', orange:'warm', yellow:'warm', pink:'warm', coral:'warm',
  salmon:'warm', maroon:'warm', burgundy:'warm', brown:'warm',
  blue:'cool', navy:'cool', teal:'cool', cyan:'cool', green:'cool',
  purple:'cool', violet:'cool', indigo:'cool', grey:'cool', gray:'cool',
  white:'neutral', black:'neutral', beige:'neutral', cream:'neutral',
  ivory:'neutral', khaki:'neutral', tan:'neutral',
}

const getColorFamily = (color = '') => {
  const c = color.toLowerCase()
  for (const [key, family] of Object.entries(COLOR_FAMILY)) {
    if (c.includes(key)) return family
  }
  return 'neutral'
}

// ── Tag builder (occasion-driven — no category defaults) ──────────────────────

const buildTags = (occasion = 'all', name = '') => {
  const tags = new Set()
  if (occasion && occasion !== 'all') tags.add(occasion.toLowerCase())
  const n = name.toLowerCase()
  if (/\b(blazer|suit|tuxedo)\b/.test(n))           { tags.add('formal'); tags.add('office') }
  if (/\b(hoodie|puffer|overcoat|trench)\b/.test(n))  tags.add('winter')
  if (/\b(raincoat|waterproof)\b/.test(n))            tags.add('rainy')
  if (tags.size === 0) tags.add('casual')
  return [...tags]
}

// ── Cloudinary upload ─────────────────────────────────────────────────────────

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'fashnex/wardrobe', resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result)
    )
    streamifier.createReadStream(buffer).pipe(stream)
  })

// ── POST /api/wardrobe/upload ─────────────────────────────────────────────────

export const uploadWardrobeItem = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId
    if (!userId)   return res.status(401).json({ message: 'Login required' })
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' })

    const {
      category: bodyCategory = 'other',
      color:    bodyColor    = 'unknown',
      season                 = 'all-season',
      occasion               = 'all',
      name                   = '',
    } = req.body

    const cloud        = await uploadToCloudinary(req.file.buffer)
    const normCategory = bodyCategory.toLowerCase().trim()
    const normSeason   = season.toLowerCase().trim().replace(/\s+/g, '-')
    const normOccasion = occasion.toLowerCase().trim()
    const colorFamily  = getColorFamily(bodyColor)
    const tags         = buildTags(normOccasion, name)

    const item = new WardrobeItem({
      userId,
      imageUrl:    cloud.secure_url,
      publicId:    cloud.public_id,
      category:    normCategory,
      color:       bodyColor,
      colorFamily,
      season:      normSeason,
      occasion:    normOccasion,
      name,
      tags,
    })

    await item.save()

    // ← NEW: invalidate ML cache so next recommendation retrains with new item
    await invalidateMLCache(userId)

    return res.status(201).json({ message: 'Item uploaded successfully', item })
  } catch (error) {
    console.error('Wardrobe upload error:', error)
    return res.status(500).json({ message: error.message })
  }
}

// ── GET /api/wardrobe/user ────────────────────────────────────────────────────

export const getUserWardrobe = async (req, res) => {
  try {
    const userId = req.userId || req.query.userId
    if (!userId) return res.status(401).json({ message: 'Login required' })
    const items = await WardrobeItem.find({ userId }).sort({ createdAt: -1 })
    return res.json(items)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// ── DELETE /api/wardrobe/:id ──────────────────────────────────────────────────

export const deleteWardrobeItem = async (req, res) => {
  try {
    const userId = req.userId || req.query.userId
    const item   = await WardrobeItem.findById(req.params.id)
    if (!item)                               return res.status(404).json({ message: 'Item not found' })
    if (item.userId !== userId.toString())   return res.status(403).json({ message: 'Unauthorised' })

    await cloudinary.uploader.destroy(item.publicId)
    await item.deleteOne()

    // ← NEW: invalidate ML cache after deletion
    await invalidateMLCache(userId)

    return res.json({ message: 'Item removed' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// ── GET /api/wardrobe/recommend ───────────────────────────────────────────────

export const getWardrobeRecommendations = async (req, res) => {
  try {
    const userId   = req.userId || req.query.userId
    const season   = (req.query.season   || 'all-season').toLowerCase()
    const occasion = (req.query.occasion || 'casual').toLowerCase()
    if (!userId) return res.status(401).json({ message: 'Login required' })

    const allItems = await WardrobeItem.find({ userId })
    if (allItems.length < 2) {
      return res.json({ outfits: [], storeSuggestions: [],
        message: 'Upload at least 2 items to get outfit recommendations.' })
    }

    // ── STEP 1: Try ML service (primary path) ──────────────────────────────
    const mlResult = await getMLRecommendations(allItems, season, occasion, userId, 5)

    if (mlResult?.outfits?.length > 0) {
      // ML succeeded — enrich with store suggestions and return
      const storeSuggestions = await getStoreSuggestions(season)
      return res.json({
        outfits:          mlResult.outfits,
        storeSuggestions,
        modelInfo:        mlResult.model_info,
        message:          mlResult.message,
        engine:           'ml',
      })
    }

    // ── STEP 2: Rule-based fallback ────────────────────────────────────────
    console.info('[Wardrobe] ML unavailable or returned 0 outfits — using rule-based engine')
    const outfits          = generateRuleBasedOutfits(allItems, season, occasion)
    const storeSuggestions = await getStoreSuggestions(season)

    return res.json({
      outfits,
      storeSuggestions,
      message: outfits.length
        ? `Found ${outfits.length} outfit combinations (rule-based).`
        : 'No matching outfits found. Try uploading more items.',
      engine: 'rule-based',
    })
  } catch (error) {
    console.error('Wardrobe recommend error:', error)
    return res.status(500).json({ message: error.message })
  }
}

// ── Rule-based outfit engine (preserved from original) ───────────────────────

const CLASSIC_PAIRS = new Set([
  'white-black','white-navy','white-blue','beige-brown','beige-black',
  'black-red','grey-white','navy-beige','camel-black','brown-red',
])

const colorHarmony = (cA, cB, fA, fB) => {
  const key  = `${(cA||'').toLowerCase()}-${(cB||'').toLowerCase()}`
  const rkey = `${(cB||'').toLowerCase()}-${(cA||'').toLowerCase()}`
  if (CLASSIC_PAIRS.has(key) || CLASSIC_PAIRS.has(rkey)) return 5
  if (fA === 'neutral' || fB === 'neutral') return 4
  if (fA === fB) return 3
  return 2
}

const computeScore = (cs, hasShoe) => {
  const colorPts = (cs / 5) * 2.0
  const compPts  = hasShoe ? 1.0 : 0.5
  const bonus    = cs >= 5 ? 0.5 : 0
  return parseFloat(Math.min(5.0, colorPts + 1.5 + compPts + bonus).toFixed(1))
}

const generateRuleBasedOutfits = (items, season, occasion) => {
  const norm = items.map(i => ({
    ...i.toObject?.() ?? i,
    category:    (i.category || 'other').toLowerCase(),
    season:      (i.season   || 'all-season').toLowerCase(),
    occasion:    (i.occasion || 'all').toLowerCase(),
    colorFamily: i.colorFamily || getColorFamily(i.color || ''),
  }))

  const isCompat = (item) => {
    const sm = item.season   === season   || item.season   === 'all-season'
    const om = item.occasion === occasion || item.occasion === 'all'
    return sm && om
  }

  const shoes    = norm.filter(i => i.category === 'footwear')
  const pool     = norm.filter(i => i.category !== 'footwear' && isCompat(i))
  const tops     = pool.filter(i => i.category === 'topwear')
  const dresses  = pool.filter(i => i.category === 'dress')
  const bottoms  = pool.filter(i => i.category === 'bottomwear')
  const combos   = []

  const bestShoe = (anchor) =>
    shoes.reduce((best, s) => {
      const sc = colorHarmony(anchor.color, s.color, anchor.colorFamily, s.colorFamily)
      const bc = best ? colorHarmony(anchor.color, best.color, anchor.colorFamily, best.colorFamily) : 0
      return sc > bc ? s : best
    }, null)

  dresses.forEach(dress => {
    const shoe  = bestShoe(dress)
    const cs    = colorHarmony(dress.color, shoe?.color || '', dress.colorFamily, shoe?.colorFamily || 'neutral')
    const score = computeScore(cs, !!shoe)
    combos.push({
      type:        'Dress Outfit',
      items:       [dress, shoe].filter(Boolean),
      score,
      score_1_5:   score,
      label:       `${cap(dress.color)} ${dress.name || 'Dress'}${shoe ? ' + ' + cap(shoe.color) + ' Footwear' : ''}`,
      explanation: `${cap(dress.color)} dress paired with ${shoe?.color || 'matching'} footwear.`,
      breakdown:   { color: cs / 5, season: 1, occasion: 1, completeness: shoe ? 1 : 0.5 },
      engine:      'rule-based',
    })
  })

  tops.forEach(top => {
    bottoms.forEach(bottom => {
      const cs   = colorHarmony(top.color, bottom.color, top.colorFamily, bottom.colorFamily)
      const shoe = bestShoe(bottom)
      const score = computeScore(cs, !!shoe)
      combos.push({
        type:        'Complete Look',
        items:       [top, bottom, shoe].filter(Boolean),
        score,
        score_1_5:   score,
        label:       `${cap(top.color)} Top + ${cap(bottom.color)} Bottom${shoe ? ' + ' + cap(shoe.color) + ' Footwear' : ''}`,
        explanation: `${cap(top.color)} and ${bottom.color} ${cs >= 5 ? 'are a classic pair' : 'work well together'}.`,
        breakdown:   { color: cs / 5, season: 1, occasion: 1, completeness: shoe ? 1 : 0.5 },
        engine:      'rule-based',
      })
    })
  })

  return combos.sort((a, b) => b.score - a.score).slice(0, 5)
}

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

// ── Store suggestions ─────────────────────────────────────────────────────────

const getStoreSuggestions = async (season) => {
  const subCatMap = {
    summer:       ['TopWear', 'Dresses'],
    winter:       ['WinterWear', 'TopWear'],
    rainy:        ['WinterWear', 'TopWear'],
    'all-season': ['TopWear', 'BottomWear'],
  }
  return Product.find({ subCategory: { $in: subCatMap[season] || ['TopWear'] } })
    .limit(4)
    .catch(() => [])
}