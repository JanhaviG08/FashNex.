import React, { useState, useContext } from 'react'
import Logo from '../assets/logo1.png'
import Google from '../assets/google.png'
import { useNavigate } from 'react-router-dom'
import { IoIosEye, IoIosEyeOff } from 'react-icons/io'
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi'
import axios from 'axios'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../../utils/Firebase'
import { AuthDataContext } from '../context/authContext.jsx'
import { UserDataContext } from '../context/UserContext.jsx'
import { Sparkles } from 'lucide-react'

function Login() {
  const [show,     setShow]     = useState(false)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const { serverUrl }          = useContext(AuthDataContext)
  const { getCurrentUser }     = useContext(UserDataContext)
  const navigate               = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await axios.post(serverUrl + '/api/auth/login', { email, password }, { withCredentials: true })
      await getCurrentUser()
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async () => {
    setError('')
    try {
      const response = await signInWithPopup(auth, provider)
      const { displayName: name, email } = response.user
      await axios.post(serverUrl + '/api/auth/googlelogin', { name, email }, { withCredentials: true })
      await getCurrentUser()
      navigate('/')
    } catch (err) {
      setError('Google login failed. Please try again.')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; margin: 0; }
      `}</style>

      <div className="min-h-screen w-full bg-[#fde8f0] flex items-center justify-center relative overflow-hidden px-4">

        {/* Ambient blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-pink-300/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] bg-rose-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-fuchsia-200/10 rounded-full blur-3xl" />
        </div>

        {/* Card */}
        <div className="relative z-10 w-full max-w-md">

          {/* Logo */}
          <div
            className="flex items-center justify-center gap-3 mb-8 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden">
              <Sparkles size={18}  className="w-7 h-7 object-contain text-pink-500" />
            </div>
            <span
              className="text-3xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              FashNex
            </span>
          </div>

          {/* Glass card */}
          <div className="bg-white/70 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-2xl shadow-pink-200/30 p-8 flex flex-col gap-6">

            {/* Heading */}
            <div className="flex flex-col gap-1 text-center">
              <h1
                className="text-3xl font-black text-gray-800"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Welcome back
              </h1>
              <p className="text-gray-400 text-sm">Sign in to your FashNex account</p>
            </div>

            {/* Google button */}
            <button
              onClick={googleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-pink-100 rounded-2xl shadow-sm hover:shadow-md hover:border-pink-200 hover:-translate-y-0.5 transition-all duration-200 text-gray-600 font-semibold text-sm"
            >
              <img src={Google} alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-pink-100" />
              <span className="text-xs text-gray-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-pink-100" />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">

              {/* Email */}
              <div className="relative">
                <FiMail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <FiLock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none"
                />
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-pink-50/60 border border-pink-100 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-400 transition-colors"
                >
                  {show ? <IoIosEyeOff size={18} /> : <IoIosEye size={18} />}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-500 text-xs font-medium px-4 py-3 rounded-2xl">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 mt-1
                  ${loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200 hover:scale-[1.02] hover:shadow-xl'
                  }`}
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />Signing in…</>
                  : <> Login <FiArrowRight size={16} /></>
                }
              </button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-pink-500 font-bold hover:text-rose-500 cursor-pointer transition-colors"
              >
                Create one free
              </button>
            </p>
          </div>

          {/* Trust line */}
          <p className="text-center text-xs text-gray-400 mt-6">
            🔒 Secure login · Your data is protected
          </p>
        </div>
      </div>
    </>
  )
}

export default Login