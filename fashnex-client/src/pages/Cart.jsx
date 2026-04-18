import React, { useContext, useState, useEffect } from 'react'
import { ShopDataContext } from '../context/ShopContext'
import { useNavigate } from 'react-router-dom'
import { RiDeleteBin6Line } from 'react-icons/ri'
import { FiShoppingCart, FiArrowLeft, FiMinus, FiPlus } from 'react-icons/fi'
import CartTotal from '../component/CartTotal'
import { toast } from 'react-toastify';


function Cart() {
  const { products, currency, cartItem, updateQuantity } = useContext(ShopDataContext)
  const [cartData, setCartData] = useState([])
  const navigate = useNavigate()

  // Build flat cartData array from cartItem map
  useEffect(() => {
    const tempData = []
    for (const itemId in cartItem) {
      for (const size in cartItem[itemId]) {
        const qty = cartItem[itemId][size]
        if (qty > 0) {
          tempData.push({ _id: itemId, size, quantity: qty })
        }
      }
    }
    setCartData(tempData)
  }, [cartItem])

  const isEmpty = cartData.length === 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50">

        {/* Ambient blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-200/25 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-10 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-fuchsia-100/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 pt-24 pb-24">

          {/* ── Page Header ── */}
          <div className="flex flex-col gap-3 mb-10">
            <button
              onClick={() => navigate('/collection')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors w-fit"
            >
              <FiArrowLeft size={15} /> Continue Shopping
            </button>
            <div className="flex items-center gap-3">
              <span className="w-5 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-pink-400">Your Bag</span>
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black text-gray-800 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your{' '}
              <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                Cart
              </span>
              {!isEmpty && (
                <span className="ml-3 text-lg font-semibold text-gray-400">
                  ({cartData.length} {cartData.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </h1>
          </div>

          {/* ── Empty state ── */}
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200 flex items-center justify-center shadow-lg">
                <FiShoppingCart size={38} className="text-pink-300" />
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <h2
                  className="text-2xl font-black text-gray-700"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Your cart is empty
                </h2>
                <p className="text-gray-400 text-sm max-w-xs">
                  Looks like you haven't added anything yet. Explore our collections and find your next favourite look.
                </p>
              </div>
              <button
                onClick={() => navigate('/collection')}
                className="bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-8 py-3.5 rounded-full text-sm shadow-lg shadow-pink-200 hover:scale-105 active:scale-100 transition-all duration-200"
              >
                Shop Now ✨
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-10 items-start">

              {/* ── LEFT: Cart items ── */}
              <div className="flex-1 flex flex-col gap-4">
                {cartData.map((item, index) => {
                  const product = products.find(p => p._id === item._id)
                  if (!product) return null

                  return (
                    <div
                      key={index}
                      className="group bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5 shadow-sm hover:shadow-lg hover:shadow-pink-100/50 transition-all duration-300"
                    >
                      {/* Product image */}
                      <div
                        className="w-24 h-28 sm:w-28 sm:h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-pink-100 cursor-pointer"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        <img
                          src={product.image1}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <h3
                          className="text-gray-800 font-bold text-base sm:text-lg leading-snug truncate cursor-pointer hover:text-pink-500 transition-colors"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                          onClick={() => navigate(`/product/${product._id}`)}
                        >
                          {product.name}
                        </h3>

                        {/* Price + size row */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className="font-black text-lg bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {currency} {product.price}
                          </span>
                          <span className="bg-pink-50 border border-pink-200 text-pink-500 text-xs font-bold px-3 py-1 rounded-full">
                            Size: {item.size}
                          </span>
                          <span className="text-gray-400 text-xs">{product.category}</span>
                        </div>

                        {/* Quantity controls + delete */}
                        <div className="flex items-center justify-between mt-1">
                          {/* Qty stepper */}
                          <div className="flex items-center gap-2 bg-white/80 border border-pink-100 rounded-2xl px-2 py-1.5 shadow-sm">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantity(item._id, item.size, item.quantity - 1)
                                }
                              }}
                              disabled={item.quantity <= 1}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-pink-400 hover:bg-pink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <FiMinus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-gray-700 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-pink-400 hover:bg-pink-50 transition-all"
                            >
                              <FiPlus size={12} />
                            </button>
                          </div>

                          {/* Line total */}
                          <span className="text-gray-500 text-sm font-semibold hidden sm:block">
                            = {currency} {(product.price * item.quantity).toFixed(2)}
                          </span>

                          {/* Delete */}
                          <button
                            onClick={() => updateQuantity(item._id, item.size, 0)}
                            className="w-9 h-9 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 border border-transparent hover:border-rose-200 transition-all duration-200"
                          >
                            <RiDeleteBin6Line size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── RIGHT: Order summary ── */}
              <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-28">
                <CartTotal />

                {/* Checkout button */}
                <button
                  onClick={() => navigate('/placeorder')}
                  className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-pink-200 hover:from-pink-500 hover:to-rose-600 hover:scale-[1.02] active:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Proceed to Checkout →
                </button>

                {/* OR continue shopping */}
                <button
                  onClick={() => navigate('/collection')}
                  className="w-full border-2 border-pink-200 text-pink-500 font-semibold py-3.5 rounded-2xl text-sm hover:bg-pink-50 hover:border-pink-400 transition-all duration-200"
                >
                  ← Continue Shopping
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Cart