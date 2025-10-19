/**
 * Motion Filter Module
 * Provides smoothing, constraints, and velocity limiting for hand tracking
 */

/**
 * Exponential Moving Average Filter
 * Reduces jitter and noise from camera tracking
 */
class ExponentialMovingAverageFilter {
  constructor(alpha = 0.3) {
    this.alpha = alpha // Smoothing factor (0-1): lower = smoother but more lag
    this.previousValues = {}
  }

  /**
   * Apply filter to a single value
   * @param {string} key - Identifier for the value (e.g., joint name)
   * @param {number} newValue - New value to filter
   * @param {string} prefix - Optional prefix for key (e.g., 'left' or 'right')
   * @returns {number} - Filtered value
   */
  filter(key, newValue, prefix = '') {
    const fullKey = prefix ? `${prefix}_${key}` : key

    if (!(fullKey in this.previousValues)) {
      // First value, no filtering
      this.previousValues[fullKey] = newValue
      return newValue
    }

    // EMA formula: filtered = alpha * new + (1 - alpha) * previous
    const filtered = this.alpha * newValue + (1 - this.alpha) * this.previousValues[fullKey]
    this.previousValues[fullKey] = filtered

    return filtered
  }

  /**
   * Apply filter to all joints in rotation object
   * @param {Object} rotations - Joint rotations {joint_name: angle}
   * @param {string} prefix - Optional prefix for keys (e.g., 'left' or 'right')
   * @returns {Object} - Filtered rotations
   */
  filterAll(rotations, prefix = '') {
    const filtered = {}

    for (const [joint, value] of Object.entries(rotations)) {
      filtered[joint] = this.filter(joint, value, prefix)
    }

    return filtered
  }

  /**
   * Reset filter state
   */
  reset() {
    this.previousValues = {}
  }

  /**
   * Set smoothing factor
   * @param {number} alpha - Smoothing factor (0-1)
   */
  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha))
  }
}

/**
 * Velocity Limiter
 * Prevents unrealistic rapid movements by capping angular velocity
 */
class VelocityLimiter {
  constructor(maxVelocity = 3.0) {
    this.maxVelocity = maxVelocity // Maximum radians per frame (at 60fps ≈ 180 rad/s)
    this.previousValues = {}
    this.previousTimestamps = {}
  }

  /**
   * Limit velocity of a single value
   * @param {string} key - Identifier for the value
   * @param {number} newValue - New value
   * @param {number} timestamp - Current timestamp in ms
   * @param {string} prefix - Optional prefix for key (e.g., 'left' or 'right')
   * @returns {number} - Velocity-limited value
   */
  limit(key, newValue, timestamp = Date.now(), prefix = '') {
    const fullKey = prefix ? `${prefix}_${key}` : key

    if (!(fullKey in this.previousValues)) {
      // First value, no limiting
      this.previousValues[fullKey] = newValue
      this.previousTimestamps[fullKey] = timestamp
      return newValue
    }

    const deltaTime = (timestamp - this.previousTimestamps[fullKey]) / 1000 // Convert to seconds
    if (deltaTime <= 0) {
      return this.previousValues[fullKey] // No time passed, return previous value
    }

    const deltaValue = newValue - this.previousValues[fullKey]
    const velocity = Math.abs(deltaValue) / deltaTime

    let limitedValue = newValue

    if (velocity > this.maxVelocity) {
      // Cap the velocity
      const maxDelta = this.maxVelocity * deltaTime
      const direction = Math.sign(deltaValue)
      limitedValue = this.previousValues[fullKey] + direction * maxDelta
    }

    this.previousValues[fullKey] = limitedValue
    this.previousTimestamps[fullKey] = timestamp

    return limitedValue
  }

  /**
   * Apply velocity limiting to all joints
   * @param {Object} rotations - Joint rotations
   * @param {number} timestamp - Current timestamp
   * @param {string} prefix - Optional prefix for keys (e.g., 'left' or 'right')
   * @returns {Object} - Velocity-limited rotations
   */
  limitAll(rotations, timestamp = Date.now(), prefix = '') {
    const limited = {}

    for (const [joint, value] of Object.entries(rotations)) {
      limited[joint] = this.limit(joint, value, timestamp, prefix)
    }

    return limited
  }

  /**
   * Reset limiter state
   */
  reset() {
    this.previousValues = {}
    this.previousTimestamps = {}
  }

  /**
   * Set maximum velocity
   * @param {number} maxVelocity - Max radians per second
   */
  setMaxVelocity(maxVelocity) {
    this.maxVelocity = Math.max(0, maxVelocity)
  }
}

/**
 * Joint Constraints
 * Enforces anatomical limits and coupled joint behavior
 */
class JointConstraints {
  constructor() {
    // Standard anatomical limits for human hand (in radians)
    this.limits = {
      // Wrist
      wrist: { min: -0.5, max: 0.5 },

      // Finger MCP joints (0 = straight, positive = flexion)
      thumb_mcp: { min: 0, max: 1.5 },
      index_mcp: { min: 0, max: 1.57 }, // ~90 degrees
      middle_mcp: { min: 0, max: 1.57 },
      ring_mcp: { min: 0, max: 1.57 },
      pinky_mcp: { min: 0, max: 1.57 },

      // Finger PIP joints
      thumb_pip: { min: 0, max: 1.57 },
      index_pip: { min: 0, max: 1.75 }, // ~100 degrees
      middle_pip: { min: 0, max: 1.75 },
      ring_pip: { min: 0, max: 1.75 },
      pinky_pip: { min: 0, max: 1.75 },

      // Finger DIP joints (typically coupled with PIP)
      thumb_dip: { min: 0, max: 1.4 },
      index_dip: { min: 0, max: 1.4 },
      middle_dip: { min: 0, max: 1.4 },
      ring_dip: { min: 0, max: 1.4 },
      pinky_dip: { min: 0, max: 1.4 },

      // Finger tips (typically coupled with DIP)
      thumb_tip: { min: 0, max: 1.2 },
      index_tip: { min: 0, max: 1.2 },
      middle_tip: { min: 0, max: 1.2 },
      ring_tip: { min: 0, max: 1.2 },
      pinky_tip: { min: 0, max: 1.2 },
    }

    // Joint coupling ratios (e.g., DIP typically moves 2/3 of PIP)
    this.couplings = {
      // DIP follows PIP motion
      index_dip: { source: 'index_pip', ratio: 0.67 },
      middle_dip: { source: 'middle_pip', ratio: 0.67 },
      ring_dip: { source: 'ring_pip', ratio: 0.67 },
      pinky_dip: { source: 'pinky_pip', ratio: 0.67 },

      // TIP follows DIP motion
      index_tip: { source: 'index_dip', ratio: 0.5 },
      middle_tip: { source: 'middle_dip', ratio: 0.5 },
      ring_tip: { source: 'ring_dip', ratio: 0.5 },
      pinky_tip: { source: 'pinky_dip', ratio: 0.5 },
    }
  }

  /**
   * Apply constraints to joint rotations
   * @param {Object} rotations - Joint rotations
   * @returns {Object} - Constrained rotations
   */
  constrain(rotations) {
    const constrained = { ...rotations }

    // First pass: apply joint limits
    for (const [joint, value] of Object.entries(constrained)) {
      if (this.limits[joint]) {
        const { min, max } = this.limits[joint]
        constrained[joint] = Math.max(min, Math.min(max, value))
      }
    }

    // Second pass: apply joint couplings
    for (const [joint, coupling] of Object.entries(this.couplings)) {
      if (constrained[coupling.source] !== undefined) {
        // Coupled joint should follow source joint with ratio
        const sourceValue = constrained[coupling.source]
        const coupledValue = sourceValue * coupling.ratio

        // Still respect limits
        if (this.limits[joint]) {
          const { min, max } = this.limits[joint]
          constrained[joint] = Math.max(min, Math.min(max, coupledValue))
        } else {
          constrained[joint] = coupledValue
        }
      }
    }

    return constrained
  }

  /**
   * Update joint limits (e.g., for different hand models)
   * @param {string} joint - Joint name
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   */
  setLimit(joint, min, max) {
    this.limits[joint] = { min, max }
  }
}

/**
 * Complete Motion Filter Pipeline
 * Combines smoothing, velocity limiting, and constraints
 */
export class MotionFilter {
  constructor(config = {}) {
    this.smoothingFilter = new ExponentialMovingAverageFilter(config.alpha || 0.3)
    this.velocityLimiter = new VelocityLimiter(config.maxVelocity || 3.0)
    this.constraints = new JointConstraints()

    this.enabled = {
      smoothing: config.enableSmoothing !== false,
      velocityLimiting: config.enableVelocityLimiting !== false,
      constraints: config.enableConstraints !== false,
    }
  }

  /**
   * Apply full filter pipeline to rotations
   * @param {Object} rotations - Raw joint rotations (can be flat object or {wristOrientation, joints})
   * @param {number} timestamp - Current timestamp
   * @param {string} prefix - Optional prefix for keys (e.g., 'left' or 'right')
   * @returns {Object} - Filtered rotations
   */
  filter(rotations, timestamp = Date.now(), prefix = '') {
    // Handle new data structure with wristOrientation and joints
    if (rotations.wristOrientation && rotations.joints) {
      // New structure: separate wrist orientation and joints
      const filteredJoints = { ...rotations.joints }
      const filteredWrist = { ...rotations.wristOrientation }

      // Filter joints
      let processedJoints = filteredJoints
      if (this.enabled.smoothing) {
        processedJoints = this.smoothingFilter.filterAll(processedJoints, prefix)
      }
      if (this.enabled.velocityLimiting) {
        processedJoints = this.velocityLimiter.limitAll(processedJoints, timestamp, prefix)
      }
      if (this.enabled.constraints) {
        processedJoints = this.constraints.constrain(processedJoints)
      }

      // Filter wrist orientation (x, y, z Euler angles)
      let processedWrist = filteredWrist
      if (this.enabled.smoothing) {
        processedWrist = {
          x: this.smoothingFilter.filter('wrist_orient_x', filteredWrist.x, prefix),
          y: this.smoothingFilter.filter('wrist_orient_y', filteredWrist.y, prefix),
          z: this.smoothingFilter.filter('wrist_orient_z', filteredWrist.z, prefix)
        }
      }
      if (this.enabled.velocityLimiting) {
        processedWrist = {
          x: this.velocityLimiter.limit('wrist_orient_x', processedWrist.x, timestamp, prefix),
          y: this.velocityLimiter.limit('wrist_orient_y', processedWrist.y, timestamp, prefix),
          z: this.velocityLimiter.limit('wrist_orient_z', processedWrist.z, timestamp, prefix)
        }
      }

      return {
        wristOrientation: processedWrist,
        joints: processedJoints
      }
    }

    // Old structure: flat object (backward compatibility)
    let filtered = { ...rotations }

    if (this.enabled.smoothing) {
      filtered = this.smoothingFilter.filterAll(filtered, prefix)
    }

    if (this.enabled.velocityLimiting) {
      filtered = this.velocityLimiter.limitAll(filtered, timestamp, prefix)
    }

    if (this.enabled.constraints) {
      filtered = this.constraints.constrain(filtered)
    }

    return filtered
  }

  /**
   * Reset all filter states
   */
  reset() {
    this.smoothingFilter.reset()
    this.velocityLimiter.reset()
  }

  /**
   * Enable/disable specific filters
   * @param {Object} settings - {smoothing: bool, velocityLimiting: bool, constraints: bool}
   */
  configure(settings) {
    if (settings.smoothing !== undefined) {
      this.enabled.smoothing = settings.smoothing
    }
    if (settings.velocityLimiting !== undefined) {
      this.enabled.velocityLimiting = settings.velocityLimiting
    }
    if (settings.constraints !== undefined) {
      this.enabled.constraints = settings.constraints
    }
  }

  /**
   * Set smoothing strength
   * @param {number} alpha - Smoothing factor (0-1, higher = less smoothing)
   */
  setSmoothingStrength(alpha) {
    this.smoothingFilter.setAlpha(alpha)
  }

  /**
   * Set maximum velocity
   * @param {number} maxVelocity - Max radians per second
   */
  setMaxVelocity(maxVelocity) {
    this.velocityLimiter.setMaxVelocity(maxVelocity)
  }
}

// Export individual filters for advanced usage
export { ExponentialMovingAverageFilter, VelocityLimiter, JointConstraints }
