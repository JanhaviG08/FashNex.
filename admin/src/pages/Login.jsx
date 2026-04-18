import React, { useState, useContext } from 'react'
import Logo from "../assets/logo1.png"
import { IoIosEye, IoIosEyeOff } from "react-icons/io"
import { FiMail, FiLock } from 'react-icons/fi'
import axios from "axios"
import { authDataContext } from '../context/AuthContext'
import { adminDataContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';

function Login() {
  const [show, setShow]         = useState(false)
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)

  const { serverUrl } = useContext(authDataContext)
  const { getAdmin }  = useContext(adminDataContext)
  const navigate      = useNavigate()

  const AdminLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await axios.post(
        serverUrl + "/api/auth/adminlogin",
        { email, password },
        { withCredentials: true }
      )
      console.log(result.data)
      toast.success("Admin Login Successfully")
      getAdmin()
      navigate("/")
    } catch (error) {
      console.log(error)
      toast.error("Admin Login Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen w-full bg-[#1a0a10] flex items-center justify-center px-4 relative overflow-hidden">

        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-900/10 rounded-full blur-3xl" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(#ff3f6c 1px, transparent 1px), linear-gradient(90deg, #ff3f6c 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="relative z-10 w-full max-w-md flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-xl shadow-pink-900/40 overflow-hidden">
              <img src={Logo} alt="FashNex" className="w-12 h-12 object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Fash<span className="text-pink-400">Nex</span>
              </h1>
              <p className="text-pink-400/70 text-xs font-bold uppercase tracking-widest mt-1"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>Admin Portal</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
            <div className="flex flex-col gap-2 mb-7">
              <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Welcome back
              </h2>
              <p className="text-gray-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Sign in to manage your FashNex store
              </p>
            </div>

            <form onSubmit={AdminLogin} className="flex flex-col gap-4">

              {/* Email */}
              <div className="relative">
                <FiMail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Admin email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <FiLock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={show ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-10 pr-12 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-400 transition-colors"
                >
                  {show ? <IoIosEyeOff size={18} /> : <IoIosEye size={18} />}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-2
                  ${loading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-900/40 hover:from-pink-400 hover:to-rose-400 hover:scale-[1.02] active:scale-100'
                  }`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> Signing in…</>
                ) : 'Sign In to Admin'}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-600 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            FashNex Admin Panel · Restricted Access
          </p>
        </div>
      </div>
    </>
  )
}

export default Login