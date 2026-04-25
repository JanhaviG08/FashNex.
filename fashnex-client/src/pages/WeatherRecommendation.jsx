/**
 * WeatherRecommendation.jsx — REDESIGNED
 * =========================================
 * All business logic is IDENTICAL to the previous version.
 * Visual redesign: modern hero, image-based trending cards,
 * refined section hierarchy — soft pink theme preserved.
 *
 * Features preserved:
 *  ✔ localStorage cache (30-min TTL) + reset button
 *  ✔ visibleCount / View More / Show Less
 *  ✔ Weather match score bars + badges on product cards
 *  ✔ Wardrobe outfit cards + OutfitPreviewModal
 *  ✔ StyleTipsSection (always visible before search)
 *  ✔ Trending Now section (inline, real Unsplash images)
 *  ✔ SustainabilitySection
 *  ✔ Geolocation + city search
 *  ✔ Quick-city pills on empty state
 */

import { useState, useContext, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { AuthDataContext } from '../context/authContext'
import {
  FiMapPin, FiSearch, FiNavigation, FiStar,
  FiInfo, FiChevronDown, FiChevronUp, FiEye, FiRefreshCw,
  FiArrowUpRight
} from 'react-icons/fi'
import OutfitPreviewModal from '../component/OutfitPreviewModal'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_KEY = 'fashnex_weather_cache'
const CACHE_TTL = 30 * 60 * 1000

const weatherEmoji = {
  Clear:'☀️', Clouds:'☁️', Rain:'🌧️', Drizzle:'🌦️',
  Snow:'❄️', Thunderstorm:'⛈️', Mist:'🌫️', Haze:'🌫️', Wind:'💨',
}
const MEDALS = ['🥇','🥈','🥉','4️⃣','5️⃣']

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TIPS = [
  { icon:'🎨', title:'Build Around Neutrals',  text:'A wardrobe built on white, black, grey, and beige lets every piece pair easily.' },
  { icon:'✨', title:'Invest in Fit',           text:'A well-fitting average outfit beats a poorly fitting expensive one every time.' },
  { icon:'🔄', title:'Capsule Wardrobing',      text:'10 versatile pieces create more outfits than 50 single-use items.' },
  { icon:'🧴', title:'Care for Your Clothes',   text:'Proper washing extends the life of your clothes and keeps colours vibrant longer.' },
  { icon:'👟', title:'Shoes Make the Outfit',   text:'The same outfit looks completely different with sneakers vs. heeled boots.' },
  { icon:'📸', title:'Dress for the Day',       text:"Always consider your day's activities before getting dressed — comfort matters." },
]

const DEFAULT_SUSTAINABILITY = [
  { icon:'♻️', title:'Outfit Repeating is Stylish',  text:'Use our outfit generator to make new combinations from clothes you already own — every rewear helps.' },
  { icon:'👗', title:"Donate, Don't Discard",         text:"Clothes you've outgrown can give joy to someone else. Find a local donation centre near you." },
  { icon:'🛒', title:'Buy Less, Wear More',           text:'Invest in fewer, high-quality pieces that last longer — both economically and for the planet.' },
  { icon:'🌱', title:'Choose Natural Fabrics',        text:'Cotton, linen, and wool are biodegradable. Synthetics release microplastics on every wash.' },
  { icon:'🧺', title:'Wash Cold, Air Dry',            text:"90% of a garment's energy use is in washing. Cold washes and air drying extend fabric life." },
  { icon:'🤝', title:'Support Slow Fashion',          text:'Buy from brands that pay fair wages and use sustainable materials. Slow fashion always outlasts fast.' },
]

// Trending data — Unsplash images as requested
const TRENDING_DATA = [
  {
    id: 'tr1',
    title: 'Y2K Revival',
    description: 'Low-rise jeans, baby tees, and bold colors are back',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    platform: 'TikTok',
    tag: 'Trending',
  },
  {
    id: 'tr2',
    title: 'Minimalist Aesthetic',
    description: 'Clean fits, neutral tones, and simple silhouettes',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
    platform: 'Instagram',
    tag: 'Aesthetic',
  },
  {
    id: 'tr3',
    title: 'Streetwear Vibes',
    description: 'Oversized fits, hoodies, and sneakers dominate',
    image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600&auto=format&fit=crop&q=80',
    platform: 'TikTok',
    tag: 'Street',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SCORE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const scoreColor = (pct) => {
  if (pct >= 75) return 'bg-emerald-400'
  if (pct >= 50) return 'bg-amber-400'
  if (pct >= 25) return 'bg-orange-400'
  return 'bg-rose-300'
}
const scoreLabel = (pct) => {
  if (pct >= 75) return 'Excellent match'
  if (pct >= 50) return 'Good match'
  if (pct >= 25) return 'Fair match'
  return 'Low match'
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const saveToCache = (data) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data })) }
  catch { /* storage full */ }
}
const loadFromCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { timestamp, data } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null }
    return data
  } catch { return null }
}
const clearCache = () => { try { localStorage.removeItem(CACHE_KEY) } catch { /* ignore */ } }

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function WeatherCard({ weather }) {
  if (!weather) return null
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-400 to-rose-500 text-white p-6 shadow-2xl shadow-pink-300/50 flex flex-col gap-3 h-full">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-6 left-1/2 w-24 h-24 bg-rose-300/20 rounded-full blur-xl pointer-events-none" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
            📍 {weather.city}, {weather.country}
          </p>
          <p className="text-5xl font-black mt-1" style={{ fontFamily:"'Playfair Display', serif" }}>
            {weather.temp}°C
          </p>
          <p className="text-white/80 text-sm capitalize mt-1">{weather.description}</p>
        </div>
        {weather.iconUrl
          ? <img src={weather.iconUrl} alt={weather.condition} className="w-16 h-16 drop-shadow-lg" />
          : <span className="text-5xl">{weatherEmoji[weather.condition] || '🌤️'}</span>
        }
      </div>
      <div className="flex items-center gap-3 text-sm text-white/80 mt-1 relative z-10">
        <span className="bg-white/15 rounded-full px-3 py-1">💧 {weather.humidity}%</span>
        <span className="bg-white/15 rounded-full px-3 py-1">🌡️ {weather.condition}</span>
      </div>
    </div>
  )
}

// ProductCard — design unchanged from original
function ProductCard({ product, navigate }) {
  const pct    = product._scorePct ?? null
  const reason = product._reason   ?? null
  return (
    <div
      onClick={() => navigate(`/productdetail/${product._id}`)}
      className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-pink-100 cursor-pointer hover:shadow-2xl hover:shadow-pink-100/70 hover:-translate-y-2 transition-all duration-300"
    >
      <div className="relative h-52 overflow-hidden bg-pink-50">
        <img
          src={product.image1}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 bg-white/90 border border-pink-100 text-pink-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
          {product.subCategory}
        </span>
        {pct != null && (
          <span className={`absolute top-3 right-3 text-white text-[10px] font-black px-2 py-1 rounded-full ${scoreColor(pct)}`}>
            {pct}% match
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-gray-800 font-bold text-sm line-clamp-2" style={{ fontFamily:"'Playfair Display', serif" }}>
          {product.name}
        </h3>
        <span className="font-black text-pink-500">₹ {product.price}</span>
        {pct != null && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400">{scoreLabel(pct)}</span>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${scoreColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        {reason && (
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 italic">"{reason}"</p>
        )}
      </div>
    </div>
  )
}

function StyleTipsSection({ tips, weatherLabel }) {
  const displayTips = (tips && tips.length > 0) ? tips : DEFAULT_TIPS
  const label = weatherLabel || 'Today'
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400 mb-1">Fashion Intelligence</p>
        <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily:"'Playfair Display', serif" }}>
          Style Tips for{' '}
          <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">{label}</span>
        </h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {weatherLabel ? 'Fashion advice matched to your weather' : 'General fashion advice — search your city for personalised tips'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayTips.map((tip, i) => (
          <div key={i} className="flex items-start gap-4 bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-4 hover:shadow-md hover:border-pink-200 transition-all duration-200">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-100 border border-pink-200 flex items-center justify-center text-2xl flex-shrink-0">
              {tip.icon}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-gray-800 font-bold text-sm" style={{ fontFamily:"'Playfair Display', serif" }}>{tip.title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OutfitCard({ outfit, rank, onPreview }) {
  const [showWhy, setShowWhy] = useState(false)
  const exp = outfit.explanation_data || {}
  return (
    <div className="bg-white border border-pink-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{MEDALS[rank] || '✨'}</span>
            <div>
              <p className="text-gray-800 font-bold text-sm" style={{ fontFamily:"'Playfair Display', serif" }}>
                {outfit.label || outfit.type || 'Outfit Combination'}
              </p>
              <p className="text-gray-400 text-xs capitalize mt-0.5">{outfit.weatherReason || ''}</p>
            </div>
          </div>
          {outfit.score_1_5 != null && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1 flex-shrink-0">
              <FiStar size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-amber-700 font-black text-sm">{outfit.score_1_5.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(outfit.items || []).map((item, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="w-[60px] h-[75px] rounded-xl overflow-hidden border border-pink-100 bg-pink-50">
                <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-gray-400 capitalize">{item.category}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(outfit, rank)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md hover:scale-[1.02] transition-all"
          >
            <FiEye size={12} /> Preview
          </button>
          <button
            onClick={() => setShowWhy(v => !v)}
            className="flex items-center gap-1 border border-pink-200 text-pink-500 font-semibold py-2.5 px-3 rounded-xl text-xs hover:bg-pink-50 transition-colors"
          >
            <FiInfo size={11} />
            {showWhy ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
          </button>
        </div>
      </div>
      {showWhy && (
        <div className="border-t border-pink-50 px-5 pb-4 pt-3 bg-pink-50/40">
          <p className="text-gray-500 text-xs leading-relaxed">
            {exp.paragraph || outfit.explanation || outfit.weatherReason || 'This outfit suits the weather.'}
          </p>
        </div>
      )}
    </div>
  )
}

function SustainabilitySection({ tips = DEFAULT_SUSTAINABILITY }) {
  const items = tips.length > 0 ? tips : DEFAULT_SUSTAINABILITY
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-4 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">Fashion Responsibility</span>
        </div>
        <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily:"'Playfair Display', serif" }}>
          Sustainability{' '}
          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent italic">Tips</span>
        </h2>
        <p className="text-gray-400 text-sm mt-1">Small changes. Big impact.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((tip, i) => (
          <div key={i} className="flex items-start gap-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200">
            <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
              {tip.icon}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-gray-800 font-bold text-sm" style={{ fontFamily:"'Playfair Display', serif" }}>{tip.title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl px-5 py-3.5">
        <span className="text-lg">🌍</span>
        <p className="text-emerald-700 text-sm font-semibold">
          Together, our style choices can drive real change. Wear it well, wear it wisely.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function WeatherRecommendation() {
  const { serverUrl } = useContext(AuthDataContext)
  const navigate      = useNavigate()

  const cached = loadFromCache()

  const [cityInput,           setCityInput]           = useState(cached?.cityInput           || '')
  const [weather,             setWeather]             = useState(cached?.weather             || null)
  const [profile,             setProfile]             = useState(cached?.profile             || null)
  const [products,            setProducts]            = useState(cached?.products            || [])
  const [tips,                setTips]                = useState(cached?.tips                || [])
  const [wardrobeSuggestions, setWardrobeSuggestions] = useState(cached?.wardrobeSuggestions || [])
  const [loading,             setLoading]             = useState(false)
  const [locLoading,          setLocLoading]          = useState(false)
  const [error,               setError]               = useState('')
  const [previewOutfit,       setPreviewOutfit]       = useState(null)
  const [previewRank,         setPreviewRank]         = useState(0)
  const [visibleCount,        setVisibleCount]        = useState(8)

  useEffect(() => {
    if (!weather) return
    saveToCache({ cityInput, weather, profile, products, tips, wardrobeSuggestions })
  }, [weather, products, tips, wardrobeSuggestions, profile, cityInput])

  const handleResponse = useCallback((res, city) => {
    setWeather(res.data.weather)
    setProfile(res.data.profile)
    setProducts(res.data.products || res.data.storeSuggestions || [])
    setTips(res.data.tips || [])
    setWardrobeSuggestions(res.data.wardrobeSuggestions || [])
    if (city) setCityInput(city)
    setVisibleCount(8)
  }, [])

  const fetchByCity = async () => {
    if (!cityInput.trim()) return
    setLoading(true); setError('')
    try {
      const res = await axios.get(
        `${serverUrl}/api/recommendations/weather?city=${encodeURIComponent(cityInput.trim())}`,
        { withCredentials: true }
      )
      handleResponse(res, res.data.weather?.city || cityInput)
    } catch (err) {
      setError(err.response?.data?.message || 'City not found. Check spelling and try again.')
    } finally { setLoading(false) }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return }
    setLocLoading(true); setError('')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await axios.get(
            `${serverUrl}/api/recommendations/weather?lat=${coords.latitude}&lon=${coords.longitude}`,
            { withCredentials: true }
          )
          handleResponse(res, res.data.weather?.city)
        } catch { setError('Failed to fetch weather for your location.') }
        finally { setLocLoading(false) }
      },
      () => { setError('Location access denied. Enter city manually.'); setLocLoading(false) }
    )
  }

  const handleReset = () => {
    clearCache()
    setWeather(null); setProfile(null); setProducts([])
    setTips([]); setWardrobeSuggestions([])
    setCityInput(''); setError('')
  }

  // Quick-city handler — needs small delay so setCityInput flushes first
  const searchCity = (city) => {
    setCityInput(city)
    setTimeout(async () => {
      setLoading(true); setError('')
      try {
        const res = await axios.get(
          `${serverUrl}/api/recommendations/weather?city=${encodeURIComponent(city)}`,
          { withCredentials: true }
        )
        handleResponse(res, res.data.weather?.city || city)
      } catch (err) {
        setError(err.response?.data?.message || 'City not found.')
      } finally { setLoading(false) }
    }, 50)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50 relative overflow-hidden">

        {/* Ambient blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-pink-200/25 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-24 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-fuchsia-100/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 pt-24 pb-24 flex flex-col gap-16">

          {/* ═══════════════════════════════
              HERO + SEARCH
          ═══════════════════════════════ */}
          <div className="flex flex-col items-center text-center gap-6">

            {/* Eyebrow */}
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-pink-500 bg-pink-100 px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              Style, Powered by Weather
            </span>

            {/* Headline */}
            <div className="flex flex-col items-center gap-1">
              <h1
                className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-800 leading-[1.05]"
                style={{ fontFamily:"'Playfair Display', serif" }}
              >
                Dress for the
              </h1>
              <h1
                className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-500 bg-clip-text text-transparent italic"
                style={{ fontFamily:"'Playfair Display', serif" }}
              >
                Moment.
              </h1>
            </div>

            <p className="text-gray-500 text-base sm:text-lg max-w-xl leading-relaxed">
              Real-time weather → AI-matched outfits from our store and your wardrobe.
            </p>

            {/* Search row */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl mt-2">
              <div className="relative flex-1">
                <FiMapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
                <input
                  type="text"
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchByCity()}
                  placeholder="Enter your city (e.g. Mumbai, Delhi…)"
                  className="w-full py-4 bg-white/80 border border-pink-100 rounded-2xl pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-sm"
                />
              </div>
              <button
                onClick={fetchByCity}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-6 py-4 rounded-2xl text-sm shadow-lg shadow-pink-200/60 hover:scale-105 hover:shadow-xl hover:shadow-pink-200/80 transition-all disabled:opacity-60 whitespace-nowrap"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <FiSearch size={15} />
                }
                {loading ? 'Fetching…' : 'Get Outfits'}
              </button>
              <button
                onClick={detectLocation}
                disabled={locLoading}
                className="flex items-center justify-center gap-2 bg-white/80 border border-pink-200 text-pink-500 font-semibold px-5 py-4 rounded-2xl text-sm hover:bg-pink-50 transition-all disabled:opacity-60 whitespace-nowrap"
              >
                <FiNavigation size={14} className={locLoading ? 'animate-spin' : ''} />
                {locLoading ? 'Locating…' : 'My Location'}
              </button>
              {weather && (
                <button
                  onClick={handleReset}
                  title="Clear and search a new city"
                  className="flex items-center justify-center w-14 h-14 bg-white/80 border border-pink-200 text-gray-400 hover:text-pink-500 rounded-2xl transition-colors flex-shrink-0"
                >
                  <FiRefreshCw size={15} />
                </button>
              )}
            </div>

            {/* Cache banner */}
            {weather && cached && !loading && (
              <div className="w-full max-w-2xl bg-violet-50 border border-violet-100 text-violet-600 text-xs font-medium px-4 py-2.5 rounded-2xl flex items-center gap-2">
                📦 Showing saved results for <strong>{weather.city}</strong> — click "Get Outfits" to refresh.
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="w-full max-w-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium px-5 py-3.5 rounded-2xl text-center">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════
              STYLE TIPS (always visible)
          ═══════════════════════════════ */}
          <StyleTipsSection tips={tips} weatherLabel={profile?.label || null} />

          {/* ═══════════════════════════════
              WEATHER RESULTS
          ═══════════════════════════════ */}
          {weather && (
            <div className="flex flex-col gap-12">

              {/* Weather card + style profile */}
              <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                <div className="w-full lg:w-80 flex-shrink-0">
                  <WeatherCard weather={weather} />
                </div>
                {profile && (
                  <div className="flex-1 bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-6 flex flex-col gap-4 shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                      <span className="text-xs font-bold uppercase tracking-widest text-pink-400">Today's Style Profile</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily:"'Playfair Display', serif" }}>
                        {profile.emoji} {profile.label}
                      </h2>
                      <p className="text-gray-500 text-sm leading-relaxed mt-1">💡 {profile.tip}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(profile.keywords || []).map(k => (
                        <span key={k} className="bg-pink-50 border border-pink-200 text-pink-500 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product grid */}
              <div className="flex flex-col gap-6">
                <div className="flex items-end justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400 mb-1">Weather-Matched Picks</p>
                    <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily:"'Playfair Display', serif" }}>
                      Recommended for{' '}
                      <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                        {weather.condition} Weather
                      </span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-gray-400 bg-white/70 px-3 py-1 rounded-full border border-pink-100">
                      {products.length} items
                    </span>
                    {products.some(p => p._scorePct != null) && (
                      <span className="text-xs text-violet-500 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full font-semibold">
                        AI-ranked ✦
                      </span>
                    )}
                  </div>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center gap-4 bg-white/40 rounded-3xl border border-pink-100">
                    <span className="text-6xl">👗</span>
                    <div>
                      <p className="text-gray-600 font-semibold text-lg">No matching products found</p>
                      <p className="text-gray-400 text-sm mt-1">Add products to your store with relevant categories.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Grid — sliced to visibleCount */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                      {products.slice(0, visibleCount).map(product => (
                        <ProductCard key={product._id} product={product} navigate={navigate} />
                      ))}
                    </div>

                    {/* View More / Show Less */}
                    {products.length > 8 && (
                      <div className="flex flex-col items-center gap-2 pt-2">
                        {visibleCount < products.length ? (
                          <button
                            onClick={() => setVisibleCount(products.length)}
                            className="flex items-center gap-2 bg-white border-2 border-pink-200 text-pink-500 font-bold px-10 py-3.5 rounded-full text-sm hover:bg-gradient-to-r hover:from-pink-400 hover:to-rose-500 hover:text-white hover:border-transparent hover:scale-105 transition-all duration-200 shadow-sm"
                          >
                            <FiChevronDown size={16} />
                            View More — {products.length - visibleCount} more look{products.length - visibleCount !== 1 ? 's' : ''}
                          </button>
                        ) : (
                          <button
                            onClick={() => setVisibleCount(8)}
                            className="flex items-center gap-2 bg-white/80 border-2 border-pink-100 text-pink-400 font-semibold px-10 py-3.5 rounded-full text-sm hover:bg-pink-50 transition-all duration-200"
                          >
                            <FiChevronUp size={16} />
                            Show Less
                          </button>
                        )}
                        <p className="text-xs text-gray-400">
                          Showing {Math.min(visibleCount, products.length)} of {products.length} matched items
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Wardrobe outfit suggestions */}
              {wardrobeSuggestions.length > 0 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400 mb-1">From Your Wardrobe</p>
                    <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily:"'Playfair Display', serif" }}>
                      Your Outfits for This Weather
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {wardrobeSuggestions.map((outfit, i) => (
                      <OutfitCard
                        key={i}
                        outfit={outfit}
                        rank={i}
                        onPreview={(o, r) => { setPreviewOutfit(o); setPreviewRank(r) }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Wardrobe CTA — redesigned as a full-bleed gradient banner */}
              <div className="relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl p-8 text-white">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-xl font-black" style={{ fontFamily:"'Playfair Display', serif" }}>
                    {wardrobeSuggestions.length > 0 ? 'See all your wardrobe combos 🌟' : 'Get AI outfits from YOUR clothes 🌟'}
                  </h3>
                  <p className="text-white/75 text-sm mt-1">
                    {wardrobeSuggestions.length > 0
                      ? 'Visit your wardrobe page for all AI-generated combinations.'
                      : 'Upload your wardrobe and we will match it to todays weather.'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/wardrobe')}
                  className="relative z-10 flex-shrink-0 bg-white text-pink-500 font-bold px-7 py-3.5 rounded-full text-sm shadow-lg hover:scale-105 transition-all"
                >
                  {wardrobeSuggestions.length > 0 ? 'My Wardrobe →' : 'Upload Clothes →'}
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!weather && !loading && (
            <div className="flex flex-col items-center gap-6 py-12 text-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200 flex items-center justify-center text-6xl shadow-xl shadow-pink-100/60">
                  🌤️
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-sm shadow-md">
                  ✨
                </div>
              </div>
              <div>
                <p className="text-gray-700 font-bold text-xl">Enter your city to get started</p>
                <p className="text-gray-400 text-sm mt-1.5 max-w-md">
                  We'll fetch live weather and show only the products that suit today's conditions.
                </p>
              </div>
              {/* Quick city pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'].map(city => (
                  <button
                    key={city}
                    onClick={() => searchCity(city)}
                    className="text-xs font-semibold text-pink-500 bg-pink-50 border border-pink-200 px-3.5 py-1.5 rounded-full hover:bg-pink-100 hover:scale-105 transition-all"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════
              TRENDING NOW  (inline, no component)
          ═══════════════════════════════ */}
          <div className="flex flex-col gap-8">

            {/* Section header */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400 mb-1">What's Hot Right Now</p>
              <h2 className="text-2xl font-black text-gray-800" style={{ fontFamily:"'Playfair Display', serif" }}>
                Trending{' '}
                <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">Now</span>
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">Fashion moments taking over TikTok &amp; Instagram</p>
            </div>

            {/* 3-column image cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {TRENDING_DATA.map((trend) => (
                <div
                  key={trend.id}
                  className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-pink-100 shadow-sm hover:shadow-2xl hover:shadow-pink-100/70 hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                >
                  {/* Image area */}
                  <div className="relative h-56 overflow-hidden bg-pink-100">
                    <img
                      src={trend.image}
                      alt={trend.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={e => {
                        e.target.style.display = 'none'
                        e.target.parentElement.style.background = 'linear-gradient(135deg,#f9a8d4,#fb7185)'
                      }}
                    />
                    {/* Bottom fade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

                    {/* Platform badge */}
                    <span className="absolute top-3 right-3 bg-black/65 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {trend.platform}
                    </span>

                    {/* Tag pill */}
                    <span className="absolute bottom-3 left-3 bg-white/90 border border-pink-100 text-pink-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {trend.tag}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <h3
                        className="text-gray-800 font-black text-base leading-tight"
                        style={{ fontFamily:"'Playfair Display', serif" }}
                      >
                        {trend.title}
                      </h3>
                      <p className="text-gray-500 text-xs leading-relaxed mt-1.5">{trend.description}</p>
                    </div>
                    <button className="flex items-center gap-1.5 text-pink-500 text-xs font-bold group-hover:gap-2.5 transition-all duration-200 w-fit">
                      Explore <FiArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Trend Matching promo banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-8 text-white text-center">
              <div className="absolute -top-8 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">📈</div>
                <h3 className="text-xl font-black" style={{ fontFamily:"'Playfair Display', serif" }}>
                  AI Trend Matching
                </h3>
                <p className="text-white/75 text-sm max-w-sm">
                  Coming soon: Match your closet items with trending styles automatically.
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════
              SUSTAINABILITY TIPS
          ═══════════════════════════════ */}
          <SustainabilitySection />

        </div>
      </div>

      {/* Outfit preview modal */}
      {previewOutfit && (
        <OutfitPreviewModal
          outfit={previewOutfit}
          rank={previewRank}
          onClose={() => setPreviewOutfit(null)}
        />
      )}
    </>
  )
}