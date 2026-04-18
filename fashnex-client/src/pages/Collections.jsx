import React, { useContext, useEffect, useState } from 'react'
import { ShopDataContext } from '../context/ShopContext'
import { useNavigate } from 'react-router-dom'
import { FiFilter, FiX, FiChevronDown, FiChevronUp, FiHeart } from 'react-icons/fi'
import { FaStar, FaStarHalfAlt } from 'react-icons/fa'

// ── Custom checkbox ──────────────────────────────────────────────────────────
function FilterCheckbox({ label, value, checked, onChange }) {
  return (
    <label
      onClick={() => onChange(value)}
      className="flex items-center gap-2.5 cursor-pointer group"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
        ${checked
          ? 'bg-gradient-to-br from-pink-400 to-rose-500 border-transparent'
          : 'border-pink-200 bg-white group-hover:border-pink-400'}`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-sm transition-colors ${checked ? 'text-pink-500 font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>
        {label}
      </span>
    </label>
  )
}

// ── Collapsible filter section ───────────────────────────────────────────────
function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col gap-3 border-b border-pink-100 pb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-700">{title}</span>
        {open ? <FiChevronUp size={14} className="text-pink-400" /> : <FiChevronDown size={14} className="text-pink-400" />}
      </button>
      {open && <div className="flex flex-col gap-2.5">{children}</div>}
    </div>
  )
}

// ── Product card ─────────────────────────────────────────────────────────────
function CollectionCard({ item, currency, navigate }) {
  const [wishlisted, setWishlisted] = useState(false)

  return (
    <div
      onClick={() => navigate(`/productdetail/${item._id}`)}
      className="group relative flex flex-col bg-white rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-pink-200/60 hover:-translate-y-2 transition-all duration-300 border border-pink-100"
    >
      <div className="relative overflow-hidden bg-pink-50" style={{ aspectRatio: '3/4' }}>
        <img
          src={item.image1}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />

        {/* Top-left: stacked — category, then bestseller below. No overlap. */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span
            className="bg-white/90 border border-pink-100 text-pink-500 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm w-fit"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {item.subCategory || item.category}
          </span>
          {item.bestseller && (
            <span
              className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm w-fit"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              ⭐ Best Seller
            </span>
          )}
        </div>

        {/* Top-right: ONLY wishlist heart — no star icon here */}
        <button
          onClick={e => { e.stopPropagation(); setWishlisted(!wishlisted) }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full border flex items-center justify-center shadow-md transition-all duration-200
            ${wishlisted ? 'bg-pink-500 border-pink-400 text-white' : 'bg-white border-pink-100 text-gray-400 hover:text-pink-400 hover:border-pink-300'}`}
        >
          <FiHeart size={13} className={wishlisted ? 'fill-white' : ''} />
        </button>

        {/* Quick view */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-pink-500 text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-md border border-pink-100"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Quick View →
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-gray-800 font-bold text-sm leading-snug line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {item.name}
        </h3>
        <div className="flex items-center gap-0.5">
          {[1,2,3,4].map(i => <FaStar key={i} className="text-amber-400 text-[10px]" />)}
          <FaStarHalfAlt className="text-amber-400 text-[10px]" />
          <span className="text-gray-400 text-[10px] ml-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>(4.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-base text-pink-500"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {currency} {item.price}
          </span>
          <span className="text-gray-400 line-through text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {currency} {Math.round(item.price * 1.2)}
          </span>
        </div>
      </div>

      <div className="h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  )
}

// ── Main Collections Page ─────────────────────────────────────────────────────
function Collections() {
  const { products, currency, search, showSearch } = useContext(ShopDataContext)
  const navigate = useNavigate()

  const [filterProduct, setFilterProduct] = useState([])
  const [gender,        setGender]        = useState([])
  const [category,      setCategory]      = useState([])
  const [subCategory,   setSubCategory]   = useState([])
  const [sortType,      setSortType]      = useState('relevant')
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [activeCount,   setActiveCount]   = useState(0)

  const toggle = (setter, value) =>
    setter(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value])

  const clearAll = () => { setGender([]); setCategory([]); setSubCategory([]) }

  const applyFilter = () => {
    let copy = products.slice()
    if (showSearch && search) copy = copy.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    if (gender.length > 0)      copy = copy.filter(i => gender.includes(i.gender))
    if (category.length > 0)    copy = copy.filter(i => category.includes(i.category))
    if (subCategory.length > 0) copy = copy.filter(i => subCategory.includes(i.subCategory))
    setFilterProduct(copy)
  }

  const sortProducts = () => {
    setFilterProduct(prev => {
      const copy = prev.slice()
      if (sortType === 'Low-High') return copy.sort((a, b) => a.price - b.price)
      if (sortType === 'High-Low') return copy.sort((a, b) => b.price - a.price)
      return copy
    })
  }

  useEffect(() => { setFilterProduct(products) }, [products])
  useEffect(() => { applyFilter() }, [category, subCategory, gender, showSearch, search, products])
  useEffect(() => { sortProducts() }, [sortType])
  useEffect(() => { setActiveCount(gender.length + category.length + subCategory.length) }, [gender, category, subCategory])

  const subCategoryMap = {
    Clothing:    ['TopWear', 'BottomWear', 'Dresses', 'WinterWear'],
    Footwear:    ['Shoes', 'Heels', 'Flats'],
    Accessories: ['Watches', 'Bags', 'Jewelry'],
  }
  const visibleSubCategories = category.length === 0
    ? Object.values(subCategoryMap).flat()
    : category.flatMap(c => subCategoryMap[c] || [])

  const FilterSidebar = () => (
    <div className="flex flex-col gap-6 h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiFilter size={15} className="text-pink-400" />
          <span className="font-black text-gray-800 text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
            Filters
          </span>
          {activeCount > 0 && (
            <span className="bg-gradient-to-r from-pink-400 to-rose-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-pink-400 font-semibold hover:text-rose-500 transition-colors">
            Clear All
          </button>
        )}
      </div>
      <FilterSection title="Gender">
        {['Men', 'Women', 'Kids'].map(g => (
          <FilterCheckbox key={g} label={g} value={g} checked={gender.includes(g)} onChange={() => toggle(setGender, g)} />
        ))}
      </FilterSection>
      <FilterSection title="Category">
        {['Clothing', 'Footwear', 'Accessories'].map(c => (
          <FilterCheckbox key={c} label={c} value={c} checked={category.includes(c)} onChange={() => toggle(setCategory, c)} />
        ))}
      </FilterSection>
      <FilterSection title="Sub-Category">
        {visibleSubCategories.map(sc => (
          <FilterCheckbox key={sc} label={sc} value={sc} checked={subCategory.includes(sc)} onChange={() => toggle(setSubCategory, sc)} />
        ))}
      </FilterSection>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Full-page warm pink background */}
      <div className="min-h-screen w-full bg-[#fde8f0] relative">

        {/* Soft blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-300/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-10 w-64 h-64 bg-rose-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-pink-200/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto flex pt-20">

          {/* ── DESKTOP SIDEBAR ── */}
          <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 sticky top-20 self-start h-[calc(100vh-80px)] overflow-y-auto">
            <div className="m-4 bg-white/80 border border-pink-100 rounded-3xl p-6 shadow-md flex flex-col gap-6">
              <FilterSidebar />
            </div>
          </aside>

          {/* ── MOBILE SIDEBAR OVERLAY ── */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-white shadow-2xl flex flex-col p-6 gap-6 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Filters
                  </span>
                  <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-pink-500">
                    <FiX size={20} />
                  </button>
                </div>
                <FilterSidebar />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-pink-200"
                >
                  Show {filterProduct.length} Results
                </button>
              </div>
            </div>
          )}

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

            {/* Top bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-pink-400">Browse</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-800"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  All{' '}
                  <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent italic">
                    Collections
                  </span>
                </h1>
                <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {filterProduct.length} products found
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 bg-white/80 border border-pink-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm hover:border-pink-400 transition-all"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <FiFilter size={14} className="text-pink-400" />
                  Filters
                  {activeCount > 0 && (
                    <span className="bg-pink-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortType}
                    onChange={e => setSortType(e.target.value)}
                    className="appearance-none bg-white/80 border border-pink-200 rounded-2xl px-4 py-2.5 pr-9 text-sm font-semibold text-gray-600 shadow-sm hover:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all cursor-pointer"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <option value="relevant">Sort: Relevant</option>
                    <option value="Low-High">Price: Low → High</option>
                    <option value="High-Low">Price: High → Low</option>
                  </select>
                  <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active filter pills */}
            {activeCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {[...gender, ...category, ...subCategory].map(f => (
                  <span key={f}
                    className="flex items-center gap-1.5 bg-white/80 border border-pink-200 text-pink-600 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {f}
                    <button onClick={() => {
                      setGender(p => p.filter(i => i !== f))
                      setCategory(p => p.filter(i => i !== f))
                      setSubCategory(p => p.filter(i => i !== f))
                    }}>
                      <FiX size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Grid or empty state */}
            {filterProduct.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                <span className="text-6xl">👗</span>
                <h3 className="text-xl font-black text-gray-600" style={{ fontFamily: "'Playfair Display', serif" }}>
                  No products found
                </h3>
                <p className="text-gray-400 text-sm max-w-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Try adjusting your filters or clearing them to see more results.
                </p>
                <button onClick={clearAll}
                  className="bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-6 py-3 rounded-full text-sm shadow-lg shadow-pink-200 hover:scale-105 transition-all duration-200"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filterProduct.map((item, index) => (
                  <CollectionCard key={index} item={item} currency={currency} navigate={navigate} />
                ))}
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  )
}

export default Collections