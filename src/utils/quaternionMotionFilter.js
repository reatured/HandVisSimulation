/**
 * Quaternion Motion Filter
 *
 * Provides smoothing for quaternion-based hand tracking using SLERP
 * (Spherical Linear Interpolation) instead of simple exponential moving average.
 *
 * SLERP ensures smooth interpolation on the quaternion sphere, avoiding
 * artifacts from linear interpolation in quaternion space.
 */

import * as THREE from 'three'

/**
 * QuaternionMotionFilter class
 * Maintains state for each joint's quaternion and applies SLERP smoothing
 */
export class QuaternionMotionFilter {
  constructor(alpha = 0.3) {
    this.alpha = alpha // Smoothing factor (0 = no smoothing, 1 = no filtering)
    this.previousQuaternions = null
    this.previousTimestamp = null
    this.maxAngularVelocity = 5.0 // radians per second
  }

  /**
   * Set smoothing factor
   * @param {number} alpha - Smoothing factor (0-1)
   */
  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha))
  }

  /**
   * Reset filter state
   */
  reset() {
    this.previousQuaternions = null
    this.previousTimestamp = null
  }

  /**
   * Apply SLERP smoothing to a single quaternion
   * @param {THREE.Quaternion} current - Current quaternion
   * @param {THREE.Quaternion} previous - Previous quaternion
   * @param {number} alpha - Interpolation factor
   * @returns {THREE.Quaternion} - Smoothed quaternion
   */
  slerpQuaternion(current, previous, alpha) {
    if (!previous) {
      return current.clone()
    }

    // SLERP interpolation: previous → current with factor alpha
    const smoothed = new THREE.Quaternion()
    THREE.Quaternion.slerp(previous, current, smoothed, alpha)

    return smoothed
  }

  /**
   * Apply velocity limiting to quaternion rotation
   * Prevents unrealistic sudden jumps in rotation
   *
   * @param {THREE.Quaternion} current - Current quaternion
   * @param {THREE.Quaternion} previous - Previous quaternion
   * @param {number} deltaTime - Time delta in seconds
   * @returns {THREE.Quaternion} - Velocity-limited quaternion
   */
  applyVelocityLimiting(current, previous, deltaTime) {
    if (!previous || deltaTime <= 0) {
      return current.clone()
    }

    // Calculate angular difference
    const angularDistance = current.angleTo(previous)

    // Calculate angular velocity
    const angularVelocity = angularDistance / deltaTime

    // If velocity is within limits, return current
    if (angularVelocity <= this.maxAngularVelocity) {
      return current.clone()
    }

    // Limit the rotation to max allowed distance
    const maxAllowedDistance = this.maxAngularVelocity * deltaTime
    const clampFactor = maxAllowedDistance / angularDistance

    // SLERP to the clamped position
    const limited = new THREE.Quaternion()
    THREE.Quaternion.slerp(previous, current, limited, clampFactor)

    return limited
  }

  /**
   * Recursively filter nested quaternion structure
   * @param {Object} current - Current quaternion structure
   * @param {Object} previous - Previous quaternion structure
   * @param {number} alpha - Smoothing factor
   * @returns {Object} - Filtered quaternion structure
   */
  filterQuaternionStructure(current, previous, alpha) {
    if (!current) {
      return null
    }

    if (current instanceof THREE.Quaternion) {
      return this.slerpQuaternion(current, previous, alpha)
    }

    if (typeof current === 'object') {
      const filtered = {}
      for (const key in current) {
        filtered[key] = this.filterQuaternionStructure(
          current[key],
          previous ? previous[key] : null,
          alpha
        )
      }
      return filtered
    }

    return current
  }

  /**
   * Apply velocity limiting to nested quaternion structure
   * @param {Object} current - Current quaternion structure
   * @param {Object} previous - Previous quaternion structure
   * @param {number} deltaTime - Time delta in seconds
   * @returns {Object} - Velocity-limited quaternion structure
   */
  applyVelocityLimitingToStructure(current, previous, deltaTime) {
    if (!current) {
      return null
    }

    if (current instanceof THREE.Quaternion) {
      return this.applyVelocityLimiting(current, previous, deltaTime)
    }

    if (typeof current === 'object') {
      const limited = {}
      for (const key in current) {
        limited[key] = this.applyVelocityLimitingToStructure(
          current[key],
          previous ? previous[key] : null,
          deltaTime
        )
      }
      return limited
    }

    return current
  }

  /**
   * Main filter function
   * Apply SLERP smoothing and velocity limiting to quaternion hand data
   *
   * @param {Object} quaternions - Quaternion structure from landmarksToQuaternions()
   * @param {number} timestamp - Current timestamp in milliseconds (optional)
   * @returns {Object} - Filtered quaternion structure
   */
  filter(quaternions, timestamp = null) {
    if (!quaternions) {
      return null
    }

    // Initialize on first call
    if (!this.previousQuaternions) {
      this.previousQuaternions = quaternions
      this.previousTimestamp = timestamp
      return quaternions
    }

    // Calculate delta time
    let deltaTime = 0.016 // Default to 60 FPS
    if (timestamp && this.previousTimestamp) {
      deltaTime = (timestamp - this.previousTimestamp) / 1000 // Convert to seconds
      deltaTime = Math.max(0.001, Math.min(0.1, deltaTime)) // Clamp to reasonable range
    }

    // Apply velocity limiting first
    const velocityLimited = this.applyVelocityLimitingToStructure(
      quaternions,
      this.previousQuaternions,
      deltaTime
    )

    // Then apply SLERP smoothing
    const filtered = this.filterQuaternionStructure(
      velocityLimited,
      this.previousQuaternions,
      this.alpha
    )

    // Update state
    this.previousQuaternions = filtered
    this.previousTimestamp = timestamp

    return filtered
  }
}

/**
 * Create a new quaternion motion filter instance
 * @param {number} alpha - Smoothing factor (default: 0.3)
 * @returns {QuaternionMotionFilter}
 */
export function createQuaternionFilter(alpha = 0.3) {
  return new QuaternionMotionFilter(alpha)
}

export default {
  QuaternionMotionFilter,
  createQuaternionFilter,
}
