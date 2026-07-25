/**
 * fashnex-client/src/component/SecuritySettings.jsx
 * =====================================================
 * Three actions:
 *  - Change password  → POST /api/auth/change-password  (new endpoint)
 *  - Logout everywhere → POST /api/auth/logout-all       (new endpoint)
 *  - Delete account     → DELETE /api/user/delete          (new endpoint)
 * All three are new — see backend notes. UI is fully wired and will
 * work as soon as the routes exist.
 */
import React, { useState, useContext } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AuthDataContext } from '../context/authContext'
import { UserDataContext } from '../context/UserContext'
import { FiLock, FiMonitor, FiTrash2, FiAlertTriangle } from 'react-icons/fi'

function SecuritySettings() {
  const { serverUrl } = useContext(AuthDataContext)
  const { setUserData } = useContext(UserDataContext)
  const navigate = useNavigate()

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwForm.next.length < 8) return toast.error('New password must be at least 8 characters')
    if (pwForm.next !== pwForm.confirm) return toast.error('Passwords do not match')
    setPwSaving(true)
    try {
      await axios.post(serverUrl + '/api/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      }, { withCredentials: true })
      toast.success('Password updated')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password')
    } finally {
      setPwSaving(false)
    }
  }

  const logoutAllDevices = async () => {
    setLoggingOutAll(true)
    try {
      await axios.post(serverUrl + '/api/auth/logout-all', {}, { withCredentials: true })
      toast.success('Logged out of all devices')
      setUserData(null)
      navigate('/')
    } catch {
      toast.error('Could not log out of all devices')
    } finally {
      setLoggingOutAll(false)
    }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await axios.delete(serverUrl + '/api/user/delete', { withCredentials: true })
      setUserData(null)
      toast.success('Account deleted')
      navigate('/')
    } catch {
      toast.error('Could not delete account')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const inputClass = "w-full h-12 px-4 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"

  return (
    <div className="flex flex-col gap-6">

      {/* ── Change password ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-200">
            <FiLock size={15} className="text-white" />
          </div>
          <h3 className="text-lg font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
            Change Password
          </h3>
        </div>
        <form onSubmit={changePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="password" placeholder="Current password" required className={`sm:col-span-2 ${inputClass}`}
            value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} />
          <input type="password" placeholder="New password (min. 8 chars)" required minLength={8} className={inputClass}
            value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} />
          <input type="password" placeholder="Confirm new password" required className={inputClass}
            value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={pwSaving}
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-500 text-white text-sm font-bold shadow-md shadow-pink-200 hover:scale-[1.02] transition-all disabled:opacity-60">
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Logout everywhere ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6 sm:p-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center">
            <FiMonitor size={15} className="text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Logout from All Devices</p>
            <p className="text-gray-400 text-xs mt-0.5">Ends every active session, including this one</p>
          </div>
        </div>
        <button onClick={logoutAllDevices} disabled={loggingOutAll}
          className="px-5 py-2.5 rounded-2xl border border-blue-200 text-blue-500 text-sm font-semibold hover:bg-blue-50 transition-all disabled:opacity-60">
          {loggingOutAll ? 'Logging out…' : 'Logout Everywhere'}
        </button>
      </div>

      {/* ── Delete account ── */}
      <div className="bg-rose-50/60 backdrop-blur-xl border border-rose-200 rounded-3xl shadow-md p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center">
            <FiAlertTriangle size={15} className="text-rose-500" />
          </div>
          <p className="font-bold text-rose-600 text-sm">Danger Zone</p>
        </div>
        <p className="text-rose-500/80 text-xs mb-4 max-w-md">
          Deleting your account permanently removes your wardrobe, wishlist, orders, and saved outfits. This can't be undone.
        </p>

        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-rose-300 text-rose-600 text-sm font-semibold hover:bg-rose-100 transition-all">
            <FiTrash2 size={13} /> Delete Account
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-rose-600 text-xs font-semibold">Are you sure? This is permanent.</span>
            <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded-xl border border-rose-200 text-xs font-semibold text-rose-500 hover:bg-white">
              Cancel
            </button>
            <button onClick={deleteAccount} disabled={deleting}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all disabled:opacity-60">
              {deleting ? 'Deleting…' : 'Yes, delete my account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SecuritySettings