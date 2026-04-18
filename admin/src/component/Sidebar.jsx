import React from 'react'
import { IoIosAddCircleOutline } from 'react-icons/io'
import { FaRegListAlt } from 'react-icons/fa'
import { SiTicktick } from 'react-icons/si'
import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/add',    icon: IoIosAddCircleOutline, label: 'Add Product' },
  { path: '/lists',  icon: FaRegListAlt,          label: 'Product List' },
  { path: '/orders', icon: SiTicktick,            label: 'Orders'       },
]

function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 bg-[#1a0a10] border-r border-white/10 flex flex-col w-16 md:w-56 transition-all duration-300">

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-3 mt-4">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group
                ${active
                  ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/10 text-pink-400 border border-pink-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200
                ${active ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-md shadow-pink-900/40' : 'bg-white/5 group-hover:bg-white/10'}`}>
                <Icon size={15} className={active ? 'text-white' : ''} />
              </div>
              <span className="hidden md:block">{label}</span>
              {active && <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-pink-400" />}
            </button>
          )
        })}
      </nav>

      {/* Bottom decoration */}
      <div className="mt-auto p-4 hidden md:block">
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-2xl p-4">
          <p className="text-pink-400 text-xs font-bold uppercase tracking-wider mb-1"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>FashNex Admin</p>
          <p className="text-gray-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Manage your store
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar