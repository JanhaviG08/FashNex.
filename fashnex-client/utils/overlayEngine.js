// src/utils/overlayEngine.js
import { EMAScalar, OneEuroScalar } from './smoothing';

// ─── Per-category fitting config ──────────────────────────────────────────────
const CATEGORY_CONFIG = {
  top: {
    anchorTop:    (lm) => midpoint(lm.leftShoulder,  lm.rightShoulder),
    anchorBottom: (lm) => midpoint(lm.leftHip,       lm.rightHip),
    widthLeft:    (lm) => lm.leftShoulder,
    widthRight:   (lm) => lm.rightShoulder,
    wScale: 1.18,
    hPadT:  0.10,
    hPadB:  0.08,
  },
  bottom: {
    anchorTop:    (lm) => midpoint(lm.leftHip,    lm.rightHip),
    anchorBottom: (lm) => midpoint(lm.leftAnkle,  lm.rightAnkle) || midpoint(lm.leftKnee, lm.rightKnee),
    widthLeft:    (lm) => lm.leftHip,
    widthRight:   (lm) => lm.rightHip,
    wScale: 1.20,
    hPadT:  0.02,
    hPadB:  0.05,
  },
  dress: {
    anchorTop:    (lm) => midpoint(lm.leftShoulder, lm.rightShoulder),
    anchorBottom: (lm) => midpoint(lm.leftAnkle,    lm.rightAnkle) || midpoint(lm.leftKnee, lm.rightKnee),
    widthLeft:    (lm) => lm.leftShoulder,
    widthRight:   (lm) => lm.rightShoulder,
    wScale: 1.22,
    hPadT:  0.10,
    hPadB:  0.05,
  },
  jacket: {
    anchorTop:    (lm) => midpoint(lm.leftShoulder, lm.rightShoulder),
    anchorBottom: (lm) => midpoint(lm.leftHip,      lm.rightHip),
    widthLeft:    (lm) => lm.leftShoulder,
    widthRight:   (lm) => lm.rightShoulder,
    wScale: 1.28,
    hPadT:  0.12,
    hPadB:  0.10,
  },
  hoodie: {
    anchorTop:    (lm) => midpoint(lm.leftShoulder, lm.rightShoulder),
    anchorBottom: (lm) => midpoint(lm.leftHip,      lm.rightHip),
    widthLeft:    (lm) => lm.leftShoulder,
    widthRight:   (lm) => lm.rightShoulder,
    wScale: 1.30,
    hPadT:  0.14,
    hPadB:  0.10,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function midpoint(a, b) {
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function dist(a, b) {
  if (!a || !b) return 0;
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angle(a, b) {
  if (!a || !b) return 0;
  return Math.atan2(b.y - a.y, b.x - a.x);
}

// ─── Transparent-bounds detection ─────────────────────────────────────────────

function getClothBounds(img) {
  const c   = document.createElement('canvas');
  c.width   = img.naturalWidth  || img.width;
  c.height  = img.naturalHeight || img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let minX = width, minY = height, maxX = 0, maxY = 0;
  const ALPHA = 10;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > ALPHA) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX) return { left: 0, top: 0, right: c.width, bottom: c.height };
  return { left: minX, top: minY, right: maxX, bottom: maxY };
}

const _boundsCache = new Map();
export function getClothBoundsCached(img) {
  const key = img.src || img._id || Math.random().toString();
  if (!_boundsCache.has(key)) _boundsCache.set(key, getClothBounds(img));
  return _boundsCache.get(key);
}

export function clearBoundsCache() { _boundsCache.clear(); }

// ─── Transform smoother ───────────────────────────────────────────────────────

class TransformSmoother {
  constructor() {
    this.x     = new OneEuroScalar({ minCutoff: 1.5, beta: 0.01 });
    this.y     = new OneEuroScalar({ minCutoff: 1.5, beta: 0.01 });
    this.w     = new EMAScalar(0.20);
    this.h     = new EMAScalar(0.20);
    this.angle = new EMAScalar(0.18);
  }
  update({ x, y, w, h, angle }) {
    return {
      x:     this.x.update(x),
      y:     this.y.update(y),
      w:     this.w.update(w),
      h:     this.h.update(h),
      angle: this.angle.update(angle),
    };
  }
  reset() {
    this.x.reset(); this.y.reset();
    this.w.reset(); this.h.reset(); this.angle.reset();
  }
}

const _transformSmoother = new TransformSmoother();

export function resetOverlaySmoother() { _transformSmoother.reset(); }

// ─── Main draw function ───────────────────────────────────────────────────────

/**
 * Draw the clothing overlay onto ctx.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement}         img          transparent-bg product image
 * @param {object}                   landmarks    named pixel-space landmarks
 * @param {string}                   category     top|bottom|dress|jacket|hoodie
 * @param {{ width, height }}        videoSize
 */
export function drawClothingOverlay(ctx, img, landmarks, category, videoSize) {
  if (!img || !landmarks) return;

  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.top;

  const topAnchor    = cfg.anchorTop(landmarks);
  const bottomAnchor = cfg.anchorBottom(landmarks);
  const wLeft        = cfg.widthLeft(landmarks);
  const wRight       = cfg.widthRight(landmarks);

  if (!topAnchor || !bottomAnchor || !wLeft || !wRight) return;

  const bodyWidth  = dist(wLeft, wRight);
  const bodyHeight = dist(topAnchor, bottomAnchor);
  if (bodyWidth < 10 || bodyHeight < 10) return;

  const clothW = bodyWidth  * cfg.wScale;
  const clothH = bodyHeight * (1 + cfg.hPadT + cfg.hPadB);

  const shoulderAngle = angle(landmarks.leftShoulder, landmarks.rightShoulder);

  const centerX = (topAnchor.x + bottomAnchor.x) / 2;
  const centerY = topAnchor.y + bodyHeight * (0.5 - cfg.hPadT);

  const T = _transformSmoother.update({
    x: centerX, y: centerY,
    w: clothW,  h: clothH,
    angle: shoulderAngle,
  });

  // Trim transparent padding from image
  const bounds  = getClothBoundsCached(img);
  const srcW    = bounds.right  - bounds.left;
  const srcH    = bounds.bottom - bounds.top;
  if (srcW <= 0 || srcH <= 0) return;

  // Maintain aspect ratio
  const srcAspect  = srcW / srcH;
  const bodyAspect = T.w  / T.h;
  let drawW = T.w, drawH = T.h;
  if (srcAspect > bodyAspect) { drawH = drawW / srcAspect; }
  else                        { drawW = drawH * srcAspect; }

  ctx.save();
  ctx.translate(T.x, T.y);
  ctx.rotate(T.angle);
  ctx.drawImage(
    img,
    bounds.left, bounds.top, srcW, srcH,
    -drawW / 2,  -drawH / 2, drawW, drawH,
  );
  ctx.restore();
}