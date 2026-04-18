import React, { useContext, useEffect, useState } from 'react'
import { ShopDataContext } from '../context/ShopContext'
import { useNavigate } from 'react-router-dom'
import { ProductCard } from './LatestCollection'

function BestSeller() {
  const { products, currency } = useContext(ShopDataContext)
  const [bestSeller, setBestSeller] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const filtered = products.filter(item => item.bestseller)
    setBestSeller(filtered.slice(0, 4))
  }, [products])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <section className="w-full py-16 px-4 sm:px-8 lg:px-16 flex flex-col gap-12 bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50 ">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center gap-4">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            🏆 Fan Favourites
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-800 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Best{' '}
            <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
              Sellers
            </span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-md"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Tried, tested, and loved — discover our all-time bestsellers that customers can't stop buying.
          </p>
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-pink-300 rounded-full" />
            <span className="text-pink-300">✦</span>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-pink-300 rounded-full" />
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { emoji: '🔥', value: '10K+', label: 'Units Sold' },
            { emoji: '⭐', value: '4.9',  label: 'Avg Rating' },
            { emoji: '💬', value: '3K+',  label: 'Reviews'    },
            { emoji: '♻️', value: '92%',  label: 'Repeat Buy' },
          ].map((s, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-md border border-pink-100 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
              <span className="text-xl">{s.emoji}</span>
              <div>
                <p className="font-black text-gray-800 text-base leading-none"
                  style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
                <p className="text-gray-400 text-xs mt-0.5"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {bestSeller.map((item, index) => (
            <ProductCard
              key={index}
              item={item}
              currency={currency}
              navigate={navigate}
              badge="⭐ Best Seller"
            />
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/collection')}
            className="flex items-center gap-2 border-2 border-pink-200 text-pink-500 font-bold px-8 py-3.5 rounded-full text-sm hover:bg-pink-50 hover:border-pink-400 transition-all duration-200"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Explore All Products →
          </button>
        </div>
      </section>
    </>
  )
}

export default BestSeller