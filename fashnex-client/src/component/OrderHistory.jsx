/**
 * fashnex-client/src/component/OrderHistory.jsx
 * =================================================
 * Receives orders as a prop (Profile.jsx fetches them once via the
 * existing /api/order/userorder endpoint, same one Order.jsx already
 * uses) so we don't double-fetch.
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPackage, FiChevronRight, FiRefreshCw } from 'react-icons/fi'

const statusStyle = {
  'Order Place':      'bg-amber-50 border-amber-200 text-amber-700',
  'Packing':           'bg-blue-50 border-blue-200 text-blue-700',
  'Out For Delivery':  'bg-purple-50 border-purple-200 text-purple-700',
  'Shipped':            'bg-green-50 border-green-200 text-green-700',
  'Delivered':          'bg-green-50 border-green-200 text-green-700',
}

function OrderHistory({ orders = [], loading, currency, onRefresh }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Orders
          </h3>
          <p className="text-gray-400 text-sm mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 bg-white border border-pink-100 rounded-2xl px-3.5 py-2 text-xs font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-500 transition-all"
        >
          <FiRefreshCw size={12} className={loading ? 'animate-spin text-pink-400' : ''} />
          Refresh
        </button>
      </div>

      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center">
            <FiPackage size={26} className="text-pink-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No orders yet</p>
          <button
            onClick={() => navigate('/collection')}
            className="text-xs font-bold text-pink-500 hover:text-rose-500"
          >
            Start shopping →
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-pink-50/70 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.slice(0, 8).map((o, i) => (
            <button
              key={i}
              onClick={() => navigate('/order')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-pink-50 hover:border-pink-200 hover:bg-pink-50/40 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0 border border-pink-100">
                {o.image1 && <img src={o.image1} alt={o.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-semibold text-sm truncate">{o.name || 'Order item'}</p>
                <p className="text-gray-400 text-xs mt-0.5">{o.date ? new Date(o.date).toDateString() : ''}</p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusStyle[o.status] || statusStyle['Order Place']}`}>
                {o.status || 'Order Placed'}
              </span>
              <span className="font-black text-pink-500 text-sm hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>
                {currency} {o.price}
              </span>
              <FiChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}

          {orders.length > 8 && (
            <button
              onClick={() => navigate('/order')}
              className="text-center text-sm font-bold text-pink-500 hover:text-rose-500 py-2"
            >
              View all {orders.length} orders →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default OrderHistory