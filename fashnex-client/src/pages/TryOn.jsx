/**
 * pages/TryOn.jsx
 * ═══════════════════════════════════════════════════════════════════════════
 * Virtual Try-On — MediaPipe Pose (CDN) edition
 *
 * WHY MediaPipe CDN instead of @tensorflow-models/pose-detection?
 *   The npm TF.js stack downloads ~40 MB of WASM + model weights on first
 *   load, taking 10-20 s and blocking the thread.
 *   MediaPipe via CDN is ~4 MB, streams in ~1 s, and uses the exact same
 *   window.Pose + window.Camera API proven in the reference ZIP project.
 *
 * FLOW:
 *   1. User arrives at /try-on/:productId
 *   2. Product image loaded immediately (no crossOrigin → no CORS taint)
 *   3. User clicks "Start Camera" → getUserMedia
 *   4. User clicks "Start Try-On"
 *      → MediaPipe CDN scripts injected once (cached after first load)
 *      → window.Pose + window.Camera started
 *      → onResults fires every frame with poseLandmarks
 *      → extractLandmarks() + LandmarkSmoother → named pixel map
 *      → drawClothingOverlay() → canvas
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, {
  useState, useEffect, useRef, useContext, useCallback
} from 'react'
import { useParams, useNavigate }    from 'react-router-dom'
import { ShopDataContext }           from '../context/ShopContext'
import { extractLandmarks }         from '../../utils/poseDetection'
import { drawClothingOverlay, getClothBoundsCached, resetOverlaySmoother, clearBoundsCache }
  from '../../utils/overlayEngine'
import { LandmarkSmoother }         from '../../utils/smoothing'
import { recommendSize }            from '../../utils/sizeRecommendation'
import { FiCamera, FiCameraOff, FiArrowLeft, FiInfo, FiZap } from 'react-icons/fi'

// ─── MediaPipe CDN scripts ────────────────────────────────────────────────────
const MP_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
]

async function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return   // already loaded
  return new Promise((resolve, reject) => {
    const s     = document.createElement('script')
    s.src       = src
    s.crossOrigin = 'anonymous'
    s.onload    = resolve
    s.onerror   = () => reject(new Error(`Failed to load: ${src}`))
    document.head.appendChild(s)
  })
}

let _mpLoaded = false
async function ensureMediaPipe() {
  if (_mpLoaded) return
  for (const src of MP_SCRIPTS) await loadScript(src)
  await new Promise(r => setTimeout(r, 300))   // let MP self-initialise
  _mpLoaded = true
}

// ─── Category resolver ────────────────────────────────────────────────────────
const CATEGORY_MAP = {
  tshirt:'top', shirt:'top', top:'top', blouse:'top', crop:'top', tank:'top', kurta:'top',
  jacket:'jacket', hoodie:'hoodie', sweater:'jacket', coat:'jacket', blazer:'jacket',
  dress:'dress', gown:'dress', jumpsuit:'dress', saree:'dress',
  jeans:'bottom', trouser:'bottom', pants:'bottom', shorts:'bottom',
  skirt:'bottom', leggings:'bottom', chino:'bottom', pant:'bottom',
}

function resolveCategory(product) {
  const tag = `${product?.subCategory || ''} ${product?.category || ''}`.toLowerCase()
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (tag.includes(key)) return cat
  }
  return 'top'
}

// ─── Outfit pairing ───────────────────────────────────────────────────────────
function getOppositeTag(category = '') {
  const c = category.toLowerCase()
  if (['top','jacket','hoodie'].includes(c)) return 'bottomwear'
  if (c === 'bottom')                         return 'topwear'
  return 'topwear'
}

// ─── Skeleton debug ───────────────────────────────────────────────────────────
function drawSkeleton(ctx, lm) {
  const pairs = [
    ['leftShoulder','rightShoulder'],['leftShoulder','leftHip'],
    ['rightShoulder','rightHip'],['leftHip','rightHip'],
    ['leftHip','leftKnee'],['rightHip','rightKnee'],
    ['leftKnee','leftAnkle'],['rightKnee','rightAnkle'],
  ]
  ctx.strokeStyle = 'rgba(99,102,241,0.75)'; ctx.lineWidth = 2
  for (const [a, b] of pairs) {
    if (!lm[a] || !lm[b]) continue
    ctx.beginPath(); ctx.moveTo(lm[a].x, lm[a].y); ctx.lineTo(lm[b].x, lm[b].y); ctx.stroke()
  }
  for (const pt of Object.values(lm)) {
    if (!pt) continue
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(244,63,94,0.9)'; ctx.fill()
  }
}

// ─── Size labels ─────────────────────────────────────────────────────────────
const SIZE_INFO = {
  XS: { chest:'< 32"',  waist:'< 26"',  note:'Extra Small' },
  S:  { chest:'32–34"', waist:'26–28"', note:'Small'        },
  M:  { chest:'34–36"', waist:'28–30"', note:'Medium'       },
  L:  { chest:'36–40"', waist:'30–34"', note:'Large'        },
  XL: { chest:'40+"',   waist:'34+"',   note:'Extra Large'  },
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TryOn() {
  const { productId }          = useParams()
  const navigate               = useNavigate()
  const { products, currency } = useContext(ShopDataContext)

  const product     = products?.find(p => p._id === productId) || null
  const category    = product ? resolveCategory(product) : 'top'

  // Outfit suggestions
  const suggestions = product
    ? (products || [])
        .filter(p => {
          const opp = getOppositeTag(category)
          return p._id !== productId &&
            (p.category || '').toLowerCase().includes(opp.replace('wear',''))
        })
        .slice(0, 4)
    : []

  // ── Refs ────────────────────────────────────────────────────────────────
  const videoRef      = useRef(null)   // hidden <video> webcam feed
  const canvasRef     = useRef(null)   // visible output canvas
  const imgRef        = useRef(null)   // product HTMLImageElement
  const cameraObjRef  = useRef(null)   // MediaPipe Camera instance
  const poseObjRef    = useRef(null)   // MediaPipe Pose instance
  const smootherRef   = useRef(new LandmarkSmoother(0.25))
  const streamRef     = useRef(null)
  const opacityRef    = useRef(0.92)
  const debugRef      = useRef(false)
  const catOverrideRef = useRef(null)
  const sizeFrameRef  = useRef(0)
  const fpsCountRef   = useRef(0)
  const fpsTimeRef    = useRef(performance.now())

  // ── State ───────────────────────────────────────────────────────────────
  const [cameraOn,    setCameraOn]    = useState(false)
  const [tryOnActive, setTryOnActive] = useState(false)
  const [loadStage,   setLoadStage]   = useState('idle')
  // loadStage values:
  //   idle | requestingCamera | cameraReady |
  //   loadingMP | loadingImage | running | error | paused
  const [error,       setError]       = useState('')
  const [sizeLabel,   setSizeLabel]   = useState(null)
  const [sizeInfo,    setSizeInfo]    = useState(null)
  const [poseFound,   setPoseFound]   = useState(false)
  const [opacity,     setOpacity]     = useState(0.92)
  const [showDebug,   setShowDebug]   = useState(false)
  const [fps,         setFps]         = useState(0)
  const [catOverride, setCatOverride] = useState(null)
  const [imgLoaded,   setImgLoaded]   = useState(false)

  // Sync mutable refs with state so the MediaPipe callback always sees fresh values
  useEffect(() => { opacityRef.current   = opacity    }, [opacity])
  useEffect(() => { debugRef.current     = showDebug  }, [showDebug])
  useEffect(() => { catOverrideRef.current = catOverride }, [catOverride])

  const effectiveCategory = catOverride || category

  // ── Preload product image on mount (no crossOrigin = no CORS taint) ─────
  useEffect(() => {
    if (!product) return
    setImgLoaded(false)
    imgRef.current = null
    clearBoundsCache()

    const src = Array.isArray(product.image)
      ? product.image[0]
      : product.image1 || product.image2 || product.image || ''

    if (!src) return

    const img    = new Image()
    // Intentionally NOT setting crossOrigin so drawImage() never taints canvas
    img.onload   = () => { imgRef.current = img; getClothBoundsCached(img); setImgLoaded(true) }
    img.onerror  = () => console.warn('[TryOn] product image load failed:', src)
    img.src      = src
  }, [product?._id])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup ─────────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    // Stop MediaPipe Camera loop
    try { cameraObjRef.current?.stop?.() } catch {}
    cameraObjRef.current = null
    poseObjRef.current   = null

    // Stop webcam stream
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null

    setCameraOn(false); setTryOnActive(false)
    setPoseFound(false); setSizeLabel(null); setSizeInfo(null)
    setLoadStage('idle')
    resetOverlaySmoother(); smootherRef.current.reset()

    const c = canvasRef.current
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height)
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  // ── Start camera (getUserMedia only, no MediaPipe yet) ───────────────────
  const startCamera = useCallback(async () => {
    stopAll(); setError('')
    setLoadStage('requestingCamera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await new Promise(res => { video.onloadedmetadata = res })
      video.play()
      setCameraOn(true)
      setLoadStage('cameraReady')
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access and try again.'
        : err.name === 'NotReadableError'
          ? 'Camera is in use by another app. Close it and try again.'
          : 'Could not open camera: ' + err.message
      setError(msg); setLoadStage('error')
    }
  }, [stopAll])

  // ── Start try-on ─────────────────────────────────────────────────────────
  const startTryOn = useCallback(async () => {
    if (!cameraOn) return
    setError(''); setTryOnActive(false)

    // 1 — Load MediaPipe scripts (cached after first load, ~1 s)
    setLoadStage('loadingMP')
    try {
      await ensureMediaPipe()
    } catch (err) {
      setError('Could not load MediaPipe. Check your internet connection. ' + err.message)
      setLoadStage('error'); return
    }

    // 2 — Ensure product image is loaded
    if (!imgRef.current) {
      setLoadStage('loadingImage')
      // Wait up to 8 s for the preload that started in useEffect
      for (let i = 0; i < 80; i++) {
        if (imgRef.current) break
        await new Promise(r => setTimeout(r, 100))
      }
      if (!imgRef.current) {
        setError('Could not load product image. Check your internet connection.')
        setLoadStage('error'); return
      }
    }

    // Ensure bounds are cached
    getClothBoundsCached(imgRef.current)

    // 3 — Create MediaPipe Pose instance
    setLoadStage('running')
    resetOverlaySmoother(); smootherRef.current.reset()
    sizeFrameRef.current = 0; fpsCountRef.current = 0; fpsTimeRef.current = performance.now()

    const pose = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    })
    pose.setOptions({
      modelComplexity:        1,
      smoothLandmarks:        true,
      enableSegmentation:     false,
      minDetectionConfidence: 0.4,
      minTrackingConfidence:  0.4,
    })

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    pose.onResults((results) => {
      const W = results.image.width
      const H = results.image.height
      canvas.width  = W
      canvas.height = H

      // 1. Draw mirrored webcam frame
      ctx.save()
      ctx.translate(W, 0); ctx.scale(-1, 1)
      ctx.drawImage(results.image, 0, 0, W, H)
      ctx.restore()

      // 2. Pose landmarks
      if (results.poseLandmarks) {
        // extractLandmarks converts normalised → pixel AND mirrors x (since canvas is mirrored)
        // We pass W so mirroring is: px = (1 - lm.x) * W
        const rawLM  = extractLandmarksMP(results.poseLandmarks, W, H)
        const lm     = smootherRef.current.update(rawLM)

        // 3. Overlay
        if (imgRef.current) {
          ctx.globalAlpha = opacityRef.current
          const cat = catOverrideRef.current || resolveCategory(
            products?.find(p => p._id === productId) || {}
          )
          drawClothingOverlay(ctx, imgRef.current, lm, cat, { width: W, height: H })
          ctx.globalAlpha = 1
        }

        // 4. Debug skeleton
        if (debugRef.current) drawSkeleton(ctx, lm)

        // 5. Size (every 45 frames)
        sizeFrameRef.current++
        if (sizeFrameRef.current % 45 === 0) {
          const s = recommendSize(lm, { width: W, height: H })
          setSizeLabel(s.size); setSizeInfo(s)
        }

        setPoseFound(true)
      } else {
        setPoseFound(false)
      }

      // 6. FPS counter
      fpsCountRef.current++
      const now = performance.now()
      if (now - fpsTimeRef.current >= 1000) {
        setFps(fpsCountRef.current)
        fpsCountRef.current = 0; fpsTimeRef.current = now
      }
    })

    poseObjRef.current = pose

    // 4 — Start MediaPipe Camera loop (same as ZIP reference)
    const video  = videoRef.current
    const camera = new window.Camera(video, {
      onFrame: async () => {
        await pose.send({ image: video })
      },
      width:  1280,
      height: 720,
    })
    cameraObjRef.current = camera
    camera.start()

    setTryOnActive(true)
  }, [cameraOn, productId, products])

  // ── Pause try-on (keep camera, stop MediaPipe loop) ──────────────────────
  const pauseTryOn = useCallback(() => {
    try { cameraObjRef.current?.stop?.() } catch {}
    cameraObjRef.current = null
    poseObjRef.current   = null
    setTryOnActive(false); setLoadStage('cameraReady')
    setPoseFound(false)
    resetOverlaySmoother(); smootherRef.current.reset()
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // Loading message
  // ─────────────────────────────────────────────────────────────────────────
  const LOAD_MSG = {
    requestingCamera: '📷 Opening camera…',
    loadingMP:        '⚡ Loading MediaPipe (~1–2 s on first use)…',
    loadingImage:     '🖼 Loading product image…',
  }
  const loadingMsg = LOAD_MSG[loadStage] || ''

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-gray-600 font-semibold text-lg">Product not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-pink-500 font-semibold hover:underline">← Go back</button>
      </div>
    </div>
  )

  const imgSrc = Array.isArray(product.image)
    ? product.image[0]
    : product.image1 || product.image2 || product.image || ''

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes dotPulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        .dot-pulse { animation: dotPulse 1.4s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50 pt-20 pb-16">

        {/* Background blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-200/25 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { stopAll(); navigate(-1) }}
                className="w-9 h-9 rounded-xl bg-white/70 border border-pink-100 flex items-center justify-center text-gray-500 hover:text-pink-500 transition-colors shadow-sm"
              >
                <FiArrowLeft size={16} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-400">AI Powered</p>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-800" style={{ fontFamily:"'Playfair Display', serif" }}>
                  Virtual{' '}
                  <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                    Try-On
                  </span>
                </h1>
              </div>
            </div>
            {tryOnActive && (
              <span className="text-[11px] font-bold text-violet-500 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full">
                {fps} fps
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

            {/* ═══ LEFT — Camera/Canvas panel ═══ */}
            <div className="flex flex-col gap-4">

              {/* Canvas */}
              <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl shadow-pink-200/30" style={{ aspectRatio:'4/3' }}>

                {/* Hidden video element — webcam feed for MediaPipe */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
                  playsInline muted autoPlay
                />

                {/* Output canvas */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Empty state */}
                {!cameraOn && !loadingMsg && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/50">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center">
                      <FiCamera size={36} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white/70">Camera is off</p>
                      <p className="text-xs text-white/40 mt-1">Click "Start Camera" below</p>
                    </div>
                  </div>
                )}

                {/* Loading overlay */}
                {loadingMsg && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 backdrop-blur-sm">
                    <div className="w-14 h-14 rounded-full border-4 border-pink-400/40 border-t-pink-400 spin" />
                    <p className="text-white text-sm font-semibold text-center px-8 leading-relaxed max-w-xs">
                      {loadingMsg}
                    </p>
                  </div>
                )}

                {/* Pose badge */}
                {cameraOn && (
                  <div className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm
                    ${poseFound ? 'bg-emerald-500/85 text-white' : 'bg-black/50 text-white/80'}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0
                      ${poseFound ? 'bg-white dot-pulse' : 'bg-white/40'}`} />
                    {poseFound
                      ? '✓ Body detected'
                      : tryOnActive ? 'Searching for body…' : 'Camera ready'}
                  </div>
                )}

                {/* Category badge */}
                {tryOnActive && (
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize">
                    {effectiveCategory}
                  </div>
                )}

                {/* Image ready indicator */}
                {cameraOn && !tryOnActive && (
                  <div className={`absolute bottom-4 left-4 text-[11px] font-bold px-3 py-1 rounded-full
                    ${imgLoaded ? 'bg-emerald-500/80 text-white' : 'bg-amber-400/80 text-white'}`}>
                    {imgLoaded ? '✓ Garment ready' : '⌛ Loading garment…'}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="absolute inset-x-4 bottom-4 bg-rose-500/90 backdrop-blur-sm text-white text-xs font-medium px-4 py-3 rounded-2xl leading-relaxed">
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-3">
                {!cameraOn ? (
                  <button
                    onClick={startCamera}
                    disabled={loadStage === 'requestingCamera'}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-pink-200 hover:scale-105 transition-all disabled:opacity-60"
                  >
                    <FiCamera size={16} />
                    {loadStage === 'requestingCamera' ? 'Opening…' : 'Start Camera'}
                  </button>
                ) : (
                  <>
                    {!tryOnActive ? (
                      <button
                        onClick={startTryOn}
                        disabled={loadStage === 'loadingMP' || loadStage === 'loadingImage'}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-violet-200 hover:scale-105 transition-all disabled:opacity-60"
                      >
                        <FiZap size={16} />
                        {loadStage === 'loadingMP' || loadStage === 'loadingImage'
                          ? 'Loading…'
                          : '✨ Start Try-On'}
                      </button>
                    ) : (
                      <button
                        onClick={pauseTryOn}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-violet-200 text-violet-500 font-bold py-3.5 rounded-2xl text-sm hover:bg-violet-50 transition-all"
                      >
                        Pause Try-On
                      </button>
                    )}
                    <button
                      onClick={stopAll}
                      title="Stop camera"
                      className="w-14 flex items-center justify-center bg-white border-2 border-pink-100 text-gray-400 rounded-2xl hover:text-rose-500 hover:border-rose-200 transition-all"
                    >
                      <FiCameraOff size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Overlay & category settings */}
              {tryOnActive && (
                <div className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overlay Settings</p>

                  {/* Opacity */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-20 flex-shrink-0">Opacity</label>
                    <input type="range" min="0.3" max="1" step="0.05" value={opacity}
                      onChange={e => setOpacity(parseFloat(e.target.value))}
                      className="flex-1 accent-pink-400" />
                    <span className="text-xs text-gray-500 w-8 text-right">{Math.round(opacity * 100)}%</span>
                  </div>

                  {/* Skeleton */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-20 flex-shrink-0">Skeleton</label>
                    <button onClick={() => setShowDebug(v => !v)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors
                        ${showDebug ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {showDebug ? 'ON' : 'OFF'}
                    </button>
                    <span className="text-xs text-gray-400">Shows detected keypoints</span>
                  </div>

                  {/* Fit type override */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-sm text-gray-600 w-20 flex-shrink-0">Fit type</label>
                    {['top','bottom','dress','jacket','hoodie'].map(c => (
                      <button key={c}
                        onClick={() => { setCatOverride(c); resetOverlaySmoother() }}
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors
                          ${effectiveCategory === c ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-pink-50'}`}>
                        {c}
                      </button>
                    ))}
                    {catOverride && (
                      <button onClick={() => { setCatOverride(null); resetOverlaySmoother() }}
                        className="px-3 py-1 rounded-full text-xs font-bold text-gray-400 bg-gray-100 hover:bg-red-50 hover:text-red-400 transition-colors">
                        ✕ reset
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-white/60 border border-pink-100 rounded-2xl px-5 py-4 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FiInfo size={12} /> Tips for best results
                </p>
                <ul className="text-xs text-gray-400 leading-relaxed space-y-1.5">
                  <li>• Stand 1–2 metres from the camera</li>
                  <li>• Full upper body (shoulders to hips) must be visible</li>
                  <li>• Good lighting significantly improves detection accuracy</li>
                  <li>• Face the camera squarely — angled poses reduce accuracy</li>
                  <li>• Wear a plain fitted top for the cleanest overlay result</li>
                </ul>
              </div>
            </div>

            {/* ═══ RIGHT — Product + Size + Suggestions ═══ */}
            <div className="flex flex-col gap-5">

              {/* Product card */}
              <div className="bg-white/70 backdrop-blur-sm border border-pink-100 rounded-3xl overflow-hidden shadow-md">
                <div className="relative h-56 bg-pink-50">
                  {imgSrc && (
                    <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 border border-pink-100 text-pink-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {product.subCategory || product.category}
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-1.5">
                  <h2 className="text-gray-800 font-black text-base line-clamp-2"
                      style={{ fontFamily:"'Playfair Display', serif" }}>
                    {product.name}
                  </h2>
                  <span className="font-black text-pink-500 text-lg">{currency} {product.price}</span>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{product.description}</p>
                </div>
              </div>

              {/* Size recommendation */}
              <div className={`rounded-3xl p-5 border shadow-sm transition-all duration-500
                ${sizeLabel
                  ? 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200'
                  : 'bg-white/60 border-pink-100'}`}>
                <p className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-3">
                  Size Recommendation
                </p>
                {sizeLabel ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-pink-200 flex-shrink-0">
                        {sizeLabel}
                      </div>
                      <div>
                        <p className="text-gray-800 font-bold">{SIZE_INFO[sizeLabel]?.note}</p>
                        <p className="text-gray-400 text-xs">Chest: {SIZE_INFO[sizeLabel]?.chest}</p>
                        <p className="text-gray-400 text-xs">Waist: {SIZE_INFO[sizeLabel]?.waist}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {['XS','S','M','L','XL'].map(s => (
                        <span key={s} className={`w-10 h-10 rounded-xl text-xs font-bold flex items-center justify-center border-2 transition-all
                          ${s === sizeLabel
                            ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white border-transparent shadow-md scale-110'
                            : 'bg-white text-gray-400 border-pink-100'}`}>
                          {s}
                        </span>
                      ))}
                    </div>
                    {sizeInfo?.confidence === 'low' && (
                      <p className="text-yellow-500 text-[11px]">⚠ Move closer to camera for better accuracy</p>
                    )}
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Based on real-time shoulder width. Final size may vary by brand.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    {cameraOn
                      ? 'Start Try-On to get your recommended size.'
                      : 'Open camera to get your recommended size.'}
                  </p>
                )}
              </div>

              {/* Outfit suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-white/60 border border-pink-100 rounded-3xl p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-3">
                    Complete the Look
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestions.map(p => (
                      <div key={p._id}
                        onClick={() => navigate(`/productdetail/${p._id}`)}
                        className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-pink-100 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                        <div className="h-28 overflow-hidden bg-pink-50">
                          <img
                            src={Array.isArray(p.image) ? p.image[0] : p.image1 || p.image || ''}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-2.5">
                          <p className="text-gray-700 font-semibold text-xs line-clamp-1">{p.name}</p>
                          <p className="text-pink-500 font-black text-xs mt-0.5">{currency} {p.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => navigate(`/productdetail/${productId}`)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-pink-200 hover:scale-105 hover:shadow-xl transition-all"
              >
                Add to Cart →
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

// ─── Internal helper — mirrors x so keypoints match the mirrored canvas ───────
function extractLandmarksMP(poseLandmarks, canvasW, canvasH, minVis = 0.3) {
  if (!poseLandmarks) return {}
  const get = (idx) => {
    const lm = poseLandmarks[idx]
    if (!lm || (lm.visibility ?? 1) < minVis) return null
    return {
      // Mirror x because canvas is drawn with ctx.scale(-1,1)
      x:     (1 - lm.x) * canvasW,
      y:     lm.y * canvasH,
      score: lm.visibility ?? 1,
    }
  }
  return {
    nose:          get(0),
    leftShoulder:  get(11),
    rightShoulder: get(12),
    leftElbow:     get(13),
    rightElbow:    get(14),
    leftWrist:     get(15),
    rightWrist:    get(16),
    leftHip:       get(23),
    rightHip:      get(24),
    leftKnee:      get(25),
    rightKnee:     get(26),
    leftAnkle:     get(27),
    rightAnkle:    get(28),
  }
}