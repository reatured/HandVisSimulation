import { Suspense } from 'react'
import { Text } from '@react-three/drei'
import AbilityHand from '../models/AbilityHand'
import InspireHand from '../models/InspireHand'

function HandModelInner({ position = [0, 0, 0], modelPath = 'ability_hand', side = 'left', jointRotations = {} }) {
  // Select the appropriate model component based on modelPath
  const renderModel = () => {
    switch (modelPath) {
      case 'ability_hand':
        return <AbilityHand side={side} jointRotations={jointRotations} />
      case 'inspire_hand':
        return <InspireHand side={side} />
      case 'shadow_hand':
      case 'allegro_hand':
      case 'leap_hand':
      case 'schunk_hand':
      case 'barrett_hand':
      case 'dclaw_gripper':
      case 'panda_gripper':
        // Placeholder for models not yet implemented
        return (
          <group>
            <Text
              position={[0, 0, 0]}
              fontSize={0.1}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {modelPath.replace('_', ' ').toUpperCase()}
              {'\n'}
              (Coming Soon)
            </Text>
            <mesh>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="orange" opacity={0.5} transparent />
            </mesh>
          </group>
        )
      default:
        return null
    }
  }

  return (
    <group position={position}>
      {renderModel()}
    </group>
  )
}

export default function HandModel(props) {
  return (
    <Suspense fallback={null}>
      <HandModelInner {...props} />
    </Suspense>
  )
}
