/**
 * Quaternion to Axis Angles Decomposition
 *
 * This module takes quaternions from handKinematicsQuaternion.js and decomposes them
 * to extract rotation angles along specific axes as defined in the URDF model.
 *
 * Linker L6 URDF Joint Axes:
 * - Y-axis [0, 1, 0]: All finger MCP and DIP joints (8 joints)
 * - Z-axis [0, 0, 1]: Thumb CMC roll (1 joint)
 * - -X-axis [-1, 0, 0]: Thumb CMC pitch and DIP (2 joints)
 */

import * as THREE from 'three'

/**
 * Extract rotation angle around a specific axis from a quaternion
 *
 * @param {THREE.Quaternion} quaternion - Input quaternion
 * @param {THREE.Vector3} axis - Axis to extract rotation around (normalized)
 * @returns {number} - Rotation angle in radians around the specified axis
 */
export function extractAxisRotation(quaternion, axis) {
  // Ensure quaternion is normalized
  const q = quaternion.clone().normalize()

  // Convert quaternion to rotation matrix
  const matrix = new THREE.Matrix4()
  matrix.makeRotationFromQuaternion(q)

  // Extract Euler angles using XYZ order
  const euler = new THREE.Euler()
  euler.setFromRotationMatrix(matrix, 'XYZ')

  // Determine which axis to extract
  const axisNormalized = axis.clone().normalize()

  // Check which axis this is (with tolerance for floating point)
  const tolerance = 0.1

  // X-axis [1, 0, 0] or [-1, 0, 0]
  if (Math.abs(axisNormalized.x) > 1 - tolerance && Math.abs(axisNormalized.y) < tolerance && Math.abs(axisNormalized.z) < tolerance) {
    return axisNormalized.x > 0 ? euler.x : -euler.x
  }

  // Y-axis [0, 1, 0] or [0, -1, 0]
  if (Math.abs(axisNormalized.x) < tolerance && Math.abs(axisNormalized.y) > 1 - tolerance && Math.abs(axisNormalized.z) < tolerance) {
    return axisNormalized.y > 0 ? euler.y : -euler.y
  }

  // Z-axis [0, 0, 1] or [0, 0, -1]
  if (Math.abs(axisNormalized.x) < tolerance && Math.abs(axisNormalized.y) < tolerance && Math.abs(axisNormalized.z) > 1 - tolerance) {
    return axisNormalized.z > 0 ? euler.z : -euler.z
  }

  // For arbitrary axes, project the rotation onto the axis
  // This is more complex and uses rotation vector decomposition
  return projectRotationOntoAxis(q, axisNormalized)
}

/**
 * Project a quaternion rotation onto an arbitrary axis
 * Uses the rotation vector (axis-angle) representation
 *
 * @param {THREE.Quaternion} quaternion - Input quaternion (normalized)
 * @param {THREE.Vector3} targetAxis - Axis to project onto (normalized)
 * @returns {number} - Rotation angle in radians around the target axis
 */
function projectRotationOntoAxis(quaternion, targetAxis) {
  // Extract axis-angle from quaternion
  // For quaternion q = [w, x, y, z] = [cos(θ/2), sin(θ/2)*ax, sin(θ/2)*ay, sin(θ/2)*az]
  const w = quaternion.w
  const x = quaternion.x
  const y = quaternion.y
  const z = quaternion.z

  // Half angle
  const halfAngle = Math.acos(Math.max(-1, Math.min(1, w)))
  const sinHalfAngle = Math.sin(halfAngle)

  // If angle is very small, no rotation
  if (Math.abs(sinHalfAngle) < 0.001) {
    return 0
  }

  // Rotation axis
  const rotationAxis = new THREE.Vector3(x / sinHalfAngle, y / sinHalfAngle, z / sinHalfAngle)
  rotationAxis.normalize()

  // Full rotation angle
  const angle = 2 * halfAngle

  // Project rotation axis onto target axis
  const projection = rotationAxis.dot(targetAxis)

  // The component of rotation around the target axis
  return angle * projection
}

/**
 * Convert quaternion hand data to Linker L6 URDF joint angles
 * Maps quaternions to the specific axes defined in the URDF
 *
 * @param {Object} quaternions - Quaternion data from landmarksToQuaternions()
 * @returns {Object} - Joint angles in radians matching URDF joint names
 */
export function quaternionsToLinkerL6Joints(quaternions) {
  if (!quaternions) {
    return {}
  }

  const joints = {}

  // Define axes (as per URDF)
  const Y_AXIS = new THREE.Vector3(0, 1, 0)
  const Z_AXIS = new THREE.Vector3(0, 0, 1)
  const NEG_X_AXIS = new THREE.Vector3(-1, 0, 0)

  // Thumb joints
  if (quaternions.thumb) {
    // thunb_cmc_roll (typo in URDF): Z-axis rotation
    if (quaternions.thumb.cmc) {
      joints.thunb_cmc_roll = extractAxisRotation(quaternions.thumb.cmc, Z_AXIS)
    }

    // thumb_cmc_pitch: -X-axis rotation
    if (quaternions.thumb.mcp) {
      joints.thumb_cmc_pitch = extractAxisRotation(quaternions.thumb.mcp, NEG_X_AXIS)
    }

    // thumb_dip: -X-axis rotation (mimics thumb_cmc_pitch × 2.22 in URDF, but we'll set it anyway)
    if (quaternions.thumb.ip) {
      joints.thumb_dip = extractAxisRotation(quaternions.thumb.ip, NEG_X_AXIS)
    }
  }

  // Index finger: Y-axis rotations
  if (quaternions.index) {
    if (quaternions.index.mcp) {
      joints.index_mcp_pitch = extractAxisRotation(quaternions.index.mcp, Y_AXIS)
    }
    if (quaternions.index.pip) {
      joints.index_dip = extractAxisRotation(quaternions.index.pip, Y_AXIS)
    }
  }

  // Middle finger: Y-axis rotations
  if (quaternions.middle) {
    if (quaternions.middle.mcp) {
      joints.middle_mcp_pitch = extractAxisRotation(quaternions.middle.mcp, Y_AXIS)
    }
    if (quaternions.middle.pip) {
      joints.middle_dip = extractAxisRotation(quaternions.middle.pip, Y_AXIS)
    }
  }

  // Ring finger: Y-axis rotations
  if (quaternions.ring) {
    if (quaternions.ring.mcp) {
      joints.ring_mcp_pitch = extractAxisRotation(quaternions.ring.mcp, Y_AXIS)
    }
    if (quaternions.ring.pip) {
      joints.ring_dip = extractAxisRotation(quaternions.ring.pip, Y_AXIS)
    }
  }

  // Pinky finger: Y-axis rotations
  if (quaternions.pinky) {
    if (quaternions.pinky.mcp) {
      joints.pinky_mcp_pitch = extractAxisRotation(quaternions.pinky.mcp, Y_AXIS)
    }
    if (quaternions.pinky.pip) {
      joints.pinky_dip = extractAxisRotation(quaternions.pinky.pip, Y_AXIS)
    }
  }

  return joints
}

/**
 * Clamp joint angles to URDF limits
 * Linker L6 specific limits
 *
 * @param {Object} joints - Joint angles from quaternionsToLinkerL6Joints()
 * @returns {Object} - Clamped joint angles
 */
export function clampToURDFLimits(joints) {
  const limits = {
    thunb_cmc_roll: { min: 0, max: 1.39 }, // 0° to 79.6°
    thumb_cmc_pitch: { min: 0, max: 0.99 }, // 0° to 56.7°
    thumb_dip: { min: 0, max: 1.22 }, // 0° to 69.9°
    index_mcp_pitch: { min: 0, max: 1.26 }, // 0° to 72.2°
    index_dip: { min: 0, max: 1.14 }, // 0° to 65.3°
    middle_mcp_pitch: { min: 0, max: 1.26 },
    middle_dip: { min: 0, max: 1.14 },
    ring_mcp_pitch: { min: 0, max: 1.26 },
    ring_dip: { min: 0, max: 1.14 },
    pinky_mcp_pitch: { min: 0, max: 1.26 },
    pinky_dip: { min: 0, max: 1.14 },
  }

  const clamped = {}

  for (const [jointName, angle] of Object.entries(joints)) {
    if (limits[jointName]) {
      clamped[jointName] = Math.max(limits[jointName].min, Math.min(limits[jointName].max, angle))
    } else {
      clamped[jointName] = angle
    }
  }

  return clamped
}

/**
 * Complete pipeline: quaternions → URDF joint angles → clamped
 *
 * @param {Object} quaternions - From landmarksToQuaternions()
 * @returns {Object} - Clamped joint angles ready for URDF model
 */
export function quaternionsToURDFJoints(quaternions) {
  const joints = quaternionsToLinkerL6Joints(quaternions)
  return clampToURDFLimits(joints)
}

export default {
  extractAxisRotation,
  quaternionsToLinkerL6Joints,
  clampToURDFLimits,
  quaternionsToURDFJoints,
}
