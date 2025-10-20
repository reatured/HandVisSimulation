/**
 * URDF Configuration Mapping
 * Maps model paths to their corresponding URDF file locations
 * Using GLB versions for better web performance
 */

const PUBLIC_URL = process.env.PUBLIC_URL || ''

export const URDF_MODELS = {
  ability_hand: {
    left: `${PUBLIC_URL}/assets/robots/hands/ability_hand/ability_hand_left_glb.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/ability_hand/ability_hand_right_glb.urdf`,
  },
  shadow_hand: {
    left: `${PUBLIC_URL}/assets/robots/hands/shadow_hand/shadow_hand_left_glb.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/shadow_hand/shadow_hand_right_glb.urdf`,
  },
  allegro_hand: {
    left: `${PUBLIC_URL}/assets/robots/hands/allegro_hand/allegro_hand_left_glb.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/allegro_hand/allegro_hand_right_glb.urdf`,
  },
  leap_hand: {
    left: `${PUBLIC_URL}/assets/robots/hands/leap_hand/leap_hand_left_glb.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/leap_hand/leap_hand_right_glb.urdf`,
  },
  schunk_hand: {
    left: `${PUBLIC_URL}/assets/robots/hands/schunk_hand/schunk_svh_hand_left_glb.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/schunk_hand/schunk_svh_hand_right_glb.urdf`,
  },
  dclaw_gripper: {
    null: `${PUBLIC_URL}/assets/robots/hands/dclaw_gripper/dclaw_gripper_glb.urdf`,
  },
  barrett_hand: {
    // Barrett hand may not have GLB version, will need to check
    null: `${PUBLIC_URL}/assets/robots/hands/barrett_hand/barrett_hand.urdf`,
  },
  panda_gripper: {
    // Panda gripper may not have GLB version, will need to check
    null: `${PUBLIC_URL}/assets/robots/hands/panda_gripper/panda_gripper.urdf`,
  },
  linker_l6: {
    left: `${PUBLIC_URL}/assets/robots/hands/linker_l6/left/linkerhand_l6_left.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/linker_l6/right/linkerhand_l6_right.urdf`,
  },
  linker_l10: {
    left: `${PUBLIC_URL}/assets/robots/hands/linker_l10/left/linkerhand_l10_left.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/linker_l10/right/linkerhand_l10_right.urdf`,
  },
  linker_l20: {
    left: `${PUBLIC_URL}/assets/robots/hands/linker_l20/left/linkerhand_l20_left.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/linker_l20/right/linkerhand_l20_right.urdf`,
  },
  linker_l20pro: {
    right: `${PUBLIC_URL}/assets/robots/hands/linker_l20pro/right/linkerhand_l20pro_right.urdf`,
  },
  linker_l21: {
    left: `${PUBLIC_URL}/assets/robots/hands/linker_l21/left/linkerhand_l21_left.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/linker_l21/right/linkerhand_l21_right.urdf`,
  },
  linker_l25: {
    left: `${PUBLIC_URL}/assets/robots/hands/linker_l25/left/linkerhand_l25_left.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/linker_l25/right/linkerhand_l25_right.urdf`,
  },
  linker_l30: {
    right: `${PUBLIC_URL}/assets/robots/hands/linker_l30/right/linkerhand_l30_right.urdf`,
  },
  linker_o6: {
    left: `${PUBLIC_URL}/assets/robots/hands/linker_o6/left/linkerhand_o6_left.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/linker_o6/right/linkerhand_o6_right.urdf`,
  },
  linker_o7: {
    left: `${PUBLIC_URL}/assets/robots/hands/linker_o7/left/linkerhand_o7v3_left.urdf`,
    right: `${PUBLIC_URL}/assets/robots/hands/linker_o7/right/linkerhand_o7v3_right.urdf`,
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
