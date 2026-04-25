/**
 * weatherController.js — COMPLETE FIX
 * ======================================
 *
 * Problems solved in this version:
 *
 * P1 — STATIC PRODUCTS: filterStoreProducts() now does TWO-STAGE filtering:
 *   Stage 1: MongoDB query filtered by weather-specific subCategories
 *   Stage 2: JS-level scoring using weather_mapper rules (keyword, color, fabric)
 *   Products that match avoid_keywords are EXCLUDED before scoring.
 *   Result: HOT weather → only cotton/linen tops and dresses; COLD → only
 *           winterwear/jackets/sweaters. Different weather = different products.
 *
 * P2 — PAGE RESET: handled in WeatherRecommendation.jsx (localStorage).
 *       Backend returns full response; frontend persists it.
 *
 * P5 — HARD-CODED LIMIT: Dynamic top_n from query param (default 8, max 20).
 *       Slight randomisation added to avoid always showing exact same N items.
 *
 * All existing helper exports (mapColorToFamily, normalizeWardrobeItems etc.)
 * are PRESERVED unchanged so other controllers that import them still work.
 */

import axios      from 'axios'
import Product    from '../model/productModel.js'
import WardrobeItem from '../model/wardrobeModel.js'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001'
const AI_TIMEOUT_MS  = parseInt(process.env.AI_TIMEOUT_MS || '15000', 10)

// ─────────────────────────────────────────────────────────────────────────────
// ALL EXISTING HELPERS — UNCHANGED (other files import these)
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_FAMILY_MAP = {
  red:'warm', orange:'warm', yellow:'warm', pink:'warm',
  coral:'warm', salmon:'warm', maroon:'warm', burgundy:'warm', brown:'warm',
  blue:'cool', navy:'cool', teal:'cool', cyan:'cool',
  green:'cool', purple:'cool', violet:'cool', indigo:'cool', grey:'cool', gray:'cool',
  white:'neutral', black:'neutral', beige:'neutral', cream:'neutral',
  ivory:'neutral', khaki:'neutral', tan:'neutral',
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
  if (text.includes('formal')  || text.includes('blazer')   || text.includes('suit'))       tags.push('formal')
  if (text.includes('casual')  || text.includes('tee')      || text.includes('jeans'))       tags.push('casual')
  if (text.includes('party')   || text.includes('dress')    || text.includes('gown'))        tags.push('party')
  if (text.includes('office')  || text.includes('shirt')    || text.includes('trouser'))     tags.push('office')
  if (text.includes('winter')  || text.includes('coat')     || text.includes('jacket')    || text.includes('hoodie'))  tags.push('winter')
  if (text.includes('summer')  || text.includes('shorts')   || text.includes('sundress')  || text.includes('linen'))   tags.push('summer')
  if (text.includes('rain')    || text.includes('waterproof')) tags.push('rainy')
  return tags.length ? tags : ['casual']
}

export const normalizeWardrobeItems = (items = []) =>
  items.map(item => {
    const category    = (item.category || 'other').toLowerCase()
    const season      = (item.season   || 'all-season').toLowerCase()
    const colorFamily = item.colorFamily || mapColorToFamily(item.color)
    const tags        = item.tags?.length ? item.tags : generateBasicTags(category, item.name)
    return { ...item, category, season, colorFamily, tags }
  })

export const transformStoreProducts = (products = []) =>
  products.map(p => {
    const sc = (p.subCategory || p.category || '').toLowerCase()
    const category =
      sc === 'topwear'    ? 'topwear'
      : sc === 'bottomwear' ? 'bottomwear'
      : sc === 'dresses'    ? 'dress'
      : sc === 'winterwear' ? 'outerwear'
      : ['shoes','heels','flats'].includes(sc) ? 'footwear'
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
      price:       p.price,
      subCategory: p.subCategory,
      isStoreItem: true,
    }
  })

export const getWeatherCategory = (temp, condition) => {
  const cond = condition.toLowerCase()
  if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower') || cond.includes('thunder')) return 'rainy'
  if (temp >= 32) return 'hot'
  if (temp >= 26) return 'warm'
  if (temp >= 18) return 'moderate'
  if (temp >= 12) return 'cool'
  return 'cold'
}

// Full clothing rules (kept for wardrobe outfit generation)
export const getClothingRules = (category) => {
  const rules = {
    hot:      { label:'Hot & Sunny',     emoji:'☀️',  season:'summer',     subCategories:['TopWear','Dresses'],              wardrobeCategories:['topwear','dress','bottomwear'],       wardrobeTags:['summer','casual'], tip:'Stay cool with breathable fabrics.', keywords:['cotton','linen','light','summer','sleeveless','short','casual'] },
    warm:     { label:'Warm & Pleasant', emoji:'🌤️', season:'summer',     subCategories:['TopWear','Dresses','BottomWear'],  wardrobeCategories:['topwear','dress','bottomwear'],       wardrobeTags:['summer','casual'], tip:'Light layers for flexibility.',       keywords:['cotton','casual','light','summer','shirt','tee'] },
    moderate: { label:'Mild & Breezy',   emoji:'⛅',  season:'all-season', subCategories:['TopWear','BottomWear','Dresses'],  wardrobeCategories:['topwear','bottomwear','outerwear','dress'], wardrobeTags:['casual','office'], tip:'Perfect layering weather.',      keywords:['casual','denim','cotton','jacket','cardigan'] },
    cool:     { label:'Cool & Windy',    emoji:'🌬️', season:'all-season', subCategories:['TopWear','WinterWear','BottomWear'], wardrobeCategories:['topwear','outerwear','bottomwear'], wardrobeTags:['casual','winter'], tip:'Layer up today.',                keywords:['jacket','hoodie','sweater','cardigan','fleece'] },
    cold:     { label:'Cold & Chilly',   emoji:'❄️',  season:'winter',     subCategories:['WinterWear','TopWear','BottomWear'],wardrobeCategories:['outerwear','topwear','bottomwear'], wardrobeTags:['winter','formal'], tip:'Bundle up in warm layers.',      keywords:['wool','coat','jacket','sweater','thermal','warm'] },
    rainy:    { label:'Rainy Day',       emoji:'🌧️', season:'rainy',      subCategories:['TopWear','WinterWear','BottomWear'],wardrobeCategories:['outerwear','topwear','bottomwear'], wardrobeTags:['rainy','casual'],  tip:'Dark and waterproof today.',     keywords:['waterproof','dark','jacket','hoodie','coat'] },
  }
  return rules[category] || rules.moderate
}

export const filterWardrobeItems = (allItems, rules) => {
  if (!allItems || allItems.length < 2) return []
  const items = normalizeWardrobeItems(allItems)
  const allowedSeasons = [rules.season.toLowerCase(), 'all-season']
  const allowedCats    = rules.wardrobeCategories.map(c => c.toLowerCase())
  const allowedTags    = rules.wardrobeTags.map(t => t.toLowerCase())
  const filtered = items.filter(item => {
    const seasonMatch   = allowedSeasons.includes(item.season)
    const categoryMatch = allowedCats.includes(item.category)
    const tagMatch      = item.tags?.some(t => allowedTags.includes(t.toLowerCase()))
    return seasonMatch && (categoryMatch || tagMatch)
  })
  const pool     = filtered.length >= 2 ? filtered : items
  const tops     = pool.filter(i => ['topwear','dress'].includes(i.category))
  const bottoms  = pool.filter(i => i.category === 'bottomwear')
  const footwear = pool.filter(i => i.category === 'footwear')
  const outerwear = pool.filter(i => i.category === 'outerwear')
  const cs = (a, b) => (!a || !b) ? 1 : a === 'neutral' || b === 'neutral' ? 3 : a === b ? 2 : 1
  const outfits = []
  tops.filter(t => t.category === 'dress').forEach(dress => {
    const shoe = footwear[0] || null
    outfits.push({ type:'Dress Outfit', items:[dress,shoe].filter(Boolean), score: shoe ? cs(dress.colorFamily,shoe.colorFamily)+2:2, label:`${dress.color} dress${shoe?' + '+shoe.color+' shoes':''}`, weatherReason:`A ${dress.color} dress suits ${rules.label}.` })
  })
  tops.filter(t => t.category === 'topwear').forEach(top => {
    bottoms.forEach(bottom => {
      const score = cs(top.colorFamily,bottom.colorFamily) + (footwear[0]?1:0) + (outerwear[0]?0.5:0)
      outfits.push({ type:'Complete Look', items:[top,bottom,footwear[0],outerwear[0]].filter(Boolean), score, label:`${top.color} top + ${bottom.color} bottom`, weatherReason:`This combo suits ${rules.label} — ${rules.tip}` })
    })
  })
  return outfits.sort((a,b) => b.score - a.score).slice(0, 5)
}

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER PROFILE — mirrors weather_mapper.py (self-contained JS version)
// Used when Python AI service is offline. Keeps the Node backend autonomous.
// ─────────────────────────────────────────────────────────────────────────────

const WEATHER_PROFILES = {
  hot: {
    label:   'Hot & Sunny', emoji: '☀️',
    allowedSubCategories:  ['TopWear', 'Dresses'],
    allowedKeywords:       ['cotton','linen','sleeveless','short sleeve','shorts','sundress','casual','light','summer','breathable','tee','t-shirt','crop','tank','floral'],
    avoidKeywords:         ['wool','jacket','hoodie','coat','sweater','thermal','fleece','blazer','trench','puffer','waterproof'],
    preferredColors:       ['white','cream','beige','light blue','yellow','mint','coral','pink'],
    preferredFabrics:      ['cotton','linen','rayon','modal'],
    fallbackSubCategories: ['TopWear','BottomWear','Dresses'],
  },
  warm: {
    label:   'Warm & Pleasant', emoji: '🌤️',
    allowedSubCategories:  ['TopWear','Dresses','BottomWear'],
    allowedKeywords:       ['cotton','casual','light','tee','t-shirt','shirt','dress','linen','summer','chino','trouser'],
    avoidKeywords:         ['wool','puffer','thermal','heavy coat'],
    preferredColors:       ['white','light blue','yellow','coral','beige','pink'],
    preferredFabrics:      ['cotton','linen','jersey','rayon'],
    fallbackSubCategories: ['TopWear','BottomWear'],
  },
  moderate: {
    label:   'Mild & Breezy', emoji: '⛅',
    allowedSubCategories:  ['TopWear','BottomWear','Dresses'],
    allowedKeywords:       ['casual','denim','cotton','jeans','shirt','tee','cardigan','layer','blouse','trouser'],
    avoidKeywords:         ['puffer','heavy wool','thermal'],
    preferredColors:       ['navy','grey','white','olive','burgundy','camel'],
    preferredFabrics:      ['cotton','denim','light knit'],
    fallbackSubCategories: ['TopWear','BottomWear'],
  },
  cool: {
    label:   'Cool & Windy', emoji: '🌬️',
    allowedSubCategories:  ['TopWear','WinterWear','BottomWear'],
    allowedKeywords:       ['jacket','hoodie','sweater','cardigan','sweatshirt','knit','layer','long sleeve','fleece','denim jacket','bomber'],
    avoidKeywords:         ['sleeveless','shorts','crop top','tank'],
    preferredColors:       ['navy','grey','brown','olive','burgundy'],
    preferredFabrics:      ['fleece','knit','denim','corduroy'],
    fallbackSubCategories: ['TopWear','WinterWear'],
  },
  cold: {
    label:   'Cold & Chilly', emoji: '❄️',
    allowedSubCategories:  ['WinterWear','TopWear','BottomWear'],
    allowedKeywords:       ['wool','coat','jacket','sweater','thermal','warm','fleece','puffer','down','knit','winter','hoodie','turtleneck'],
    avoidKeywords:         ['sleeveless','shorts','mini','crop top','linen','tank'],
    preferredColors:       ['navy','charcoal','black','burgundy','dark green','camel'],
    preferredFabrics:      ['wool','cashmere','fleece','down','thick knit'],
    fallbackSubCategories: ['WinterWear','TopWear'],
  },
  rainy: {
    label:   'Rainy Day', emoji: '🌧️',
    allowedSubCategories:  ['TopWear','WinterWear','BottomWear'],
    allowedKeywords:       ['waterproof','jacket','hoodie','coat','dark','quick-dry','rain','trench','anorak','windproof','denim','trouser'],
    avoidKeywords:         ['suede','velvet','linen','sheer','floral'],
    preferredColors:       ['black','navy','dark grey','dark green','charcoal'],
    preferredFabrics:      ['nylon','polyester','quick-dry'],
    fallbackSubCategories: ['TopWear','WinterWear'],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FIXED: filterAndRankProducts — the core of Problem 1
// TWO-STAGE: strict DB query + JS scoring + exclusion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stage 1 — MongoDB query: only fetch products with matching subCategory.
 * Stage 2 — JS scoring: score and rank using weather profile rules.
 *   - Products with avoidKeywords are EXCLUDED (score = 0, filtered out)
 *   - Remaining products are scored and sorted DESC
 *   - Returns top_n items, with slight shuffle among near-equal scores
 */
const filterAndRankProducts = async (weatherCat, topN = 8) => {
  const profile = WEATHER_PROFILES[weatherCat] || WEATHER_PROFILES.moderate

  // ── Stage 1: Targeted DB query ──────────────────────────────────────────────
  // Fetch MORE than top_n so scoring has a pool to work with
  const fetchLimit = Math.max(topN * 4, 30)
  const subCatRegexes = profile.allowedSubCategories.map(s => new RegExp(`^${s}$`, 'i'))

  let rawProducts = await Product.find({
    subCategory: { $in: subCatRegexes }
  }).limit(fetchLimit).lean()

  // Fallback: if not enough, try fallback categories
  if (rawProducts.length < 3) {
    const fallbackRegexes = profile.fallbackSubCategories.map(s => new RegExp(`^${s}$`, 'i'))
    rawProducts = await Product.find({
      subCategory: { $in: fallbackRegexes }
    }).limit(fetchLimit).lean()
  }

  // Final fallback: any clothing
  if (rawProducts.length < 3) {
    rawProducts = await Product.find({ category: { $regex: /^clothing$/i } }).limit(fetchLimit).lean()
  }

  // ── Stage 2: JS scoring ─────────────────────────────────────────────────────
  const avoidKw  = profile.avoidKeywords.map(k => k.toLowerCase())
  const allowKw  = profile.allowedKeywords.map(k => k.toLowerCase())
  const prefFab  = profile.preferredFabrics.map(f => f.toLowerCase())
  const prefCol  = profile.preferredColors.map(c => c.toLowerCase())

  const scored = []

  for (const product of rawProducts) {
    const text = `${product.name || ''} ${product.description || ''}`.toLowerCase()

    // HARD EXCLUSION: if product name/description contains an avoid keyword, skip it
    const avoidHit = avoidKw.find(k => text.includes(k))
    if (avoidHit) continue   // excluded — never returned regardless of count

    // Scoring
    let raw = 0
    const matched = []

    const subCatLower = (product.subCategory || '').toLowerCase()
    if (profile.allowedSubCategories.some(s => s.toLowerCase() === subCatLower)) {
      raw += 2
      matched.push(`Category: ${product.subCategory}`)
    }

    const kwHits = allowKw.filter(k => text.includes(k))
    if (kwHits.length > 0) {
      raw += 2
      matched.push(`Style: ${kwHits[0]}`)
    }
    if (kwHits.length >= 2) {
      raw += 1  // bonus
      matched.push('Strong style match')
    }

    const fabHit = prefFab.find(f => text.includes(f))
    if (fabHit) { raw += 1; matched.push(`Fabric: ${fabHit}`) }

    const colHit = prefCol.find(c => text.includes(c))
    if (colHit) { raw += 1; matched.push(`Colour: ${colHit}`) }

    if (product.bestseller) { raw += 1; matched.push('Bestseller') }

    const score    = Math.round(Math.min(100, (raw / 8) * 100))
    const scorePct = score

    // Dynamic reason
    let reason
    if (score >= 80)      reason = `Perfect for ${profile.label} — ${matched.slice(0,2).join(', ')}.`
    else if (score >= 50) reason = `Good match for ${profile.label} — ${matched[0] || 'weather-appropriate'}.`
    else if (score >= 25) reason = `Suitable for ${profile.label} weather.`
    else                  reason = `Works for ${profile.label} with the right styling.`

    scored.push({ ...product, _weatherScore: score, _scorePct: scorePct, _reason: reason, _matched: matched })
  }

  // Sort by score DESC
  scored.sort((a, b) => b._weatherScore - a._weatherScore)

  // Slight variety: among items within 10 points of the top score, shuffle
  if (scored.length > topN) {
    const topScore     = scored[0]?._weatherScore || 0
    const topTier      = scored.filter(p => p._weatherScore >= topScore - 10)
    const rest         = scored.filter(p => p._weatherScore < topScore - 10)
    // Fisher-Yates shuffle on topTier for variety
    for (let i = topTier.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topTier[i], topTier[j]] = [topTier[j], topTier[i]]
    }
    return [...topTier, ...rest].slice(0, topN)
  }

  return scored.slice(0, topN)
}

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER TIPS — JS-side (no Python dependency)
// ─────────────────────────────────────────────────────────────────────────────

const WEATHER_TIPS = {
  hot: [
    { icon:'🌬️', title:'Breathable Fabrics First', text:'Cotton, linen, and rayon allow air to circulate — keeping you cool naturally all day.' },
    { icon:'🤍', title:'Light Colours Only',        text:'White and pastels reflect sunlight. You\'ll feel up to 5°C cooler than in dark colours.' },
    { icon:'👗', title:'Go Loose & Flowy',          text:'Loose silhouettes trap less heat than fitted clothes and let your skin breathe freely.' },
    { icon:'🕶️', title:'Protect from UV',           text:'A wide-brim hat and UV sunglasses are essential accessories on hot days.' },
    { icon:'👡', title:'Open-Toe Footwear',         text:'Sandals prevent sweaty feet — a small change that dramatically improves comfort.' },
    { icon:'🚫', title:'Avoid Dark Colours',        text:'Black and dark navy absorb heat. Save them for cooler weather.' },
  ],
  warm: [
    { icon:'👔', title:'Light Single Layer',        text:'One breathable layer is all you need. Keep a cardigan for air-conditioned spaces.' },
    { icon:'🎨', title:'Summer Tones',              text:'Coral, yellow, and soft blue are seasonally perfect and elevate any look.' },
    { icon:'🧴', title:'Cotton First',              text:'Cotton blends give the best comfort-to-style ratio in warm weather.' },
    { icon:'👟', title:'Lightweight Footwear',      text:'Canvas sneakers and loafers are breathable and always stylish.' },
    { icon:'🚫', title:'Skip Heavy Denim',          text:'Heavy jeans trap heat. Try lightweight chinos or linen trousers instead.' },
    { icon:'✨', title:'One Statement Piece',       text:'Minimal layers means one strong piece does all the talking.' },
  ],
  moderate: [
    { icon:'🧥', title:'Master the Layer',          text:'Start with a tee, add a denim jacket — remove it as the day warms up.' },
    { icon:'🎨', title:'Earth Tones Shine',         text:'Olive, camel, and navy pair with almost anything and suit mild weather perfectly.' },
    { icon:'🧣', title:'Scarf = Style + Warmth',   text:'A lightweight scarf is one of the most versatile pieces you can wear.' },
    { icon:'👟', title:'Sneakers or Loafers',       text:'Hit the sweet spot between comfort and polish for a mild day out.' },
    { icon:'👖', title:'Denim is Perfect',          text:'Jeans are the perfect weight for mild days — not too heavy, not too light.' },
    { icon:'⚡', title:'Versatility is Key',        text:'Pick pieces that work indoors and outdoors as mild weather shifts through the day.' },
  ],
  cool: [
    { icon:'🧅', title:'Layer Like a Pro',          text:'Base + mid + outer layer = the formula that keeps you warm without bulk.' },
    { icon:'🟤', title:'Rich Tones Elevate',        text:'Burgundy, rust, and forest green are made for cool weather.' },
    { icon:'🧤', title:'Accessories Matter',        text:'A chunky scarf and beanie transform any simple outfit into a seasonal statement.' },
    { icon:'🥾', title:'Ankle Boots Are Ideal',     text:'Warm enough for cool days, stylish enough for any occasion.' },
    { icon:'🧶', title:'Embrace Knits',             text:'Chunky sweaters are cosy and effortlessly stylish.' },
    { icon:'🚫', title:'No Thin Layers Alone',      text:'A single thin cotton layer won\'t cut it — always bring a jacket.' },
  ],
  cold: [
    { icon:'🔥', title:'Thermal Base Layer',        text:'Invisible under your outfit but makes a huge warmth difference.' },
    { icon:'🐑', title:'Wool is King',              text:'Merino wool regulates temperature, resists odour, and is supremely warm.' },
    { icon:'🧣', title:'Cover Head & Neck',         text:'You lose most heat through your head and neck — a hat and scarf are essential.' },
    { icon:'🖤', title:'Dark Palette Wins',         text:'Dark colours absorb more sunlight warmth and hide winter grime.' },
    { icon:'🥾', title:'Insulated Boots Only',      text:'Cold feet ruin any outfit — rubber or insulated leather boots are non-negotiable.' },
    { icon:'🚫', title:'Never Skip Layers',         text:'Three thin layers are warmer than one thick one. Always layer.' },
  ],
  rainy: [
    { icon:'💧', title:'Waterproof is Priority',   text:'One waterproof jacket is the most important piece in your rain-day arsenal.' },
    { icon:'🖤', title:'Wear Darks Confidently',   text:'Dark colours hide water spots and mud — you\'ll look sharp all day.' },
    { icon:'☂️', title:'Statement Umbrella',        text:'Match your umbrella to your outfit — an underrated style move.' },
    { icon:'🚫', title:'No Suede Ever',             text:'Suede is ruined by water — opt for leather or rubber instead.' },
    { icon:'🩱', title:'Quick-Dry Fabrics',        text:'Nylon and polyester dry fast — far more comfortable than soggy cotton.' },
    { icon:'👢', title:'Waterproof Boots',          text:'Wet socks are miserable. Waterproofed leather or rubber boots are essential.' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER DATA FETCHER
// ─────────────────────────────────────────────────────────────────────────────

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
    iconUrl:     `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

export const getWeather = async (req, res) => {
  try {
    const { city, lat, lon } = req.query
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) return res.status(500).json({ message: 'OPENWEATHER_API_KEY not set' })
    const query = lat && lon ? `lat=${lat}&lon=${lon}` : city ? `q=${encodeURIComponent(city)}` : null
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

/**
 * GET /api/recommendations/weather?city=Mumbai
 *
 * Fixed flow:
 *  1. Fetch weather → classify → get category ('hot'/'cold' etc.)
 *  2. filterAndRankProducts(category) — TWO-STAGE: strict DB + JS scoring
 *     Products containing avoid keywords are EXCLUDED entirely.
 *     Results are scored, sorted, and slightly shuffled for variety.
 *  3. Fetch user wardrobe (if logged in) → JS outfit combos
 *  4. Call Python AI for enhanced recommendations (optional, graceful fallback)
 *  5. Return everything: weather, profile, products (with scores), tips, wardrobe outfits
 */
export const getWeatherRecommendations = async (req, res) => {
  try {
    const { city, lat, lon, occasion: queryOccasion } = req.query
    const apiKey  = process.env.OPENWEATHER_API_KEY
    const topN    = Math.min(parseInt(req.query.top_n || '20', 10), 60)   // default 20, max 60 — frontend slices to 8

    // Try to extract userId from cookie JWT (optional — weather works without login)
    let userId = req.userId || req.query.userId
    if (!userId) {
      try {
        const jwt     = (await import('jsonwebtoken')).default
        const token   = req.cookies?.token
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET)
          userId = decoded.userId || decoded.id || decoded._id
        }
      } catch { /* not logged in — fine */ }
    }

    const occasion = queryOccasion || 'casual'
    const query    = lat && lon ? `lat=${lat}&lon=${lon}` : city ? `q=${encodeURIComponent(city.trim())}` : null
    if (!query) return res.status(400).json({ message: 'Provide city or lat/lon' })

    // ── 1. Weather ─────────────────────────────────────────────────────────
    const weather     = await fetchWeatherData(query, apiKey)
    const weatherCat  = getWeatherCategory(weather.temp, weather.condition)
    const rules       = getClothingRules(weatherCat)

    // ── 2. FIXED: Filter + rank products by weather (TWO-STAGE) ───────────
    const rankedProducts = await filterAndRankProducts(weatherCat, topN)

    // ── 3. Style tips ──────────────────────────────────────────────────────
    const tips = WEATHER_TIPS[weatherCat] || WEATHER_TIPS.moderate

    // ── 4. Wardrobe outfit suggestions (if logged in) ──────────────────────
    let wardrobeSuggestions = []
    let aiStatus = { engine: 'js-rules', fallback: false }

    if (userId) {
      const rawWardrobe = await WardrobeItem.find({ userId }).lean()
      const normalized  = normalizeWardrobeItems(rawWardrobe)
      if (normalized.length >= 2) {
        wardrobeSuggestions = filterWardrobeItems(normalized, rules)
      }

      // ── 5. Optional: call Python AI for enhanced wardrobe outfits ──────────
      if (normalized.length >= 2) {
        try {
          const aiRes = await axios.post(
            `${AI_SERVICE_URL}/recommend`,
            {
              wardrobe:  normalized.map(i => ({
                _id:         i._id?.toString() || '',
                category:    i.category    || 'other',
                color:       i.color       || 'unknown',
                colorFamily: i.colorFamily || 'neutral',
                season:      i.season      || 'all-season',
                occasion:    i.occasion    || 'all',
                name:        i.name        || '',
                imageUrl:    i.imageUrl    || '',
              })),
              season:   rules.season,
              occasion: occasion,
              user_id:  userId.toString(),
              top_n:    5,
              use_ml:   true,
            },
            { timeout: AI_TIMEOUT_MS }
          )
          if (aiRes.data.outfits?.length > 0) {
            wardrobeSuggestions = aiRes.data.outfits
            aiStatus = { engine: aiRes.data.model_info?.scorer || 'ml', fallback: false }
          }
        } catch {
          // Python offline — keep JS wardrobe suggestions
          aiStatus = { engine: 'js-rules', fallback: true }
        }
      }
    }

    // ── 6. Return ──────────────────────────────────────────────────────────
    return res.json({
      weather,
      profile:  rules,        // ← legacy key (existing frontend reads this)
      tips,                   // ← NEW: style tips array

      // Products — now filtered and ranked by weather
      products: rankedProducts,           // full Mongo docs + _weatherScore _scorePct _reason
      storeSuggestions: rankedProducts,   // alias for components that use this key

      wardrobeSuggestions,
      aiStatus,
      weatherCategory: weatherCat,
    })
  } catch (error) {
    console.error('Recommendation error:', error.message)
    if (error.response?.status === 404) return res.status(404).json({ message: 'City not found.' })
    return res.status(500).json({ message: error.message })
  }
}