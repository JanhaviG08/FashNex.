/**
 * fashnex-client/src/pages/Wardrobe.jsx  — UPDATED
 *
 * Changes vs original:
 *   1. OutfitComboCard now shows "Why this outfit?" inline expand AND
 *      a "👁 Preview Outfit" button that opens OutfitPreviewModal
 *   2. Modal state is managed here (selectedOutfit + selectedRank)
 *   3. WardrobeItemCard — unchanged from original
 *   4. All other logic (upload modal, tabs, controls) — unchanged
 */

import { useState, useContext, useEffect, useRef } from 'react'
import { WardrobeContext } from '../context/WardrobeContext'
import { useNavigate }     from 'react-router-dom'
import {
  FiUploadCloud, FiTrash2, FiRefreshCw, FiStar,
  FiChevronDown, FiEye, FiInfo, FiChevronUp
} from 'react-icons/fi'
import OutfitPreviewModal from '../component/OutfitPreviewModal'

const CATEGORIES = ['topwear','bottomwear','footwear','accessories','outerwear','dress','other']
const SEASONS    = ['all-season','summer','winter','rainy']
const OCCASIONS  = ['all','casual','formal','party','office']
const COLORS     = ['white','black','blue','navy','red','pink','green','yellow','beige','grey','brown','orange','purple','other']

const catColor = {
  topwear:     'bg-blue-50   text-blue-500   border-blue-200',
  bottomwear:  'bg-green-50  text-green-600  border-green-200',
  footwear:    'bg-amber-50  text-amber-600  border-amber-200',
  accessories: 'bg-purple-50 text-purple-500 border-purple-200',
  outerwear:   'bg-indigo-50 text-indigo-500 border-indigo-200',
  dress:       'bg-pink-50   text-pink-500   border-pink-200',
  other:       'bg-gray-50   text-gray-500   border-gray-200',
}

// ── WardrobeItemCard (unchanged) ──────────────────────────────────────────
function WardrobeItemCard({ item, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="group relative bg-white border border-pink-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-pink-100/50 hover:-translate-y-1.5 transition-all duration-300">
      <div className="relative h-48 overflow-hidden bg-pink-50">
        <img src={item.imageUrl} alt={item.name || item.category}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <button
          onClick={async () => { setDeleting(true); await onDelete(item._id); setDeleting(false) }}
          disabled={deleting}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 border border-rose-200 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          {deleting
            ? <div className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            : <FiTrash2 size={13} />
          }
        </button>
        <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${catColor[item.category] || catColor.other}`}>
          {item.category}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-gray-700 font-semibold text-sm truncate">{item.name || item.category}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-400 text-xs capitalize">{item.color}</span>
          <span className="w-1 h-1 rounded-full bg-gray-200" />
          <span className="text-gray-400 text-xs capitalize">{item.season}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {(item.tags || []).map(tag => (
            <span key={tag} className="bg-pink-50 border border-pink-100 text-pink-400 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── OutfitComboCard — UPDATED with explanation expand + preview button ────
function OutfitComboCard({ outfit, rank, onPreview }) {
  const [showWhy, setShowWhy] = useState(false)
  const medals  = ['🥇','🥈','🥉','4️⃣','5️⃣']
  const expData = outfit.explanation_data || {}
  const highlights = expData.highlights || []

  return (
    <div className="bg-white border border-pink-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:shadow-pink-100/60 hover:-translate-y-0.5 transition-all duration-300">
      {/* Main card body */}
      <div className="p-5 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{medals[rank] || '✨'}</span>
            <div>
              <p className="text-gray-800 font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                {outfit.type || outfit.label}
              </p>
              <p className="text-gray-400 text-xs mt-0.5 capitalize">{outfit.label}</p>
            </div>
          </div>
          {/* Score */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-1.5">
              <FiStar size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-amber-700 font-black text-sm">{(outfit.score_1_5 || 0).toFixed(1)}</span>
              <span className="text-amber-400 text-[10px]">/5</span>
            </div>
          </div>
        </div>

        {/* Highlight badges */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h, i) => (
              <span key={i} className="text-[10px] font-bold bg-pink-50 border border-pink-100 text-pink-500 px-2.5 py-1 rounded-full">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Item image strip */}
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {(outfit.items || []).map((item, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="w-[72px] h-[88px] rounded-2xl overflow-hidden border border-pink-100 bg-pink-50 shadow-sm">
                <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-gray-400 capitalize">{item.category}</span>
            </div>
          ))}
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2">
          {/* Preview button — opens modal */}
          <button
            onClick={() => onPreview(outfit, rank)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
          >
            <FiEye size={13} />
            Preview Outfit
          </button>

          {/* Why this outfit — inline expand */}
          <button
            onClick={() => setShowWhy(v => !v)}
            className="flex items-center gap-1.5 border border-pink-200 text-pink-500 font-semibold py-2.5 px-4 rounded-2xl text-xs hover:bg-pink-50 transition-colors"
          >
            <FiInfo size={12} />
            {showWhy ? 'Hide' : 'Why?'}
            {showWhy ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Inline explanation (collapsed by default) */}
      {showWhy && (
        <div className="border-t border-pink-50 px-5 pb-5 pt-4 bg-pink-50/40">
          <p className="text-gray-500 text-xs leading-relaxed mb-3">
            {expData.paragraph || outfit.explanation || 'This outfit scored well across all criteria.'}
          </p>
          {(expData.bullets || []).slice(0, 3).map((bullet, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-500 mb-1.5">
              <span className="text-pink-400 mt-0.5 flex-shrink-0">•</span>
              {bullet}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Upload Modal (unchanged from original) ────────────────────────────────
function UploadModal({ onClose, onUpload, loading }) {
  const fileRef = useRef()
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({
    category: 'topwear', color: 'white', season: 'all-season', occasion: 'casual', name: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('image', file)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    const result = await onUpload(fd)
    if (result?.success !== false) onClose()
  }

  const Field = ({ label, name, options }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>
      <div className="relative">
        <select value={form[name]} onChange={e => set(name, e.target.value)}
          className="w-full appearance-none bg-pink-50/60 border border-pink-100 rounded-2xl px-4 py-2.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300 capitalize">
          {options.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
        </select>
        <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>Add to Wardrobe</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="wardrobeFile"
              className="relative h-44 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/40 flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all">
              {preview
                ? <img src={preview} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                : <><FiUploadCloud size={32} className="text-pink-300" /><p className="text-sm text-gray-400 mt-2">Click to upload clothing image</p></>
              }
              <input id="wardrobeFile" type="file" hidden ref={fileRef}
                onChange={e => e.target.files[0] && setPreview(URL.createObjectURL(e.target.files[0]))}
                accept="image/*" required />
            </label>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Item Name (optional)</label>
              <input type="text" placeholder="e.g. Blue Denim Jacket" value={form.name}
                onChange={e => set('name', e.target.value)}
                className="bg-pink-50/60 border border-pink-100 rounded-2xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" name="category" options={CATEGORIES} />
              <Field label="Color"    name="color"    options={COLORS}    />
              <Field label="Season"   name="season"   options={SEASONS}   />
              <Field label="Occasion" name="occasion" options={OCCASIONS} />
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-700">
              💡 <strong>Occasion</strong> determines which outfit suggestions this item appears in.
            </div>
            <button type="submit" disabled={loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200
                ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200 hover:scale-[1.02]'}`}>
              {loading
                ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />Uploading…</>
                : <><FiUploadCloud size={15} />Upload Item</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Wardrobe() {
  const navigate = useNavigate()
  const {
    wardrobe, outfits, loading, uploadLoading, error,
    fetchWardrobe, uploadItem, deleteItem, getRecommendations
  } = useContext(WardrobeContext)

  const [showUpload,       setShowUpload]       = useState(false)
  const [activeTab,        setActiveTab]         = useState('wardrobe')
  const [season,           setSeason]            = useState('all-season')
  const [occasion,         setOccasion]          = useState('casual')
  const [recResult,        setRecResult]         = useState(null)
  const [recLoading,       setRecLoading]        = useState(false)
  const [storeSuggestions, setStoreSuggestions]  = useState([])

  // ── Modal state ──────────────────────────────────────────────────────────
  const [previewOutfit, setPreviewOutfit] = useState(null)
  const [previewRank,   setPreviewRank]   = useState(0)

  useEffect(() => { fetchWardrobe() }, [])

  const handleGetOutfits = async () => {
    setRecLoading(true)
    const data = await getRecommendations(season, occasion)
    setRecResult(data)
    setStoreSuggestions(data.storeSuggestions || [])
    setActiveTab('outfits')
    setRecLoading(false)
  }

  const handlePreview = (outfit, rank) => {
    setPreviewOutfit(outfit)
    setPreviewRank(rank)
  }

  const tabs = [
    { key: 'wardrobe', label: `My Clothes (${wardrobe.length})` },
    { key: 'outfits',  label: `AI Outfits${outfits.length ? ` (${outfits.length})` : ''}` },
  ]

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap'); body{font-family:'DM Sans',sans-serif;}`}</style>

      <div className="min-h-screen w-full bg-[#fde8f0] relative">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-300/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 pt-24 pb-24 flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-pink-400">AI Wardrobe</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                My <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">Wardrobe</span>
              </h1>
              <p className="text-gray-400 text-sm">{wardrobe.length} items · AI outfit engine</p>
            </div>
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-6 py-3.5 rounded-full text-sm shadow-lg shadow-pink-200 hover:scale-105 transition-all duration-200 self-start sm:self-auto">
              <FiUploadCloud size={16} /> Add Clothing
            </button>
          </div>

          {/* AI Controls */}
          <div className="bg-white/70 backdrop-blur-md border border-pink-100 rounded-3xl p-6 shadow-lg shadow-pink-100/40">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Generate Outfit Combinations</p>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {['season','occasion'].map(field => (
                <div key={field} className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                    {field === 'season' ? 'Season / Weather' : 'Occasion'}
                  </label>
                  <div className="relative">
                    <select
                      value={field === 'season' ? season : occasion}
                      onChange={e => field === 'season' ? setSeason(e.target.value) : setOccasion(e.target.value)}
                      className="w-full appearance-none bg-pink-50/60 border border-pink-100 rounded-2xl px-4 py-2.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    >
                      {(field === 'season' ? SEASONS : OCCASIONS).map(o =>
                        <option key={o} value={o} className="capitalize">{o}</option>
                      )}
                    </select>
                    <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-300 pointer-events-none" />
                  </div>
                </div>
              ))}
              <button onClick={handleGetOutfits} disabled={recLoading || wardrobe.length < 2}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-7 py-3 rounded-2xl text-sm shadow-lg shadow-pink-200 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                {recLoading
                  ? <><FiRefreshCw size={14} className="animate-spin" />Generating…</>
                  : <><FiStar size={14} />Get AI Outfits</>
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-500 text-sm font-medium px-5 py-3.5 rounded-2xl">⚠️ {error}</div>
          )}

          {/* Tabs */}
          <div className="flex gap-1.5 bg-white/70 backdrop-blur-md border border-pink-100 rounded-2xl p-1.5 w-fit shadow-sm">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${activeTab === t.key ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md' : 'text-gray-500 hover:text-pink-400'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Wardrobe Tab */}
          {activeTab === 'wardrobe' && (
            <>
              {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-56 bg-white/60 rounded-3xl animate-pulse border border-pink-50" />)}
                </div>
              )}
              {!loading && wardrobe.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-200 border border-pink-200 flex items-center justify-center text-5xl shadow-xl">👗</div>
                  <div>
                    <p className="font-black text-xl text-gray-700" style={{ fontFamily: "'Playfair Display', serif" }}>Your wardrobe is empty</p>
                    <p className="text-gray-400 text-sm mt-1 max-w-xs">Upload your clothes to get AI-powered outfit combinations with full explanations.</p>
                  </div>
                  <button onClick={() => setShowUpload(true)}
                    className="bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-8 py-3.5 rounded-full text-sm shadow-lg hover:scale-105 transition-all">
                    Upload First Item ✨
                  </button>
                </div>
              )}
              {!loading && wardrobe.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wardrobe.map(item => (
                    <WardrobeItemCard key={item._id} item={item} onDelete={deleteItem} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* AI Outfits Tab */}
          {activeTab === 'outfits' && (
            <div className="flex flex-col gap-8">
              {recResult?.message && (
                <div className="bg-white/60 border border-pink-100 rounded-2xl px-5 py-3 text-pink-500 text-sm font-semibold flex items-center gap-2">
                  ✨ {recResult.message}
                </div>
              )}

              {outfits.length === 0 && !recLoading && (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <div className="text-6xl">👗</div>
                  <p className="text-gray-600 font-bold text-lg">No outfit combinations yet</p>
                  <p className="text-gray-400 text-sm max-w-xs">Upload at least 1 top + 1 bottom tagged for the same occasion, then click "Get AI Outfits".</p>
                </div>
              )}

              {outfits.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Top Outfit Combinations
                    </h2>
                    <span className="text-xs text-gray-400 bg-white/70 border border-pink-100 px-3 py-1.5 rounded-full">
                      Click "Preview Outfit" to see avatar
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {outfits.map((outfit, i) => (
                      <OutfitComboCard
                        key={i}
                        outfit={outfit}
                        rank={i}
                        onPreview={handlePreview}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Store suggestions */}
              {storeSuggestions.length > 0 && (
                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Pair with Store Products
                    </h2>
                    <button onClick={() => navigate('/collection')} className="text-pink-400 text-sm font-semibold hover:underline">See all →</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {storeSuggestions.map(product => (
                      <div key={product._id} onClick={() => navigate(`/productdetail/${product._id}`)}
                        className="group bg-white border border-pink-100 rounded-3xl overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                        <div className="h-40 overflow-hidden bg-pink-50">
                          <img src={product.image1} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-3">
                          <p className="text-gray-800 font-bold text-xs line-clamp-2">{product.name}</p>
                          <p className="text-pink-500 font-black text-sm mt-1">₹ {product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUpload={uploadItem} loading={uploadLoading} />
      )}

      {/* Outfit Preview Modal */}
      {previewOutfit && (
        <OutfitPreviewModal
          outfit={previewOutfit}
          rank={previewRank}
          onClose={() => setPreviewOutfit(null)}
        />
      )}
    </>
  )
}