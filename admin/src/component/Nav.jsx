import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from "../assets/logo1.png"
import axios from 'axios'
import { authDataContext } from '../context/AuthContext'
import { adminDataContext } from '../context/AdminContext'
import { FiLogOut } from 'react-icons/fi'

function Nav() {
  const navigate      = useNavigate()
  const { serverUrl } = useContext(authDataContext)
  const { getAdmin }  = useContext(adminDataContext)

  const logOut = async () => {
    try {
      await axios.get(serverUrl + '/api/auth/logout', { withCredentials: true })
      getAdmin()
      navigate('/login')
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      <nav className="fixed top-0 left-0 w-full h-16 z-50 bg-[#1a0a10]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 shadow-lg shadow-black/20">

        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-900/40 overflow-hidden">
            <img src={Logo} alt="FashNex" className="w-6 h-6 object-contain" />
          </div>
          <span className="text-lg font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Fash<span className="text-pink-400">Nex</span>
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-pink-400/70 align-middle">Admin</span>
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
            A
          </div>
          <button
            onClick={logOut}
            className="flex items-center gap-2 bg-white/10 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <FiLogOut size={14} />
            Logout
          </button>
        </div>
      </nav>
    </>
  )
}

export default Nav