import React, { useState, useContext, useEffect } from 'react'
import Nav     from '../component/Nav'
import Sidebar from '../component/Sidebar'
import { authDataContext } from '../context/AuthContext'
import axios from 'axios'
import { FiPackage, FiShoppingBag, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { Sparkles } from 'lucide-react';

function Home() {
  const [totalProducts, setTotalProducts] = useState(null)
  const [totalOrders,   setTotalOrders]   = useState(null)
  const [loading,       setLoading]       = useState(true)

  const { serverUrl } = useContext(authDataContext)

  const fetchCount = async () => {
    setLoading(true)
    try {
      const [productsRes, ordersRes] = await Promise.all([
        axios.get(`${serverUrl}/api/product/list`, { withCredentials: true }),
        axios.post(`${serverUrl}/api/order/list`, {}, { withCredentials: true }),
      ])
      setTotalProducts(productsRes.data.length ?? 0)
      setTotalOrders(ordersRes.data.length ?? 0)
    } catch (error) {
      console.error('Failed to fetch counts:', error)
      setTotalProducts(0)
      setTotalOrders(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCount() }, [])

  const stats = [
    {
      label:   'Total Products',
      value:   totalProducts,
      icon:    <FiPackage size={24} />,
      gradient:'from-pink-400 to-rose-500',
      bg:      'bg-pink-50',
      text:    'text-pink-500',
      border:  'border-pink-100',
      shadow:  'shadow-pink-100/60',
      desc:    'Items in your catalogue',
    },
    {
      label:   'Total Orders',
      value:   totalOrders,
      icon:    <FiShoppingBag size={24} />,
      gradient:'from-violet-400 to-purple-500',
      bg:      'bg-violet-50',
      text:    'text-violet-500',
      border:  'border-violet-100',
      shadow:  'shadow-violet-100/60',
      desc:    'Customer orders placed',
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="w-screen min-h-screen bg-[#f8f4f6] relative">
        <Nav />
        <Sidebar />

        {/* Main content — offset for sidebar */}
        <div className="absolute left-[210px] right-0 top-0 min-h-screen pt-20 px-8 pb-12">

          {/* Ambient blob */}
          <div className="pointer-events-none fixed top-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl z-0" />
          <div className="pointer-events-none fixed bottom-0 left-[210px] w-72 h-72 bg-rose-200/15 rounded-full blur-3xl z-0" />

          <div className="relative z-10 flex flex-col gap-8 max-w-5xl">

            {/* Page header */}
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-pink-400">Dashboard</span>
              </div>
              <h1
                className="text-4xl font-black text-gray-800"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Admin{' '}
                <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                  Overview
                </span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Welcome back! Here's what's happening in your store today.
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-white border ${stat.border} rounded-3xl p-6 shadow-lg ${stat.shadow} flex flex-col gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
                >
                  {/* Icon + label row */}
                  <div className="flex items-center justify-between">
                    <div className={`${stat.bg} border ${stat.border} w-12 h-12 rounded-2xl flex items-center justify-center ${stat.text}`}>
                      {stat.icon}
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-wider ${stat.text} ${stat.bg} border ${stat.border} px-3 py-1.5 rounded-full`}>
                      Live
                    </div>
                  </div>

                  {/* Value */}
                  <div className="flex flex-col gap-0.5">
                    {loading ? (
                      <div className="w-20 h-10 bg-gray-100 rounded-2xl animate-pulse" />
                    ) : (
                      <span
                        className="text-5xl font-black text-gray-800 leading-none"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {stat.value ?? '—'}
                      </span>
                    )}
                    <p className="text-gray-800 font-bold text-base mt-2">{stat.label}</p>
                    <p className="text-gray-400 text-xs">{stat.desc}</p>
                  </div>

                  {/* Gradient bar */}
                  <div className={`h-1 w-full rounded-full bg-gradient-to-r ${stat.gradient} opacity-30`} />
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-4">
              <h2
                className="text-lg font-black text-gray-700"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Add New Product',  desc: 'Upload items to your store',    icon: '➕', href: '/add',   grad: 'from-pink-400 to-rose-500'    },
                  { label: 'View Product List', desc: 'Manage your catalogue',         icon: '📋', href: '/list',  grad: 'from-violet-400 to-purple-500' },
                  { label: 'Manage Orders',     desc: 'Process customer orders',       icon: '📦', href: '/orders',grad: 'from-amber-400 to-orange-500'  },
                ].map(action => (
                  <a
                    key={action.label}
                    href={action.href}
                    className="group bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer no-underline"
                  >
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${action.grad} flex items-center justify-center text-xl shadow-md flex-shrink-0`}>
                      {action.icon}
                    </div>
                    <div>
                      <p className="text-gray-800 font-bold text-sm">{action.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{action.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Store health strip */}
            <div className="bg-white border border-pink-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-gray-600 font-semibold text-sm">All systems operational</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400 text-xs">Store is live and accepting orders</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FiTrendingUp size={14} className="text-pink-400" />
                FashNex Admin Dashboard
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default Home