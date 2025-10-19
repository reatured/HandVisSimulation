/**
 * URDF Configuration Mapping
 * Maps model paths to their corresponding URDF file locations
 * Using GLB versions for better web performance
 */

export const URDF_MODELS = {
  ability_hand: {
    left: '/assets/robots/hands/ability_hand/ability_hand_left_glb.urdf',
    right: '/assets/robots/hands/ability_hand/ability_hand_right_glb.urdf',
  },
  shadow_hand: {
    left: '/assets/robots/hands/shadow_hand/shadow_hand_left_glb.urdf',
    right: '/assets/robots/hands/shadow_hand/shadow_hand_right_glb.urdf',
  },
  allegro_hand: {
    left: '/assets/robots/hands/allegro_hand/allegro_hand_left_glb.urdf',
    right: '/assets/robots/hands/allegro_hand/allegro_hand_right_glb.urdf',
  },
  leap_hand: {
    left: '/assets/robots/hands/leap_hand/leap_hand_left_glb.urdf',
    right: '/assets/robots/hands/leap_hand/leap_hand_right_glb.urdf',
  },
  schunk_hand: {
    left: '/assets/robots/hands/schunk_hand/schunk_svh_hand_left_glb.urdf',
    right: '/assets/robots/hands/schunk_hand/schunk_svh_hand_right_glb.urdf',
  },
  dclaw_gripper: {
    null: '/assets/robots/hands/dclaw_gripper/dclaw_gripper_glb.urdf',
  },
  barrett_hand: {
    // Barrett hand may not have GLB version, will need to check
    null: '/assets/robots/hands/barrett_hand/barrett_hand.urdf',
  },
  panda_gripper: {
    // Panda gripper may not have GLB version, will need to check
    null: '/assets/robots/hands/panda_gripper/panda_gripper.urdf',
  },
}

/**
 * Get the URDF file path for a given model and side
 * @param {string} modelPath - Model path (e.g., 'shadow_hand')
 * @param {string|null} side - Side of the hand ('left', 'right', or null)
 * @returns {string|null} - URDF file path or null if not found
 */
export function getURDFPath(modelPath, side) {
  const model = URDF_MODELS[modelPath]
  if (!model) return null

  // For models without side (grippers), use null key
  const sideKey = side || 'null'
  return model[sideKey] || null
}

/**
 * Check if a model has URDF support
 * @param {string} modelPath - Model path (e.g., 'shadow_hand')
 * @returns {boolean} - True if URDF is available
 */
export function hasURDFSupport(modelPath) {
  return modelPath in URDF_MODELS
}
