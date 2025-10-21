/**
 * Thumb 3DOF Addon Module
 * Extracts full 3-axis thumb CMC rotation from camera quaternions
 *
 * This addon ensures the thumb CMC joint rotates exactly as the user's real thumb by:
 * 1. Using the CMC quaternion orientation from camera tracking
 * 2. Decomposing it sequentially through roll, yaw, and pitch axes
 * 3. Accounting for non-orthogonal joint axes in the URDF
 * 4. Overriding thumb CMC joints (and downstream joints) with calculated values
 */

import * as THREE from 'three'
import {
  getThumbJointFrames,
  decomposeQuaternionAroundAxis,
  removeAxisRotation
} from './jointFrameCalculator'

/**
 * Apply 3DOF thumb addon to override thumb joint rotations
 * This function takes camera quaternions and decomposes them into individual joint angles
 *
 * @param {Object} quaternions - Quaternion data from landmarksToQuaternions()
 * @param {Object} robot - URDF robot object (needed for joint frame extraction)
 * @param {string} handedness - 'Left' or 'Right'
 * @returns {Object} - Thumb joint angles to override in the rotation object
 */
export function applyThumb3DoFAddon(quaternions, robot, handedness = 'Right') {
  if (!quaternions || !quaternions.thumb) {
    console.warn('[Thumb3DoF] No thumb quaternion data available')
    return {}
  }

  if (!robot || !robot.joints) {
    console.warn('[Thumb3DoF] No robot data available for joint frame calculation')
    return {}
  }

  // Get thumb joint frames with actual axis directions
  const thumbFrames = getThumbJointFrames(robot)

  if (!thumbFrames || !thumbFrames.joints) {
    console.warn('[Thumb3DoF] Could not extract thumb joint frames')
    return {}
  }

  // Extract thumb quaternions from camera tracking
  // Use the CMC (carpometacarpal) quaternion which represents the full 3D orientation
  // of the thumb base from the wrist - this is decomposed into roll, yaw, and pitch axes
  const thumbQuaternion = quaternions.thumb.cmc?.clone() || new THREE.Quaternion()

  console.log('🔧 [Thumb3DoF] Starting sequential decomposition for', handedness, 'hand')

  // Resulting joint angles
  const thumbJoints = {}

  // Sequential decomposition through kinematic chain
  // Remaining rotation to decompose
  let remainingRotation = thumbQuaternion.clone()

  // Process each joint in kinematic order
  thumbFrames.order.forEach((jointName, index) => {
    const frameData = thumbFrames.joints[jointName]

    if (!frameData) return

    const { axis, limits } = frameData

    // Decompose remaining rotation around this joint's axis
    const angle = decomposeQuaternionAroundAxis(remainingRotation, axis)

    // Clamp to joint limits
    const clampedAngle = Math.max(limits.lower, Math.min(limits.upper, angle))

    // Store the joint angle
    thumbJoints[jointName] = clampedAngle

    // Remove this rotation from the remaining quaternion
    remainingRotation = removeAxisRotation(remainingRotation, axis, clampedAngle)

    console.log(`  ${index + 1}. ${jointName}: ${(clampedAngle * 180 / Math.PI).toFixed(1)}° (limits: [${(limits.lower * 180 / Math.PI).toFixed(1)}°, ${(limits.upper * 180 / Math.PI).toFixed(1)}°])`)
  })

  console.log('✅ [Thumb3DoF] Decomposition complete:', thumbJoints)

  return thumbJoints
}

/**
 * Check if thumb 3DOF addon should be applied
 * @param {boolean} useThumb3DoF - User toggle for addon
 * @param {boolean} useQuaternionTracking - Quaternion tracking mode enabled
 * @param {Object} robot - Robot object available
 * @returns {boolean} - True if addon should be applied
 */
export function shouldApplyThumb3DoF(useThumb3DoF, useQuaternionTracking, robot) {
  return useThumb3DoF && useQuaternionTracking && robot && robot.joints
}

/**
 * Override thumb joints in rotation object with addon output
 * This merges the addon results into the existing rotation data
 *
 * @param {Object} rotations - Existing joint rotations from quaternionsToURDFJoints()
 * @param {Object} thumbOverrides - Thumb joint angles from applyThumb3DoFAddon()
 * @returns {Object} - Updated rotations with thumb overrides
 */
export function mergeThumbOverrides(rotations, thumbOverrides) {
  return {
    ...rotations,
    ...thumbOverrides
  }
}

export default {
  applyThumb3DoFAddon,
  shouldApplyThumb3DoF,
  mergeThumbOverrides
}
