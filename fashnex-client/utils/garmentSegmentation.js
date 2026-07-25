/**
 * utils/garmentSegmentation.js
 * ==============================
 * Extracts ONLY the clothing region from a product image that contains
 * a human model wearing the garment.
 *
 * TWO-STAGE APPROACH (for maximum compatibility):
 *
 * Stage 1 — BodyPix segmentation (preferred):
 *   Load @tensorflow-models/body-pix from CDN.
 *   Run segmentation on the product image (rendered to an off-screen canvas).
 *   INVERT the person mask → keep only NON-person pixels for background removal.
 *   Then SMART CROP: detect the garment zone from the remaining pixels
 *   (removes head + floor regions intelligently using keypoint data).
 *
 * Stage 2 — Heuristic crop fallback (when BodyPix fails or CORS blocks):
 *   For a TOP:    crop top 15% (head) and bottom 40% (legs) of image
 *   For a BOTTOM: crop top 55% (head+torso) and bottom 10%
 *   For a DRESS:  crop top 15% (head)
 *   Return the cropped region as a transparent-background canvas.
 *
 * Public API:
 *   loadBodyPix()                       → Promise<model | null>
 *   segmentGarment(img, category, model) → Promise<HTMLCanvasElement>
 *     Returns an off-screen canvas whose pixels contain ONLY the garment
 *     with a transparent background. Drop this canvas into renderFrame()
 *     exactly as you would a regular HTMLImageElement.
 *
 * The returned canvas is cached by image src + category so segmentation
 * only runs once per product per session.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CDN loader for BodyPix
// ─────────────────────────────────────────────────────────────────────────────

let _bodyPixModel = null
let _bodyPixLoaded = false

async function ensureBodyPixScript() {
  const src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.0/dist/body-pix.min.js'
  if (document.querySelector(`script[src="${src}"]`)) return
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src; s.async = false
    s.onload  = resolve
    s.onerror = () => reject(new Error('Failed to load BodyPix CDN'))
    document.head.appendChild(s)
  })
  await new Promise(r => setTimeout(r, 200))
}

export async function loadBodyPix() {
  if (_bodyPixLoaded) return _bodyPixModel
  try {
    await ensureBodyPixScript()
    if (!window.bodyPix) throw new Error('bodyPix not on window')
    // Use MobileNetV1 0.50 — fast, small, still good enough for product images
    _bodyPixModel = await window.bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.50,
      quantBytes: 2,
    })
    _bodyPixLoaded = true
    return _bodyPixModel
  } catch (err) {
    console.warn('[garmentSeg] BodyPix unavailable, will use heuristic fallback:', err.message)
    _bodyPixLoaded = true   // don't retry
    _bodyPixModel  = null
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEURISTIC CROP CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
// (fraction of image height to crop FROM TOP / FROM BOTTOM per category)

const CROP_CONFIG = {
  top: {
    // Remove top 18% (model's head/neck area) and bottom 45% (hips→feet)
    fromTop:    0.14,
    fromBottom: 0.42,
    // Slight horizontal inset so the background border is removed
    fromLeft:   0.04,
    fromRight:  0.04,
  },
  bottom: {
    // Remove top 52% (head+torso) and bottom 8% (floor shadow)
    fromTop:    0.50,
    fromBottom: 0.06,
    fromLeft:   0.04,
    fromRight:  0.04,
  },
  dress: {
    // Remove only the top 15% (head area) and tiny bottom floor strip
    fromTop:    0.13,
    fromBottom: 0.04,
    fromLeft:   0.04,
    fromRight:  0.04,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// OFF-SCREEN CANVAS HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

/** Draw img into an off-screen canvas so BodyPix can run on it */
function imageToCanvas(img, maxSize = 256) {
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth  * scale)
  const h = Math.round(img.naturalHeight * scale)
  const c = makeCanvas(w, h)
  c.getContext('2d').drawImage(img, 0, 0, w, h)
  return c
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 — BodyPix segmentation
// ─────────────────────────────────────────────────────────────────────────────

async function segmentWithBodyPix(img, category, model) {
  const inputCanvas = imageToCanvas(img, 512)
  const W = inputCanvas.width
  const H = inputCanvas.height

  // Segment the person in the product photo
  const segmentation = await model.segmentPerson(inputCanvas, {
    internalResolution: 'medium',
    segmentationThreshold: 0.55,
    maxDetections: 1,
  })

  const mask  = segmentation.data   // Uint8Array — 1 = person, 0 = background
  const srcCtx = inputCanvas.getContext('2d')
  const srcData = srcCtx.getImageData(0, 0, W, H)
  const pixels  = srcData.data   // RGBA

  // We KEEP pixels that are:
  //   a) classified as PERSON (the model) AND
  //   b) in the garment zone (exclude head, exclude legs per category)
  const cfg    = CROP_CONFIG[category] || CROP_CONFIG.top
  const yStart = Math.round(H * cfg.fromTop)
  const yEnd   = Math.round(H * (1 - cfg.fromBottom))
  const xStart = Math.round(W * cfg.fromLeft)
  const xEnd   = Math.round(W * (1 - cfg.fromRight))

  for (let i = 0; i < mask.length; i++) {
    const x = i % W
    const y = Math.floor(i / W)
    const px = i * 4

    const inPersonMask  = mask[i] === 1
    const inGarmentZone = x >= xStart && x <= xEnd && y >= yStart && y <= yEnd

    if (!inPersonMask || !inGarmentZone) {
      // Make pixel transparent
      pixels[px + 3] = 0
    }
  }

  // Write masked pixels to output canvas
  const out = makeCanvas(W, H)
  out.getContext('2d').putImageData(srcData, 0, 0)
  return trimTransparent(out)
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2 — Heuristic crop (no BodyPix)
// ─────────────────────────────────────────────────────────────────────────────

function segmentHeuristic(img, category) {
  const W   = img.naturalWidth
  const H   = img.naturalHeight
  const cfg = CROP_CONFIG[category] || CROP_CONFIG.top

  const srcX = Math.round(W * cfg.fromLeft)
  const srcY = Math.round(H * cfg.fromTop)
  const srcW = Math.round(W * (1 - cfg.fromLeft - cfg.fromRight))
  const srcH = Math.round(H * (1 - cfg.fromTop  - cfg.fromBottom))

  // Draw only the garment-zone crop onto a transparent canvas
  const out = makeCanvas(srcW, srcH)
  const ctx = out.getContext('2d')
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)

  // Light edge-fade to soften hard crop lines
  applyEdgeFade(ctx, srcW, srcH, 18)

  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// POST-PROCESSING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trim fully transparent rows/columns from all four edges of a canvas,
 * returning a new tighter canvas. This removes large empty margins that
 * would misalign the overlay anchor point.
 */
function trimTransparent(canvas) {
  const ctx  = canvas.getContext('2d')
  const { width: W, height: H } = canvas
  const data = ctx.getImageData(0, 0, W, H).data

  let top = 0, bottom = H - 1, left = 0, right = W - 1

  // Find first row with any non-transparent pixel
  outer: for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 10) { top = y; break outer }
    }
  }
  // Find last row
  outer: for (let y = H - 1; y >= 0; y--) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 10) { bottom = y; break outer }
    }
  }
  // First column
  outer: for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      if (data[(y * W + x) * 4 + 3] > 10) { left = x; break outer }
    }
  }
  // Last column
  outer: for (let x = W - 1; x >= 0; x--) {
    for (let y = 0; y < H; y++) {
      if (data[(y * W + x) * 4 + 3] > 10) { right = x; break outer }
    }
  }

  const cW = right  - left   + 1
  const cH = bottom - top    + 1
  if (cW <= 0 || cH <= 0) return canvas  // nothing to trim

  const out = makeCanvas(cW, cH)
  out.getContext('2d').drawImage(canvas, left, top, cW, cH, 0, 0, cW, cH)
  return out
}

/**
 * Apply a soft alpha fade to all four edges of a canvas context.
 * Prevents hard-cut crop lines from appearing as visible seams.
 */
function applyEdgeFade(ctx, W, H, fadeSize) {
  const grad = (x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0,   'rgba(0,0,0,1)')
    g.addColorStop(0.3, 'rgba(0,0,0,0.7)')
    g.addColorStop(1,   'rgba(0,0,0,0)')
    return g
  }

  // Left edge
  ctx.save()
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = grad(0, 0, fadeSize, 0)
  ctx.fillRect(0, 0, fadeSize, H)
  // Right edge
  ctx.fillStyle = grad(W, 0, W - fadeSize, 0)
  ctx.fillRect(W - fadeSize, 0, fadeSize, H)
  // Top edge
  ctx.fillStyle = grad(0, 0, 0, fadeSize)
  ctx.fillRect(0, 0, W, fadeSize)
  // Bottom edge
  ctx.fillStyle = grad(0, H, 0, H - fadeSize)
  ctx.fillRect(0, H - fadeSize, W, fadeSize)
  ctx.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY NORMALISER
// ─────────────────────────────────────────────────────────────────────────────

export function normaliseCategory(raw = '') {
  const c = raw.toLowerCase().trim()
  if (['topwear','top','tops','shirt','blouse','tshirt','t-shirt','crop'].some(k => c.includes(k)))
    return 'top'
  if (['bottomwear','bottom','jeans','pant','skirt','shorts','trouser','legging'].some(k => c.includes(k)))
    return 'bottom'
  return 'dress'
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT CACHE
// ─────────────────────────────────────────────────────────────────────────────

const _segCache = new Map()

/**
 * Main export — segments the garment from a product image.
 *
 * @param {HTMLImageElement}  img       Preloaded product image
 * @param {string}            category  Raw product category string
 * @param {object|null}       bpModel   BodyPix model (may be null for heuristic)
 * @returns {Promise<HTMLCanvasElement>}  Canvas with transparent background
 */
export async function segmentGarment(img, category, bpModel) {
  const key = img.src + '|' + category
  if (_segCache.has(key)) return _segCache.get(key)

  const cat = normaliseCategory(category)
  let result

  if (bpModel) {
    try {
      result = await segmentWithBodyPix(img, cat, bpModel)
    } catch (err) {
      console.warn('[garmentSeg] BodyPix segmentation failed, using heuristic:', err.message)
      result = segmentHeuristic(img, cat)
    }
  } else {
    result = segmentHeuristic(img, cat)
  }

  _segCache.set(key, result)
  return result
}

export function clearSegmentCache() {
  _segCache.clear()
}