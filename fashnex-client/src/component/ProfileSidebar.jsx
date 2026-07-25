/**
 * fashnex-client/src/component/ProfileSidebar.jsx
 * ==================================================
 * Desktop: sticky left column.
 * Mobile: stacks above the content (Profile.jsx handles the layout switch).
 */
import React from 'react'
import AvatarUploader from './AvatarUploader'
import {
  FiGrid, FiUser, FiPackage, FiHeart, FiBookOpen, FiBookmark,
  FiMapPin, FiCreditCard, FiBell, FiShield, FiLogOut, FiChevronRight
} from 'react-icons/fi'

export const MENU_ITEMS = [
  { key: 'overview',      label: 'Profile Overview',     icon: FiGrid },
  { key: 'personal',      label: 'Personal Information',  icon: FiUser },
  { key: 'orders',        label: 'My Orders',             icon: FiPackage },
  { key: 'wishlist',      label: 'Wishlist',               icon: FiHeart },
  { key: 'wardrobe',      label: 'My Wardrobe',           icon: FiBookOpen },
  { key: 'outfits',       label: 'Saved Outfits',          icon: FiBookmark },
  { key: 'addresses',     label: 'Address Book',           icon: FiMapPin },
  { key: 'payments',      label: 'Payment Methods',        icon: FiCreditCard },
  { key: 'notifications', label: 'Notifications',          icon: FiBell },
  { key: 'security',      label: 'Security',               icon: FiShield },
]

function ProfileSidebar({ userData, stats, activeTab, setActiveTab, onLogoutClick, onAvatarUpload, avatarUploading }) {
  const memberSince = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—'

  const statList = [
    { label: 'Wishlist',   value: stats.wishlist },
    { label: 'Wardrobe',   value: stats.wardrobe },
    { label: 'Orders',     value: stats.orders },
    { label: 'Outfits',    value: stats.savedOutfits },
    { label: 'Try-On',     value: stats.tryOnUses },
    { label: 'Weather AI', value: stats.weatherUses },
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* ── Identity card ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6 flex flex-col items-center text-center gap-3">
        <AvatarUploader
          name={userData?.name}
          photoUrl={userData?.profileImage}
          onUpload={onAvatarUpload}
          uploading={avatarUploading}
        />

        <div>
          <h2 className="text-lg font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
            {userData?.name || 'FashNex Member'}
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">{userData?.email}</p>
        </div>

        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 text-pink-500 text-[11px] font-bold px-3 py-1.5 rounded-full">
          ✨ Style Enthusiast
        </span>

        <p className="text-gray-400 text-[11px]">Member since {memberSince}</p>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-y-3 gap-x-2 w-full mt-2 pt-4 border-t border-pink-50">
          {statList.map(s => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-gray-800 font-black text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                {s.value}
              </span>
              <span className="text-gray-400 text-[10px] mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Menu ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-2.5 flex flex-col gap-1">
        {MENU_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group
                ${active
                  ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md shadow-pink-200'
                  : 'text-gray-600 hover:bg-pink-50 hover:text-pink-500'}`}
            >
              <Icon size={16} className={active ? 'text-white' : 'text-pink-400 group-hover:text-pink-500'} />
              <span className="flex-1 text-left">{label}</span>
              {active && <FiChevronRight size={14} />}
            </button>
          )
        })}

        <div className="border-t border-pink-50 mt-1 pt-1">
          <button
            onClick={onLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all duration-200"
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileSidebar