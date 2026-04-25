/**
 * fashnex-client/src/pages/Wishlist.jsx
 * =======================================
 * Route: /wishlist
 * Protected by App.jsx (user must be logged in).
 *
 * Features:
 *  • Loads full product data on mount via WishlistContext.fetchWishlistProducts()
 *  • Grid layout matching the existing product cards (same card design)
 *  • Heart icon on each card → remove from wishlist with toast
 *  • "Go to product" click navigates to /productdetail/:id
 *  • Empty state with CTA to browse collections
 *  • Wishlist count badge in the heading
 *  • Consistent pink theme
 */

import React, { useEffect, useState, useContext } from 'react'
import { useNavigate }           from 'react-router-dom'
import { ShopDataContext }        from '../context/ShopContext'
import { useWishlist }            from '../context/WishlistContext'
import HeartButton                from '../component/HeartButton'

function Wishlist() {
  const navigate                              = useNavigate()
  const { currency }                          = useContext(ShopDataContext)
  const { fetchWishlistProducts, isWishlisted } = useWishlist()

  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  // ── Load on mount ─────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true)
    const products = await fetchWishlistProducts()
    setItems(products)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // When a heart is toggled on THIS page, remove the card instantly
  const handleToggle = async (productId) => {
    // HeartButton already calls toggleWishlist; we just need to
    // filter the local list after the server confirms removal.
    // We poll isWishlisted after a short tick so the Set is updated.
    setTimeout(() => {
      setItems(prev => prev.filter(p => isWishlisted(p._id)))
    }, 300)
  }

  // ── Loading spinner ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="flex flex-col items-center gap-4 opacity-60">
          <div className="w-12 h-12 rounded-full border-4 border-pink-300 border-t-pink-500 animate-spin" />
          <p className="text-pink-400 font-medium text-sm">Loading wishlist…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="w-full min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50">

        {/* Decorative blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-0 w-72 h-72 bg-rose-200/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 pt-24 pb-24">

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400 mb-1">
                Your saved items
              </p>
              <h1
                className="text-3xl sm:text-4xl font-black text-gray-800 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                My{' '}
                <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                  Wishlist
                </span>
                {items.length > 0 && (
                  <span className="ml-3 text-lg font-bold text-pink-400">
                    ({items.length})
                  </span>
                )}
              </h1>
            </div>

            {items.length > 0 && (
              <button
                onClick={() => navigate('/collection')}
                className="text-sm font-semibold text-pink-500 border border-pink-200 px-5 py-2.5 rounded-full hover:bg-pink-50 transition-all"
              >
                + Add More
              </button>
            )}
          </div>

          {/* ── Empty state ── */}
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200 flex items-center justify-center text-5xl shadow-lg">
                💔
              </div>
              <div>
                <p
                  className="text-2xl font-black text-gray-800"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Your wishlist is empty
                </p>
                <p className="text-gray-400 text-sm mt-2 max-w-xs">
                  Save items you love by tapping the heart icon on any product.
                </p>
              </div>
              <button
                onClick={() => navigate('/collection')}
                className="bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-pink-200 hover:scale-105 transition-all"
              >
                Browse Collections →
              </button>
            </div>
          )}

          {/* ── Product grid ── */}
          {items.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map(product => (
                <WishlistCard
                  key={product._id}
                  product={product}
                  currency={currency}
                  navigate={navigate}
                  onHeartToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── WishlistCard ──────────────────────────────────────────────────────────────
// Same visual design as the ProductCard used across the site.
// The HeartButton handles remove-from-wishlist logic.
function WishlistCard({ product, currency, navigate, onHeartToggle }) {
  return (
    <div
      className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-pink-100 cursor-pointer hover:shadow-2xl hover:shadow-pink-100/70 hover:-translate-y-2 transition-all duration-300"
      onClick={() => navigate(`/productdetail/${product._id}`)}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-pink-50">
        <img
          src={product.image1}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Category pill */}
        <span className="absolute top-3 left-3 bg-white/90 border border-pink-100 text-pink-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
          {product.subCategory || product.category}
        </span>

        {/* ❤️ HeartButton — handles remove with toast */}
        <HeartButton
          productId={product._id}
          size="md"
          variant="overlay"
        />
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5">
        <h3
          className="text-gray-800 font-bold text-sm line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {product.name}
        </h3>
        <span
          className="font-black text-pink-500"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {currency} {product.price}
        </span>
      </div>
    </div>
  )
}

export default Wishlist