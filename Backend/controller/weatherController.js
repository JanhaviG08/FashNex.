/**
 * weatherController.js — FIXED
 * ==============================
 *
 * Root-cause fixes applied:
 *
 * 1. DATA NORMALIZATION: normalizeWardrobeItems() lowercases category/season,
 *    generates tags + colorFamily from raw DB values before anything touches them.
 *    Fixes: "Topwear" ≠ "topwear", "All-Season" ≠ "all-season"
 *
 * 2. STORE NORMALIZATION: transformStoreProducts() converts store schema to AI
 *    schema so Flask can score them alongside wardrobe items.
 *
 * 3. SINGLE FLASK CALL: Was being called twice (wardrobe + store separately).
 *    Now one call, response split by presence of `price` / `isStoreItem` field.
 *
 * 4. STORE FILTER: filterStoreProducts() uses case-insensitive regex so
 *    "Topwear" / "TopWear" / "topwear" all match.
 *
 * 5. WARDROBE FALLBACK: filterWardrobeItems() normalizes strings before matching.
 */

import axios from 'axios'
import Product from '../model/productModel.js'
import WardrobeItem from '../model/wardrobeModel.js'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001'

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_FAMILY_MAP = {
  red: 'warm', orange: 'warm', yellow: 'warm', pink: 'warm',
  coral: 'warm', salmon: 'warm', maroon: 'warm', burgundy: 'warm', brown: 'warm',
  blue: 'cool', navy: 'cool', teal: 'cool', cyan: 'cool',
  green: 'cool', purple: 'cool', violet: 'cool', indigo: 'cool', grey: 'cool', gray: 'cool',
  white: 'neutral', black: 'neutral', beige: 'neutral', cream: 'neutral',
  ivory: 'neutral', khaki: 'neutral', tan: 'neutral',
}

export const mapColorToFamily = (color = '') => {
  const c = color.toLowerCase()
  for (const [key, family] of Object.entries(COLOR_FAMILY_MAP)) {
    if (c.includes(key)) return family
  }
  return 'neutral'
}

export const generateBasicTags = (category = '', name = '') => {
  const tags = []
  const text = (category + ' ' + name).toLowerCase()
  if (text.includes('formal') || text.includes('blazer') || text.includes('suit')) tags.push('formal')
  if (text.includes('casual') || text.includes('tee')    || text.includes('jeans'))    tags.push('casual')
  if (text.includes('party')  || text.includes('dress')  || text.includes('gown'))     tags.push('party')
  if (text.includes('office') || text.includes('shirt')  || text.includes('trouser'))  tags.push('office')
  if (text.includes('winter') || text.includes('coat')   || text.includes('jacket')  || text.includes('hoodie')) tags.push('winter')
  if (text.includes('summer') || text.includes('shorts') || text.includes('sundress') || text.includes('linen'))  tags.push('summer')
  if (text.includes('rain')   || text.includes('waterproof')) tags.push('rainy')
  return tags.length ? tags : ['casual']
}

/**
 * FIX #1 — normalizeWardrobeItems()
 * Converts raw MongoDB wardrobe docs to the shape the AI service expects.
 *   "Topwear"    → "topwear"
 *   "All-Season" → "all-season"
 *   colorFamily  generated from color string when missing
 *   tags         auto-generated when empty
 */
export const normalizeWardrobeItems = (items = []) =>
  items.map(item => {
    const category    = (item.category || 'other').toLowerCase()
    const season      = (item.season   || 'all-season').toLowerCase()
    const colorFamily = item.colorFamily || mapColorToFamily(item.color)
    const tags        = item.tags?.length ? item.tags : generateBasicTags(category, item.name)
    return { ...item, category, season, colorFamily, tags }
  })

/**
 * FIX #2 — transformStoreProducts()
 * Converts store Product documents to AI-compatible schema.
 *   subCategory "TopWear" → category "topwear"
 *   image1      → imageUrl
 *   price kept  → used later to identify store items
 */
export const transformStoreProducts = (products = []) =>
  products.map(p => {
    const sc = (p.subCategory || p.category || '').toLowerCase()
    const category =
      sc === 'topwear'    ? 'topwear'
      : sc === 'bottomwear' ? 'bottomwear'
      : sc === 'dresses'    ? 'dress'
      : sc === 'winterwear' ? 'outerwear'
      : ['shoes', 'heels', 'flats'].includes(sc) ? 'footwear'
      : 'topwear'

    return {
      _id:         p._id?.toString(),
      name:        p.name,
      category,
      season:      'all-season',
      tags:        generateBasicTags(category, p.name),
      colorFamily: 'neutral',
      imageUrl:    p.image1,
      image1:      p.image1,
      price:       p.price,       // presence of price = store item (used to split response)
      subCategory: p.subCategory,
      isStoreItem: true,
    }
  })

// ── Weather category classifier ───────────────────────────────────────────────
export const getWeatherCategory = (temp, condition) => {
  const cond = condition.toLowerCase()
  if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower') || cond.includes('thunder')) return 'rainy'
  if (temp >= 32) return 'hot'
  if (temp >= 26) return 'warm'
  if (temp >= 18) return 'moderate'
  if (temp >= 12) return 'cool'
  return 'cold'
}

// ── Clothing rules ────────────────────────────────────────────────────────────
export const getClothingRules = (category) => {
  const rules = {
    hot: {
      label: 'Hot & Sunny', emoji: '☀️', season: 'summer',
      tip:  'Stay cool with breathable fabrics and light colours.',
      why:  'Above 32°C your body needs help staying cool — loose, light fabrics aid sweat evaporation.',
      subCategories:      ['TopWear', 'Dresses'],
      wardrobeCategories: ['topwear', 'dress', 'bottomwear'],
      wardrobeTags:       ['summer', 'casual'],
      keywords:           ['cotton', 'linen', 'light', 'casual', 'summer', 'sleeveless', 'short'],
      clothing: {
        topwear:     { label: 'Tops',        suggestion: 'Sleeveless tops, cotton tees, linen shirts', icon: '👕' },
        bottomwear:  { label: 'Bottoms',     suggestion: 'Shorts, skirts, light trousers',             icon: '🩳' },
        footwear:    { label: 'Footwear',    suggestion: 'Sandals, flip-flops, open-toe shoes',        icon: '👡' },
        accessories: { label: 'Accessories', suggestion: 'Sunglasses, cap, light scarf',              icon: '🕶️' },
      }
    },
    warm: {
      label: 'Warm & Pleasant', emoji: '🌤️', season: 'summer',
      tip:  'Light layers give you flexibility throughout the day.',
      why:  'At 26–32°C a single layer usually suffices — keep a light jacket for AC zones.',
      subCategories:      ['TopWear', 'Dresses', 'BottomWear'],
      wardrobeCategories: ['topwear', 'dress', 'bottomwear'],
      wardrobeTags:       ['summer', 'casual'],
      keywords:           ['cotton', 'casual', 'light', 'summer', 'dress'],
      clothing: {
        topwear:     { label: 'Tops',        suggestion: 'Light tees, breathable blouses',  icon: '👕' },
        bottomwear:  { label: 'Bottoms',     suggestion: 'Chinos, light jeans',             icon: '👖' },
        footwear:    { label: 'Footwear',    suggestion: 'Sneakers, loafers, sandals',      icon: '👟' },
        accessories: { label: 'Accessories', suggestion: 'Sunglasses, light bag',           icon: '👜' },
      }
    },
    moderate: {
      label: 'Mild & Breezy', emoji: '⛅', season: 'all-season',
      tip:  'Perfect layering weather. A light jacket is your best friend.',
      why:  '18–26°C can shift through the day — smart layering lets you adapt.',
      subCategories:      ['TopWear', 'BottomWear', 'Dresses'],
      wardrobeCategories: ['topwear', 'bottomwear', 'outerwear', 'dress'],
      wardrobeTags:       ['casual', 'office'],
      keywords:           ['casual', 'denim', 'cotton', 'light jacket', 'cardigan'],
      clothing: {
        topwear:     { label: 'Tops',        suggestion: 'Light sweaters, full-sleeve tees',      icon: '👔' },
        bottomwear:  { label: 'Bottoms',     suggestion: 'Jeans, casual trousers',                icon: '👖' },
        footwear:    { label: 'Footwear',    suggestion: 'Sneakers, ankle boots',                 icon: '👟' },
        accessories: { label: 'Accessories', suggestion: 'Light scarf, crossbody bag',           icon: '🧣' },
      }
    },
    cool: {
      label: 'Cool & Windy', emoji: '🌬️', season: 'all-season',
      tip:  "Layer up — a hoodie or jacket is a must.",
      why:  '12–18°C with wind chill feels colder — layering traps warm air.',
      subCategories:      ['TopWear', 'WinterWear', 'BottomWear'],
      wardrobeCategories: ['topwear', 'outerwear', 'bottomwear'],
      wardrobeTags:       ['casual', 'winter'],
      keywords:           ['layer', 'jacket', 'hoodie', 'sweater', 'cardigan'],
      clothing: {
        topwear:     { label: 'Tops',        suggestion: 'Sweaters, hoodies, long-sleeve + layer', icon: '🧥' },
        bottomwear:  { label: 'Bottoms',     suggestion: 'Thick jeans, trousers, cords',           icon: '👖' },
        footwear:    { label: 'Footwear',    suggestion: 'Ankle boots, chunky sneakers',           icon: '👢' },
        accessories: { label: 'Accessories', suggestion: 'Light scarf, beanie, gloves',           icon: '🧤' },
      }
    },
    cold: {
      label: 'Cold & Chilly', emoji: '❄️', season: 'winter',
      tip:  'Bundle up in warm insulating layers.',
      why:  'Below 12°C heat retention is critical — wool and thick fabrics trap body heat.',
      subCategories:      ['WinterWear', 'TopWear', 'BottomWear'],
      wardrobeCategories: ['outerwear', 'topwear', 'bottomwear'],
      wardrobeTags:       ['winter', 'formal', 'casual'],
      keywords:           ['wool', 'coat', 'jacket', 'sweater', 'thermal', 'warm'],
      clothing: {
        topwear:     { label: 'Tops',        suggestion: 'Thermal base layer + thick sweater',  icon: '🧥' },
        bottomwear:  { label: 'Bottoms',     suggestion: 'Thick jeans, thermal leggings',       icon: '👖' },
        footwear:    { label: 'Footwear',    suggestion: 'Boots, insulated shoes',              icon: '👢' },
        accessories: { label: 'Accessories', suggestion: 'Woollen scarf, warm beanie, gloves', icon: '🧣' },
      }
    },
    rainy: {
      label: 'Rainy Day', emoji: '🌧️', season: 'rainy',
      tip:  'Dark tones and quick-dry fabrics are your superpower today.',
      why:  'Rain soaks light fabrics — dark, quick-dry materials keep you comfortable.',
      subCategories:      ['TopWear', 'WinterWear', 'BottomWear'],
      wardrobeCategories: ['outerwear', 'topwear', 'bottomwear'],
      wardrobeTags:       ['rainy', 'casual'],
      keywords:           ['waterproof', 'dark', 'jacket', 'hoodie', 'coat', 'quick-dry'],
      clothing: {
        topwear:     { label: 'Tops',        suggestion: 'Waterproof jacket, dark hoodie',    icon: '🧥' },
        bottomwear:  { label: 'Bottoms',     suggestion: 'Dark jeans, quick-dry trousers',    icon: '👖' },
        footwear:    { label: 'Footwear',    suggestion: 'Waterproof boots — no suede!',      icon: '👢' },
        accessories: { label: 'Accessories', suggestion: 'Umbrella, waterproof bag',         icon: '☂️' },
      }
    }
  }
  return rules[category] || rules.moderate
}

// ── FIX #3 — JS wardrobe filter (case-insensitive, normalized) ────────────────
export const filterWardrobeItems = (allItems, rules) => {
  if (!allItems || allItems.length < 2) return []

  // Always normalize before filtering
  const items         = normalizeWardrobeItems(allItems)
  const allowedSeasons = [rules.season.toLowerCase(), 'all-season']
  const allowedCats    = rules.wardrobeCategories.map(c => c.toLowerCase())
  const allowedTags    = rules.wardrobeTags.map(t => t.toLowerCase())

  const filtered = items.filter(item => {
    const seasonMatch   = allowedSeasons.includes(item.season)
    const categoryMatch = allowedCats.includes(item.category)
    const tagMatch      = item.tags?.some(t => allowedTags.includes(t.toLowerCase()))
    return seasonMatch && (categoryMatch || tagMatch)
  })

  const pool      = filtered.length >= 2 ? filtered : items
  const tops      = pool.filter(i => ['topwear', 'dress'].includes(i.category))
  const bottoms   = pool.filter(i => i.category === 'bottomwear')
  const footwear  = pool.filter(i => i.category === 'footwear')
  const outerwear = pool.filter(i => i.category === 'outerwear')

  const colorScore = (a, b) => {
    if (!a || !b) return 1
    if (a === 'neutral' || b === 'neutral') return 3
    if (a === b) return 2
    return 1
  }

  const outfits = []

  tops.filter(t => t.category === 'dress').forEach(dress => {
    const shoe = footwear[0] || null
    outfits.push({
      type:  'Dress Outfit',
      items: [dress, shoe].filter(Boolean),
      score: shoe ? colorScore(dress.colorFamily, shoe.colorFamily) + 2 : 2,
      label: `${dress.color} dress${shoe ? ' + ' + shoe.color + ' shoes' : ''}`,
      weatherReason: `A ${dress.color} dress works well for ${rules.label} weather.`,
      aiInsight: { colorMatch: 'good', reason: rules.tip }
    })
  })

  tops.filter(t => t.category === 'topwear').forEach(top => {
    bottoms.forEach(bottom => {
      const cs    = colorScore(top.colorFamily, bottom.colorFamily)
      const shoe  = footwear.find(f => colorScore(f.colorFamily, bottom.colorFamily) >= 2) || footwear[0]
      const outer = outerwear[0] || null
      const score = cs + (shoe ? 1 : 0) + (outer ? 0.5 : 0)
      outfits.push({
        type:  'Complete Look',
        items: [top, bottom, shoe, outer].filter(Boolean),
        score,
        label: `${top.color} top + ${bottom.color} bottom${shoe ? ' + ' + shoe.color + ' shoes' : ''}`,
        weatherReason: `This combo suits ${rules.label} — ${rules.tip}`,
        aiInsight: { colorMatch: cs >= 3 ? 'excellent' : cs >= 2 ? 'good' : 'acceptable', reason: rules.tip }
      })
    })
  })

  return outfits.sort((a, b) => b.score - a.score).slice(0, 5)
}

// ── FIX #4 — Store filter: case-insensitive regex ─────────────────────────────
export const filterStoreProducts = async (rules) => {
  const subCatRegexes = rules.subCategories.map(sc => new RegExp(`^${sc}$`, 'i'))

  let products = await Product.find({ subCategory: { $in: subCatRegexes } }).limit(8)

  if (products.length < 3) {
    products = await Product.find({ category: { $regex: /^clothing$/i } }).limit(8)
  }

  if (products.length < 3) {
    products = await Product.find({}).limit(8)
  }

  return products
}

// ── Fetch raw weather data ────────────────────────────────────────────────────
const fetchWeatherData = async (query, apiKey) => {
  const res  = await axios.get(`https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric`)
  const data = res.data
  return {
    temp:        Math.round(data.main.temp),
    condition:   data.weather[0].main,
    description: data.weather[0].description,
    humidity:    data.main.humidity,
    city:        data.name,
    country:     data.sys.country,
    iconUrl:     `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
  }
}

// ── GET /api/weather ──────────────────────────────────────────────────────────
export const getWeather = async (req, res) => {
  try {
    const { city, lat, lon } = req.query
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) return res.status(500).json({ message: 'OPENWEATHER_API_KEY not set' })

    const query = lat && lon ? `lat=${lat}&lon=${lon}` : city ? `q=${city}` : null
    if (!query) return res.status(400).json({ message: 'Provide city or lat/lon' })

    const weather  = await fetchWeatherData(query, apiKey)
    const category = getWeatherCategory(weather.temp, weather.condition)
    const rules    = getClothingRules(category)
    return res.json({ ...weather, profile: rules })
  } catch (error) {
    if (error.response?.status === 404) return res.status(404).json({ message: 'City not found.' })
    return res.status(500).json({ message: error.message })
  }
}

// ── GET /api/recommendations/weather ─────────────────────────────────────────
/**
 * FIX #5 — Single Flask call with normalized + combined data.
 *
 * Flow:
 * 1. Fetch weather → classify → get clothing rules
 * 2. Normalize wardrobe items (fix case mismatches)
 * 3. Fetch store products → transform to AI schema
 * 4. Combine into one payload → ONE Flask call
 * 5. Split ranked response: price present = store item, else wardrobe item
 * 6. Fallback to JS engine if Flask is down
 */
export const getWeatherRecommendations = async (req, res) => {
  try {
    const { city, lat, lon } = req.query
    const apiKey   = process.env.OPENWEATHER_API_KEY
    const userId   = req.userId || req.query.userId
    const occasion = req.query.occasion || 'casual'

    const query = lat && lon ? `lat=${lat}&lon=${lon}` : city ? `q=${city}` : null
    if (!query) return res.status(400).json({ message: 'Provide city or lat/lon' })

    // ── 1. Weather ────────────────────────────────────────────────────────
    const weather  = await fetchWeatherData(query, apiKey)
    const category = getWeatherCategory(weather.temp, weather.condition)
    const rules    = getClothingRules(category)

    // ── 2. Normalize wardrobe items ───────────────────────────────────────
    let rawWardrobeItems = []
    if (userId) {
      rawWardrobeItems = await WardrobeItem.find({ userId }).lean()
    }
    const normalizedWardrobe = normalizeWardrobeItems(rawWardrobeItems)

    // ── 3. Fetch + transform store products ───────────────────────────────
    const rawStoreProducts    = await filterStoreProducts(rules)
    const transformedProducts = transformStoreProducts(rawStoreProducts)

    // ── 4. Combine wardrobe + store as one AI payload ─────────────────────
    const combinedItems = [...normalizedWardrobe, ...transformedProducts]

    // ── 5. Single Flask call ──────────────────────────────────────────────
    let wardrobeSuggestions = []
    let storeSuggestions    = rawStoreProducts  // default fallback
    let aiInsights          = null
    let styleProfile        = rules

    try {
      const aiRes = await axios.post(
        `${AI_SERVICE_URL}/recommendations`,
        { weather, wardrobeItems: combinedItems, occasion },
        { timeout: 12000 }
      )

      styleProfile = aiRes.data.styleProfile || rules
      aiInsights   = aiRes.data.aiInsights   || null

      // FIX #6 — Outfit combos from Flask outfit engine
      wardrobeSuggestions = aiRes.data.wardrobeSuggestions || []

      // Filter out any store-item combos that leaked into wardrobe suggestions
      wardrobeSuggestions = wardrobeSuggestions.filter(outfit => {
        const items = outfit.items || []
        return items.some(i => !i.price && !i.isStoreItem)
      })

      // Store: keep original Mongoose docs (have all fields for UI)
      // If AI returned ranked store items, re-order rawStoreProducts to match
      const rankedStoreIds = (aiRes.data.rankedItems || [])
        .filter(i => i.price != null || i.isStoreItem)
        .map(i => i._id?.toString())

      if (rankedStoreIds.length > 0) {
        const storeMap = Object.fromEntries(rawStoreProducts.map(p => [p._id.toString(), p]))
        storeSuggestions = [
          ...rankedStoreIds.map(id => storeMap[id]).filter(Boolean),
          ...rawStoreProducts.filter(p => !rankedStoreIds.includes(p._id.toString()))
        ]
      }

    } catch (flaskErr) {
      console.warn('[WeatherRec] Flask unavailable, using JS fallback:', flaskErr.message)

      // Wardrobe fallback
      if (normalizedWardrobe.length >= 2) {
        wardrobeSuggestions = filterWardrobeItems(normalizedWardrobe, rules)
      }

      aiInsights = {
        tip: 'Running rule-based recommendations (AI service offline).',
        wardrobeBalance: normalizedWardrobe.reduce((acc, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1; return acc
        }, {}),
        fallback: true
      }
    }

    return res.json({
      weather,
      styleProfile,
      wardrobeSuggestions,
      storeSuggestions,
      aiInsights,
      // Legacy
      profile:  rules,
      products: storeSuggestions
    })
  } catch (error) {
    console.error('Recommendation error:', error.message)
    if (error.response?.status === 404) return res.status(404).json({ message: 'City not found.' })
    return res.status(500).json({ message: error.message })
  }
}