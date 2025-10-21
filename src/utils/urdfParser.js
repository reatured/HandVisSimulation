/**
 * URDF Parser Utility
 * Dynamically extracts joint configuration, limits, and semantic mappings from loaded URDF robot objects
 */

/**
 * Parse URDF robot object to extract joint configuration
 * @param {Object} robot - Loaded URDF robot object from urdf-loader
 * @returns {Object} - Joint configuration with DoF and limits
 */
export function parseJointConfig(robot) {
  if (!robot || !robot.joints) {
    console.warn('urdfParser: Invalid robot object')
    return {}
  }

  const config = {}

  Object.entries(robot.joints).forEach(([jointName, joint]) => {
    // Skip fixed joints - they don't move
    if (joint.jointType === 'fixed') {
      return
    }

    // Extract joint type, axis, and limits
    config[jointName] = {
      name: jointName,
      type: joint.jointType, // 'revolute', 'continuous', 'prismatic', etc.
      axis: joint.axis ? [joint.axis.x, joint.axis.y, joint.axis.z] : null,
      limits: {
        lower: joint.limit?.lower ?? -Infinity,
        upper: joint.limit?.upper ?? Infinity,
        effort: joint.limit?.effort ?? Infinity,
        velocity: joint.limit?.velocity ?? Infinity
      },
      mimic: joint.mimicJoint ? {
        joint: joint.mimicJoint,
        multiplier: joint.multiplier ?? 1.0,
        offset: joint.offset ?? 0.0
      } : null
    }
  })

  return config
}

/**
 * Determine rotation axis name from URDF axis vector
 * @param {Array} axisVector - [x, y, z]
 * @returns {string} - 'pitch', 'yaw', or 'roll'
 */
export function getAxisName(axisVector) {
  if (!axisVector || axisVector.length !== 3) return 'pitch' // default

  const [x, y, z] = axisVector.map(Math.abs)

  // Determine primary axis (largest component)
  if (x > y && x > z) return 'roll'   // X-axis rotation
  if (y > x && y > z) return 'pitch'  // Y-axis rotation
  if (z > x && z > y) return 'yaw'    // Z-axis rotation

  return 'pitch' // fallback
}

/**
 * Group related joints by semantic meaning (e.g., thumb CMC multi-DoF)
 * This creates UI-friendly groupings from potentially multiple URDF joints
 *
 * @param {Object} jointConfig - Parsed joint configuration from parseJointConfig
 * @returns {Object} - Semantic joint groups for UI control
 */
export function createSemanticMapping(jointConfig) {
  const semanticMap = {}

  // Pattern 1: Multi-axis joints with explicit axis naming
  // Example: thumb_cmc_yaw, thumb_cmc_pitch, thumb_cmc_roll
  const multiAxisPattern = /^(.+)_(pitch|yaw|roll)$/i

  // Pattern 2: Standard single-axis joints
  // Example: index_pip, FFJ2, robot0_THJ1

  Object.entries(jointConfig).forEach(([jointName, config]) => {
    const match = jointName.match(multiAxisPattern)

    if (match) {
      // Multi-axis joint naming pattern detected
      const [_, baseJointName, axis] = match
      const axisLower = axis.toLowerCase()

      if (!semanticMap[baseJointName]) {
        semanticMap[baseJointName] = {
          uiName: baseJointName,
          urdfJoints: {},
          axes: [],
          limits: {},
          mimics: {}
        }
      }

      semanticMap[baseJointName].urdfJoints[axisLower] = jointName
      semanticMap[baseJointName].axes.push(axisLower)
      semanticMap[baseJointName].limits[axisLower] = [config.limits.lower, config.limits.upper]

      if (config.mimic) {
        semanticMap[baseJointName].mimics[axisLower] = config.mimic
      }
    } else {
      // Single-axis joint - create 1-to-1 mapping
      const axisName = getAxisName(config.axis)

      semanticMap[jointName] = {
        uiName: jointName,
        urdfJoints: { [axisName]: jointName },
        axes: [axisName],
        limits: { [axisName]: [config.limits.lower, config.limits.upper] },
        mimics: config.mimic ? { [axisName]: config.mimic } : {}
      }
    }
  })

  return semanticMap
}

/**
 * Infer MediaPipe joint name from URDF joint name
 * This helps bridge the gap between MediaPipe's naming (thumb_mcp)
 * and various URDF naming conventions (THJ1, thumb_cmc_pitch, etc.)
 *
 * @param {string} urdfJointName - URDF joint name
 * @returns {string|null} - Inferred MediaPipe joint name or null
 */
export function inferMediaPipeJointName(urdfJointName) {
  const lower = urdfJointName.toLowerCase()

  // Common patterns for finger joints
  const fingerPatterns = {
    thumb: ['thumb', 'thj', 'th_'],
    index: ['index', 'ffj', 'if_', 'ff_'],
    middle: ['middle', 'mfj', 'mf_'],
    ring: ['ring', 'rfj', 'rf_'],
    pinky: ['pinky', 'lfj', 'lf_', 'little']
  }

  const segmentPatterns = {
    mcp: ['mcp', 'cmc', 'j5', 'j4', 'metacarpal'],
    pip: ['pip', 'j3', 'proximal'],
    dip: ['dip', 'j2', 'j1', 'distal'],
    tip: ['tip', 'j0']
  }

  // Try to identify finger
  let finger = null
  for (const [fingerName, patterns] of Object.entries(fingerPatterns)) {
    if (patterns.some(p => lower.includes(p))) {
      finger = fingerName
      break
    }
  }

  // Try to identify segment
  let segment = null
  for (const [segmentName, patterns] of Object.entries(segmentPatterns)) {
    if (patterns.some(p => lower.includes(p))) {
      segment = segmentName
      break
    }
  }

  // Wrist joint
  if (lower.includes('wrist') || lower.includes('wr_') || lower === 'wj') {
    return 'wrist'
  }

  // Construct MediaPipe joint name
  if (finger && segment) {
    return `${finger}_${segment}`
  }

  return null
}

/**
 * Create reverse mapping from MediaPipe joint names to URDF semantic groups
 * This allows the system to find the correct URDF joints when given MediaPipe data
 *
 * @param {Object} semanticMapping - Semantic mapping from createSemanticMapping
 * @returns {Object} - Map from MediaPipe joint names to semantic groups
 */
export function createMediaPipeToSemanticMap(semanticMapping) {
  const mediaPipeMap = {}

  Object.entries(semanticMapping).forEach(([semanticName, mapping]) => {
    // Try to infer MediaPipe name from URDF joint names
    const firstUrdfJoint = Object.values(mapping.urdfJoints)[0]
    const inferredName = inferMediaPipeJointName(firstUrdfJoint)

    if (inferredName) {
      mediaPipeMap[inferredName] = semanticName
    }

    // Also map the semantic name directly
    mediaPipeMap[semanticName] = semanticName
  })

  return mediaPipeMap
}

/**
 * Get debug info about parsed URDF joint configuration
 * @param {Object} robot - URDF robot object
 * @returns {Object} - Debug statistics
 */
export function getURDFDebugInfo(robot) {
  if (!robot) return null

  const jointConfig = parseJointConfig(robot)
  const semanticMapping = createSemanticMapping(jointConfig)
  const mediaPipeMap = createMediaPipeToSemanticMap(semanticMapping)

  return {
    totalJoints: Object.keys(robot.joints).length,
    movableJoints: Object.keys(jointConfig).length,
    semanticGroups: Object.keys(semanticMapping).length,
    mediaPipeMappings: Object.keys(mediaPipeMap).length,
    jointTypes: Object.values(jointConfig).reduce((acc, j) => {
      acc[j.type] = (acc[j.type] || 0) + 1
      return acc
    }, {}),
    multiDoFGroups: Object.values(semanticMapping).filter(m => m.axes.length > 1).length
  }
}
