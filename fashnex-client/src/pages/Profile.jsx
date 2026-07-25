/**
 * fashnex-client/src/pages/Profile.jsx
 * =======================================
 * Route: /profile — protected by <ProtectedRoute> in App.jsx.
 *
 * Layout: sticky sidebar (desktop) / stacked (mobile), content area swaps
 * by `activeTab` — a single route, no sub-routing, so it stays simple and
 * matches how the rest of the site is protected.
 */
import React, { useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

import { AuthDataContext } from '../context/authContext'
import { UserDataContext } from '../context/UserContext'
import { ShopDataContext }  from '../context/ShopContext'
import { WardrobeContext }  from '../context/WardrobeContext'
import { useWishlist }      from '../context/WishlistContext'
import { getUsageCount }    from '../../utils/usageTracker.js'

import ProfileSidebar       from '../component/ProfileSidebar'
import ProfileOverview      from '../component/ProfileOverview'
import PersonalInfo         from '../component/PersonalInfo'
import OrderHistory         from '../component/OrderHistory'
import AddressBook          from '../component/AddressBook'
import NotificationSettings from '../component/NotificationSettings'
import SecuritySettings     from '../component/SecuritySettings'
import LogoutModal          from '../component/LogoutModal'

import { FiHeart, FiBookOpen, FiBookmark, FiCreditCard, FiChevronRight } from 'react-icons/fi'

const PERSONAL_FIELDS_FOR_COMPLETION = ['name', 'phone', 'gender', 'dob', 'city', 'state', 'country', 'pincode']

function Profile() {
  const navigate = useNavigate()
  const { serverUrl }      = useContext(AuthDataContext)
  const { userData, getCurrentUser, setUserData } = useContext(UserDataContext)
  const { currency }        = useContext(ShopDataContext)
  const { wardrobe, outfits, fetchWardrobe } = useContext(WardrobeContext)
  const { wishlistCount, fetchWishlistProducts } = useWishlist()

  const [activeTab, setActiveTab] = useState('overview')
  const [orders, setOrders]       = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [wishlistItems, setWishlistItems] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(true)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const result = await axios.post(serverUrl + '/api/order/userorder', {}, { withCredentials: true })
      const flat = []
      ;(result.data || []).forEach(order => {
        order.items.forEach(item => {
          flat.push({ ...item, status: order.status, date: order.date })
        })
      })
      setOrders(flat.reverse())
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [serverUrl])

  const loadWishlist = useCallback(async () => {
    setWishlistLoading(true)
    const products = await fetchWishlistProducts()
    setWishlistItems(products || [])
    setWishlistLoading(false)
  }, [fetchWishlistProducts])

  useEffect(() => { loadOrders() }, [loadOrders])
  useEffect(() => { fetchWardrobe() }, [])
  useEffect(() => { loadWishlist() }, [loadWishlist])

  const completion = Math.round(
    (PERSONAL_FIELDS_FOR_COMPLETION.filter(f => userData?.[f]).length / PERSONAL_FIELDS_FOR_COMPLETION.length) * 100
  )

  const stats = {
    wishlist:     wishlistCount || 0,
    wardrobe:     wardrobe?.length || 0,
    orders:       orders.length,
    savedOutfits: outfits?.length || 0,
    tryOnUses:    getUsageCount('tryOn'),
    weatherUses:  getUsageCount('weatherRec'),
  }

  const handleAvatarUpload = async (file) => {
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('profileImage', file)
      await axios.patch(serverUrl + '/api/user/update', fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await getCurrentUser()
      toast.success('Profile photo updated')
    } catch {
      toast.error('Could not upload photo — add multipart handling to /api/user/update')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await axios.get(serverUrl + '/api/auth/logout', { withCredentials: true })
      await getCurrentUser()
      navigate('/')
    } catch {
      toast.error('Logout failed, please try again')
    } finally {
      setLoggingOut(false)
      setShowLogout(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="w-full min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-0 w-72 h-72 bg-rose-200/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 pt-24 pb-24">

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-2">
              <span className="w-4 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-pink-400">My Account</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your{' '}
              <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                Profile
              </span>
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-[320px] flex-shrink-0 lg:sticky lg:top-24">
              <ProfileSidebar
                userData={userData}
                stats={stats}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogoutClick={() => setShowLogout(true)}
                onAvatarUpload={handleAvatarUpload}
                avatarUploading={avatarUploading}
              />
            </div>

            <div className="flex-1 w-full min-w-0">
              {activeTab === 'overview' && (
                <ProfileOverview
                  userData={userData}
                  wardrobe={wardrobe}
                  outfits={outfits}
                  orders={orders}
                  wishlistCount={stats.wishlist}
                  completion={completion}
                  stats={stats}
                  navigate={navigate}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'personal' && <PersonalInfo userData={userData} />}

              {activeTab === 'orders' && (
                <OrderHistory orders={orders} loading={ordersLoading} currency={currency} onRefresh={loadOrders} />
              )}

              {activeTab === 'wishlist' && (
                <QuickListPanel
                  icon={FiHeart}
                  title="Wishlist"
                  count={stats.wishlist}
                  loading={wishlistLoading}
                  items={wishlistItems}
                  emptyText="Nothing saved yet — tap the heart on any product."
                  ctaLabel="View Full Wishlist"
                  onCta={() => navigate('/wishlist')}
                  renderItem={(p) => (
                    <div key={p._id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-pink-50/60 transition-all">
                      <img src={p.image1} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-pink-100" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-pink-500 font-bold">{currency} {p.price}</p>
                      </div>
                    </div>
                  )}
                />
              )}

              {activeTab === 'wardrobe' && (
                <QuickListPanel
                  icon={FiBookOpen}
                  title="My Wardrobe"
                  count={stats.wardrobe}
                  loading={false}
                  items={wardrobe || []}
                  emptyText="Upload your first item to get outfit ideas."
                  ctaLabel="Go to Wardrobe"
                  onCta={() => navigate('/wardrobe')}
                  renderItem={(w) => (
                    <div key={w._id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-pink-50/60 transition-all">
                      <img src={w.imageUrl} alt={w.name} className="w-12 h-12 rounded-xl object-cover border border-pink-100" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate capitalize">{w.name || w.category}</p>
                        <p className="text-xs text-gray-400 capitalize">{w.color} · {w.season}</p>
                      </div>
                    </div>
                  )}
                />
              )}

              {activeTab === 'outfits' && (
                <QuickListPanel
                  icon={FiBookmark}
                  title="Saved Outfits"
                  count={outfits?.length || 0}
                  loading={false}
                  items={outfits || []}
                  emptyText="Generate outfit combos from your wardrobe to see them here."
                  ctaLabel="Generate Outfits"
                  onCta={() => navigate('/wardrobe')}
                  renderItem={(o, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-pink-50/60 transition-all">
                      <div className="flex -space-x-2">
                        {(o.items || []).slice(0, 3).map((it, j) => (
                          <img key={j} src={it.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover border-2 border-white" />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate capitalize">{o.type || o.label}</p>
                        <p className="text-xs text-amber-500 font-bold">★ {(o.score_1_5 || 0).toFixed(1)}/5</p>
                      </div>
                    </div>
                  )}
                />
              )}

              {activeTab === 'addresses' && <AddressBook userData={userData} />}

              {activeTab === 'payments' && (
                <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-8 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-200">
                    <FiCreditCard size={20} className="text-white" />
                  </div>
                  <h3 className="text-lg font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Payment Methods
                  </h3>
                  <p className="text-gray-400 text-sm max-w-sm">
                    You currently pay via Razorpay or Cash on Delivery at checkout. Saved cards, UPI, and wallet
                    support are coming soon — this space is ready for it.
                  </p>
                  <span className="text-xs font-bold text-pink-500 bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-full">
                    🚧 Coming soon
                  </span>
                </div>
              )}

              {activeTab === 'notifications' && <NotificationSettings userData={userData} />}
              {activeTab === 'security' && <SecuritySettings />}
            </div>
          </div>
        </div>
      </div>

      <LogoutModal open={showLogout} onCancel={() => setShowLogout(false)} onConfirm={handleLogout} loading={loggingOut} />
    </>
  )
}

// ── Reusable compact list panel for Wishlist / Wardrobe / Outfits tabs ──
function QuickListPanel({ icon: Icon, title, count, loading, items, emptyText, ctaLabel, onCta, renderItem }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-200">
            <Icon size={15} className="text-white" />
          </div>
          <div>
            <h3 className="font-black text-gray-800 text-base" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h3>
            <p className="text-gray-400 text-xs">{count} item{count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={onCta} className="flex items-center gap-1 text-xs font-bold text-pink-500 hover:text-rose-500">
          {ctaLabel} <FiChevronRight size={12} />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-pink-50/70 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-10">{emptyText}</p>
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col divide-y divide-pink-50">
          {items.slice(0, 6).map(renderItem)}
        </div>
      )}
    </div>
  )
}

export default Profile