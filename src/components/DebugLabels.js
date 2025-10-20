import { Text } from '@react-three/drei'

/**
 * DebugLabels Component
 * Displays 3D text labels to help identify hand positions and scene orientation
 */
export default function DebugLabels({ visible = true }) {
  if (!visible) return null

  return (
    <group>
      {/* Hand labels - positioned above where hands appear */}
      <Text
        position={[0.3, 0.4, 0]}
        fontSize={0.08}
        color="yellow"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="black"
      >
        LEFT HAND
      </Text>

      <Text
        position={[-0.3, 0.4, 0]}
        fontSize={0.08}
        color="cyan"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="black"
      >
        RIGHT HAND
      </Text>

      {/* Scene direction labels */}
      {/* FRONT - toward viewer (positive Z) */}
      <Text
        position={[0, -0.25, 0.8]}
        fontSize={0.1}
        color="lime"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="black"
      >
        FRONT
      </Text>

      {/* BACK - away from viewer (negative Z) */}
      <Text
        position={[0, -0.25, -0.8]}
        fontSize={0.1}
        color="red"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="black"
        rotation={[0, Math.PI, 0]}
      >
        BACK
      </Text>

      {/* LEFT - viewer's left (positive X) */}
      <Text
        position={[0.8, -0.25, 0]}
        fontSize={0.1}
        color="orange"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="black"
        rotation={[0, -Math.PI / 2, 0]}
      >
        LEFT
      </Text>

      {/* RIGHT - viewer's right (negative X) */}
      <Text
        position={[-0.8, -0.25, 0]}
        fontSize={0.1}
        color="purple"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="black"
        rotation={[0, Math.PI / 2, 0]}
      >
        RIGHT
      </Text>
    </group>
  )
}
