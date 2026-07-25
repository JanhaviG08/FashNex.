/**
 * fashnex-client/src/component/LogoutModal.jsx
 * ================================================
 * Small confirmation modal. Purely presentational — the actual logout
 * call (axios + getCurrentUser + navigate) lives wherever it's triggered
 * from, same pattern Nav.jsx already uses.
 */
import React from 'react'
import { FiLogOut, FiX } from 'react-icons/fi'

function LogoutModal({ open, onCancel, onConfirm, loading }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-2xl shadow-pink-200/40 p-7 flex flex-col items-center text-center gap-4 animate-[popIn_0.2s_cubic-bezier(.34,1.56,.64,1)_forwards]">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <FiX size={18} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
          <FiLogOut size={22} className="text-white" />
        </div>

        <div>
          <h3
            className="text-xl font-black text-gray-800"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Log out of FashNex?
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            You'll need to sign in again to access your wishlist, wardrobe, and orders.
          </p>
        </div>

        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-pink-100 text-gray-600 font-semibold text-sm hover:bg-pink-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2
              ${loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-200 hover:scale-[1.02]'}`}
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoutModal