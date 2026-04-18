import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShopDataContext } from '../context/ShopContext';
import { FaStar, FaStarHalfAlt } from "react-icons/fa"
import { FiShoppingCart, FiHeart, FiShare2, FiShield, FiRefreshCw, FiTruck } from "react-icons/fi"
import RelatedProduct from '../component/RelatedProduct'
import { toast } from 'react-toastify';

function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { products, addToCart, currency } = useContext(ShopDataContext)

  const [productData, setProductData] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [size, setSize]               = useState('')
  const [activeTab, setActiveTab]     = useState('description')
  const [wishlist, setWishlist]       = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  // Re-run every time productId changes (clicking a related product)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setSize('')
    setAddedToCart(false)
    setActiveTab('description')
    setActiveImage('')
    setProductData(null)

    if (!products || products.length === 0) return
    const found = products.find(item => item._id === productId)
    if (found) {
      setProductData(found)
      setActiveImage(found.image1)
    }
  }, [productId, products])

  const handleAddToCart = () => {
    if (!size) return
    addToCart(productData._id, size)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }
  const handleTryOn = () => {
  if (!productData) return
  navigate(`/try-on/${productData._id}`)
}

  const thumbs = productData
    ? [productData.image1, productData.image2, productData.image3, productData.image4].filter(Boolean)
    : []

  const guarantees = [
    { Icon: FiShield,    label: '100% Original'      },
    { Icon: FiTruck,     label: 'Cash on Delivery'   },
    { Icon: FiRefreshCw, label: '7-Day Easy Returns' },
  ]

  // Loading state
  if (!productData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="flex flex-col items-center gap-4 opacity-60">
          <div className="w-12 h-12 rounded-full border-4 border-pink-300 border-t-pink-500 animate-spin" />
          <p className="text-pink-400 font-medium text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Loading product…
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; overflow-y: auto !important; }
      `}</style>

      {/*
        KEY FIX: No overflow-hidden, no fixed height on any parent.
        The page scrolls naturally.
      */}
      <div className="w-full bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50">

        {/* Decorative blobs — fixed position, pointer-events-none so they never intercept scroll or clicks */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-10 w-72 h-72 bg-rose-200/15 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-fuchsia-100/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 pt-24 pb-24">
          <div className="flex flex-col gap-16">

            {/* ══════════════════════════════════════════
                SECTION 1 — IMAGE GALLERY + PRODUCT INFO
            ══════════════════════════════════════════ */}
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">

              {/* LEFT — Gallery */}
              <div className="w-full lg:w-[50%] flex flex-col gap-4">

                {/* Main image */}
                <div
                  className="relative w-full rounded-[24px] overflow-hidden border border-pink-100 bg-white/60 backdrop-blur-md shadow-xl shadow-pink-100/40"
                  style={{ aspectRatio: '4/5' }}
                >
                  {activeImage && (
                    <img
                      src={activeImage}
                      alt={productData.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

                  {/* Wishlist */}
                  <button
                    onClick={() => setWishlist(!wishlist)}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center shadow-md transition-all duration-200
                      ${wishlist ? 'bg-pink-500 border-pink-400 text-white' : 'bg-white/70 border-white/60 text-gray-500 hover:text-pink-400'}`}
                  >
                    <FiHeart size={16} className={wishlist ? 'fill-white' : ''} />
                  </button>

                  {/* Share */}
                  <button className="absolute top-[72px] right-4 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-white/60 flex items-center justify-center text-gray-500 hover:text-pink-400 shadow-md transition-all duration-200">
                    <FiShare2 size={15} />
                  </button>

                  {/* Category badge */}
                  <span className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm border border-pink-100 text-pink-500 text-xs font-semibold px-3 py-1 rounded-full">
                    {productData.category}
                  </span>
                </div>

                {/* Thumbnails row */}
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {thumbs.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(src)}
                      className={`flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-200
                        ${activeImage === src
                          ? 'border-pink-400 shadow-lg shadow-pink-200/60 scale-105'
                          : 'border-pink-100 hover:border-pink-300 opacity-60 hover:opacity-100'}`}
                      style={{ width: 72, height: 88 }}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT — Product Info */}
              <div className="flex-1 flex flex-col gap-5">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span
                    onClick={() => navigate('/')}
                    className="hover:text-pink-400 cursor-pointer transition-colors"
                  >Home</span>
                  <span>/</span>
                  <span
                    onClick={() => navigate('/collections')}
                    className="hover:text-pink-400 cursor-pointer transition-colors"
                  >{productData.category}</span>
                  <span>/</span>
                  <span className="text-pink-400 font-medium truncate max-w-[180px]">
                    {productData.name}
                  </span>
                </div>

                {/* Name */}
                <h1
                  className="text-3xl sm:text-4xl font-black text-gray-800 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {productData.name}
                </h1>

                {/* Rating row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4].map(i => <FaStar key={i} className="text-amber-400 text-sm" />)}
                    <FaStarHalfAlt className="text-amber-400 text-sm" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">4.5</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-pink-400 font-semibold cursor-pointer hover:underline">123 Reviews</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-green-500 font-semibold">✓ In Stock</span>
                </div>

                {/* Price */}
                <div className="flex items-end gap-3 flex-wrap">
                  <span
                    className="text-4xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {currency} {productData.price}
                  </span>
                  <span className="text-gray-400 line-through text-lg mb-1">
                    {currency} {Math.round(productData.price * 1.25)}
                  </span>
                  <span className="mb-1 text-xs font-bold bg-green-100 text-green-600 px-2.5 py-1 rounded-full">
                    20% OFF
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                  {productData.description}
                </p>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-pink-100 via-rose-100 to-transparent" />

                {/* Size selector */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-700 font-bold text-sm uppercase tracking-wider">Select Size</p>
                    <button className="text-xs text-pink-400 font-semibold hover:underline">Size Guide →</button>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {productData.sizes && productData.sizes.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setSize(item)}
                        className={`w-12 h-12 rounded-2xl text-sm font-bold border-2 transition-all duration-200
                          ${item === size
                            ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white border-transparent shadow-lg shadow-pink-200 scale-110'
                            : 'bg-white/80 text-gray-600 border-pink-100 hover:border-pink-300 hover:text-pink-500'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  {!size && (
                    <p className="text-xs text-rose-400 font-medium">Please select a size to continue</p>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    onClick={handleAddToCart}
                    disabled={!size}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg
                      ${!size
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                        : addedToCart
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-200 scale-105'
                          : 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-pink-200 hover:from-pink-500 hover:to-rose-600 hover:scale-105 active:scale-100'}`}
                  >
                    {addedToCart
                      ? <><span>✓</span> Added to Cart!</>
                      : <><FiShoppingCart size={17} /> Add to Cart</>}
                  </button>

                  <button className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm border-2 border-pink-200 text-pink-500 bg-white/70 hover:bg-pink-50 hover:border-pink-400 transition-all duration-200">
                    Buy Now →
                  </button>
                   {/* 🔥 NEW TRY ON BUTTON */}
                  <button
                      onClick={handleTryOn}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-lg shadow-indigo-200 hover:from-purple-500 hover:to-indigo-600 hover:scale-105 active:scale-100 transition-all duration-200"
                  >
                     👗 Try On
                  </button>
                </div>

                {/* Guarantee pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {guarantees.map(({ Icon, label }, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-white/70 border border-pink-100 rounded-full px-3.5 py-2 text-xs text-gray-600 font-medium">
                      <Icon size={13} className="text-pink-400" />
                      {label}
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* ══════════════════════════════════════════
                SECTION 2 — TABS: DESCRIPTION / REVIEWS
            ══════════════════════════════════════════ */}
            <div className="flex flex-col gap-6">

              {/* Tab switcher */}
              <div className="flex gap-1 bg-white/60 backdrop-blur-md border border-pink-100 rounded-2xl p-1.5 w-fit shadow-sm">
                {['description', 'reviews'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200
                      ${activeTab === tab
                        ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md shadow-pink-200'
                        : 'text-gray-500 hover:text-pink-400'}`}
                  >
                    {tab === 'reviews' ? 'Reviews (123)' : 'Description'}
                  </button>
                ))}
              </div>

              {/* Tab body */}
              <div className="bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-6 sm:p-8 shadow-md">
                {activeTab === 'description' ? (
                  <div className="flex flex-col gap-4 max-w-3xl">
                    <h3
                      className="text-xl font-black text-gray-800"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Product Description
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Upgrade your wardrobe with this stylish slim-fit cotton shirt, available now on FashNex. Crafted from breathable high-quality fabric, it offers all-day comfort and effortless style. Easy to maintain and perfect for any setting — this shirt is a must-have essential for those who value both fashion and function.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {[
                        ['Material', '100% Premium Cotton'],
                        ['Fit',      'Slim Fit'],
                        ['Care',     'Machine Wash Cold'],
                        ['Origin',   'Made in India'],
                      ].map(([key, val]) => (
                        <div key={key} className="flex items-center gap-3 bg-pink-50/60 rounded-2xl px-4 py-3">
                          <span className="text-xs font-bold text-pink-400 uppercase tracking-wider w-16 flex-shrink-0">{key}</span>
                          <span className="text-sm text-gray-600">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 max-w-3xl">
                    <h3
                      className="text-xl font-black text-gray-800"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Customer Reviews
                    </h3>
                    {[
                      { name: 'Priya S.',  rating: 5, text: 'Absolutely loved the quality! Fits perfectly and the fabric is super soft.',    time: '2 days ago'  },
                      { name: 'Ananya M.', rating: 4, text: 'Great product. Delivery was quick and packaging was neat. Would buy again!',     time: '1 week ago'  },
                      { name: 'Riya K.',   rating: 5, text: 'The color matches exactly as shown. Very happy with this purchase from FashNex!', time: '2 weeks ago' },
                    ].map((review, i) => (
                      <div key={i} className="flex flex-col gap-2 bg-pink-50/50 rounded-2xl px-5 py-4 border border-pink-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                              {review.name[0]}
                            </div>
                            <span className="text-sm font-bold text-gray-700">{review.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{review.time}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: review.rating }).map((_, j) => (
                            <FaStar key={j} className="text-amber-400 text-xs" />
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">{review.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════
                SECTION 3 — RELATED PRODUCTS
            ══════════════════════════════════════════ */}
            <RelatedProduct
              category={productData.category}
              gender={productData.gender}
              subCategory={productData.subCategory}
              currentProductId={productData._id}
            />

          </div>
        </div>
      </div>
    </>
  )
}

export default ProductDetail
