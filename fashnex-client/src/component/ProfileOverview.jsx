/**
 * fashnex-client/src/component/ProfileOverview.jsx
 * ===================================================
 * All numbers here are derived from real data already available in
 * context (wardrobe items, outfits, orders, wishlist) or from the
 * local usage tracker (Try-On / Weather AI counts) — nothing fabricated.
 */
import React from 'react'
import { FiPackage, FiHeart, FiBookOpen, FiChevronRight, FiZap, FiCloud, FiGrid, FiAward, FiLock } from 'react-icons/fi'
import { Sparkles } from 'lucide-react'

function mode(arr) {
  if (!arr || arr.length === 0) return '—'
  const counts = {}
  arr.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1 })
  const entries = Object.entries(counts)
  if (entries.length === 0) return '—'
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

function topN(arr, n) {
  const counts = {}
  arr.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([v]) => v)
}

const QUICK_ACTIONS = [
  { label: 'Explore Collections',  icon: FiGrid,    path: '/collection' },
  { label: 'Generate AI Outfit',    icon: Sparkles,  path: '/wardrobe' },
  { label: 'Weather Recommendation', icon: FiCloud, path: '/recommend' },
  { label: 'Open Wardrobe',          icon: FiBookOpen, path: '/wardrobe' },
]

function ProfileOverview({ userData, wardrobe = [], outfits = [], orders = [], wishlistCount = 0, completion, stats = {}, navigate, setActiveTab }) {
  const recentWardrobe = [...wardrobe]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4)

  const recentOrders = [...orders].slice(0, 3)

  // ── Activity timeline — merges real wardrobe uploads + orders ──
  const activity = [
    ...wardrobe.map(w => ({
      type: 'wardrobe',
      text: `Added ${w.name || w.category} to wardrobe`,
      date: w.createdAt,
    })),
    ...orders.map(o => ({
      type: 'order',
      text: `Placed an order · ${o.status || 'Processing'}`,
      date: o.date,
    })),
  ]
    .filter(a => a.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)

  const insights = [
    { label: 'Most Preferred Category', value: mode(wardrobe.map(w => w.category)) },
    { label: 'Most Preferred Color',    value: mode(wardrobe.map(w => w.color)) },
    { label: 'Favourite Season',        value: mode(wardrobe.map(w => w.season)) },
    { label: 'Outfits Generated',        value: outfits.length },
    { label: 'Weather AI Usage',        value: stats.weatherUses ?? 0 },
    { label: 'Virtual Try-On Usage',    value: stats.tryOnUses ?? 0 },
  ]

  // ── Style profile — top colors/categories from real wardrobe data ──
  const topColors     = topN(wardrobe.map(w => w.color), 3)
  const topCategories = topN(wardrobe.map(w => w.category), 3)
  const topOccasions   = topN(outfits.map(o => o.label), 3)

  // ── Fashion Score — transparent weighted formula from real signals ──
  const diversityScore    = Math.min(100, (new Set(wardrobe.map(w => w.category)).size / 7) * 100)
  const outfitScore        = Math.min(100, outfits.length * 10)
  const fashionScore = Math.round(diversityScore * 0.4 + outfitScore * 0.3 + completion * 0.3)

  // ── Achievements — unlock thresholds against real counts ──
  const achievements = [
    { label: 'Wardrobe Starter',   desc: 'Add your first item',        unlocked: wardrobe.length >= 1 },
    { label: 'Fashion Explorer',   desc: 'Save 5 wishlist items',       unlocked: wishlistCount >= 5 },
    { label: 'Style Expert',        desc: 'Generate 5 outfit combos',   unlocked: outfits.length >= 5 },
    { label: 'AI Stylist',          desc: 'Generate 10 outfit combos',  unlocked: outfits.length >= 10 },
    { label: 'Virtual Try-On Master', desc: 'Use Try-On 5 times',       unlocked: (stats.tryOnUses || 0) >= 5 },
    { label: 'Weather Ready',       desc: 'Use Weather AI 5 times',     unlocked: (stats.weatherUses || 0) >= 5 },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-400 to-rose-500 rounded-3xl p-7 shadow-lg shadow-pink-200/60 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 mb-1">Welcome back</p>
        <h2 className="text-2xl sm:text-3xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
          Hi {userData?.name?.split(' ')[0] || 'there'}, ready to style your day? ✨
        </h2>
        <p className="text-white/85 text-sm mt-2 max-w-lg">
          {wardrobe.length > 0
            ? `You've added ${wardrobe.length} pieces to your wardrobe and generated ${outfits.length} outfit combos so far.`
            : `Add a few pieces to your wardrobe and let our AI put together your first outfit.`}
        </p>
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {QUICK_ACTIONS.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate?.(path)}
            className="flex-shrink-0 flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-pink-100 rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 shadow-sm hover:shadow-md hover:border-pink-300 hover:text-pink-500 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Icon size={14} className="text-pink-400" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile completion ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Profile Completion</h3>
            <p className="text-gray-400 text-xs mt-0.5">A complete profile gets you better AI recommendations</p>
          </div>
          <span className="text-pink-500 font-black text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            {completion}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-pink-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <button
            onClick={() => setActiveTab('personal')}
            className="mt-3 text-xs font-bold text-pink-500 hover:text-rose-500 flex items-center gap-1"
          >
            Complete your profile <FiChevronRight size={12} />
          </button>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          icon={FiPackage}
          label="My Orders"
          value={orders.length}
          desc={recentOrders[0] ? `Last: ${recentOrders[0].status || 'Processing'}` : 'No orders yet'}
          onClick={() => setActiveTab('orders')}
        />
        <SummaryCard
          icon={FiHeart}
          label="Wishlist"
          value={wishlistCount}
          desc={wishlistCount > 0 ? 'Items you saved for later' : 'Nothing saved yet'}
          onClick={() => setActiveTab('wishlist')}
        />
        <SummaryCard
          icon={FiBookOpen}
          label="Wardrobe"
          value={wardrobe.length}
          desc={recentWardrobe[0] ? `Latest: ${recentWardrobe[0].name || recentWardrobe[0].category}` : 'Upload your first item'}
          onClick={() => setActiveTab('wardrobe')}
        />

        {/* Fashion Score */}
        <div className="text-left bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl shadow-md p-6 text-white flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <FiZap size={16} className="text-pink-300" />
            </div>
          </div>
          <p className="text-3xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
            {fashionScore}<span className="text-base text-white/50">/100</span>
          </p>
          <p className="text-white/70 text-sm font-semibold mt-1">Fashion Score</p>
          <p className="text-white/40 text-[11px] mt-1">Diversity · Outfits · Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Recent activity ── */}
        <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No activity yet — start by adding to your wardrobe.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-sm">{a.text}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{new Date(a.date).toDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── AI Insights ── */}
        <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} className="text-pink-500" />
            <h3 className="font-bold text-gray-800 text-sm">AI Style Insights</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {insights.map(i => (
              <div key={i.label} className="bg-pink-50/60 border border-pink-100 rounded-2xl p-3.5">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide mb-1">{i.label}</p>
                <p className="text-gray-800 font-bold text-sm capitalize truncate">{i.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Style Profile ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Your Style Profile</h3>
        {wardrobe.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Add wardrobe items to build your style profile.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StyleGroup title="Preferred Colors" items={topColors} />
            <StyleGroup title="Preferred Categories" items={topCategories} />
            <StyleGroup title="Preferred Vibes" items={topOccasions.length ? topOccasions : ['Not enough data yet']} />
          </div>
        )}
      </div>

      {/* ── Achievements ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiAward size={15} className="text-pink-500" />
          <h3 className="font-bold text-gray-800 text-sm">Achievements</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {achievements.map(a => (
            <div
              key={a.label}
              className={`rounded-2xl p-4 border flex flex-col items-center text-center gap-1.5
                ${a.unlocked ? 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.unlocked ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gray-200'}`}>
                {a.unlocked ? <FiAward size={15} className="text-white" /> : <FiLock size={13} className="text-gray-400" />}
              </div>
              <p className="text-gray-800 font-bold text-xs">{a.label}</p>
              <p className="text-gray-400 text-[10px]">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StyleGroup({ title, items }) {
  return (
    <div>
      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="bg-pink-50 border border-pink-100 text-pink-500 text-xs font-bold px-3 py-1.5 rounded-full capitalize">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/60 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-200">
          <Icon size={16} className="text-white" />
        </div>
        <FiChevronRight size={16} className="text-pink-300" />
      </div>
      <p className="text-3xl font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</p>
      <p className="text-gray-500 text-sm font-semibold mt-1">{label}</p>
      <p className="text-gray-400 text-xs mt-1 truncate">{desc}</p>
    </button>
  )
}

export default ProfileOverview