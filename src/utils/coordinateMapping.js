/**
 * Coordinate Mapping and Calibration Module
 * Provides rest pose calibration to align MediaPipe tracking with hand models
 */

const CALIBRATION_STORAGE_KEY = 'handTracking_calibration'

/**
 * Calibration Manager
 * Handles rest pose calibration with local storage persistence
 */
export class CalibrationManager {
  constructor() {
    this.calibrationOffsets = {}
    this.isCalibrated = false
    this.restPoseRotations = null

    // Load saved calibration from local storage
    this.loadCalibration()
  }

  /**
   * Capture rest pose for calibration
   * User should have hand in neutral position (open, relaxed)
   * @param {Object} currentRotations - Current joint rotations from camera
   */
  calibrate(currentRotations) {
    if (!currentRotations || Object.keys(currentRotations).length === 0) {
      console.warn('Cannot calibrate: no rotation data provided')
      return false
    }

    // Store the rest pose rotations
    this.restPoseRotations = { ...currentRotations }

    // Calculate offsets (how much to subtract from future readings)
    this.calibrationOffsets = {}
    for (const [joint, angle] of Object.entries(currentRotations)) {
      // For rest pose, we want most joints to be at 0
      // Exception: some joints may have natural offset
      this.calibrationOffsets[joint] = angle
    }

    this.isCalibrated = true

    // Save to local storage
    this.saveCalibration()

    console.log('Calibration complete:', this.calibrationOffsets)
    return true
  }

  /**
   * Apply calibration offsets to rotations
   * @param {Object} rotations - Raw joint rotations
   * @returns {Object} - Calibrated rotations
   */
  applyCalibration(rotations) {
    if (!this.isCalibrated || Object.keys(this.calibrationOffsets).length === 0) {
      return rotations // No calibration, return as-is
    }

    const calibrated = {}

    for (const [joint, angle] of Object.entries(rotations)) {
      const offset = this.calibrationOffsets[joint] || 0
      calibrated[joint] = angle - offset

      // Ensure we don't go negative for flexion-only joints
      // (most finger joints can't extend beyond straight)
      if (joint !== 'wrist' && joint.includes('_')) {
        calibrated[joint] = Math.max(0, calibrated[joint])
      }
    }

    return calibrated
  }

  /**
   * Reset calibration
   */
  resetCalibration() {
    this.calibrationOffsets = {}
    this.isCalibrated = false
    this.restPoseRotations = null

    // Clear from local storage
    localStorage.removeItem(CALIBRATION_STORAGE_KEY)

    console.log('Calibration reset')
  }

  /**
   * Save calibration to local storage
   */
  saveCalibration() {
    try {
      const data = {
        offsets: this.calibrationOffsets,
        restPose: this.restPoseRotations,
        timestamp: Date.now(),
      }
      localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save calibration:', error)
    }
  }

  /**
   * Load calibration from local storage
   */
  loadCalibration() {
    try {
      const data = localStorage.getItem(CALIBRATION_STORAGE_KEY)
      if (!data) return

      const parsed = JSON.parse(data)

      // Check if calibration is not too old (expire after 7 days)
      const age = Date.now() - (parsed.timestamp || 0)
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

      if (age > maxAge) {
        console.log('Calibration expired, removing')
        this.resetCalibration()
        return
      }

      this.calibrationOffsets = parsed.offsets || {}
      this.restPoseRotations = parsed.restPose || null
      this.isCalibrated = Object.keys(this.calibrationOffsets).length > 0

      console.log('Calibration loaded from storage')
    } catch (error) {
      console.error('Failed to load calibration:', error)
    }
  }

  /**
   * Get calibration status
   * @returns {Object} - {isCalibrated, jointCount, timestamp}
   */
  getStatus() {
    return {
      isCalibrated: this.isCalibrated,
      jointCount: Object.keys(this.calibrationOffsets).length,
      restPose: this.restPoseRotations,
    }
  }

  /**
   * Export calibration data (for debugging or sharing)
   * @returns {Object} - Calibration data
   */
  exportCalibration() {
    return {
      offsets: this.calibrationOffsets,
      restPose: this.restPoseRotations,
      isCalibrated: this.isCalibrated,
    }
  }

  /**
   * Import calibration data
   * @param {Object} data - Calibration data
   */
  importCalibration(data) {
    if (!data || !data.offsets) {
      console.error('Invalid calibration data')
      return false
    }

    this.calibrationOffsets = data.offsets
    this.restPoseRotations = data.restPose || null
    this.isCalibrated = true

    this.saveCalibration()

    console.log('Calibration imported')
    return true
  }
}

/**
 * Coordinate space transformations
 * MediaPipe uses different coordinate system than some 3D models
 */

/**
 * Mirror rotations for opposite hand
 * @param {Object} rotations - Joint rotations
 * @param {string} sourceHand - 'Left' or 'Right'
 * @param {string} targetHand - 'Left' or 'Right'
 * @returns {Object} - Mirrored rotations
 */
export function mirrorRotations(rotations, sourceHand, targetHand) {
  if (sourceHand === targetHand) {
    return rotations // No mirroring needed
  }

  // For hand mirroring, most joint angles stay the same
  // Only abduction/adduction angles need to be negated
  // Since we're primarily tracking flexion/extension, we can use rotations as-is
  // More sophisticated mirroring would handle spread/abduction

  return { ...rotations }
}

/**
 * Scale rotations by a factor (for sensitivity adjustment)
 * @param {Object} rotations - Joint rotations
 * @param {number} scale - Scale factor (1.0 = no change)
 * @returns {Object} - Scaled rotations
 */
export function scaleRotations(rotations, scale = 1.0) {
  const scaled = {}

  for (const [joint, angle] of Object.entries(rotations)) {
    scaled[joint] = angle * scale
  }

  return scaled
}

/**
 * Apply dead zone to rotations (ignore small movements)
 * @param {Object} rotations - Joint rotations
 * @param {number} threshold - Dead zone threshold in radians
 * @returns {Object} - Rotations with dead zone applied
 */
export function applyDeadZone(rotations, threshold = 0.05) {
  const filtered = {}

  for (const [joint, angle] of Object.entries(rotations)) {
    filtered[joint] = Math.abs(angle) < threshold ? 0 : angle
  }

  return filtered
}

// Default export
export default CalibrationManager
