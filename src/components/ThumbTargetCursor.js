/**
 * FingertipTargetCursors Component
 *
 * Displays 3D cube cursors showing:
 * - 5 fingertip target positions (thumb, index, middle, ring, pinky)
 * - 4 MCP joint positions (index, middle, ring, pinky - excluding thumb)
 * All positioned relative to the wrist from hand tracking data.
 *
 * This serves as the IK target visualization for all fingers.
 * Includes position smoothing to eliminate jittery movement.
 * Includes lines from wrist origin to each target position.
 */

import { useRef, useState, useEffect } from 'react'
import { Line, Text } from '@react-three/drei'
import * as THREE from 'three'

export default function ThumbTargetCursor({ landmarks, side, rotation = [Math.PI / 2, 0, Math.PI / 2] }) {
  // Smoothing parameters
  const ALPHA = 0.2 // Smoothing factor (0-1): lower = smoother, higher = more responsive

  // Store previous smoothed position
  const previousPosRef = useRef(null)
  const [smoothedPos, setSmoothedPos] = useState(null)

  useEffect(() => {
    if (!landmarks || landmarks.length < 21) {
      return
    }

    // MediaPipe landmark indices
    const WRIST = 0
    const THUMB_TIP = 4
    const INDEX_MCP = 5
    const INDEX_TIP = 8
    const MIDDLE_MCP = 9
    const MIDDLE_TIP = 12
    const RING_MCP = 13
    const RING_TIP = 16
    const PINKY_MCP = 17
    const PINKY_TIP = 20

    const wrist = landmarks[WRIST]

    // Fingertip targets
    const fingertips = [
      { name: 'thumb', landmark: landmarks[THUMB_TIP] },
      { name: 'index', landmark: landmarks[INDEX_TIP] },
      { name: 'middle', landmark: landmarks[MIDDLE_TIP] },
      { name: 'ring', landmark: landmarks[RING_TIP] },
      { name: 'pinky', landmark: landmarks[PINKY_TIP] }
    ]

    // MCP joint targets (4 fingers, excluding thumb)
    const mcpJoints = [
      { name: 'index_mcp', landmark: landmarks[INDEX_MCP] },
      { name: 'middle_mcp', landmark: landmarks[MIDDLE_MCP] },
      { name: 'ring_mcp', landmark: landmarks[RING_MCP] },
      { name: 'pinky_mcp', landmark: landmarks[PINKY_MCP] }
    ]

    // Combine all targets
    const allTargets = [...fingertips, ...mcpJoints]

    // Build hand-oriented coordinate system
    const middleMcp = landmarks[MIDDLE_MCP]
    const ringMcp = landmarks[RING_MCP]
    const indexMcp = landmarks[INDEX_MCP]
    const pinkyMcp = landmarks[PINKY_MCP]

    // Forward vector: wrist to midpoint between middle and ring MCPs
    const midPoint = {
      x: (middleMcp.x + ringMcp.x) / 2,
      y: (middleMcp.y + ringMcp.y) / 2,
      z: (middleMcp.z + ringMcp.z) / 2
    }
    const forward = new THREE.Vector3(
      midPoint.x - wrist.x,
      midPoint.y - wrist.y,
      midPoint.z - wrist.z
    ).normalize()

    // Hand width vector (index to pinky MCP) - only used to compute normal
    const widthVec = new THREE.Vector3(
      pinkyMcp.x - indexMcp.x,
      pinkyMcp.y - indexMcp.y,
      pinkyMcp.z - indexMcp.z
    )

    // Up vector: normal to the plane (forward × width)
    const up = new THREE.Vector3().crossVectors(forward, widthVec).normalize()

    // Right vector: perpendicular to both (up × forward)
    const right = new THREE.Vector3().crossVectors(up, forward).normalize()

    // Create transformation matrix from hand basis vectors
    // Matrix columns are the basis vectors
    const handMatrix = new THREE.Matrix4()
    handMatrix.makeBasis(right, up, forward)

    // Invert to transform from world space to hand space
    const invHandMatrix = handMatrix.clone().invert()

    // Calculate positions in hand-oriented coordinate system
    // MediaPipe: x right, y down, z toward camera (negative = away)
    // Three.js: x right, y up, z toward viewer (positive = toward)
    const rawPositions = allTargets.map(({ name, landmark }) => {
      // Calculate relative position in MediaPipe space
      const relativeVec = new THREE.Vector3(
        landmark.x - wrist.x,
        landmark.y - wrist.y,
        landmark.z - wrist.z
      )

      // Transform to hand-oriented space
      const transformedVec = relativeVec.applyMatrix4(invHandMatrix)

      // Apply MediaPipe → Three.js axis conversions
      return {
        name,
        pos: {
          x: transformedVec.x,        // Keep X as-is
          y: -transformedVec.y,       // Invert Y (MediaPipe down → Three.js up)
          z: -transformedVec.z        // Invert Z (MediaPipe toward camera → Three.js away)
        }
      }
    })

    // Apply exponential moving average smoothing
    if (previousPosRef.current === null) {
      // First frame - no smoothing
      previousPosRef.current = rawPositions
      setSmoothedPos(rawPositions)
    } else {
      // Apply EMA: smoothed = alpha * raw + (1 - alpha) * previous
      const newSmoothedPositions = rawPositions.map(({ name, pos }, index) => {
        const prevPos = previousPosRef.current[index].pos
        return {
          name,
          pos: {
            x: ALPHA * pos.x + (1 - ALPHA) * prevPos.x,
            y: ALPHA * pos.y + (1 - ALPHA) * prevPos.y,
            z: ALPHA * pos.z + (1 - ALPHA) * prevPos.z
          }
        }
      })
      previousPosRef.current = newSmoothedPositions
      setSmoothedPos(newSmoothedPositions)
    }
  }, [landmarks])

  // Reset smoothing when landmarks become null
  useEffect(() => {
    if (!landmarks) {
      previousPosRef.current = null
      setSmoothedPos(null)
    }
  }, [landmarks])

  if (!smoothedPos || !Array.isArray(smoothedPos)) {
    return null
  }

  // Color based on hand side
  const color = side === 'left' ? '#00BFFF' : '#FF6B6B'

  return (
    <group rotation={rotation}>
      {/* Wrist origin marker */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.02, 0.02, 0.02]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Fingertips with position labels (first 5 targets) */}
      {smoothedPos.slice(0, 5).map(({ name, pos }) => (
        <group key={name}>
          {/* Line from wrist origin to fingertip target */}
          <Line
            points={[
              [0, 0, 0],  // Wrist origin
              [pos.x, pos.y, pos.z]  // Fingertip target
            ]}
            color={color}
            lineWidth={2}
            transparent
            opacity={0.6}
          />

          {/* Cube at fingertip target position */}
          <mesh position={[pos.x, pos.y, pos.z]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.8}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* Position text label above cube */}
          <Text
            position={[pos.x, pos.y + 0.03, pos.z]}
            fontSize={0.005}
            color={color}
            anchorX="center"
            anchorY="bottom"
          >
            {`(${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)})`}
          </Text>
        </group>
      ))}

      {/* MCP joints without labels (last 4 targets) */}
      {smoothedPos.slice(5).map(({ name, pos }) => (
        <group key={name}>
          {/* Line from wrist origin to MCP target */}
          <Line
            points={[
              [0, 0, 0],  // Wrist origin
              [pos.x, pos.y, pos.z]  // MCP target
            ]}
            color={color}
            lineWidth={2}
            transparent
            opacity={0.6}
          />

          {/* Cube at MCP target position */}
          <mesh position={[pos.x, pos.y, pos.z]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.8}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
