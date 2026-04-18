import React, { useContext, useEffect, useState } from 'react'
import { ShopDataContext } from '../context/ShopContext'
import { AuthDataContext } from '../context/authContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiPackage, FiRefreshCw, FiChevronRight, FiTruck, FiCheckCircle , FiClock } from 'react-icons/fi'
import { FcShipped } from "react-icons/fc";

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig = {
  'Order Place':  { color: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50  border-amber-200',  icon: FiClock,       label: 'Order Placed'   },
  'Packing':      { color: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50   border-blue-200',   icon: FiPackage,     label: 'Packing'        },
  'Out For Delivery': { color: 'bg-purple-400', text: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: FiTruck,   label: 'Out for Delivery' },
  'Delivered':    { color: 'bg-green-400',  text: 'text-green-700',  bg: 'bg-green-50  border-green-200',  icon: FiCheckCircle, label: 'Delivered'      },
  'Shipped':    { color: 'bg-green-400',  text: 'text-green-700',  bg: 'bg-green-50  border-green-200',  icon: FcShipped , label: 'Shipped'      },
}

function getStatus(status) {
  return statusConfig[status] || statusConfig['Order Place']
}

function OrderCard({ item, currency, onTrack }) {
  const s = getStatus(item.status)
  const StatusIcon = s.icon

  return (
    <div className="group bg-white/70 backdrop-blur-md border border-pink-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300">
      <div className="flex flex-col sm:flex-row gap-4 p-5">

        {/* Product image */}
        <div className="w-full sm:w-28 h-40 sm:h-28 flex-shrink-0 rounded-2xl overflow-hidden border border-pink-100 bg-pink-50">
          <img
            src={item.image1}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">

          {/* Name */}
          <h3
            className="text-gray-800 font-bold text-base sm:text-lg leading-snug"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {item.name}
          </h3>

          {/* Price · Qty · Size */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-black text-base text-pink-500"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currency} {item.price}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="text-gray-500 text-sm">Qty: <b className="text-gray-700">{item.quantity}</b></span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="bg-pink-50 border border-pink-200 text-pink-500 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Size: {item.size}
            </span>
          </div>

          {/* Date + Payment Method — BUG FIX: was passing paymentMethod to new Date() */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-gray-400 text-xs">
              📅 <span className="text-gray-600 font-medium">{new Date(item.date).toDateString()}</span>
            </span>
            <span className="text-gray-400 text-xs">
              💳 <span className="text-gray-600 font-medium capitalize">{item.paymentMethod}</span>
              {/* ↑ BUG FIX: was new Date(item.paymentMethod).toDateString() → "Invalid Date" */}
            </span>
          </div>

          {/* Payment badge */}
          <div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border
              ${item.payment ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${item.payment ? 'bg-green-400' : 'bg-gray-400'}`} />
              {item.payment ? 'Payment Done' : 'Payment Pending'}
            </span>
          </div>
        </div>

        {/* Right: Status + Track */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 flex-shrink-0">
          {/* Status pill */}
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${s.bg} ${s.text}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.color}`} />
            {s.label}
          </div>

          {/* Track Order button */}
          <button
            onClick={onTrack}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl shadow-md shadow-pink-200 hover:scale-105 active:scale-100 transition-all duration-200 whitespace-nowrap"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <FiTruck size={13} />
            Track Order
          </button>
        </div>
      </div>
    </div>
  )
}

function Order() {
  const [orderData, setOrderData] = useState([])
  const [loading, setLoading]     = useState(true)
  const { currency }  = useContext(ShopDataContext)
  const { serverUrl } = useContext(AuthDataContext)
  const navigate      = useNavigate()

  const loadOrderData = async () => {
    setLoading(true)
    try {
      const result = await axios.post(
        serverUrl + '/api/order/userorder',
        {},
        { withCredentials: true }
      )
      if (result.data) {
        const allItems = []
        result.data.forEach(order => {
          order.items.forEach(item => {
            allItems.push({
              ...item,
              status:        order.status,
              payment:       order.payment,
              paymentMethod: order.paymentMethod,
              date:          order.date,
            })
          })
        })
        setOrderData(allItems.reverse())
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrderData() }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen w-full bg-[#fde8f0] relative">

        {/* Ambient blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-300/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-10 w-64 h-64 bg-rose-200/15 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-fuchsia-100/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 pt-24 pb-24 flex flex-col gap-8">

          {/* ── Header ── */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-pink-400">
                  Your Orders
                </span>
              </div>
              <h1
                className="text-4xl sm:text-5xl font-black text-gray-800"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                My{' '}
                <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                  Orders
                </span>
              </h1>
              {!loading && (
                <p className="text-gray-400 text-sm">
                  {orderData.length} {orderData.length === 1 ? 'item' : 'items'} ordered
                </p>
              )}
            </div>

            {/* Refresh button */}
            <button
              onClick={loadOrderData}
              className="flex items-center gap-2 bg-white/70 border border-pink-100 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm hover:border-pink-300 hover:text-pink-500 transition-all duration-200"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <FiRefreshCw size={14} className={loading ? 'animate-spin text-pink-400' : ''} />
              Refresh
            </button>
          </div>

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/60 rounded-3xl p-5 flex gap-4 animate-pulse">
                  <div className="w-28 h-28 bg-pink-100 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-3 pt-1">
                    <div className="h-4 bg-pink-100 rounded-full w-2/3" />
                    <div className="h-3 bg-pink-100 rounded-full w-1/2" />
                    <div className="h-3 bg-pink-100 rounded-full w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && orderData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200 flex items-center justify-center shadow-lg">
                <FiPackage size={34} className="text-pink-300" />
              </div>
              <div>
                <h3
                  className="text-xl font-black text-gray-700"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  No orders yet
                </h3>
                <p className="text-gray-400 text-sm mt-1 max-w-xs">
                  Looks like you haven't placed any orders. Start shopping to see your orders here.
                </p>
              </div>
              <button
                onClick={() => navigate('/collections')}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-7 py-3.5 rounded-full text-sm shadow-lg shadow-pink-200 hover:scale-105 transition-all duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Shop Now <FiChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Order cards ── */}
          {!loading && orderData.length > 0 && (
            <div className="flex flex-col gap-4">
              {orderData.map((item, index) => (
                <OrderCard
                  key={index}
                  item={item}
                  currency={currency}
                  onTrack={loadOrderData}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Order