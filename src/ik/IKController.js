/**
 * IKController.js
 *
 * React component that manages IK state and processes camera landmarks
 * through the CCDIKSolver to generate joint rotations
 *
 * Updated to use TypeScript skeleton-builder + CCDIKSolver
 */

import { useEffect, useRef } from 'react'
import { buildSkeletonFromSpec } from './builders/skeleton-builder.ts'
import { linkerhand_l10_left_thumb } from './specs/linkerhand_l10_left.ts'

/**
 * IKController Component
 * Handles IK mode logic - processes camera landmarks and outputs joint rotations
 *
 * @param {Object} cameraLandmarks - Raw landmarks from HandTrackingCamera
 * @param {Function} onIKJointRotations - Callback to send computed joint rotations
 * @param {Function} onIKDebugData - Callback to send debug visualization data
 * @param {Object} ikOptions - IK solver options (iterations, threshold, etc.)
 */
export default function IKController({
  cameraLandmarks = { left: null, right: null },
  onIKJointRotations,
  onIKDebugData,
  ikOptions = {}
}) {
  // IK skeleton instances (built once)
  const leftSkeletonRef = useRef(null)
  const rightSkeletonRef = useRef(null)

  // Initialize skeletons
  useEffect(() => {
    try {
      // Build left hand skeleton
      const leftSkeleton = buildSkeletonFromSpec(linkerhand_l10_left_thumb)
      const leftTarget = leftSkeleton.targets.get('thumb_target')
      if (leftTarget) {
        leftTarget.position.set(0.03, 0.02, 0.12) // Default position
      }
      leftSkeletonRef.current = leftSkeleton

      // Build right hand skeleton (mirror of left)
      const rightSkeleton = buildSkeletonFromSpec(linkerhand_l10_left_thumb)
      const rightTarget = rightSkeleton.targets.get('thumb_target')
      if (rightTarget) {
        rightTarget.position.set(-0.03, 0.02, 0.12) // Mirrored position
      }
      rightSkeletonRef.current = rightSkeleton

      console.log('✅ IK skeletons initialized')
    } catch (error) {
      console.error('❌ Failed to initialize IK skeletons:', error)
    }
  }, [])

  // Process camera landmarks through IK solver
  useEffect(() => {
    if (!leftSkeletonRef.current || !rightSkeletonRef.current) return

    const ikJointRotations = {
      left: {},
      right: {}
    }

    const ikDebugData = {
      left: null,
      right: null
    }

    // Solve IK for left hand
    if (cameraLandmarks.left) {
      try {
        const result = solveHandIK(
          leftSkeletonRef.current,
          cameraLandmarks.left,
          'left'
        )
        ikJointRotations.left = result.angles || {}
        ikDebugData.left = result.debugData || null
      } catch (error) {
        console.error('Left hand IK error:', error)
      }
    }

    // Solve IK for right hand
    if (cameraLandmarks.right) {
      try {
        const result = solveHandIK(
          rightSkeletonRef.current,
          cameraLandmarks.right,
          'right'
        )
        ikJointRotations.right = result.angles || {}
        ikDebugData.right = result.debugData || null
      } catch (error) {
        console.error('Right hand IK error:', error)
      }
    }

    // Send computed joint rotations to parent
    if (onIKJointRotations) {
      onIKJointRotations(ikJointRotations)
    }

    // Send debug data to parent
    if (onIKDebugData) {
      onIKDebugData(ikDebugData)
    }
  }, [cameraLandmarks, onIKJointRotations, onIKDebugData])

  // IKController doesn't render anything visible
  return null
}

/**
 * Solve IK for hand landmarks using CCDIKSolver
 * @param {Object} skeleton - Skeleton build result
 * @param {Array} landmarks - MediaPipe 21 landmarks
 * @param {String} handedness - 'left' or 'right'
 * @returns {Object} { angles: {...}, debugData: {...} }
 */
function solveHandIK(skeleton, landmarks, handedness) {
  if (!landmarks || landmarks.length !== 21) {
    return { angles: {}, debugData: {} }
  }

  // MediaPipe thumb landmarks: 0 (wrist), 1 (CMC), 2 (MCP), 3 (IP), 4 (tip)
  const thumbTip = landmarks[4]

  // Update target position to thumb tip
  const target = skeleton.targets.get('thumb_target')
  if (target && thumbTip) {
    target.position.set(thumbTip.x, thumbTip.y, thumbTip.z)
  }

  // Solve IK
  skeleton.solver.update()
  skeleton.applyAxisConstraints()
  skeleton.applyMimicConstraints()

  // Extract joint angles from bones
  const angles = extractJointAngles(skeleton)

  // Debug data
  const debugData = {
    rawLandmarks: landmarks,
    targetPosition: target ? target.position.toArray() : null,
    jointAngles: angles
  }

  return { angles, debugData }
}

/**
 * Extract joint angles from skeleton bones
 * Returns angles in URDF format for use with hand models
 */
function extractJointAngles(skeleton) {
  const angles = {}

  // Extract rotation for each joint
  // For now, just extract Y-axis rotation (common for finger joints)
  const jointNames = [
    'thumb_cmc_roll',
    'thumb_cmc_yaw',
    'thumb_cmc_pitch',
    'thumb_mcp',
    'thumb_ip'
  ]

  for (const jointName of jointNames) {
    // Find the child bone for this joint
    const bone = skeleton.bones.get(jointName.replace('_', '_metacarpals_'))
    if (bone) {
      // Simple extraction: use Y-axis rotation
      // For more complex joints, convert quaternion to axis-angle
      angles[jointName] = bone.rotation.y
    }
  }

  return angles
}
