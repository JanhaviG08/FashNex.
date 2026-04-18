import React, { useContext, useEffect, useState } from 'react'
import Nav from '../component/Nav'
import Sidebar from '../component/Sidebar'
import { authDataContext } from '../context/AuthContext'
import axios from 'axios'
import { FiPackage, FiRefreshCw, FiChevronDown } from 'react-icons/fi'
import { SiEbox } from 'react-icons/si'

const statusOptions = ['Order Placed', 'Packing', 'Shipped', 'Out For Delivery', 'Delivered']

const statusStyle = {
  'Order Placed':     'bg-amber-500/10  border-amber-500/30  text-amber-400',
  'Packing':          'bg-blue-500/10   border-blue-500/30   text-blue-400',
  'Shipped':          'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  'Out For Delivery': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  'Delivered':        'bg-green-500/10  border-green-500/30  text-green-400',
}

function Orders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const { serverUrl }         = useContext(authDataContext)

  const fetchAllOrders = async () => {
    setLoading(true)
    try {
      const result = await axios.post(serverUrl + '/api/order/list', {}, { withCredentials: true })
      setOrders(result.data.reverse())
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const statusHandler = async (e, orderId) => {
    try {
      const result = await axios.post(
        serverUrl + '/api/order/status',
        { orderId, status: e.target.value },
        { withCredentials: true }
      )
      if (result.data) await fetchAllOrders()
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => { fetchAllOrders() }, [])

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap'); body{font-family:'DM Sans',sans-serif;}`}</style>

      <div className="min-h-screen bg-[#120608] text-white">
        <Nav />
        <Sidebar />

        <main className="ml-16 md:ml-56 pt-16 min-h-screen">
          <div className="max-w-5xl mx-auto px-6 py-10">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">Management</span>
                <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  All <span className="text-pink-400 italic">Orders</span>
                </h1>
                {!loading && (
                  <p className="text-gray-500 text-sm">{orders.length} orders found</p>
                )}
              </div>
              <button
                onClick={fetchAllOrders}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                <FiRefreshCw size={13} className={loading ? 'animate-spin text-pink-400' : ''} />
                Refresh
              </button>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-36 bg-white/5 rounded-3xl animate-pulse" />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <FiPackage size={28} className="text-gray-600" />
                </div>
                <p className="text-gray-400 font-semibold">No orders yet.</p>
              </div>
            )}

            {/* Order cards */}
            {!loading && orders.length > 0 && (
              <div className="flex flex-col gap-4">
                {orders.map((order, index) => (
                  <div
                    key={index}
                    className="bg-white/5 border border-white/10 hover:border-pink-500/20 rounded-3xl p-5 flex flex-col lg:flex-row gap-5 transition-all duration-200"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                        <SiEbox size={20} className="text-pink-400" />
                      </div>
                    </div>

                    {/* Items + Address */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Order items */}
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Items</p>
                        {order.items.map((item, i) => (
                          <p key={i} className="text-sm text-white/80 leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            <span className="font-semibold text-white">{item.name}</span>
                            <span className="text-gray-500"> × {item.quantity}</span>
                            <span className="ml-2 bg-white/5 border border-white/10 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
                              {item.size}
                            </span>
                            {i < order.items.length - 1 && <span className="text-gray-600">,</span>}
                          </p>
                        ))}
                      </div>

                      {/* Address */}
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Delivery Address</p>
                        <p className="text-sm font-semibold text-white">
                          {order.address.firstName} {order.address.lastName}
                        </p>
                        <p className="text-gray-400 text-xs">{order.address.street}</p>
                        <p className="text-gray-400 text-xs">
                          {order.address.city}, {order.address.state}, {order.address.country} — {order.address.pincode || order.address.pinCode}
                        </p>
                        <p className="text-gray-400 text-xs">{order.address.phone}</p>
                      </div>
                    </div>

                    {/* Meta + Status */}
                    <div className="flex flex-col gap-3 flex-shrink-0 min-w-[180px]">
                      {/* Meta */}
                      <div className="flex flex-col gap-1 bg-white/5 rounded-2xl px-4 py-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Items</span>
                          <span className="text-white font-semibold">{order.items.length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Method</span>
                          <span className="text-white font-semibold capitalize">{order.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Payment</span>
                          <span className={`font-semibold ${order.payment ? 'text-green-400' : 'text-amber-400'}`}>
                            {order.payment ? 'Done' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Date</span>
                          <span className="text-white font-semibold">{new Date(order.date).toLocaleDateString()}</span>
                        </div>
                        <div className="border-t border-white/10 mt-1 pt-1 flex justify-between">
                          <span className="text-gray-400 text-xs font-semibold">Total</span>
                          <span className="text-pink-400 font-black text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                            ₹ {order.amount}
                          </span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className={`text-xs font-bold px-3 py-1.5 rounded-full border text-center ${statusStyle[order.status] || statusStyle['Order Placed']}`}>
                        {order.status}
                      </div>

                      {/* Status dropdown */}
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={e => statusHandler(e, order._id)}
                          className="w-full appearance-none bg-white/5 border border-white/10 hover:border-pink-500/40 rounded-2xl px-4 py-2.5 pr-8 text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all cursor-pointer"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {statusOptions.map(s => (
                            <option key={s} value={s} className="bg-[#1a0a10] text-white">{s}</option>
                          ))}
                        </select>
                        <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  )
}

export default Orders