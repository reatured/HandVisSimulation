import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * JointGimbalVisualizer Component
 * Displays 3D coordinate axes (gimbals) at each joint position to visualize joint rotations
 */
export default function JointGimbalVisualizer({ robot, visible = true, scale = 0.05 }) {
  const helpersRef = useRef([])

  useEffect(() => {
    if (!robot || !visible) {
      // Clear existing helpers
      helpersRef.current.forEach(helper => {
        if (helper.parent) {
          helper.parent.remove(helper)
        }
        helper.dispose?.()
      })
      helpersRef.current = []
      return
    }

    // Create axes helpers for each joint
    const newHelpers = []

    robot.traverse((child) => {
      // Check if this is a joint (has isURDFJoint property or has joint data)
      if (child.isURDFJoint || (child.userData && child.userData.jointType)) {
        // Create a small axes helper to show the joint's local coordinate frame
        const axesHelper = new THREE.AxesHelper(scale)

        // Add the axes helper as a child of the joint
        // This ensures it follows the joint's position and rotation
        child.add(axesHelper)
        newHelpers.push(axesHelper)
      }
    })

    helpersRef.current = newHelpers

    // Cleanup function
    return () => {
      newHelpers.forEach(helper => {
        if (helper.parent) {
          helper.parent.remove(helper)
        }
        helper.dispose?.()
      })
    }
  }, [robot, visible, scale])

  // Update helpers visibility
  useFrame(() => {
    helpersRef.current.forEach(helper => {
      if (helper) {
        helper.visible = visible
      }
    })
  })

  // This component doesn't render anything itself
  // It adds axes helpers directly to the robot's joint nodes
  return null
}
