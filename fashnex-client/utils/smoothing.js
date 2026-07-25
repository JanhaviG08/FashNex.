// src/utils/smoothing.js

/**
 * Exponential Moving Average (EMA) smoother for 2-D points.
 * Lower alpha  → more smoothing (more lag)
 * Higher alpha → less smoothing (more responsive)
 */
export class EMAPoint {
  constructor(alpha = 0.25) {
    this.alpha = alpha;
    this.prev = null;
  }

  update(pt) {
    if (!pt) { this.prev = null; return null; }
    if (!this.prev) { this.prev = { ...pt }; return this.prev; }

    this.prev = {
      x: this.alpha * pt.x + (1 - this.alpha) * this.prev.x,
      y: this.alpha * pt.y + (1 - this.alpha) * this.prev.y,
      score: pt.score,
    };
    return this.prev;
  }

  reset() { this.prev = null; }
}

/**
 * Scalar EMA — for smoothing widths, heights, angles, scales.
 */
export class EMAScalar {
  constructor(alpha = 0.2) {
    this.alpha = alpha;
    this.prev = null;
  }

  update(v) {
    if (v == null || isNaN(v)) return this.prev;
    if (this.prev == null) { this.prev = v; return v; }
    this.prev = this.alpha * v + (1 - this.alpha) * this.prev;
    return this.prev;
  }

  reset() { this.prev = null; }
}

/**
 * Landmark smoother — manages one EMAPoint per named landmark.
 */
export class LandmarkSmoother {
  constructor(alpha = 0.25) {
    this.alpha = alpha;
    this.smoothers = {};
  }

  update(landmarks) {
    const out = {};
    for (const [key, val] of Object.entries(landmarks)) {
      if (!this.smoothers[key]) this.smoothers[key] = new EMAPoint(this.alpha);
      out[key] = this.smoothers[key].update(val);
    }
    return out;
  }

  reset() {
    for (const s of Object.values(this.smoothers)) s.reset();
  }
}

/**
 * One-Euro filter for a scalar — better than pure EMA for fast vs slow motion.
 * Reduces lag during fast movement while still smoothing at rest.
 */
export class OneEuroScalar {
  constructor({ minCutoff = 1.0, beta = 0.007, dCutoff = 1.0 } = {}) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this._x = null;
    this._dx = null;
    this._lastTime = null;
  }

  _alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  update(x, timestamp = performance.now()) {
    if (this._lastTime == null) {
      this._x = x; this._dx = 0; this._lastTime = timestamp; return x;
    }
    const dt = Math.max((timestamp - this._lastTime) / 1000, 1e-6);
    this._lastTime = timestamp;

    const dxRaw = (x - this._x) / dt;
    const aDx = this._alpha(this.dCutoff, dt);
    this._dx = aDx * dxRaw + (1 - aDx) * this._dx;

    const cutoff = this.minCutoff + this.beta * Math.abs(this._dx);
    const a = this._alpha(cutoff, dt);
    this._x = a * x + (1 - a) * this._x;
    return this._x;
  }

  reset() { this._x = null; this._dx = null; this._lastTime = null; }
}