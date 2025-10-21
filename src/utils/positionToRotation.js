/**
 * Position to Rotation Converter
 * Converts MediaPipe hand landmark positions (3D coordinates) to 3-axis rotation angles
 *
 * This module calculates pitch, yaw, and roll angles for each joint based on
 * the spatial relationships between consecutive landmarks.
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
 * Calculate 3-axis rotation angles from three consecutive landmarks
 * @param {Object} proximal - Base landmark {x, y, z}
 * @param {Object} middle - Middle landmark (joint center) {x, y, z}
 * @param {Object} distal - End landmark {x, y, z}
 * @param {THREE.Vector3} referenceUp - Reference "up" direction for the hand
 * @returns {Object} - Rotation angles {pitch, yaw, roll} in radians
 */
function calculateJointRotation3D(proximal, middle, distal, referenceUp) {
  // Create vectors
  const proximalVec = new THREE.Vector3(proximal.x, proximal.y, proximal.z)
  const middleVec = new THREE.Vector3(middle.x, middle.y, middle.z)
  const distalVec = new THREE.Vector3(distal.x, distal.y, distal.z)

  // Calculate bone direction vectors
  const boneIn = new THREE.Vector3().subVectors(middleVec, proximalVec).normalize()
  const boneOut = new THREE.Vector3().subVectors(distalVec, middleVec).normalize()

  // PITCH: Flexion/Extension angle (bending up/down)
  // This is the angle between the two bone segments
  const pitch = Math.PI - boneIn.angleTo(boneOut)

  // YAW: Lateral deviation (side-to-side movement)
  // Calculate the lateral component using cross product with reference up
  const lateralAxis = new THREE.Vector3().crossVectors(boneIn, referenceUp).normalize()
  const yawComponent = boneOut.dot(lateralAxis)
  const yaw = Math.asin(Math.max(-1, Math.min(1, yawComponent)))

  // ROLL: Axial rotation (twist around bone axis)
  // Calculate rotation around the bone axis
  const rollAxis = boneOut.clone()
  const perpendicularToBone = new THREE.Vector3().crossVectors(boneOut, referenceUp).normalize()
  const rollReference = new THREE.Vector3().crossVectors(rollAxis, perpendicularToBone).normalize()
  const rollComponent = referenceUp.dot(rollReference)
  const roll = Math.asin(Math.max(-1, Math.min(1, rollComponent)))

  return { pitch, yaw, roll }
}

/**
 * Calculate wrist 3-axis rotation from hand landmarks
 * @param {Array} landmarks - MediaPipe hand landmarks
 * @param {string} handedness - 'Left' or 'Right'
 * @returns {Object} - Rotation angles {pitch, yaw, roll} in radians
 */
function calculateWristRotation3D(landmarks, handedness = 'Right') {
  if (!landmarks || landmarks.length !== 21) {
    return { pitch: 0, yaw: 0, roll: 0 }
  }

  const wrist = landmarks[LANDMARKS.WRIST]
  const indexMcp = landmarks[LANDMARKS.INDEX_MCP]
  const middleMcp = landmarks[LANDMARKS.MIDDLE_MCP]
  const pinkyMcp = landmarks[LANDMARKS.PINKY_MCP]

  // Create vectors for palm orientation
  const wristVec = new THREE.Vector3(wrist.x, wrist.y, wrist.z)
  const indexVec = new THREE.Vector3(indexMcp.x, indexMcp.y, indexMcp.z)
  const middleVec = new THREE.Vector3(middleMcp.x, middleMcp.y, middleMcp.z)
  const pinkyVec = new THREE.Vector3(pinkyMcp.x, pinkyMcp.y, pinkyMcp.z)

  // Calculate palm forward (toward fingers) and right vectors
  const palmForward = new THREE.Vector3().subVectors(middleVec, wristVec).normalize()
  const palmRight = new THREE.Vector3().subVectors(indexVec, pinkyVec).normalize()
  const palmNormal = new THREE.Vector3().crossVectors(palmForward, palmRight).normalize()

  // Build rotation matrix
  const rotationMatrix = new THREE.Matrix4()
  rotationMatrix.makeBasis(
    palmRight,
    palmNormal.clone().negate(),
    palmForward
  )

  // Extract Euler angles
  const euler = new THREE.Euler()
  euler.setFromRotationMatrix(rotationMatrix, 'XYZ')

  let { x: pitch, y: yaw, z: roll } = euler

  // Apply hand-specific corrections
  if (handedness === 'Left') {
    roll = -roll
    pitch = -pitch
  }

  return { pitch, yaw, roll }
}

/**
 * Convert MediaPipe landmarks to 3-axis joint rotations
 * @param {Array} landmarks - MediaPipe hand landmarks (21 points)
 * @param {string} handedness - 'Left' or 'Right'
 * @returns {Object} - All joint rotations with {pitch, yaw, roll} for each
 */
export function landmarksToRotations3D(landmarks, handedness = 'Right') {
  if (!landmarks || landmarks.length !== 21) {
    console.warn('Invalid landmarks: expected 21 points')
    return null
  }

  const rotations = {}

  // Calculate reference "up" direction for the hand (from wrist to middle finger base)
  const wrist = landmarks[LANDMARKS.WRIST]
  const middleMcp = landmarks[LANDMARKS.MIDDLE_MCP]
  const referenceUp = new THREE.Vector3(
    middleMcp.x - wrist.x,
    middleMcp.y - wrist.y,
    middleMcp.z - wrist.z
  ).normalize()

  // WRIST rotation
  rotations.wrist = calculateWristRotation3D(landmarks, handedness)

  // THUMB joints
  rotations.thumb_mcp = calculateJointRotation3D(
    landmarks[LANDMARKS.THUMB_CMC],
    landmarks[LANDMARKS.THUMB_MCP],
    landmarks[LANDMARKS.THUMB_IP],
    referenceUp
  )
  rotations.thumb_pip = calculateJointRotation3D(
    landmarks[LANDMARKS.THUMB_MCP],
    landmarks[LANDMARKS.THUMB_IP],
    landmarks[LANDMARKS.THUMB_TIP],
    referenceUp
  )
  rotations.thumb_dip = { ...rotations.thumb_pip } // Thumb DIP follows IP
  rotations.thumb_tip = { pitch: rotations.thumb_pip.pitch * 0.5, yaw: 0, roll: 0 }

  // INDEX finger joints
  rotations.index_mcp = calculateJointRotation3D(
    landmarks[LANDMARKS.WRIST],
    landmarks[LANDMARKS.INDEX_MCP],
    landmarks[LANDMARKS.INDEX_PIP],
    referenceUp
  )
  rotations.index_pip = calculateJointRotation3D(
    landmarks[LANDMARKS.INDEX_MCP],
    landmarks[LANDMARKS.INDEX_PIP],
    landmarks[LANDMARKS.INDEX_DIP],
    referenceUp
  )
  rotations.index_dip = calculateJointRotation3D(
    landmarks[LANDMARKS.INDEX_PIP],
    landmarks[LANDMARKS.INDEX_DIP],
    landmarks[LANDMARKS.INDEX_TIP],
    referenceUp
  )
  rotations.index_tip = { pitch: rotations.index_dip.pitch * 0.7, yaw: 0, roll: 0 }

  // MIDDLE finger joints
  rotations.middle_mcp = calculateJointRotation3D(
    landmarks[LANDMARKS.WRIST],
    landmarks[LANDMARKS.MIDDLE_MCP],
    landmarks[LANDMARKS.MIDDLE_PIP],
    referenceUp
  )
  rotations.middle_pip = calculateJointRotation3D(
    landmarks[LANDMARKS.MIDDLE_MCP],
    landmarks[LANDMARKS.MIDDLE_PIP],
    landmarks[LANDMARKS.MIDDLE_DIP],
    referenceUp
  )
  rotations.middle_dip = calculateJointRotation3D(
    landmarks[LANDMARKS.MIDDLE_PIP],
    landmarks[LANDMARKS.MIDDLE_DIP],
    landmarks[LANDMARKS.MIDDLE_TIP],
    referenceUp
  )
  rotations.middle_tip = { pitch: rotations.middle_dip.pitch * 0.7, yaw: 0, roll: 0 }

  // RING finger joints
  rotations.ring_mcp = calculateJointRotation3D(
    landmarks[LANDMARKS.WRIST],
    landmarks[LANDMARKS.RING_MCP],
    landmarks[LANDMARKS.RING_PIP],
    referenceUp
  )
  rotations.ring_pip = calculateJointRotation3D(
    landmarks[LANDMARKS.RING_MCP],
    landmarks[LANDMARKS.RING_PIP],
    landmarks[LANDMARKS.RING_DIP],
    referenceUp
  )
  rotations.ring_dip = calculateJointRotation3D(
    landmarks[LANDMARKS.RING_PIP],
    landmarks[LANDMARKS.RING_DIP],
    landmarks[LANDMARKS.RING_TIP],
    referenceUp
  )
  rotations.ring_tip = { pitch: rotations.ring_dip.pitch * 0.7, yaw: 0, roll: 0 }

  // PINKY finger joints
  rotations.pinky_mcp = calculateJointRotation3D(
    landmarks[LANDMARKS.WRIST],
    landmarks[LANDMARKS.PINKY_MCP],
    landmarks[LANDMARKS.PINKY_PIP],
    referenceUp
  )
  rotations.pinky_pip = calculateJointRotation3D(
    landmarks[LANDMARKS.PINKY_MCP],
    landmarks[LANDMARKS.PINKY_PIP],
    landmarks[LANDMARKS.PINKY_DIP],
    referenceUp
  )
  rotations.pinky_dip = calculateJointRotation3D(
    landmarks[LANDMARKS.PINKY_PIP],
    landmarks[LANDMARKS.PINKY_DIP],
    landmarks[LANDMARKS.PINKY_TIP],
    referenceUp
  )
  rotations.pinky_tip = { pitch: rotations.pinky_dip.pitch * 0.7, yaw: 0, roll: 0 }

  return rotations
}
