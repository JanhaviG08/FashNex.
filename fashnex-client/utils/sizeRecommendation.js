// src/utils/sizeRecommendation.js

const SCALE_FACTOR = 1.0;

const SIZE_THRESHOLDS = [
  { size: 'XS', maxShoulderRatio: 0.22 },
  { size: 'S',  maxShoulderRatio: 0.27 },
  { size: 'M',  maxShoulderRatio: 0.32 },
  { size: 'L',  maxShoulderRatio: 0.37 },
  { size: 'XL', maxShoulderRatio: Infinity },
];

function dist(a, b) {
  if (!a || !b) return 0;
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function recommendSize(landmarks, videoSize) {
  const { leftShoulder, rightShoulder, leftHip, rightHip } = landmarks;
  if (!leftShoulder || !rightShoulder) {
    return { size: 'M', confidence: 'low', note: 'Shoulders not detected' };
  }

  const frameH        = videoSize.height;
  const shoulderPx    = dist(leftShoulder, rightShoulder) * SCALE_FACTOR;
  const hipPx         = dist(leftHip, rightHip)          * SCALE_FACTOR;
  const midShoulder   = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const midHip        = leftHip && rightHip
    ? { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 }
    : { x: midShoulder.x, y: midShoulder.y + shoulderPx };
  const torsoPx       = dist(midShoulder, midHip) * SCALE_FACTOR;
  const shoulderRatio = shoulderPx / frameH;

  let size = 'M';
  for (const t of SIZE_THRESHOLDS) {
    if (shoulderRatio <= t.maxShoulderRatio) { size = t.size; break; }
  }

  const confidence = shoulderRatio > 0.15 && shoulderRatio < 0.55 ? 'high' : 'low';

  return {
    size,
    shoulderWidthPx: Math.round(shoulderPx),
    torsoHeightPx:   Math.round(torsoPx),
    hipWidthPx:      Math.round(hipPx),
    shoulderRatio:   +shoulderRatio.toFixed(3),
    confidence,
  };
}