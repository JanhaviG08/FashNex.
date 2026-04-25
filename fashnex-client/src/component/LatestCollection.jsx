import React, { useContext, useEffect, useState } from 'react'
import { ShopDataContext } from '../context/ShopContext'
import { useNavigate } from 'react-router-dom'
import { FaStar, FaStarHalfAlt } from 'react-icons/fa'
import HeartButton from './HeartButton'

function LatestCollection() {
  const { products, currency } = useContext(ShopDataContext)
  const [latestProducts, setLatestProducts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setLatestProducts(products.slice(0, 8))
  }, [products])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <section className="w-full py-16 px-4 sm:px-8 lg:px-16 flex flex-col gap-12 bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50 py-20 px-5 sm:px-8">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center gap-4">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-pink-400 bg-pink-100 px-4 py-1.5 rounded-full"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Fresh Drops ✨
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-800 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Latest{' '}
            <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
              Collections
            </span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-md"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Step into style — new pieces dropping this season, curated just for you.
          </p>
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-pink-300 rounded-full" />
            <span className="text-pink-300">✦</span>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-pink-300 rounded-full" />
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {latestProducts.map((item, index) => (
            <ProductCard key={index} item={item} currency={currency} navigate={navigate} />
          ))}
        </div>

        {/* ── View All CTA ── */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/collection')}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-8 py-3.5 rounded-full text-sm shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            View All Collections →
          </button>
        </div>
      </section>
    </>
  )
}

// ── Shared card used by both Latest & BestSeller ──────────────────────────────
export function ProductCard({ item, currency, navigate, badge }) {
  return (
    <div
      onClick={() => navigate(`/productdetail/${item._id}`)}
      className="group relative flex flex-col bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-pink-100/70 hover:-translate-y-2 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-pink-50/40"
        style={{ aspectRatio: '3/4' }}>
        <img
          src={item.image1}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />

        {/* Badge */}
        {badge && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
            {badge}
          </span>
        )}
        {!badge && (
          <span className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm border border-pink-100 text-pink-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {item.category}
          </span>
        )}

        {/* Wishlist — real global state via WishlistContext */}
        <HeartButton productId={item._id} size="sm" variant="overlay" />

        {/* Quick view */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md text-pink-500 text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          Quick View →
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-gray-800 font-bold text-sm leading-snug line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {item.name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-1">
          {[1,2,3,4].map(i => <FaStar key={i} className="text-amber-400 text-[10px]" />)}
          <FaStarHalfAlt className="text-amber-400 text-[10px]" />
          <span className="text-gray-400 text-[10px] ml-1">(4.5)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-black text-base bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {currency} {item.price}
          </span>
          <span className="text-gray-400 line-through text-xs">
            {currency} {Math.round(item.price * 1.2)}
          </span>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  )
}

export default LatestCollection