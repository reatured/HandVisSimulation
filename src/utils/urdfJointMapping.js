/**
 * URDF Joint Mapping Utilities
 * Maps UI joint names to actual URDF joint names for different hand models
 */

/**
 * Shadow Hand Joint Mappings
 * UI Name -> URDF Joint Name
 *
 * Shadow hand uses the following naming convention:
 * - WRJ1/WRJ2: Wrist joints
 * - THJ1-5: Thumb joints
 * - FFJ1-4: First Finger (Index) joints
 * - MFJ1-4: Middle Finger joints
 * - RFJ1-4: Ring Finger joints
 * - LFJ1-5: Little Finger (Pinky) joints
 */
const SHADOW_HAND_JOINT_MAP = {
  // Wrist - WRJ1 is primary rotation
  wrist: 'WRJ1',

  // Thumb - 5 DOF (Degrees of Freedom)
  thumb_mcp: 'THJ4',   // MCP abduction/adduction
  thumb_pip: 'THJ3',   // MCP flexion/extension
  thumb_dip: 'THJ2',   // IP flexion/extension
  thumb_tip: 'THJ1',   // Distal joint

  // Index finger (First Finger)
  index_mcp: 'FFJ3',   // MCP flexion/extension
  index_pip: 'FFJ2',   // PIP joint
  index_dip: 'FFJ1',   // DIP joint

  // Middle finger
  middle_mcp: 'MFJ3',  // MCP flexion/extension
  middle_pip: 'MFJ2',  // PIP joint
  middle_dip: 'MFJ1',  // DIP joint

  // Ring finger
  ring_mcp: 'RFJ3',    // MCP flexion/extension
  ring_pip: 'RFJ2',    // PIP joint
  ring_dip: 'RFJ1',    // DIP joint

  // Pinky (Little Finger)
  pinky_mcp: 'LFJ3',   // MCP flexion/extension
  pinky_pip: 'LFJ2',   // PIP joint
  pinky_dip: 'LFJ1',   // DIP joint
}

/**
 * Allegro Hand Joint Mappings
 * Allegro uses numerical joint names: joint_0.0 to joint_15.0
 * Layout: 4 fingers × 4 joints each = 16 joints
 */
const ALLEGRO_HAND_JOINT_MAP = {
  // Index finger (joints 0-3)
  index_mcp: 'joint_0.0',
  index_pip: 'joint_1.0',
  index_dip: 'joint_2.0',
  index_tip: 'joint_3.0',

  // Middle finger (joints 4-7)
  middle_mcp: 'joint_4.0',
  middle_pip: 'joint_5.0',
  middle_dip: 'joint_6.0',
  middle_tip: 'joint_7.0',

  // Ring finger (joints 8-11) - mapped to pinky for consistency with UI
  pinky_mcp: 'joint_8.0',
  pinky_pip: 'joint_9.0',
  pinky_dip: 'joint_10.0',
  pinky_tip: 'joint_11.0',

  // Thumb (joints 12-15)
  thumb_mcp: 'joint_12.0',
  thumb_pip: 'joint_13.0',
  thumb_dip: 'joint_14.0',
  thumb_tip: 'joint_15.0',
}

/**
 * Leap Hand Joint Mappings
 * Leap uses simple numerical joint names: 0 to 15
 * Layout: 4 fingers × 4 joints each = 16 joints
 */
const LEAP_HAND_JOINT_MAP = {
  // Thumb (joints 0-3)
  thumb_mcp: '0',
  thumb_pip: '1',
  thumb_dip: '2',
  thumb_tip: '3',

  // Index finger (joints 4-7)
  index_mcp: '4',
  index_pip: '5',
  index_dip: '6',
  index_tip: '7',

  // Middle finger (joints 8-11)
  middle_mcp: '8',
  middle_pip: '9',
  middle_dip: '10',
  middle_tip: '11',

  // Ring finger (joints 12-15)
  ring_mcp: '12',
  ring_pip: '13',
  ring_dip: '14',
  ring_tip: '15',
}

/**
 * AbilityHand Joint Mappings
 * AbilityHand uses q1/q2 naming: thumb_q1, thumb_q2, index_q1, etc.
 * Layout: 5 fingers × 2 joints each (MCP and PIP) = 10 joints
 * Joint limits from URDF:
 * - thumb_q1: -2.09 to 0 rad
 * - thumb_q2: 0 to 2.09 rad
 * - All other q1: 0 to 2.09 rad
 * - All other q2: 0 to 2.66 rad (with mimic coupling)
 */
const ABILITY_HAND_JOINT_MAP = {
  // Thumb - 2 DOF
  thumb_mcp: 'thumb_q1',   // MCP joint (-2.09 to 0 rad)
  thumb_pip: 'thumb_q2',   // PIP/IP joint (0 to 2.09 rad)

  // Index finger - 2 DOF
  index_mcp: 'index_q1',   // MCP joint (0 to 2.09 rad)
  index_pip: 'index_q2',   // PIP joint (0 to 2.66 rad, mimics q1)

  // Middle finger - 2 DOF
  middle_mcp: 'middle_q1', // MCP joint (0 to 2.09 rad)
  middle_pip: 'middle_q2', // PIP joint (0 to 2.66 rad, mimics q1)

  // Ring finger - 2 DOF
  ring_mcp: 'ring_q1',     // MCP joint (0 to 2.09 rad)
  ring_pip: 'ring_q2',     // PIP joint (0 to 2.66 rad, mimics q1)

  // Pinky - 2 DOF
  pinky_mcp: 'pinky_q1',   // MCP joint (0 to 2.09 rad)
  pinky_pip: 'pinky_q2',   // PIP joint (0 to 2.66 rad, mimics q1)
}

/**
 * Linker Hand L6 Joint Mappings (11 DOF - simpler structure)
 * Thumb: cmc_roll, cmc_pitch, dip (3 DOF)
 * Fingers: mcp_pitch, dip (2 DOF each)
 */
const LINKER_L6_JOINT_MAP = {
  // Thumb - 3 DOF (note: typo in URDF "thunb" instead of "thumb")
  thumb_mcp: 'thunb_cmc_roll',    // Using cmc_roll as MCP equivalent
  thumb_pip: 'thumb_cmc_pitch',   // Using cmc_pitch as PIP equivalent
  thumb_dip: 'thumb_dip',

  // Index finger - 2 DOF
  index_mcp: 'index_mcp_pitch',
  index_pip: 'index_dip',         // Using dip as PIP (no separate PIP joint)

  // Middle finger - 2 DOF
  middle_mcp: 'middle_mcp_pitch',
  middle_pip: 'middle_dip',

  // Ring finger - 2 DOF
  ring_mcp: 'ring_mcp_pitch',
  ring_pip: 'ring_dip',

  // Pinky - 2 DOF
  pinky_mcp: 'pinky_mcp_pitch',
  pinky_pip: 'pinky_dip',
}

/**
 * Linker Hand L10 Joint Mappings (20 DOF - intermediate structure)
 * Thumb: cmc_roll, cmc_yaw, cmc_pitch, mcp, ip (5 DOF)
 * Index: mcp_roll, mcp_pitch, pip, dip (4 DOF)
 * Middle: mcp_pitch, pip, dip (3 DOF)
 * Ring: mcp_roll, mcp_pitch, pip, dip (4 DOF)
 * Pinky: mcp_roll, mcp_pitch, pip, dip (4 DOF)
 */
const LINKER_L10_JOINT_MAP = {
  // Thumb - 5 DOF
  thumb_mcp: 'thumb_cmc_pitch',   // Using cmc_pitch as primary control
  thumb_pip: 'thumb_mcp',
  thumb_dip: 'thumb_ip',

  // Index finger - 4 DOF
  index_mcp: 'index_mcp_pitch',
  index_pip: 'index_pip',
  index_dip: 'index_dip',

  // Middle finger - 3 DOF
  middle_mcp: 'middle_mcp_pitch',
  middle_pip: 'middle_pip',
  middle_dip: 'middle_dip',

  // Ring finger - 4 DOF
  ring_mcp: 'ring_mcp_pitch',
  ring_pip: 'ring_pip',
  ring_dip: 'ring_dip',

  // Pinky - 4 DOF
  pinky_mcp: 'pinky_mcp_pitch',
  pinky_pip: 'pinky_pip',
  pinky_dip: 'pinky_dip',
}

/**
 * Linker Hand L20/L21/L25/L30/O6/O7 Joint Mappings (21 DOF - full articulation)
 * All fingers: mcp_roll, mcp_pitch, pip, dip (4 DOF each)
 * Thumb: cmc_yaw, cmc_roll, cmc_pitch, mcp, ip (5 DOF)
 */
const LINKER_L20_JOINT_MAP = {
  // Thumb - 5 DOF
  thumb_mcp: 'thumb_cmc_pitch',   // Using cmc_pitch as primary control
  thumb_pip: 'thumb_mcp',
  thumb_dip: 'thumb_ip',

  // Index finger - 4 DOF
  index_mcp: 'index_mcp_pitch',
  index_pip: 'index_pip',
  index_dip: 'index_dip',

  // Middle finger - 4 DOF
  middle_mcp: 'middle_mcp_pitch',
  middle_pip: 'middle_pip',
  middle_dip: 'middle_dip',

  // Ring finger - 4 DOF
  ring_mcp: 'ring_mcp_pitch',
  ring_pip: 'ring_pip',
  ring_dip: 'ring_dip',

  // Pinky - 4 DOF
  pinky_mcp: 'pinky_mcp_pitch',
  pinky_pip: 'pinky_pip',
  pinky_dip: 'pinky_dip',
}

/**
 * Model-specific joint mappings
 */
const JOINT_MAPPINGS = {
  ability_hand: ABILITY_HAND_JOINT_MAP,
  shadow_hand: SHADOW_HAND_JOINT_MAP,
  allegro_hand: ALLEGRO_HAND_JOINT_MAP,
  leap_hand: LEAP_HAND_JOINT_MAP,
  schunk_hand: {}, // TODO: Add Schunk mappings
  dclaw_gripper: {}, // TODO: Add DClaw mappings
  barrett_hand: {}, // TODO: Add Barrett mappings
  panda_gripper: {}, // TODO: Add Panda mappings
  // Linker Hand models
  linker_l6: LINKER_L6_JOINT_MAP,
  linker_l10: LINKER_L10_JOINT_MAP,
  linker_l20: LINKER_L20_JOINT_MAP,
  linker_l20pro: LINKER_L20_JOINT_MAP,  // Same structure as L20
  linker_l21: LINKER_L20_JOINT_MAP,     // Same structure as L20
  linker_l25: LINKER_L20_JOINT_MAP,     // Same structure as L20
  linker_l30: LINKER_L20_JOINT_MAP,     // Same structure as L20
  linker_o6: LINKER_L20_JOINT_MAP,      // Same structure as L20
  linker_o7: LINKER_L20_JOINT_MAP,      // Same structure as L20
}

/**
 * Map UI joint name to URDF joint name for a specific model
 * @param {string} uiJointName - UI joint name (e.g., 'thumb_mcp')
 * @param {string} modelPath - Model path (e.g., 'shadow_hand')
 * @returns {string|null} - URDF joint name or null if not found
 */
export function mapUIJointToURDF(uiJointName, modelPath) {
  const modelMapping = JOINT_MAPPINGS[modelPath]
  if (!modelMapping) {
    console.warn(`No joint mapping found for model: ${modelPath}`)
    return null
  }

  const urdfJointName = modelMapping[uiJointName]
  if (!urdfJointName) {
    console.warn(`No URDF joint found for UI joint: ${uiJointName} in model: ${modelPath}`)
    return null
  }

  return urdfJointName
}

/**
 * Map URDF joint name to UI joint name for a specific model
 * @param {string} urdfJointName - URDF joint name (e.g., 'THJ4')
 * @param {string} modelPath - Model path (e.g., 'shadow_hand')
 * @returns {string|null} - UI joint name or null if not found
 */
export function mapURDFJointToUI(urdfJointName, modelPath) {
  const modelMapping = JOINT_MAPPINGS[modelPath]
  if (!modelMapping) return null

  // Reverse lookup
  for (const [uiName, urdfName] of Object.entries(modelMapping)) {
    if (urdfName === urdfJointName) {
      return uiName
    }
  }

  return null
}

/**
 * Get all UI joint names that have URDF mappings for a model
 * @param {string} modelPath - Model path (e.g., 'shadow_hand')
 * @returns {string[]} - Array of UI joint names
 */
export function getAvailableJoints(modelPath) {
  const modelMapping = JOINT_MAPPINGS[modelPath]
  if (!modelMapping) return []

  return Object.keys(modelMapping)
}

/**
 * Get all URDF joint names for a model
 * @param {string} modelPath - Model path (e.g., 'shadow_hand')
 * @returns {string[]} - Array of URDF joint names
 */
export function getURDFJointNames(modelPath) {
  const modelMapping = JOINT_MAPPINGS[modelPath]
  if (!modelMapping) return []

  return Object.values(modelMapping)
}

/**
 * Joint limits for AbilityHand (in radians)
 * Values extracted from URDF files
 */
const ABILITY_HAND_JOINT_LIMITS = {
  thumb_q1: { lower: -2.0943951, upper: 0 },
  thumb_q2: { lower: 0, upper: 2.0943951 },
  index_q1: { lower: 0, upper: 2.0943951 },
  index_q2: { lower: 0, upper: 2.6586 },
  middle_q1: { lower: 0, upper: 2.0943951 },
  middle_q2: { lower: 0, upper: 2.6586 },
  ring_q1: { lower: 0, upper: 2.0943951 },
  ring_q2: { lower: 0, upper: 2.6586 },
  pinky_q1: { lower: 0, upper: 2.0943951 },
  pinky_q2: { lower: 0, upper: 2.6586 },
}

/**
 * Joint limits by model
 */
const JOINT_LIMITS = {
  ability_hand: ABILITY_HAND_JOINT_LIMITS,
  // Other models can be added here as needed
}

/**
 * Get joint limits for a specific URDF joint
 * @param {string} urdfJointName - URDF joint name (e.g., 'thumb_q1')
 * @param {string} modelPath - Model path (e.g., 'ability_hand')
 * @returns {{lower: number, upper: number}|null} - Joint limits or null if not defined
 */
export function getJointLimits(urdfJointName, modelPath) {
  const modelLimits = JOINT_LIMITS[modelPath]
  if (!modelLimits) return null

  return modelLimits[urdfJointName] || null
}

/**
 * Clamp a joint value to its limits
 * @param {number} value - Joint value in radians
 * @param {string} urdfJointName - URDF joint name
 * @param {string} modelPath - Model path
 * @returns {number} - Clamped value
 */
export function clampJointValue(value, urdfJointName, modelPath) {
  const limits = getJointLimits(urdfJointName, modelPath)
  if (!limits) return value // No limits defined, return as-is

  return Math.max(limits.lower, Math.min(limits.upper, value))
}
