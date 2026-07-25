/**
 * fashnex-client/src/component/PersonalInfo.jsx
 * =================================================
 * PATCHes /api/user/update with the changed fields. That endpoint doesn't
 * exist yet in your backend — see the User schema/API notes I've included
 * alongside this file for what to add. Reuses your existing getCurrentUser()
 * to refresh context after a successful save.
 */
import React, { useState, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AuthDataContext } from '../context/authContext'
import { UserDataContext } from '../context/UserContext'
import { FiSave } from 'react-icons/fi'

const FIELDS = [
  { name: 'name',     label: 'Full name',   type: 'text',  required: true },
  { name: 'username', label: 'Username',    type: 'text',  required: false },
  { name: 'email',    label: 'Email',       type: 'email', required: true, disabled: true },
  { name: 'phone',    label: 'Phone',       type: 'tel',   required: false },
  { name: 'gender',   label: 'Gender',      type: 'select', options: ['', 'Female', 'Male', 'Other', 'Prefer not to say'] },
  { name: 'dob',       label: 'Date of birth', type: 'date', required: false },
  { name: 'city',      label: 'City',        type: 'text',  required: false },
  { name: 'state',     label: 'State',       type: 'text',  required: false },
  { name: 'country',   label: 'Country',     type: 'text',  required: false },
  { name: 'pincode',   label: 'Pincode',     type: 'text',  required: false },
]

function PersonalInfo({ userData }) {
  const { serverUrl } = useContext(AuthDataContext)
  const { getCurrentUser } = useContext(UserDataContext)

  const [form, setForm] = useState(() =>
    FIELDS.reduce((acc, f) => ({ ...acc, [f.name]: userData?.[f.name] || '' }), {})
  )
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const next = {}
    if (!form.name?.trim()) next.name = 'Full name is required'
    if (form.phone && !/^\+?[0-9]{7,15}$/.test(form.phone)) next.phone = 'Enter a valid phone number'
    if (form.pincode && !/^[0-9]{4,10}$/.test(form.pincode)) next.pincode = 'Enter a valid pincode'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await axios.patch(serverUrl + '/api/user/update', form, { withCredentials: true })
      await getCurrentUser()
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-md shadow-pink-100/40 p-6 sm:p-8">
      <h3 className="text-lg font-black text-gray-800 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        Personal Information
      </h3>
      <p className="text-gray-400 text-sm mb-6">Keep your details up to date for a better styling experience.</p>

      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {FIELDS.map(f => (
          <div key={f.name} className={f.name === 'name' || f.name === 'email' ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              {f.label}{f.required && <span className="text-pink-400"> *</span>}
            </label>

            {f.type === 'select' ? (
              <select
                name={f.name}
                value={form[f.name]}
                onChange={onChange}
                className="w-full h-12 px-4 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
              >
                {f.options.map(o => <option key={o} value={o}>{o || 'Select…'}</option>)}
              </select>
            ) : (
              <input
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={onChange}
                disabled={f.disabled}
                className={`w-full h-12 px-4 bg-pink-50/60 border rounded-2xl text-sm text-gray-700 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all
                  ${f.disabled ? 'opacity-60 cursor-not-allowed' : ''}
                  ${errors[f.name] ? 'border-rose-300' : 'border-pink-100'}`}
              />
            )}
            {errors[f.name] && <p className="text-rose-500 text-xs mt-1">{errors[f.name]}</p>}
          </div>
        ))}

        <div className="sm:col-span-2 flex justify-end mt-2">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200
              ${saving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200 hover:scale-[1.02]'}`}
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />Saving…</>
              : <><FiSave size={15} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PersonalInfo