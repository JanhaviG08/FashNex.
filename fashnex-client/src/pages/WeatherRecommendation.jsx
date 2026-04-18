import { useState, useContext } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { AuthDataContext } from "../context/authContext"
import { FiMapPin, FiSearch, FiNavigation } from "react-icons/fi"

// ── Static weather icons (emoji fallback while img loads) ──────────────────
const weatherEmoji = {
  Clear: "☀️", Clouds: "☁️", Rain: "🌧️",
  Drizzle: "🌦️", Snow: "❄️", Thunderstorm: "⛈️",
  Mist: "🌫️", Haze: "🌫️", Wind: "💨"
}

// ── ProductCard — shows real DB products ───────────────────────────────────
function ProductCard({ product, currency = "₹", navigate }) {
  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-pink-100 cursor-pointer hover:shadow-2xl hover:shadow-pink-100/70 hover:-translate-y-2 transition-all duration-300"
    >
      <div className="relative h-52 overflow-hidden bg-pink-50">
        <img src={product.image1} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className="absolute top-3 left-3 bg-white/90 border border-pink-100 text-pink-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
          {product.subCategory}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <h3 className="text-gray-800 font-bold text-sm line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}>{product.name}</h3>
        <span className="font-black text-pink-500"
          style={{ fontFamily: "'Playfair Display', serif" }}>{currency} {product.price}</span>
      </div>
    </div>
  )
}

// ── WeatherCard — displays fetched weather ─────────────────────────────────
function WeatherCard({ weather }) {
  if (!weather) return null
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-400 to-rose-500 text-white p-6 shadow-2xl shadow-pink-300/50 flex flex-col gap-3">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
            📍 {weather.city}, {weather.country}
          </p>
          <p className="text-5xl font-black mt-1"
            style={{ fontFamily: "'Playfair Display', serif" }}>{weather.temp}°C</p>
          <p className="text-white/80 text-sm capitalize mt-1">{weather.description}</p>
        </div>
        {weather.iconUrl
          ? <img src={weather.iconUrl} alt={weather.condition} className="w-16 h-16" />
          : <span className="text-5xl">{weatherEmoji[weather.condition] || "🌤️"}</span>
        }
      </div>
      <div className="flex items-center gap-4 text-sm text-white/80 mt-1">
        <span>💧 Humidity: {weather.humidity}%</span>
        <span>🌡️ {weather.condition}</span>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function WeatherRecommendation() {
  const { serverUrl } = useContext(AuthDataContext)
  const navigate      = useNavigate()

  const [cityInput, setCityInput] = useState("")
  const [weather, setWeather]     = useState(null)
  const [profile, setProfile]     = useState(null)
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [error, setError]         = useState("")

  // ── Fetch by city name ─────────────────────────────────────────────────
  const fetchByCity = async () => {
    if (!cityInput.trim()) return
    setLoading(true); setError("")
    try {
      const res = await axios.get(
        `${serverUrl}/api/recommendations/weather?city=${encodeURIComponent(cityInput)}`
      )
      setWeather(res.data.weather)
      setProfile(res.data.profile)
      setProducts(res.data.products)
    } catch (err) {
      setError(err.response?.data?.message || "City not found. Check spelling and try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Auto-detect location ───────────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.")
      return
    }
    setLocLoading(true); setError("")
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await axios.get(
            `${serverUrl}/api/recommendations/weather?lat=${coords.latitude}&lon=${coords.longitude}`
          )
          setWeather(res.data.weather)
          setProfile(res.data.profile)
          setProducts(res.data.products)
          setCityInput(res.data.weather.city)
        } catch (err) {
          setError("Failed to fetch weather for your location.")
        } finally {
          setLocLoading(false)
        }
      },
      () => {
        setError("Location access denied. Please enter your city manually.")
        setLocLoading(false)
      }
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50 relative overflow-hidden">

        {/* Ambient blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 pt-24 pb-20 flex flex-col gap-12">

          {/* ── Header ── */}
          <div className="flex flex-col items-center text-center gap-4">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-pink-400 bg-pink-100 px-4 py-1.5 rounded-full">
              Style, Powered by Weather ✨
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-800 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Dress for the{" "}
              <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic mr-1">
                Moment
              </span>
            </h1>
            <p className="text-gray-500 text-base max-w-lg">
              Enter your city or use your location — we'll fetch real-time weather and recommend outfits from our store.
            </p>
          </div>

          {/* ── Search bar ── */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto w-full">
            <div className="relative flex-1">
              <FiMapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
              <input
                type="text"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchByCity()}
                placeholder="Enter your city (e.g. Mumbai, Delhi…)"
                className="w-full h-13 py-3.5 bg-white/80 border border-pink-100 rounded-2xl pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-sm transition"
              />
            </div>
            <button onClick={fetchByCity} disabled={loading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-6 py-3.5 rounded-2xl text-sm shadow-lg shadow-pink-200 hover:scale-105 active:scale-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSearch size={15} />}
              {loading ? "Fetching…" : "Get Outfits"}
            </button>
            <button onClick={detectLocation} disabled={locLoading}
              className="flex items-center justify-center gap-2 bg-white/80 border border-pink-200 text-pink-500 font-semibold px-5 py-3.5 rounded-2xl text-sm hover:bg-pink-50 transition-all duration-200 disabled:opacity-60 whitespace-nowrap">
              <FiNavigation size={14} className={locLoading ? "animate-spin" : ""} />
              {locLoading ? "Locating…" : "My Location"}
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="max-w-2xl mx-auto w-full bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium px-5 py-3.5 rounded-2xl text-center">
              ⚠️ {error}
            </div>
          )}

          {/* ── Results ── */}
          {weather && (
            <div className="flex flex-col gap-10">

              {/* Weather + profile */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-72 flex-shrink-0">
                  <WeatherCard weather={weather} />
                </div>
                {profile && (
                  <div className="flex-1 bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-6 flex flex-col gap-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                      <span className="text-xs font-bold uppercase tracking-widest text-pink-400">Style Profile</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800"
                      style={{ fontFamily: "'Playfair Display', serif" }}>{profile.label}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">💡 {profile.tip}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.keywords.map(k => (
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
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-800"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    Recommended for{" "}
                    <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                      {weather.condition} Weather
                    </span>
                  </h2>
                  <span className="text-sm text-gray-400 bg-white/60 px-3 py-1 rounded-full border border-pink-100">
                    {products.length} looks
                  </span>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center gap-3">
                    <span className="text-5xl">👗</span>
                    <p className="text-gray-400">No products found for this weather. Try adding more items to your store.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {products.map(product => (
                      <ProductCard key={product._id} product={product} navigate={navigate} />
                    ))}
                  </div>
                )}
              </div>

              {/* CTA to wardrobe */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-8 text-center">
                <div>
                  <h3 className="text-xl font-black text-gray-800"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    Want to style your own clothes? 🌟
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Upload your wardrobe and get AI outfit combos from your own collection.
                  </p>
                </div>
                <button onClick={() => navigate("/wardrobe")}
                  className="flex-shrink-0 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-7 py-3.5 rounded-full text-sm shadow-lg shadow-pink-200 hover:scale-105 transition-all duration-200">
                  Try My Wardrobe →
                </button>
              </div>
            </div>
          )}

          {/* ── Empty state (before search) ── */}
          {!weather && !loading && (
            <div className="flex flex-col items-center gap-6 py-16 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200 flex items-center justify-center text-5xl shadow-lg">
                🌤️
              </div>
              <div>
                <p className="text-gray-600 font-semibold text-lg">Enter your city to get started</p>
                <p className="text-gray-400 text-sm mt-1">We'll fetch live weather and show outfits from our store that match the conditions.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}