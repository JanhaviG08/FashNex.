/**
 * fashnex-client/src/component/NotificationSettings.jsx
 * ========================================================
 * PATCHes /api/user/notifications with the full preferences object.
 * New endpoint — see backend notes. Saves silently in the background
 * as each switch is toggled (debounced-ish via a single save call).
 */
import React, { useState, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AuthDataContext } from '../context/authContext'

const DEFAULT_PREFS = {
  emailNotifications: true,
  orderUpdates:        true,
  aiOutfitSuggestions: true,
  weatherAlerts:        false,
  wishlistPriceDrop:   true,
  newArrivals:          false,
}

const LABELS = {
  emailNotifications:  'Email Notifications',
  orderUpdates:         'Order Updates',
  aiOutfitSuggestions: 'AI Outfit Suggestions',
  weatherAlerts:        'Weather Alerts',
  wishlistPriceDrop:   'Wishlist Price Drop',
  newArrivals:          'New Arrivals',
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-gradient-to-r from-pink-400 to-rose-500' : 'bg-gray-200'}`}
    >
      <span className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function NotificationSettings({ userData }) {
  const { serverUrl } = useContext(AuthDataContext)
  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFS, ...(userData?.notificationPrefs || {}) })
  const [saving, setSaving] = useState(false)

  const toggle = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setSaving(true)
    try {
      await axios.patch(serverUrl + '/api/user/notifications', next, { withCredentials: true })
    } catch {
      toast.info('Saved locally — connect the notifications API to persist this')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
          Notifications
        </h3>
        {saving && <div className="w-3.5 h-3.5 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" />}
      </div>

      <div className="flex flex-col divide-y divide-pink-50">
        {Object.keys(DEFAULT_PREFS).map(key => (
          <div key={key} className="flex items-center justify-between py-4">
            <span className="text-gray-700 text-sm font-medium">{LABELS[key]}</span>
            <Toggle checked={prefs[key]} onChange={() => toggle(key)} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationSettings