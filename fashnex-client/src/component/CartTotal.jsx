import React, { useContext } from 'react'
import { ShopDataContext } from '../context/ShopContext'
import { FiShield, FiTruck, FiTag } from 'react-icons/fi'

function CartTotal() {
  const { currency, delivery_fee, getCartAmount } = useContext(ShopDataContext)

  const subtotal = getCartAmount()
  const shipping = subtotal >= 999 ? 0 : (subtotal === 0 ? 0 : delivery_fee)
  const total    = subtotal + shipping

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <div className="w-full flex flex-col gap-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="w-5 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
          <h3
            className="text-xl font-black text-gray-800"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Order <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">Summary</span>
          </h3>
        </div>

        {/* Summary card */}
        <div className="bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-6 flex flex-col gap-4 shadow-md">

          {/* Subtotal */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Subtotal</span>
            <span className="text-gray-800 font-semibold">{currency} {subtotal.toFixed(2)}</span>
          </div>

          <div className="h-px bg-pink-50" />

          {/* Shipping */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FiTruck size={14} className="text-pink-400" />
              <span className="text-gray-500 text-sm">Shipping Fee</span>
            </div>
            {subtotal === 0 ? (
              <span className="text-gray-400 text-sm">—</span>
            ) : (
              <span className="text-gray-800 font-semibold">{currency} {delivery_fee}</span>
            )}
          </div>

          {/* Free shipping note */}
          {subtotal > 0 && subtotal < 999 && (
            <div className="flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-2xl px-4 py-2.5">
              <FiTag size={13} className="text-pink-400 flex-shrink-0" />
              <p className="text-pink-500 text-xs font-medium">
                Add {currency} {(999 - subtotal).toFixed(0)} more for <span className="font-bold">FREE shipping!</span>
              </p>
            </div>
          )}
          {subtotal >= 999 && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-2xl px-4 py-2.5">
              <span className="text-green-500 text-xs font-bold">🎉 You've unlocked free shipping!</span>
            </div>
          )}

          <div className="h-px bg-pink-50" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-gray-800 font-black text-base">Total</span>
            <span
              className="text-2xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currency} {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-col gap-2">
          {[
            { Icon: FiShield, text: '100% Secure Checkout' },
            { Icon: FiTruck,  text: 'Free delivery on orders above ₹999' },
          ].map(({ Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
              <Icon size={12} className="text-pink-300 flex-shrink-0" />
              {text}
            </div>
          ))}
        </div>

      </div>
    </>
  )
}

export default CartTotal