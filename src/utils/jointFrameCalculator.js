/**
 * Joint Frame Calculator
 * Extracts joint frame information from URDF models, accounting for non-orthogonal axes
 *
 * URDF joints have:
 * - <origin xyz="..." rpy="..."/> defining the joint frame transform
 * - <axis xyz="..."/> defining the rotation axis in the joint's local frame
 *
 * This module calculates the actual axis directions in world/parent space
 */

import * as THREE from 'three'

/**
 * Extract joint transform from URDF joint object
 * @param {Object} joint - URDF joint object from urdf-loader
 * @returns {Object} - { position: Vector3, rotation: Euler }
 */
function extractJointTransform(joint) {
  // Get the joint's matrixWorld which includes all parent transforms
  const position = new THREE.Vector3()
  const quaternion = new THREE.Quaternion()
  const scale = new THREE.Vector3()

  if (joint.matrixWorld) {
    joint.matrixWorld.decompose(position, quaternion, scale)
  }

  const rotation = new THREE.Euler()
  rotation.setFromQuaternion(quaternion, 'XYZ')

  return { position, rotation, quaternion }
}

/**
 * Get the actual rotation axis in world space for a joint
 * @param {Object} joint - URDF joint object
 * @returns {THREE.Vector3} - Normalized axis vector in world space
 */
export function getJointAxisInWorldSpace(joint) {
  if (!joint || !joint.axis) {
    console.warn('Joint missing axis information')
    return new THREE.Vector3(0, 1, 0) // Default Y-axis
  }

  // Get axis in local joint frame
  const localAxis = new THREE.Vector3(joint.axis.x, joint.axis.y, joint.axis.z)
  localAxis.normalize()

  // Transform to world space using joint's world matrix
  const worldAxis = localAxis.clone()
  if (joint.matrixWorld) {
    // Apply only rotation part (ignore translation)
    const rotationMatrix = new THREE.Matrix4()
    rotationMatrix.extractRotation(joint.matrixWorld)
    worldAxis.applyMatrix4(rotationMatrix)
  }

  return worldAxis.normalize()
}

/**
 * Build forward kinematics chain for thumb joints
 * Returns joint frames in order for sequential decomposition
 *
 * @param {Object} robot - URDF robot object from urdf-loader
 * @returns {Object} - Thumb joint chain with axis vectors
 */
export function getThumbJointFrames(robot) {
  if (!robot || !robot.joints) {
    console.error('Invalid robot object')
    return null
  }

  // Linker L10 thumb joint names in kinematic order
  const thumbJointNames = [
    'thumb_cmc_roll',
    'thumb_cmc_yaw',
    'thumb_cmc_pitch',
    'thumb_mcp',
    'thumb_ip'
  ]

  const jointFrames = {}

  thumbJointNames.forEach(jointName => {
    const joint = robot.joints[jointName]

    if (!joint) {
      console.warn(`Thumb joint ${jointName} not found in URDF`)
      return
    }

    // Extract transform and axis
    const transform = extractJointTransform(joint)
    const axisWorld = getJointAxisInWorldSpace(joint)

    // Get joint limits
    const limits = {
      lower: joint.limit?.lower || 0,
      upper: joint.limit?.upper || 0
    }

    jointFrames[jointName] = {
      joint,
      axis: axisWorld,
      transform,
      limits,
      urdfAxis: joint.axis // Keep original axis for reference
    }

    console.log(`📐 [JointFrameCalc] ${jointName}:`, {
      localAxis: `[${joint.axis.x.toFixed(2)}, ${joint.axis.y.toFixed(2)}, ${joint.axis.z.toFixed(2)}]`,
      worldAxis: `[${axisWorld.x.toFixed(2)}, ${axisWorld.y.toFixed(2)}, ${axisWorld.z.toFixed(2)}]`,
      limits: `[${limits.lower.toFixed(2)}, ${limits.upper.toFixed(2)}]`
    })
  })

  return {
    joints: jointFrames,
    order: thumbJointNames.filter(name => robot.joints[name]) // Only return existing joints
  }
}

/**
 * Calculate the angle between two quaternions around a specific axis
 * Uses swing-twist decomposition
 *
 * @param {THREE.Quaternion} quaternion - Rotation to decompose
 * @param {THREE.Vector3} axis - Axis to decompose around (normalized)
 * @returns {number} - Angle in radians around the axis
 */
export function decomposeQuaternionAroundAxis(quaternion, axis) {
  // Swing-twist decomposition algorithm
  // Given q and axis n, decompose q = swing * twist
  // where twist rotates around n

  const q = quaternion.clone().normalize()
  const n = axis.clone().normalize()

  // Projection of q.xyz onto axis
  const qVec = new THREE.Vector3(q.x, q.y, q.z)
  const projection = qVec.dot(n)

  // Twist quaternion (rotation around axis)
  const twist = new THREE.Quaternion(
    n.x * projection,
    n.y * projection,
    n.z * projection,
    q.w
  ).normalize()

  // Extract angle from twist quaternion
  // For quaternion [x,y,z,w] representing rotation θ around axis n:
  // w = cos(θ/2), [x,y,z] = n*sin(θ/2)
  const angle = 2 * Math.atan2(
    Math.sqrt(twist.x * twist.x + twist.y * twist.y + twist.z * twist.z),
    twist.w
  )

  // Determine sign based on axis direction
  const axisComponent = new THREE.Vector3(twist.x, twist.y, twist.z)
  const sign = axisComponent.dot(n) >= 0 ? 1 : -1

  return angle * sign
}

/**
 * Remove rotation around axis from quaternion
 * Returns the remaining "swing" rotation after extracting "twist"
 *
 * @param {THREE.Quaternion} quaternion - Original rotation
 * @param {THREE.Vector3} axis - Axis to remove rotation around
 * @param {number} angle - Angle to remove (radians)
 * @returns {THREE.Quaternion} - Remaining rotation
 */
export function removeAxisRotation(quaternion, axis, angle) {
  const q = quaternion.clone().normalize()
  const n = axis.clone().normalize()

  // Create twist quaternion for the angle around axis
  const halfAngle = angle / 2
  const twist = new THREE.Quaternion(
    n.x * Math.sin(halfAngle),
    n.y * Math.sin(halfAngle),
    n.z * Math.sin(halfAngle),
    Math.cos(halfAngle)
  )

  // Swing = q * twist^-1
  const twistInverse = twist.clone().conjugate()
  const swing = q.clone().multiply(twistInverse)

  return swing.normalize()
}

export default {
  getThumbJointFrames,
  getJointAxisInWorldSpace,
  decomposeQuaternionAroundAxis,
  removeAxisRotation
}
