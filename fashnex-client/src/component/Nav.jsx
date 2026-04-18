import React, { useContext, useState, useEffect, useRef } from 'react';
import Logo from "../assets/logo1.png";
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserDataContext } from '../context/UserContext';
import { AuthDataContext } from '../context/authContext';
import { ShopDataContext } from '../context/ShopContext';

// ── Icons (inline SVG to avoid react-icons bundle issues) ──
const SearchIcon   = ({ solid }) => solid
  ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M10 2a8 8 0 105.293 14.707l4 4a1 1 0 001.414-1.414l-4-4A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z"/></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;

const CartIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;

const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

const GridIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;

const ContactIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>;

const SparkleIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z"/></svg>;

const UserIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const CloseIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ── Nav links config ──
const navLinks = [
  { label: "Home",        path: "/",           icon: <HomeIcon /> },
  { label: "Collections", path: "/collection", icon: <GridIcon /> },
  { label: "About",       path: "/about",      icon: null },
  { label: "Contact",     path: "/contact",    icon: <ContactIcon /> },
  {label: "My Wardrobe", path: "wardrobe"},
];

function Nav() {
  const { getCurrentUser, userData } = useContext(UserDataContext);
  const { serverUrl } = useContext(AuthDataContext);
  const { showSearch, setShowSearch, search, setSearch, getCartCount } = useContext(ShopDataContext);

  const [showProfile, setShowProfile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Shrink navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get(serverUrl + "/api/auth/logout", { withCredentials: true });
      await getCurrentUser();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        .nav-link-underline::after {
          content: '';
          display: block;
          height: 2px;
          width: 0;
          background: linear-gradient(to right, #f472b6, #fb7185);
          border-radius: 9999px;
          transition: width 0.25s ease;
          margin-top: 2px;
        }
        .nav-link-underline:hover::after,
        .nav-link-active::after {
          width: 100%;
        }
        .nav-link-active::after {
          content: '';
          display: block;
          height: 2px;
          width: 100%;
          background: linear-gradient(to right, #f472b6, #fb7185);
          border-radius: 9999px;
          margin-top: 2px;
        }
        .search-slide {
          animation: slideDown 0.25s ease forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .profile-pop {
          animation: popIn 0.2s cubic-bezier(.34,1.56,.64,1) forwards;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      {/* ════════════════════════════════════════════
          MAIN NAVBAR
      ════════════════════════════════════════════ */}
      <nav className={`w-full fixed top-0 left-0 z-50 transition-all duration-300
        ${scrolled
          ? 'h-[60px] bg-white/80 backdrop-blur-xl shadow-lg shadow-pink-100/50 border-b border-pink-100/60'
          : 'h-[70px] bg-white/90 backdrop-blur-md shadow-sm shadow-pink-50/60 border-b border-pink-50'
        }`}
      >
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">

          {/* ── Brand ── */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => navigate("/")}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-pink-200 overflow-hidden">
              <img src={Logo} alt="FashNex" className="w-7 h-7 object-contain" />
            </div>
            <span
              className="text-[22px] font-black text-gray-800 leading-none hidden sm:block"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Fash<span className="text-pink-500">Nex</span>
            </span>
          </div>

          {/* ── Desktop Nav Links ── */}
          <ul className="hidden md:flex items-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {navLinks.map(({ label, path }) => (
              <li key={label}>
                <button
                  onClick={() => navigate(path)}
                  className={`nav-link-underline ${isActive(path) ? 'nav-link-active' : ''} px-4 py-2 text-[13px] font-semibold tracking-wide transition-colors duration-200
                    ${isActive(path) ? 'text-pink-500' : 'text-gray-600 hover:text-pink-500'}`}
                >
                  {label}
                </button>
              </li>
            ))}

            {/* ✨ Recommendation CTA pill */}
            <li className="ml-2">
              <button
                onClick={() => navigate("/recommend")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 border
                  ${isActive("/recommend")
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white border-transparent shadow-md shadow-pink-200'
                    : 'bg-pink-50 text-pink-500 border-pink-200 hover:bg-gradient-to-r hover:from-pink-400 hover:to-rose-400 hover:text-white hover:border-transparent hover:shadow-md hover:shadow-pink-200'
                  }`}
              >
                <SparkleIcon />
                Style AI
              </button>
            </li>
          </ul>

          {/* ── Right Icons ── */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Search toggle */}
            <button
              onClick={() => { setShowSearch(prev => !prev); if (!showSearch) navigate("/collection"); }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                ${showSearch
                  ? 'bg-pink-100 text-pink-500'
                  : 'text-gray-500 hover:bg-pink-50 hover:text-pink-500'}`}
            >
              <SearchIcon solid={showSearch} />
            </button>

            {/* Cart — desktop only */}
            <button
              onClick={() => navigate("/cart")}
              className="relative w-9 h-9 rounded-xl text-gray-500 hover:bg-pink-50 hover:text-pink-500 transition-all duration-200 items-center justify-center hidden md:flex"
            >
              <CartIcon />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-pink-400 to-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {getCartCount()}
              </span>
            </button>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(prev => !prev)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 font-bold text-sm
                  ${userData
                    ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-md shadow-pink-200'
                    : 'text-gray-500 hover:bg-pink-50 hover:text-pink-500'}`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {userData ? userData.name.slice(0, 1).toUpperCase() : <UserIcon />}
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <div
                  className="profile-pop absolute right-0 top-[calc(100%+10px)] w-52 bg-white/90 backdrop-blur-xl border border-pink-100 rounded-2xl shadow-xl shadow-pink-100/50 overflow-hidden z-50"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {/* User info header */}
                  {userData && (
                    <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white text-sm font-bold flex items-center justify-center">
                          {userData.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-800 font-semibold text-sm leading-none">{userData.name}</p>
                          <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[120px]">{userData.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <ul className="py-1.5">
                    {!userData && (
                      <li>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-500 transition-colors duration-150 font-medium"
                          onClick={() => { navigate("login"); setShowProfile(false); }}
                        >
                          🔑 Login
                        </button>
                      </li>
                    )}
                    {userData && (
                      <li>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-500 transition-colors duration-150 font-medium"
                          onClick={() => { handleLogout(); setShowProfile(false); }}
                        >
                          👋 Logout
                        </button>
                      </li>
                    )}
                    <li>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-500 transition-colors duration-150 font-medium" onClick={()=> navigate('/order')}>
                        📦 My Orders
                      </button>
                    </li>
                    <li>
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-500 transition-colors duration-150 font-medium"
                        onClick={() => { navigate("/about"); setShowProfile(false); }}
                      >
                        ℹ️ About
                      </button>
                    </li>
                    <li className="border-t border-pink-50 mt-1">
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-pink-500 hover:bg-pink-50 transition-colors duration-150 flex items-center gap-1.5"
                        onClick={() => { navigate("/recommend"); setShowProfile(false); }}
                      >
                        <SparkleIcon /> Style AI
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Search Bar Dropdown ── */}
        {showSearch && (
          <div className="search-slide absolute top-full left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-pink-100 shadow-lg shadow-pink-50 px-4 py-3 flex items-center gap-3">
            <div className="flex-1 max-w-2xl mx-auto relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400">
                <SearchIcon solid={false} />
              </div>
              <input
                type="text"
                autoFocus
                className="w-full h-11 bg-pink-50/80 border border-pink-100 rounded-2xl pl-11 pr-10 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition"
                placeholder="Search styles, outfits, brands…"
                onChange={(e) => setSearch(e.target.value)}
                value={search}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════
          MOBILE BOTTOM BAR
      ════════════════════════════════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-xl border-t border-pink-100 shadow-t shadow-pink-50"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex items-center justify-around px-2 py-2">

          {[
            { label: "Home",    path: "/",          icon: <HomeIcon /> },
            { label: "Shop",    path: "/collection", icon: <GridIcon /> },
            { label: "Contact", path: "/contact",   icon: <ContactIcon /> },
          ].map(({ label, path, icon }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 text-[10px] font-semibold
                ${isActive(path)
                  ? 'text-pink-500 bg-pink-50'
                  : 'text-gray-400 hover:text-pink-400'}`}
            >
              <span className={isActive(path) ? 'text-pink-500' : ''}>{icon}</span>
              {label}
            </button>
          ))}

          {/* Style AI — highlighted */}
          <button
            onClick={() => navigate("/recommend")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 text-[10px] font-bold
              ${isActive("/recommend")
                ? 'text-pink-500 bg-pink-50'
                : 'text-pink-400 hover:text-pink-500'}`}
          >
            <span className="text-pink-400"><SparkleIcon /></span>
            Style AI
          </button>

          {/* Cart with badge */}
          <button
            onClick={() => navigate("/cart")}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 text-[10px] font-semibold
              ${isActive("/cart")
                ? 'text-pink-500 bg-pink-50'
                : 'text-gray-400 hover:text-pink-400'}`}
          >
            <CartIcon />
            <span className="absolute -top-0 right-1.5 w-3.5 h-3.5 bg-gradient-to-br from-pink-400 to-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {getCartCount()}
            </span>
            Cart
          </button>
        </div>
      </div>
    </>
  );
}

export default Nav;