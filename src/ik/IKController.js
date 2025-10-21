/**
 * IKController.js
 *
 * React component that manages IK state and processes camera landmarks
 * through the IK solver to generate joint rotations
 */

import { useState, useEffect, useRef } from 'react'
import HandIKSolver from './IKSolver'

/**
 * IKController Component
 * Handles IK mode logic - processes camera landmarks and outputs joint rotations
 *
 * @param {Object} cameraLandmarks - Raw landmarks from HandTrackingCamera
 * @param {Function} onIKJointRotations - Callback to send computed joint rotations
 * @param {Object} ikOptions - IK solver options (iterations, threshold, etc.)
 */
export default function IKController({
  cameraLandmarks = { left: null, right: null },
  onIKJointRotations,
  ikOptions = {}
}) {
  // IK solver instance
  const solverRef = useRef(null)

  // Initialize solver
  useEffect(() => {
    solverRef.current = new HandIKSolver(ikOptions)
  }, [])

  // Update solver options when they change
  useEffect(() => {
    if (solverRef.current) {
      solverRef.current.setOptions(ikOptions)
    }
  }, [ikOptions])

  // Process camera landmarks through IK solver
  useEffect(() => {
    if (!solverRef.current) return

    const ikJointRotations = {
      left: {},
      right: {}
    }

    // Solve IK for left hand
    if (cameraLandmarks.left) {
      ikJointRotations.left = solverRef.current.solve(cameraLandmarks.left, 'left')
    }

    // Solve IK for right hand
    if (cameraLandmarks.right) {
      ikJointRotations.right = solverRef.current.solve(cameraLandmarks.right, 'right')
    }

    // Send computed joint rotations to parent
    if (onIKJointRotations) {
      onIKJointRotations(ikJointRotations)
    }
  }, [cameraLandmarks, onIKJointRotations])

  // IKController doesn't render anything visible
  // It's a logic-only component
  return null
}
