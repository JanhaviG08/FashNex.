/**
 * controllers/wardrobeController.js  — FashNex (improved engine)
 * ═══════════════════════════════════════════════════════════════════════════
 * What changed vs the original:
 *
 *  1. uploadWardrobeItem  — stamps uploadedAt; fire-and-forget CNN extraction
 *  2. getWardrobeRecommendations — complete rewrite of the rule-based engine:
 *       • generates ALL valid combo patterns (top×bottom, dress×shoe, jacket×top×bottom …)
 *       • weighted score: color(25) + style(20) + occasion(20) + season(15) + completeness(10) + recency(10)
 *       • recency boost: items uploaded < 7 days ago get +10% weight
 *       • explanation_data.paragraph — real sentence with actual colours + score
 *       • explanation_data.bullets  — per-dimension bullet points with real %
 *       • explanation_data.highlights — earned badges only
 *       • breakdown — all dimension scores as 0-1 floats (fixes 100% bug)
 *       • avatar — layers array with actual clothing imageUrl + CSS positions
 *  3. ML path (getMLRecommendations) is preserved exactly as before — this
 *     only improves the rule-based FALLBACK so behaviour is strictly better.
 *
 * Fields returned per outfit — matches what OutfitPreviewModal.jsx reads:
 *   outfit.label, outfit.type, outfit.items[], outfit.score, outfit.score_1_5
 *   outfit.breakdown.{color,occasion,season,completeness}
 *   outfit.explanation_data.{paragraph, bullets[], highlights[], confidence}
 *   outfit.avatar.{layers[], palette[]}
 */

import cloudinary   from '../config/cloudinary.js'
import WardrobeItem from '../model/wardrobeModel.js'
import Product      from '../model/productModel.js'
import streamifier  from 'streamifier'
import axios        from 'axios'
import {
  getMLRecommendations,
  invalidateMLCache,
} from '../services/mlRecommender.js'

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

// ─────────────────────────────────────────────────────────────────────────────
//  COLOUR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_FAMILY_MAP = {
  red:'warm', orange:'warm', yellow:'warm', pink:'warm', coral:'warm',
  salmon:'warm', maroon:'warm', burgundy:'warm', brown:'warm', rust:'warm',
  blue:'cool', navy:'cool', teal:'cool', cyan:'cool', green:'cool',
  purple:'cool', violet:'cool', indigo:'cool',
  white:'neutral', black:'neutral', grey:'neutral', gray:'neutral',
  beige:'neutral', cream:'neutral', ivory:'neutral', khaki:'neutral', tan:'neutral',
}

const getColorFamily = (color = '') => {
  const c = color.toLowerCase()
  for (const [key, fam] of Object.entries(COLOR_FAMILY_MAP)) {
    if (c.includes(key)) return fam
  }
  return 'neutral'
}

// Named-pair harmony (higher = better)
const NAMED_HARMONY = {
  'white-black':0.97,'black-white':0.97,
  'white-blue':0.95, 'blue-white':0.95,
  'white-navy':0.94, 'navy-white':0.94,
  'white-grey':0.92, 'grey-white':0.92,
  'white-beige':0.90,'beige-white':0.90,
  'black-grey':0.92, 'grey-black':0.92,
  'black-red':0.86,  'red-black':0.86,
  'beige-brown':0.90,'brown-beige':0.90,
  'navy-beige':0.88, 'beige-navy':0.88,
  'blue-grey':0.85,  'grey-blue':0.85,
  'pink-white':0.87, 'white-pink':0.87,
  'pink-grey':0.83,  'grey-pink':0.83,
  'green-beige':0.84,'beige-green':0.84,
  'red-white':0.85,  'white-red':0.85,
}

const FAMILY_HARMONY = {
  'neutral-neutral':0.86,
  'warm-neutral':0.80, 'neutral-warm':0.80,
  'cool-neutral':0.82, 'neutral-cool':0.82,
  'cool-cool':0.72,
  'warm-warm':0.65,
  'warm-cool':0.62,   'cool-warm':0.62,
}

function colorScore(colorA = '', colorB = '') {
  const a = colorA.toLowerCase().trim()
  const b = colorB.toLowerCase().trim()
  const direct = NAMED_HARMONY[`${a}-${b}`]
  if (direct !== undefined) return direct
  const famA = getColorFamily(a), famB = getColorFamily(b)
  return FAMILY_HARMONY[`${famA}-${famB}`] ?? 0.68
}

function colorScoreMulti(items) {
  // Average pairwise colour harmony across all item pairs
  let sum = 0, pairs = 0
  for (let i = 0; i < items.length - 1; i++) {
    for (let j = i + 1; j < items.length; j++) {
      sum   += colorScore(items[i].color, items[j].color)
      pairs++
    }
  }
  return pairs > 0 ? sum / pairs : 0.75
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLE COMPATIBILITY
// ─────────────────────────────────────────────────────────────────────────────
const STYLE_COMPAT = {
  casual:  { casual:1.0, sporty:0.80, party:0.60, formal:0.40, ethnic:0.50 },
  formal:  { formal:1.0, office:0.90, party:0.60, casual:0.40, ethnic:0.45 },
  office:  { office:1.0, formal:0.90, casual:0.55 },
  party:   { party:1.0,  casual:0.65, formal:0.60, ethnic:0.65 },
  ethnic:  { ethnic:1.0, party:0.65, casual:0.55 },
  sporty:  { sporty:1.0, casual:0.80 },
}

function styleScore(occA = 'all', occB = 'all') {
  if (occA === 'all' || occB === 'all') return 0.80
  const a = occA.toLowerCase(), b = occB.toLowerCase()
  return STYLE_COMPAT[a]?.[b] ?? STYLE_COMPAT[b]?.[a] ?? 0.65
}

function styleScoreMulti(items) {
  let sum = 0, pairs = 0
  for (let i = 0; i < items.length - 1; i++) {
    for (let j = i + 1; j < items.length; j++) {
      sum   += styleScore(items[i].occasion, items[j].occasion)
      pairs++
    }
  }
  return pairs > 0 ? sum / pairs : 0.75
}

// ─────────────────────────────────────────────────────────────────────────────
//  RECENCY BOOST
//  Items uploaded < 7 days ago get a boost (0-1, decays linearly)
// ─────────────────────────────────────────────────────────────────────────────
const BOOST_DAYS = 7

function recencyBoost(item) {
  const ts    = item.uploadedAt || item.createdAt
  if (!ts) return 0
  const ageDays = (Date.now() - new Date(ts).getTime()) / 86400000
  return Math.max(0, 1 - ageDays / BOOST_DAYS)
}

function recencyScoreMulti(items) {
  const boosts = items.map(recencyBoost)
  // Average, but if ANY item is new the combo gets a significant lift
  const avg = boosts.reduce((s, b) => s + b, 0) / boosts.length
  const max = Math.max(...boosts)
  return avg * 0.6 + max * 0.4
}

// ─────────────────────────────────────────────────────────────────────────────
//  WEIGHTED FINAL SCORE
//  Returns total (0-1) + per-dimension breakdown for the UI score bars
// ─────────────────────────────────────────────────────────────────────────────
function scoreCombo(items, season, occasion) {
  // Colour harmony (pairwise average)
  const color = colorScoreMulti(items)

  // Style compatibility (pairwise average)
  const style = styleScoreMulti(items)

  // Season match: fraction of items matching requested season
  const seasonMatch = items.filter(
    it => it.season === season || it.season === 'all-season'
  ).length / items.length

  // Occasion match: fraction of items matching requested occasion
  const occasionMatch = items.filter(
    it => it.occasion === occasion || it.occasion === 'all'
  ).length / items.length

  // Completeness: does the outfit have the key pieces?
  const cats     = new Set(items.map(it => it.category))
  const hasTop   = cats.has('topwear') || cats.has('dress') || cats.has('outerwear')
  const hasBot   = cats.has('bottomwear') || cats.has('dress')
  const hasShoe  = cats.has('footwear')
  const hasAcc   = cats.has('accessories')
  const baseComp = (hasTop && hasBot) ? 0.80 : 0.45
  const completeness = Math.min(1.0, baseComp + (hasShoe ? 0.12 : 0) + (hasAcc ? 0.08 : 0))

  // Recency boost
  const recency = recencyScoreMulti(items)

  // Weighted total
  // color(25) + style(20) + occasion(20) + season(15) + completeness(10) + recency(10)
  const total =
    0.25 * color          +
    0.20 * style          +
    0.20 * occasionMatch  +
    0.15 * seasonMatch    +
    0.10 * completeness   +
    0.10 * recency

  return {
    total,
    breakdown: {
      color,
      occasion: occasionMatch,
      season:   seasonMatch,
      completeness,
    },
    _style:   style,
    _recency: recency,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXPLANATION GENERATOR
//  Returns fields that OutfitPreviewModal.jsx reads directly from
//  outfit.explanation_data
// ─────────────────────────────────────────────────────────────────────────────
function buildExplanation(items, scored, occasion, season) {
  const { total, breakdown, _style, _recency } = scored
  const pct   = Math.round(total * 100)
  const colorPct     = Math.round(breakdown.color        * 100)
  const seasonPct    = Math.round(breakdown.season       * 100)
  const occasionPct  = Math.round(breakdown.occasion     * 100)
  const compPct      = Math.round(breakdown.completeness * 100)
  const stylePct     = Math.round(_style                 * 100)

  // Descriptors
  const colorDesc = breakdown.color >= 0.90 ? 'excellent colour harmony'
    : breakdown.color >= 0.80 ? 'good colour compatibility'
    : 'acceptable colour pairing'

  const cats        = new Set(items.map(i => i.category))
  const hasShoe     = cats.has('footwear')
  const colorList   = [...new Set(items.map(i => i.color).filter(Boolean))].join(', ')

  // ── Paragraph ──
  const paragraph =
    `This outfit achieves an overall compatibility score of ${pct}%. ` +
    `The combination of ${colorList} shows ${colorDesc}, ` +
    `is ${seasonPct}% suitable for ${season} weather, ` +
    `and ${occasionPct}% matched to a ${occasion} occasion. ` +
    (hasShoe
      ? `The look is complete with footwear, reaching ${compPct}% outfit completeness.`
      : `Adding footwear would complete this look further.`)

  // ── Bullets ──
  const bullets = [
    `🎨 Colour harmony: ${colorPct}% — ${colorDesc}`,
    `🌤️ Season match: ${seasonPct}% for ${season}`,
    `✅ Occasion match: ${occasionPct}% for ${occasion}`,
    `💅 Style compatibility: ${stylePct}%`,
    `👟 Outfit completeness: ${compPct}%`,
  ]
  if (_recency > 0.4) {
    bullets.push('✨ Includes recently added items from your wardrobe')
  }

  // ── Highlights (earned badges only) ──
  const highlights = []
  if (breakdown.color >= 0.88)    highlights.push('Great Colour Match')
  if (seasonPct >= 100)           highlights.push(`${cap(season)} Ready`)
  if (breakdown.completeness >= 0.90) highlights.push('Complete Look')
  if (_style >= 0.85)             highlights.push('Style Consistent')
  if (_recency > 0.5)             highlights.push('Fresh Pick')

  // ── Confidence ──
  const confidence = pct >= 85 ? 'excellent' : pct >= 70 ? 'good' : 'fair'

  return { paragraph, bullets, highlights, confidence }
}

// ─────────────────────────────────────────────────────────────────────────────
//  AVATAR LAYER BUILDER
//  Maps each wardrobe item to a CSS-positioned layer on the mannequin.
//  Position values are % of the avatar container — calibrated for the SVG
//  mannequin in OutfitPreviewModal.jsx (viewBox 0 0 200 500).
// ─────────────────────────────────────────────────────────────────────────────
const LAYER_POSITIONS = {
  topwear:     { top:'18%', left:'11%', width:'78%', height:'36%', objectFit:'contain', zIndex:3 },
  outerwear:   { top:'15%', left:'7%',  width:'86%', height:'42%', objectFit:'contain', zIndex:4 },
  dress:       { top:'18%', left:'10%', width:'80%', height:'64%', objectFit:'contain', zIndex:3 },
  bottomwear:  { top:'52%', left:'13%', width:'74%', height:'36%', objectFit:'contain', zIndex:2 },
  footwear:    { top:'84%', left:'18%', width:'64%', height:'13%', objectFit:'contain', zIndex:2 },
  accessories: { top:'1%',  left:'36%', width:'28%', height:'15%', objectFit:'contain', zIndex:5 },
}

// Approximate hex from color name (for palette dots in modal)
const COLOR_HEX = {
  white:'#f5f5f5', black:'#1a1a1a', grey:'#9ca3af', gray:'#9ca3af',
  blue:'#3b82f6',  navy:'#1e3a5f', red:'#ef4444',  pink:'#f472b6',
  green:'#22c55e', yellow:'#eab308', beige:'#d4b896', brown:'#92400e',
  orange:'#f97316', purple:'#a855f7', teal:'#14b8a6', coral:'#f87171',
  cream:'#fef3c7', khaki:'#a3a352', maroon:'#7f1d1d',
}

function buildAvatar(items) {
  const layers  = []
  const palette = []

  for (const item of items) {
    const pos = LAYER_POSITIONS[item.category]
    if (!pos) continue

    layers.push({
      slot:     item.category,
      zIndex:   pos.zIndex,
      imageUrl: item.imageUrl,
      name:     item.name || item.category,
      position: {
        top:       pos.top,
        left:      pos.left,
        width:     pos.width,
        height:    pos.height,
        objectFit: pos.objectFit,
      },
    })

    // Colour palette dot
    const hex = COLOR_HEX[(item.color || '').toLowerCase()]
    if (hex && !palette.includes(hex)) palette.push(hex)
  }

  // Sort layers so lower zIndex renders first (behind)
  layers.sort((a, b) => a.zIndex - b.zIndex)

  return { layers, palette: palette.slice(0, 5) }
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMBINATION GENERATOR
//  Produces all meaningful outfit patterns.
//  Sorts each category group newest-first so new items appear in combos first.
// ─────────────────────────────────────────────────────────────────────────────
function generateCombos(wardrobe) {
  // Group by category, sorted newest-first
  const by = {}
  for (const item of wardrobe) {
    const cat = item.category || 'other'
    if (!by[cat]) by[cat] = []
    by[cat].push(item)
  }
  for (const cat of Object.keys(by)) {
    by[cat].sort((a, b) =>
      new Date(b.uploadedAt || b.createdAt) - new Date(a.uploadedAt || a.createdAt)
    )
  }

  const tops    = [...(by.topwear || []), ...(by.outerwear || [])]
  const bottoms = by.bottomwear  || []
  const shoes   = by.footwear    || []
  const dresses = by.dress       || []
  const access  = by.accessories || []

  const combos = []

  // Pattern 1: top + bottom
  for (const t of tops) {
    for (const b of bottoms) {
      combos.push({ items:[t,b], type:'Core Look',
        label:`${cap(t.color)} Top + ${cap(b.color)} Bottom` })
    }
  }

  // Pattern 2: top + bottom + shoe
  for (const t of tops) {
    for (const b of bottoms) {
      for (const s of shoes) {
        combos.push({ items:[t,b,s], type:'Complete Look',
          label:`${cap(t.color)} Top + ${cap(b.color)} Bottom + ${cap(s.color)} Footwear` })
      }
    }
  }

  // Pattern 3: top + bottom + shoe + accessory (limit explosion)
  for (const t of tops.slice(0,4)) {
    for (const b of bottoms.slice(0,3)) {
      for (const s of shoes.slice(0,2)) {
        for (const a of access.slice(0,2)) {
          combos.push({ items:[t,b,s,a], type:'Full Outfit',
            label:`${cap(t.color)} Top + ${cap(b.color)} Bottom + Accessories` })
        }
      }
    }
  }

  // Pattern 4: dress alone
  for (const d of dresses) {
    combos.push({ items:[d], type:'Dress Look', label:`${cap(d.color)} Dress` })
  }

  // Pattern 5: dress + shoe
  for (const d of dresses) {
    for (const s of shoes) {
      combos.push({ items:[d,s], type:'Dress Look',
        label:`${cap(d.color)} Dress + ${cap(s.color)} Footwear` })
    }
  }

  // Pattern 6: dress + shoe + accessory
  for (const d of dresses) {
    for (const s of shoes.slice(0,2)) {
      for (const a of access.slice(0,2)) {
        combos.push({ items:[d,s,a], type:'Full Dress Look',
          label:`${cap(d.color)} Dress + ${cap(s.color)} Footwear + Accessory` })
      }
    }
  }

  // Pattern 7: outerwear + top + bottom (jacket layer)
  const outers = by.outerwear || []
  for (const o of outers) {
    for (const t of (by.topwear || []).slice(0,3)) {
      for (const b of bottoms.slice(0,3)) {
        combos.push({ items:[o,t,b], type:'Layered Look',
          label:`${cap(o.color)} Jacket + ${cap(t.color)} Top + ${cap(b.color)} Bottom` })
      }
    }
  }

  return combos
}

// ─────────────────────────────────────────────────────────────────────────────
//  RULE-BASED ENGINE (improved)
// ─────────────────────────────────────────────────────────────────────────────
function runRuleEngine(wardrobe, season, occasion, limit = 10) {
  const allCombos = generateCombos(wardrobe)

  // Score every combo
  const scored = allCombos
    .map(combo => {
      const s = scoreCombo(combo.items, season, occasion)
      return { ...combo, ...s }
    })
    .filter(c => c.total >= 0.40)   // remove very poor matches

  // Sort descending, deduplicate by sorted item-id set
  scored.sort((a, b) => b.total - a.total)

  const seen    = new Set()
  const results = []

  for (const c of scored) {
    if (results.length >= limit) break
    const key = c.items.map(i => i._id?.toString() || i.imageUrl).sort().join('|')
    if (seen.has(key)) continue
    seen.add(key)
    results.push(c)
  }

  return results.map((c, idx) => {
    const score15    = +(1 + c.total * 4).toFixed(1)
    const expData    = buildExplanation(c.items, c, occasion, season)
    const avatar     = buildAvatar(c.items)

    return {
      rank:             idx,
      type:             c.type,
      label:            c.label,
      items:            c.items.map(it => ({
        _id:      it._id,
        imageUrl: it.imageUrl,
        category: it.category,
        color:    it.color,
        name:     it.name || it.category,
        season:   it.season,
        occasion: it.occasion,
      })),
      score:            c.total,
      score_1_5:        score15,
      breakdown:        c.breakdown,
      explanation:      expData.paragraph,      // backward-compat plain text
      explanation_data: expData,                // rich object for modal
      avatar,
      engine:           'rule-based',
    }
  })
}

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

// ─────────────────────────────────────────────────────────────────────────────
//  UPLOAD  — stamps uploadedAt; triggers CNN extraction
// ─────────────────────────────────────────────────────────────────────────────
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'fashnex/wardrobe', resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result)
    )
    streamifier.createReadStream(buffer).pipe(stream)
  })

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

    const cloud       = await uploadToCloudinary(req.file.buffer)
    const colorFamily = getColorFamily(bodyColor)

    const item = new WardrobeItem({
      userId,
      imageUrl:    cloud.secure_url,
      publicId:    cloud.public_id,
      category:    bodyCategory.toLowerCase().trim(),
      color:       bodyColor,
      colorFamily,
      season:      season.toLowerCase().trim().replace(/\s+/g, '-'),
      occasion:    occasion.toLowerCase().trim(),
      name,
      tags:        occasion !== 'all' ? [occasion] : [],
      uploadedAt:  new Date(),    // explicit stamp for recency boosting
    })

    await item.save()

    // Invalidate ML cache so next recommendation includes this item
    await invalidateMLCache(userId).catch(() => {})

    // Fire-and-forget CNN extraction (non-blocking)
    axios.post(`${AI_URL}/extract-features`, {
      item_id:   item._id.toString(),
      image_url: cloud.secure_url,
      category:  item.category,
    }).catch(err => console.warn('[wardrobe] CNN extraction skipped:', err.message))

    return res.status(201).json({ message: 'Item uploaded successfully', item })
  } catch (error) {
    console.error('[uploadWardrobeItem]', error)
    return res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET WARDROBE  — newest first
// ─────────────────────────────────────────────────────────────────────────────
export const getUserWardrobe = async (req, res) => {
  try {
    const userId = req.userId || req.query.userId
    if (!userId) return res.status(401).json({ message: 'Login required' })
    const items = await WardrobeItem.find({ userId }).sort({ uploadedAt: -1 })
    return res.json(items)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE
// ─────────────────────────────────────────────────────────────────────────────
export const deleteWardrobeItem = async (req, res) => {
  try {
    const userId = req.userId || req.query.userId
    const item   = await WardrobeItem.findById(req.params.id)
    if (!item)                              return res.status(404).json({ message: 'Item not found' })
    if (item.userId !== userId?.toString()) return res.status(403).json({ message: 'Unauthorised' })

    await cloudinary.uploader.destroy(item.publicId).catch(() => {})
    await item.deleteOne()
    await invalidateMLCache(userId).catch(() => {})

    return res.json({ message: 'Item removed' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  RECOMMENDATIONS  — ML first, improved rule-based fallback
// ─────────────────────────────────────────────────────────────────────────────
export const getWardrobeRecommendations = async (req, res) => {
  try {
    const userId   = req.userId || req.query.userId
    const season   = (req.query.season   || 'all-season').toLowerCase()
    const occasion = (req.query.occasion || 'casual').toLowerCase()
    if (!userId) return res.status(401).json({ message: 'Login required' })

    const allItems = await WardrobeItem.find({ userId }).sort({ uploadedAt: -1 }).lean()

    if (allItems.length < 2) {
      return res.json({
        outfits: [], storeSuggestions: [],
        message: 'Upload at least 2 items to get outfit recommendations.',
      })
    }

    // ── Try ML service first ───────────────────────────────────────────────
    const mlResult = await getMLRecommendations(allItems, season, occasion, userId, 10)
      .catch(() => null)

    if (mlResult?.outfits?.length > 0) {
      const storeSuggestions = await getStoreSuggestions(season)
      return res.json({
        outfits:          mlResult.outfits,
        storeSuggestions,
        message:          mlResult.message || `Found ${mlResult.outfits.length} AI outfit combinations.`,
        engine:           'ml',
      })
    }

    // ── Improved rule-based fallback ──────────────────────────────────────
    const outfits = runRuleEngine(allItems, season, occasion, 10)

    const storeSuggestions = await getStoreSuggestions(season)

    const hasNewItems = allItems.some(i => recencyBoost(i) > 0.5)
    const methodNote  = hasNewItems ? ' (includes your newest items)' : ''

    return res.json({
      outfits,
      storeSuggestions,
      message: outfits.length
        ? `Found ${outfits.length} outfit combination${outfits.length !== 1 ? 's' : ''} (rule-based)${methodNote}.`
        : 'No matching outfits found. Try uploading more items or changing the season/occasion.',
      engine: 'rule-based',
    })
  } catch (error) {
    console.error('[getWardrobeRecommendations]', error)
    return res.status(500).json({ message: error.message })
  }
}

// ── Store suggestions helper ──────────────────────────────────────────────────
async function getStoreSuggestions(season) {
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

// ── Store CNN features (called by FastAPI) ────────────────────────────────────
export const storeAIFeatures = async (req, res) => {
  try {
    const { item_id, embedding, color, colorFamily, pattern, aiConfidence } = req.body
    const item = await WardrobeItem.findById(item_id)
    if (!item) return res.status(404).json({ message: 'Item not found' })

    if (embedding?.length)   item.embedding    = embedding
    if (color)               item.color        = color
    if (colorFamily)         item.colorFamily  = colorFamily
    if (pattern)             item.pattern      = pattern
    if (aiConfidence != null) item.aiConfidence = aiConfidence

    await item.save()
    res.json({ message: 'AI features stored', item_id })
  } catch (err) {
    res.status(500).json({ message: 'Failed to store features', error: err.message })
  }
}