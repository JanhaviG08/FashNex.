/**
 * fashnex-client/src/component/AvatarUploader.jsx
 * ==================================================
 * Shows the user's profile photo, or a gradient initials avatar if none
 * is set. Click the camera badge to pick a new photo — calls onUpload(file)
 * with the raw File so the parent can POST it (e.g. multipart/form-data
 * to /api/user/update) and update userData.profileImage on success.
 */
import React, { useRef, useState } from 'react'
import { FiCamera } from 'react-icons/fi'

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function AvatarUploader({ name, photoUrl, size = 96, onUpload, uploading = false }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const handlePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onUpload?.(file)
  }

  const src = preview || photoUrl

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-3xl overflow-hidden border-4 border-white shadow-xl shadow-pink-200/50 flex items-center justify-center bg-gradient-to-br from-pink-400 to-rose-500"
      >
        {src ? (
          <img src={src} alt={name || 'Profile'} className="w-full h-full object-cover" />
        ) : (
          <span
            className="text-white font-black"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: size * 0.34 }}
          >
            {getInitials(name)}
          </span>
        )}
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white border border-pink-100 shadow-md flex items-center justify-center text-pink-500 hover:bg-pink-50 transition-all"
        title="Change photo"
      >
        {uploading
          ? <div className="w-3.5 h-3.5 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
          : <FiCamera size={14} />}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handlePick}
        className="hidden"
      />
    </div>
  )
}

export default AvatarUploader