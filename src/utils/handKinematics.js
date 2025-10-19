/**
 * Hand Kinematics Module
 * Converts MediaPipe hand landmarks (3D positions) to joint rotations (angles)
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
 * Calculate angle between three points (joint angle)
 * @param {Object} p1 - Point 1 {x, y, z}
 * @param {Object} p2 - Point 2 (joint center) {x, y, z}
 * @param {Object} p3 - Point 3 {x, y, z}
 * @returns {number} - Angle in radians
 */
function calculateAngleBetweenPoints(p1, p2, p3) {
  const v1 = new THREE.Vector3(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z)
  const v2 = new THREE.Vector3(p3.x - p2.x, p3.y - p2.y, p3.z - p2.z)

  v1.normalize()
  v2.normalize()

  // Get angle between vectors
  let angle = v1.angleTo(v2)

  // The angle from angleTo is always positive, but we want to preserve direction
  // For finger flexion, we want 0 = straight, positive = bent
  // This is a simplification - more sophisticated methods would use cross products
  return angle
}

/**
 * Calculate curl angle for a finger (flexion/extension)
 * Returns 0 for straight finger, positive for bent finger
 * @param {Array} landmarks - All hand landmarks
 * @param {number} baseIdx - Base landmark index
 * @param {number} midIdx - Middle landmark index
 * @param {number} tipIdx - Tip landmark index
 * @returns {number} - Curl angle in radians
 */
function calculateFingerCurl(landmarks, baseIdx, midIdx, tipIdx) {
  const base = landmarks[baseIdx]
  const mid = landmarks[midIdx]
  const tip = landmarks[tipIdx]

  // Calculate angle - when finger is straight, angle ≈ π (180°)
  // When bent, angle decreases
  const angle = calculateAngleBetweenPoints(base, mid, tip)

  // Convert to curl: 0 = straight, positive = curled
  // π - angle gives us the curl amount
  const curl = Math.PI - angle

  return Math.max(0, curl) // Clamp to prevent negative values
}

/**
 * Calculate finger spread/abduction angle
 * @param {Array} landmarks - All hand landmarks
 * @param {number} fingerMcpIdx - Finger MCP landmark index
 * @param {number} referenceMcpIdx - Reference finger MCP landmark index
 * @returns {number} - Spread angle in radians
 */
function calculateFingerSpread(landmarks, fingerMcpIdx, referenceMcpIdx) {
  const wrist = landmarks[LANDMARKS.WRIST]
  const fingerMcp = landmarks[fingerMcpIdx]
  const referenceMcp = landmarks[referenceMcpIdx]

  const v1 = new THREE.Vector3(
    fingerMcp.x - wrist.x,
    fingerMcp.y - wrist.y,
    fingerMcp.z - wrist.z
  )

  const v2 = new THREE.Vector3(
    referenceMcp.x - wrist.x,
    referenceMcp.y - wrist.y,
    referenceMcp.z - wrist.z
  )

  v1.normalize()
  v2.normalize()

  return v1.angleTo(v2)
}

/**
 * Convert MediaPipe landmarks to joint rotations
 * @param {Array} landmarks - MediaPipe hand landmarks (21 points)
 * @param {string} handedness - 'Left' or 'Right'
 * @returns {Object} - Joint rotations in radians {joint_name: angle}
 */
export function landmarksToJointRotations(landmarks, handedness = 'Right') {
  if (!landmarks || landmarks.length !== 21) {
    console.warn('Invalid landmarks: expected 21 points')
    return {}
  }

  const rotations = {}

  // THUMB - Special handling due to different anatomy
  // Thumb has CMC (carpometacarpal) which provides opposition
  const thumbCmcCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.WRIST,
    LANDMARKS.THUMB_CMC,
    LANDMARKS.THUMB_MCP
  )
  const thumbMcpCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.THUMB_CMC,
    LANDMARKS.THUMB_MCP,
    LANDMARKS.THUMB_IP
  )
  const thumbIpCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.THUMB_MCP,
    LANDMARKS.THUMB_IP,
    LANDMARKS.THUMB_TIP
  )

  // Thumb opposition/abduction (angle relative to index finger)
  const thumbAbduction = calculateFingerSpread(
    landmarks,
    LANDMARKS.THUMB_MCP,
    LANDMARKS.INDEX_MCP
  )

  rotations.thumb_mcp = thumbMcpCurl
  rotations.thumb_pip = thumbIpCurl
  rotations.thumb_dip = thumbIpCurl * 0.8 // DIP typically follows IP
  rotations.thumb_tip = thumbIpCurl * 0.5

  // INDEX FINGER
  const indexMcpCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.WRIST,
    LANDMARKS.INDEX_MCP,
    LANDMARKS.INDEX_PIP
  )
  const indexPipCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.INDEX_MCP,
    LANDMARKS.INDEX_PIP,
    LANDMARKS.INDEX_DIP
  )
  const indexDipCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.INDEX_PIP,
    LANDMARKS.INDEX_DIP,
    LANDMARKS.INDEX_TIP
  )

  rotations.index_mcp = indexMcpCurl
  rotations.index_pip = indexPipCurl
  rotations.index_dip = indexDipCurl
  rotations.index_tip = indexDipCurl * 0.7

  // MIDDLE FINGER
  const middleMcpCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.WRIST,
    LANDMARKS.MIDDLE_MCP,
    LANDMARKS.MIDDLE_PIP
  )
  const middlePipCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.MIDDLE_MCP,
    LANDMARKS.MIDDLE_PIP,
    LANDMARKS.MIDDLE_DIP
  )
  const middleDipCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.MIDDLE_PIP,
    LANDMARKS.MIDDLE_DIP,
    LANDMARKS.MIDDLE_TIP
  )

  rotations.middle_mcp = middleMcpCurl
  rotations.middle_pip = middlePipCurl
  rotations.middle_dip = middleDipCurl
  rotations.middle_tip = middleDipCurl * 0.7

  // RING FINGER
  const ringMcpCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.WRIST,
    LANDMARKS.RING_MCP,
    LANDMARKS.RING_PIP
  )
  const ringPipCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.RING_MCP,
    LANDMARKS.RING_PIP,
    LANDMARKS.RING_DIP
  )
  const ringDipCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.RING_PIP,
    LANDMARKS.RING_DIP,
    LANDMARKS.RING_TIP
  )

  rotations.ring_mcp = ringMcpCurl
  rotations.ring_pip = ringPipCurl
  rotations.ring_dip = ringDipCurl
  rotations.ring_tip = ringDipCurl * 0.7

  // PINKY FINGER
  const pinkyMcpCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.WRIST,
    LANDMARKS.PINKY_MCP,
    LANDMARKS.PINKY_PIP
  )
  const pinkyPipCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.PINKY_MCP,
    LANDMARKS.PINKY_PIP,
    LANDMARKS.PINKY_DIP
  )
  const pinkyDipCurl = calculateFingerCurl(
    landmarks,
    LANDMARKS.PINKY_PIP,
    LANDMARKS.PINKY_DIP,
    LANDMARKS.PINKY_TIP
  )

  rotations.pinky_mcp = pinkyMcpCurl
  rotations.pinky_pip = pinkyPipCurl
  rotations.pinky_dip = pinkyDipCurl
  rotations.pinky_tip = pinkyDipCurl * 0.7

  // WRIST
  // For now, set wrist to 0 (can be enhanced with wrist pose estimation)
  rotations.wrist = 0

  return rotations
}

/**
 * Get hand pose name based on joint angles (for debugging/visualization)
 * @param {Object} rotations - Joint rotations
 * @returns {string} - Pose name
 */
export function detectHandPose(rotations) {
  const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky']
  const curls = fingers.map(finger => rotations[`${finger}_mcp`] || 0)

  const avgCurl = curls.reduce((sum, curl) => sum + curl, 0) / curls.length

  if (avgCurl < 0.2) return 'OPEN_HAND'
  if (avgCurl > 2.5) return 'FIST'
  if (curls[1] < 0.3 && avgCurl > 1.5) return 'POINTING'

  return 'CUSTOM'
}

/**
 * Interpolate between two rotation states (for smooth transitions)
 * @param {Object} from - Starting rotations
 * @param {Object} to - Target rotations
 * @param {number} alpha - Interpolation factor (0-1)
 * @returns {Object} - Interpolated rotations
 */
export function interpolateRotations(from, to, alpha) {
  const result = {}

  for (const joint in to) {
    const fromValue = from[joint] || 0
    const toValue = to[joint] || 0
    result[joint] = fromValue + (toValue - fromValue) * alpha
  }

  return result
}
