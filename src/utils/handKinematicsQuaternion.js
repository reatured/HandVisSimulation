/**
 * Quaternion-Based Hand Kinematics Module
 * Converts MediaPipe hand landmarks to quaternion rotations for each joint
 *
 * This module creates full 3D quaternion representations of hand pose,
 * which can then be decomposed to extract rotation angles along specific axes
 * as defined in the URDF model.
 *
 * MediaPipe provides 21 3D landmarks per hand:
 * 0: WRIST
 * 1-4: THUMB (CMC, MCP, IP, TIP)
 * 5-8: INDEX (MCP, PIP, DIP, TIP)
 * 9-12: MIDDLE (MCP, PIP, DIP, TIP)
 * 13-16: RING (MCP, PIP, DIP, TIP)
 * 17-20: PINKY (MCP, PIP, DIP, TIP)
 */

import * as THREE from 'three'

// MediaPipe landmark indices
const LANDMARKS = {
  WRIST: 0,

  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,

  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,

  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,

  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,

  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
}

/**
 * Build a quaternion from three consecutive landmarks
 * Creates a local coordinate frame and converts to quaternion
 *
 * @param {Object} base - Base landmark {x, y, z}
 * @param {Object} mid - Middle landmark (joint location) {x, y, z}
 * @param {Object} tip - Tip landmark (direction) {x, y, z}
 * @param {THREE.Vector3} upReference - Reference up vector for disambiguation
 * @returns {THREE.Quaternion} - Quaternion representing the rotation
 */
function buildQuaternionFromLandmarks(base, mid, tip, upReference = new THREE.Vector3(0, 1, 0)) {
  // Convert landmarks to Three.js vectors
  const vBase = new THREE.Vector3(base.x, base.y, base.z)
  const vMid = new THREE.Vector3(mid.x, mid.y, mid.z)
  const vTip = new THREE.Vector3(tip.x, tip.y, tip.z)

  // Build local coordinate frame
  // Forward: direction from mid to tip (along the bone)
  const forward = new THREE.Vector3().subVectors(vTip, vMid).normalize()

  // Backward: direction from mid to base (for better orientation)
  const backward = new THREE.Vector3().subVectors(vBase, vMid).normalize()

  // Right: perpendicular to forward and backward
  const right = new THREE.Vector3().crossVectors(forward, upReference).normalize()

  // If right vector is too small, use backward vector
  if (right.length() < 0.1) {
    right.crossVectors(forward, backward).normalize()
  }

  // Up: perpendicular to forward and right (complete orthonormal basis)
  const up = new THREE.Vector3().crossVectors(right, forward).normalize()

  // Create rotation matrix from basis vectors
  const rotationMatrix = new THREE.Matrix4()
  rotationMatrix.makeBasis(right, up, forward)

  // Extract quaternion from rotation matrix
  const quaternion = new THREE.Quaternion()
  quaternion.setFromRotationMatrix(rotationMatrix)

  return quaternion
}

/**
 * Calculate wrist orientation quaternion from palm landmarks
 * Uses wrist (0), index MCP (5), middle MCP (9), and pinky MCP (17) to define palm plane
 *
 * @param {Array} landmarks - All hand landmarks
 * @returns {THREE.Quaternion} - Wrist orientation quaternion
 */
function calculateWristQuaternion(landmarks) {
  const wrist = landmarks[LANDMARKS.WRIST]
  const indexMCP = landmarks[LANDMARKS.INDEX_MCP]
  const middleMCP = landmarks[LANDMARKS.MIDDLE_MCP]
  const pinkyMCP = landmarks[LANDMARKS.PINKY_MCP]

  // Convert to Three.js vectors
  const vWrist = new THREE.Vector3(wrist.x, wrist.y, wrist.z)
  const vIndex = new THREE.Vector3(indexMCP.x, indexMCP.y, indexMCP.z)
  const vMiddle = new THREE.Vector3(middleMCP.x, middleMCP.y, middleMCP.z)
  const vPinky = new THREE.Vector3(pinkyMCP.x, pinkyMCP.y, pinkyMCP.z)

  // Palm forward: from wrist toward middle finger
  const palmForward = new THREE.Vector3().subVectors(vMiddle, vWrist).normalize()

  // Palm right: from pinky to index (across the palm)
  const palmRight = new THREE.Vector3().subVectors(vIndex, vPinky).normalize()

  // Palm normal: perpendicular to palm plane (points out of palm)
  const palmNormal = new THREE.Vector3().crossVectors(palmForward, palmRight).normalize()

  // Recompute palm right to ensure orthogonality
  palmRight.crossVectors(palmNormal, palmForward).normalize()

  // Build rotation matrix
  const rotationMatrix = new THREE.Matrix4()
  rotationMatrix.makeBasis(palmRight, palmForward, palmNormal)

  // Extract quaternion
  const quaternion = new THREE.Quaternion()
  quaternion.setFromRotationMatrix(rotationMatrix)

  return quaternion
}

/**
 * Calculate thumb quaternions
 * Returns quaternions for CMC (carpometacarpal) and MCP (metacarpophalangeal) joints
 *
 * @param {Array} landmarks - All hand landmarks
 * @returns {Object} - Thumb quaternions {cmc, mcp}
 */
function calculateThumbQuaternions(landmarks) {
  const wrist = landmarks[LANDMARKS.WRIST]
  const cmc = landmarks[LANDMARKS.THUMB_CMC]
  const mcp = landmarks[LANDMARKS.THUMB_MCP]
  const ip = landmarks[LANDMARKS.THUMB_IP]
  const tip = landmarks[LANDMARKS.THUMB_TIP]

  return {
    // CMC joint: from wrist to CMC to MCP
    cmc: buildQuaternionFromLandmarks(wrist, cmc, mcp),
    // MCP joint: from CMC to MCP to IP
    mcp: buildQuaternionFromLandmarks(cmc, mcp, ip),
    // IP joint: from MCP to IP to TIP
    ip: buildQuaternionFromLandmarks(mcp, ip, tip),
  }
}

/**
 * Calculate finger quaternions for a single finger
 *
 * @param {Array} landmarks - All hand landmarks
 * @param {number} mcpIdx - MCP landmark index
 * @param {number} pipIdx - PIP landmark index
 * @param {number} dipIdx - DIP landmark index
 * @param {number} tipIdx - TIP landmark index
 * @returns {Object} - Finger quaternions {mcp, pip, dip}
 */
function calculateFingerQuaternions(landmarks, mcpIdx, pipIdx, dipIdx, tipIdx) {
  const wrist = landmarks[LANDMARKS.WRIST]
  const mcp = landmarks[mcpIdx]
  const pip = landmarks[pipIdx]
  const dip = landmarks[dipIdx]
  const tip = landmarks[tipIdx]

  return {
    // MCP joint: from wrist to MCP to PIP
    mcp: buildQuaternionFromLandmarks(wrist, mcp, pip),
    // PIP joint: from MCP to PIP to DIP
    pip: buildQuaternionFromLandmarks(mcp, pip, dip),
    // DIP joint: from PIP to DIP to TIP
    dip: buildQuaternionFromLandmarks(pip, dip, tip),
  }
}

/**
 * Main function: Convert MediaPipe landmarks to quaternion rotations
 *
 * @param {Array} landmarks - Array of 21 hand landmarks {x, y, z}
 * @param {string} handedness - 'Left' or 'Right'
 * @returns {Object} - Quaternion rotations for all joints
 */
export function landmarksToQuaternions(landmarks, handedness = 'Right') {
  if (!landmarks || landmarks.length !== 21) {
    console.warn('Invalid landmarks: expected 21 landmarks')
    return null
  }

  // Calculate wrist orientation
  const wrist = calculateWristQuaternion(landmarks)

  // Calculate thumb quaternions
  const thumb = calculateThumbQuaternions(landmarks)

  // Calculate finger quaternions
  const index = calculateFingerQuaternions(
    landmarks,
    LANDMARKS.INDEX_MCP,
    LANDMARKS.INDEX_PIP,
    LANDMARKS.INDEX_DIP,
    LANDMARKS.INDEX_TIP
  )

  const middle = calculateFingerQuaternions(
    landmarks,
    LANDMARKS.MIDDLE_MCP,
    LANDMARKS.MIDDLE_PIP,
    LANDMARKS.MIDDLE_DIP,
    LANDMARKS.MIDDLE_TIP
  )

  const ring = calculateFingerQuaternions(
    landmarks,
    LANDMARKS.RING_MCP,
    LANDMARKS.RING_PIP,
    LANDMARKS.RING_DIP,
    LANDMARKS.RING_TIP
  )

  const pinky = calculateFingerQuaternions(
    landmarks,
    LANDMARKS.PINKY_MCP,
    LANDMARKS.PINKY_PIP,
    LANDMARKS.PINKY_DIP,
    LANDMARKS.PINKY_TIP
  )

  // Handle handedness (mirror for left hand)
  if (handedness === 'Left') {
    // For left hand, mirror the quaternions around the YZ plane
    // This is done by negating the X and W components
    const mirrorQuaternion = (q) => {
      const mirrored = q.clone()
      mirrored.x = -mirrored.x
      mirrored.w = -mirrored.w
      return mirrored
    }

    return {
      wrist: mirrorQuaternion(wrist),
      thumb: {
        cmc: mirrorQuaternion(thumb.cmc),
        mcp: mirrorQuaternion(thumb.mcp),
        ip: mirrorQuaternion(thumb.ip),
      },
      index: {
        mcp: mirrorQuaternion(index.mcp),
        pip: mirrorQuaternion(index.pip),
        dip: mirrorQuaternion(index.dip),
      },
      middle: {
        mcp: mirrorQuaternion(middle.mcp),
        pip: mirrorQuaternion(middle.pip),
        dip: mirrorQuaternion(middle.dip),
      },
      ring: {
        mcp: mirrorQuaternion(ring.mcp),
        pip: mirrorQuaternion(ring.pip),
        dip: mirrorQuaternion(ring.dip),
      },
      pinky: {
        mcp: mirrorQuaternion(pinky.mcp),
        pip: mirrorQuaternion(pinky.pip),
        dip: mirrorQuaternion(pinky.dip),
      },
    }
  }

  // Return quaternions for right hand (or default)
  return {
    wrist,
    thumb: {
      cmc: thumb.cmc,
      mcp: thumb.mcp,
      ip: thumb.ip,
    },
    index: {
      mcp: index.mcp,
      pip: index.pip,
      dip: index.dip,
    },
    middle: {
      mcp: middle.mcp,
      pip: middle.pip,
      dip: middle.dip,
    },
    ring: {
      mcp: ring.mcp,
      pip: ring.pip,
      dip: ring.dip,
    },
    pinky: {
      mcp: pinky.mcp,
      pip: pinky.pip,
      dip: pinky.dip,
    },
  }
}

/**
 * Get wrist position from landmarks
 * @param {Array} landmarks - Array of 21 hand landmarks
 * @returns {Object} - Wrist position {x, y, z}
 */
export function getWristPosition(landmarks) {
  if (!landmarks || landmarks.length !== 21) {
    return { x: 0, y: 0, z: 0 }
  }

  const wrist = landmarks[LANDMARKS.WRIST]
  return {
    x: (wrist.x - 0.5) * 2, // Convert from [0,1] to [-1,1]
    y: -(wrist.y - 0.5) * 2, // Invert Y axis
    z: -wrist.z * 2, // Invert Z axis
  }
}

export default {
  landmarksToQuaternions,
  getWristPosition,
}
