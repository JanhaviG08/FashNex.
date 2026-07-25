/**
 * fashnex-client/src/component/AddressBook.jsx
 * ================================================
 * Expects userData.addresses (array) to exist on the user document.
 * Calls /api/user/address[...] — new endpoints, see backend notes.
 * Falls back to local state if the API isn't there yet, so the UI is
 * usable immediately while the backend catches up.
 */
import React, { useState, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AuthDataContext } from '../context/authContext'
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiCheck } from 'react-icons/fi'

const emptyAddress = { label: 'Home', line1: '', city: '', state: '', pincode: '', phone: '' }

function AddressBook({ userData }) {
  const { serverUrl } = useContext(AuthDataContext)
  const [addresses, setAddresses] = useState(userData?.addresses || [])
  const [editing, setEditing]     = useState(null) // address object or 'new'
  const [form, setForm]           = useState(emptyAddress)
  const [saving, setSaving]       = useState(false)

  const openNew = () => { setForm(emptyAddress); setEditing('new') }
  const openEdit = (addr) => { setForm(addr); setEditing(addr._id || addr) }

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const save = async () => {
    if (!form.line1 || !form.city || !form.pincode) {
      toast.error('Address line, city, and pincode are required')
      return
    }
    setSaving(true)
    const isNew = editing === 'new'
    try {
      if (isNew) {
        const { data } = await axios.post(serverUrl + '/api/user/address', form, { withCredentials: true })
        setAddresses(prev => [...prev, data?.address || { ...form, _id: Date.now().toString() }])
      } else {
        await axios.put(serverUrl + `/api/user/address/${form._id}`, form, { withCredentials: true })
        setAddresses(prev => prev.map(a => (a._id === form._id ? form : a)))
      }
      toast.success('Address saved')
    } catch {
      // Backend endpoint may not exist yet — keep the UI usable locally.
      setAddresses(prev =>
        isNew ? [...prev, { ...form, _id: Date.now().toString() }] : prev.map(a => (a._id === form._id ? form : a))
      )
      toast.info('Saved locally — connect the address API to persist this')
    } finally {
      setSaving(false)
      setEditing(null)
    }
  }

  const remove = async (id) => {
    try {
      await axios.delete(serverUrl + `/api/user/address/${id}`, { withCredentials: true })
    } catch {
      /* backend not wired yet — still remove locally */
    }
    setAddresses(prev => prev.filter(a => a._id !== id))
  }

  const setDefault = async (id) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })))
    try {
      await axios.patch(serverUrl + `/api/user/address/${id}/default`, {}, { withCredentials: true })
    } catch {
      /* backend not wired yet */
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
          Address Book
        </h3>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-gradient-to-r from-pink-400 to-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-pink-200 hover:scale-105 transition-all"
        >
          <FiPlus size={13} /> Add Address
        </button>
      </div>

      {addresses.length === 0 && !editing && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <FiMapPin size={26} className="text-pink-300" />
          <p className="text-gray-500 text-sm">No saved addresses yet</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map(addr => (
          <div key={addr._id} className="relative border border-pink-100 rounded-2xl p-4 hover:border-pink-300 transition-all">
            {addr.isDefault && (
              <span className="absolute top-3 right-3 text-[10px] font-bold text-pink-500 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
            <p className="text-xs font-bold text-pink-500 uppercase tracking-wide mb-1">{addr.label}</p>
            <p className="text-gray-700 text-sm">{addr.line1}</p>
            <p className="text-gray-400 text-xs mt-0.5">{addr.city}, {addr.state} — {addr.pincode}</p>
            {addr.phone && <p className="text-gray-400 text-xs mt-0.5">📞 {addr.phone}</p>}

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-pink-50">
              <button onClick={() => openEdit(addr)} className="text-xs font-semibold text-gray-500 hover:text-pink-500 flex items-center gap-1">
                <FiEdit2 size={11} /> Edit
              </button>
              <button onClick={() => remove(addr._id)} className="text-xs font-semibold text-gray-500 hover:text-rose-500 flex items-center gap-1">
                <FiTrash2 size={11} /> Delete
              </button>
              {!addr.isDefault && (
                <button onClick={() => setDefault(addr._id)} className="text-xs font-semibold text-gray-500 hover:text-pink-500 flex items-center gap-1 ml-auto">
                  <FiCheck size={11} /> Set default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Inline add/edit form */}
      {editing && (
        <div className="mt-6 border-t border-pink-50 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input name="label" value={form.label} onChange={onChange} placeholder="Label (Home, Work…)"
            className="h-11 px-4 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone"
            className="h-11 px-4 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          <input name="line1" value={form.line1} onChange={onChange} placeholder="Address line" required
            className="h-11 px-4 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
          <input name="city" value={form.city} onChange={onChange} placeholder="City" required
            className="h-11 px-4 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          <input name="state" value={form.state} onChange={onChange} placeholder="State"
            className="h-11 px-4 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          <input name="pincode" value={form.pincode} onChange={onChange} placeholder="Pincode" required
            className="h-11 px-4 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />

          <div className="sm:col-span-2 flex gap-3 justify-end">
            <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-2xl border border-pink-100 text-gray-600 text-sm font-semibold hover:bg-pink-50">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-500 text-white text-sm font-bold shadow-md shadow-pink-200 hover:scale-[1.02] transition-all"
            >
              {saving ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddressBook