/**
 * Multi-DoF Rotation Mapper
 * Maps 3D rotation data (from MediaPipe/camera) to semantic multi-DoF joint groups
 */

/**
 * Map 3D rotation data to multi-DoF joint format using semantic mapping
 * @param {Object} rotations3D - Rotation data from positionToRotation.js (MediaPipe joint names)
 * @param {Object} semanticMapping - Semantic mapping from urdfParser.createSemanticMapping
 * @param {Object} mediaPipeMap - MediaPipe-to-semantic mapping from urdfParser.createMediaPipeToSemanticMap
 * @returns {Object} - Multi-DoF joint rotations ready for URDF application
 */
export function mapToMultiDoF(rotations3D, semanticMapping, mediaPipeMap) {
  if (!rotations3D || !semanticMapping) {
    console.warn('multiDoFMapper: Missing required parameters')
    return {}
  }

  const result = {}

  // Iterate through all rotation data from MediaPipe/camera
  Object.entries(rotations3D).forEach(([mediaPipeJointName, rotationData]) => {
    // Find the corresponding semantic joint group
    const semanticName = mediaPipeMap?.[mediaPipeJointName] || mediaPipeJointName
    const mapping = semanticMapping[semanticName]

    if (!mapping) {
      // No mapping found - skip this joint
      console.debug(`multiDoFMapper: No mapping for ${mediaPipeJointName}`)
      return
    }

    // Check if rotation data is object with pitch/yaw/roll or single value
    const isMultiAxisData = typeof rotationData === 'object' &&
                            (rotationData.pitch !== undefined ||
                             rotationData.yaw !== undefined ||
                             rotationData.roll !== undefined)

    if (isMultiAxisData) {
      // Multi-axis rotation data - map each axis
      result[semanticName] = {}

      mapping.axes.forEach(axis => {
        // Use the rotation value if available, otherwise 0
        result[semanticName][axis] = rotationData[axis] ?? 0
      })
    } else {
      // Single value - assume it's for the primary axis
      result[semanticName] = {}
      const primaryAxis = mapping.axes[0] || 'pitch'
      result[semanticName][primaryAxis] = rotationData
    }
  })

  return result
}

/**
 * Map single-axis rotation data (legacy format) to multi-DoF format
 * @param {Object} singleAxisRotations - Single-value rotations (e.g., { thumb_mcp: 0.5 })
 * @param {Object} semanticMapping - Semantic mapping from urdfParser
 * @returns {Object} - Multi-DoF format with explicit axes
 */
export function convertSingleAxisToMultiDoF(singleAxisRotations, semanticMapping) {
  if (!singleAxisRotations || !semanticMapping) return {}

  const result = {}

  Object.entries(singleAxisRotations).forEach(([jointName, angle]) => {
    const mapping = semanticMapping[jointName]

    if (!mapping) {
      console.debug(`multiDoFMapper: No mapping for ${jointName}`)
      return
    }

    result[jointName] = {}
    const primaryAxis = mapping.axes[0] || 'pitch'
    result[jointName][primaryAxis] = angle
  })

  return result
}

/**
 * Clamp rotation values to joint limits from URDF
 * @param {Object} multiDoFRotations - Multi-DoF rotation data
 * @param {Object} semanticMapping - Semantic mapping with limits
 * @returns {Object} - Clamped rotation values
 */
export function clampToLimits(multiDoFRotations, semanticMapping) {
  if (!multiDoFRotations || !semanticMapping) return multiDoFRotations

  const clamped = {}

  Object.entries(multiDoFRotations).forEach(([jointName, axes]) => {
    const mapping = semanticMapping[jointName]

    if (!mapping) {
      clamped[jointName] = axes
      return
    }

    clamped[jointName] = {}

    Object.entries(axes).forEach(([axis, value]) => {
      const limits = mapping.limits[axis]

      if (limits) {
        const [lower, upper] = limits
        clamped[jointName][axis] = Math.max(lower, Math.min(upper, value))
      } else {
        clamped[jointName][axis] = value
      }
    })
  })

  return clamped
}

/**
 * Get debug info for rotation mapping
 * @param {Object} rotations3D - Input rotation data
 * @param {Object} multiDoFRotations - Mapped multi-DoF rotations
 * @param {Object} semanticMapping - Semantic mapping
 * @returns {Object} - Debug statistics
 */
export function getMapperDebugInfo(rotations3D, multiDoFRotations, semanticMapping) {
  const inputJoints = Object.keys(rotations3D || {})
  const outputJoints = Object.keys(multiDoFRotations || {})
  const availableSemanticJoints = Object.keys(semanticMapping || {})

  const unmappedJoints = inputJoints.filter(j => !outputJoints.includes(j))

  return {
    inputJointCount: inputJoints.length,
    outputJointCount: outputJoints.length,
    availableSemanticJoints: availableSemanticJoints.length,
    unmappedJoints,
    mappingSuccess: inputJoints.length > 0 ? (outputJoints.length / inputJoints.length * 100).toFixed(1) + '%' : '0%'
  }
}
