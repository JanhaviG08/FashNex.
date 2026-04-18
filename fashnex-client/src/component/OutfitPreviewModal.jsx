/**
 * fashnex-client/src/component/OutfitPreviewModal.jsx
 * =====================================================
 * Full-screen outfit preview modal with:
 *   - Layered avatar rendering (user's real clothing photos on a mannequin)
 *   - Rich AI explanation (paragraph + bullet points + score badges)
 *   - Score breakdown visualisation
 *   - Smooth open/close animation
 *
 * Props:
 *   outfit  — full outfit object from /recommend API (includes avatar & explanation_data)
 *   rank    — 0-based rank (for medal)
 *   onClose — callback to close modal
 *
 * Avatar rendering approach:
 *   The "avatar" is a CSS container with:
 *     1. A base SVG mannequin silhouette (no real person)
 *     2. Each clothing photo absolutely positioned on top using layer config from API
 *   No 3D, no external API — just CSS absolute positioning.
 */

import { useEffect, useRef } from 'react'
import {
  FiX, FiStar, FiCheckCircle, FiZap, FiCalendar,
  FiSun, FiDroplet
} from 'react-icons/fi'

// ── Medal mapping ──────────────────────────────────────────────────────────
const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

// ── Confidence badge colours ───────────────────────────────────────────────
const CONFIDENCE_STYLE = {
  excellent: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  good:      'bg-blue-50    text-blue-600    border-blue-200',
  fair:      'bg-amber-50   text-amber-600   border-amber-200',
}

// ── Score bar colours ──────────────────────────────────────────────────────
const BAR_COLORS = {
  color:        'bg-pink-400',
  occasion:     'bg-violet-400',
  season:       'bg-sky-400',
  completeness: 'bg-emerald-400',
}
const BAR_LABELS = {
  color:        '🎨 Colour Harmony',
  occasion:     '✅ Occasion Match',
  season:       '🌤️ Season Match',
  completeness: '👟 Completeness',
}

// ── Base avatar SVG mannequin ──────────────────────────────────────────────
// A simple gender-neutral fashion mannequin silhouette.
// Clothing layers are positioned on top of this.
function MannequinBase() {
  return (
    <svg
      viewBox="0 0 200 500"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
    >
      {/* Head */}
      <ellipse cx="100" cy="48" rx="30" ry="34" fill="#f5e6d8" stroke="#e8c9b0" strokeWidth="1.5"/>
      {/* Neck */}
      <rect x="90" y="78" width="20" height="22" rx="4" fill="#f5e6d8" stroke="#e8c9b0" strokeWidth="1"/>
      {/* Shoulders & torso */}
      <path d="M45 100 Q30 105 25 130 L25 280 Q25 290 35 290 L165 290 Q175 290 175 280 L175 130 Q170 105 155 100 Q135 95 100 95 Q65 95 45 100Z"
            fill="#f0e8df" stroke="#dcc9b8" strokeWidth="1.5"/>
      {/* Left arm */}
      <path d="M25 130 Q15 150 18 200 Q20 225 25 240 Q30 250 35 240 L38 200 L35 130Z"
            fill="#f0e8df" stroke="#dcc9b8" strokeWidth="1"/>
      {/* Right arm */}
      <path d="M175 130 Q185 150 182 200 Q180 225 175 240 Q170 250 165 240 L162 200 L165 130Z"
            fill="#f0e8df" stroke="#dcc9b8" strokeWidth="1"/>
      {/* Hips */}
      <path d="M35 290 Q30 310 32 340 L38 340 L40 290Z" fill="#f0e8df" stroke="#dcc9b8" strokeWidth="1"/>
      <path d="M165 290 Q170 310 168 340 L162 340 L160 290Z" fill="#f0e8df" stroke="#dcc9b8" strokeWidth="1"/>
      {/* Left leg */}
      <path d="M38 340 Q35 380 36 420 Q37 440 46 440 Q55 440 56 420 L58 340Z"
            fill="#f0e8df" stroke="#dcc9b8" strokeWidth="1"/>
      {/* Right leg */}
      <path d="M162 340 Q165 380 164 420 Q163 440 154 440 Q145 440 144 420 L142 340Z"
            fill="#f0e8df" stroke="#dcc9b8" strokeWidth="1"/>
      {/* Left foot */}
      <ellipse cx="46" cy="450" rx="18" ry="9" fill="#e8c9b0" stroke="#dcc9b8" strokeWidth="1"/>
      {/* Right foot */}
      <ellipse cx="154" cy="450" rx="18" ry="9" fill="#e8c9b0" stroke="#dcc9b8" strokeWidth="1"/>
      {/* Face details */}
      <ellipse cx="91" cy="44" rx="3" ry="3.5" fill="#a07850" opacity="0.6"/>
      <ellipse cx="109" cy="44" rx="3" ry="3.5" fill="#a07850" opacity="0.6"/>
      <path d="M91 60 Q100 67 109 60" stroke="#a07850" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ── Avatar — stacks clothing layers on mannequin ──────────────────────────
function AvatarPreview({ avatar }) {
  if (!avatar) return (
    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
      No avatar data
    </div>
  )

  const { layers = [], palette = [] } = avatar

  return (
    <div
      className="relative w-full"
      style={{ paddingBottom: '160%' /* 5:8 aspect ratio for mannequin */ }}
    >
      {/* Mannequin base */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MannequinBase />

        {/* Clothing layers — sorted by zIndex ascending */}
        {[...layers]
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((layer, i) => (
            layer.imageUrl ? (
              <img
                key={i}
                src={layer.imageUrl}
                alt={layer.name || layer.slot}
                title={`${layer.name} (${layer.slot})`}
                style={{
                  position:   'absolute',
                  top:        layer.position?.top    || '0%',
                  left:       layer.position?.left   || '0%',
                  width:      layer.position?.width  || '100%',
                  height:     layer.position?.height || '40%',
                  objectFit:  layer.position?.objectFit || 'contain',
                  zIndex:     layer.zIndex ?? 2,
                  pointerEvents: 'none',
                  // Blend mode makes the clothing look like it's "on" the mannequin
                  mixBlendMode: 'multiply',
                }}
              />
            ) : null
          ))
        }
      </div>

      {/* Colour palette dots */}
      {palette.length > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-2"
          style={{ zIndex: 20 }}
        >
          {palette.map((color, i) => (
            <div
              key={i}
              title={color}
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color.toLowerCase() }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Score breakdown bar ────────────────────────────────────────────────────
function ScoreBar({ label, value, colorClass }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-xs font-bold text-gray-700">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────
export default function OutfitPreviewModal({ outfit, rank = 0, onClose }) {
  const overlayRef = useRef()

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!outfit) return null

  const expData    = outfit.explanation_data || {}
  const breakdown  = outfit.breakdown        || {}
  const avatar     = outfit.avatar           || null
  const confidence = expData.confidence      || 'good'
  const bullets    = expData.bullets         || []
  const highlights = expData.highlights      || []

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full sm:max-w-3xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-pink-400 to-rose-500 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{MEDALS[rank] || '✨'}</span>
            <div>
              <h2 className="text-white font-black text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                {outfit.label || 'Outfit Preview'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                  <FiStar size={11} className="text-amber-200 fill-amber-200" />
                  <span className="text-white text-xs font-bold">{(outfit.score_1_5 || 0).toFixed(1)} / 5</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize bg-white/20 text-white border-white/30`}>
                  {confidence} match
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row gap-0 sm:gap-6 p-5 sm:p-6">

            {/* ── LEFT COLUMN — Avatar ── */}
            <div className="sm:w-56 flex-shrink-0 flex flex-col gap-3">
              {/* Avatar container */}
              <div className="bg-gradient-to-b from-pink-50 to-rose-50 rounded-2xl border border-pink-100 overflow-hidden relative">
                <AvatarPreview avatar={avatar} />
              </div>

              {/* Item pills below avatar */}
              {(outfit.items || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {outfit.items.map((item, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold bg-pink-50 border border-pink-100 text-pink-500 px-2.5 py-1 rounded-full capitalize"
                    >
                      {item.color} {item.category}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN — Explanation + Score ── */}
            <div className="flex-1 flex flex-col gap-5 mt-5 sm:mt-0">

              {/* Highlight badges */}
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {highlights.map((h, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 text-pink-600 text-xs font-bold px-3 py-1.5 rounded-full"
                    >
                      <FiZap size={11} />
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {/* AI Explanation paragraph */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">AI</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Why this outfit?
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {expData.paragraph || outfit.explanation || 'This outfit scored well across all criteria.'}
                </p>
              </div>

              {/* Bullet points */}
              {bullets.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Key Reasons</p>
                  <div className="flex flex-col gap-1.5">
                    {bullets.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <FiCheckCircle size={14} className="text-pink-400 mt-0.5 flex-shrink-0" />
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score breakdown bars */}
              {Object.keys(breakdown).length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Score Breakdown</p>
                  {Object.entries(breakdown).map(([key, value]) => (
                    BAR_LABELS[key] && (
                      <ScoreBar
                        key={key}
                        label={BAR_LABELS[key]}
                        value={value}
                        colorClass={BAR_COLORS[key] || 'bg-pink-300'}
                      />
                    )
                  ))}
                </div>
              )}

              {/* Item photos strip */}
              {(outfit.items || []).length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Items in this Outfit</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {outfit.items.map((item, i) => (
                      <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                        <div className="w-16 h-20 rounded-xl overflow-hidden border border-pink-100 bg-pink-50 shadow-sm">
                          <img
                            src={item.imageUrl}
                            alt={item.name || item.category}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 capitalize text-center max-w-[64px] truncate">
                          {item.name || item.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-pink-50 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white">
          <p className="text-xs text-gray-400">
            AI Score: <span className="font-bold text-gray-600">{(outfit.score_1_5 || 0).toFixed(1)}/5.0</span>
            {' · '}
            <span className={`font-semibold capitalize ${
              confidence === 'excellent' ? 'text-emerald-500' :
              confidence === 'good'      ? 'text-blue-500'    : 'text-amber-500'
            }`}>{confidence} match</span>
          </p>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md hover:scale-105 transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}