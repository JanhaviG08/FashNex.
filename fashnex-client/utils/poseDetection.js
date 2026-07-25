// src/utils/poseDetection.js
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";

let detector = null;

// MoveNet keypoint indices
export const KP = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

export async function loadDetector() {
  if (detector) return detector;

  await tf.ready();
  await tf.setBackend("webgl");

  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
      enableSmoothing: false, // we do our own smoothing
      minPoseScore: 0.25,
    }
  );

  return detector;
}

/**
 * Run inference on a video/canvas element.
 * Returns an array of keypoints [{x, y, score, name}] or null.
 */
export async function detectPose(videoEl) {
  if (!detector || !videoEl) return null;

  const poses = await detector.estimatePoses(videoEl, {
    maxPoses: 1,
    flipHorizontal: false,
  });

  if (!poses || poses.length === 0) return null;

  const { keypoints, score } = poses[0];
  if (score < 0.2) return null;

  return keypoints; // [{x, y, score, name}]
}

/**
 * Extract the landmarks we care about with confidence gating.
 * Returns null for any landmark below minScore.
 */
export function extractLandmarks(keypoints, minScore = 0.3) {
  const get = (idx) => {
    const kp = keypoints[idx];
    return kp && kp.score >= minScore ? { x: kp.x, y: kp.y, score: kp.score } : null;
  };

  return {
    nose: get(KP.NOSE),
    leftShoulder: get(KP.LEFT_SHOULDER),
    rightShoulder: get(KP.RIGHT_SHOULDER),
    leftHip: get(KP.LEFT_HIP),
    rightHip: get(KP.RIGHT_HIP),
    leftKnee: get(KP.LEFT_KNEE),
    rightKnee: get(KP.RIGHT_KNEE),
    leftAnkle: get(KP.LEFT_ANKLE),
    rightAnkle: get(KP.RIGHT_ANKLE),
    leftElbow: get(KP.LEFT_ELBOW),
    rightElbow: get(KP.RIGHT_ELBOW),
  };
}