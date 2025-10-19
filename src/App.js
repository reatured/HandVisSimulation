import { useState, useCallback, useMemo } from 'react'
import HandTrackingCamera from './components/HandTrackingCamera'
import Scene3D from './components/Scene3D'
import ControlPanel from './components/ControlPanel'
import DebugPanel from './components/DebugPanel'

// Available hand models configuration
const HAND_MODELS = [
  { id: 'ability_left', name: 'Ability Hand (Left)', path: 'ability_hand', side: 'left' },
  { id: 'ability_right', name: 'Ability Hand (Right)', path: 'ability_hand', side: 'right' },
  { id: 'shadow_left', name: 'Shadow Hand (Left)', path: 'shadow_hand', side: 'left' },
  { id: 'shadow_right', name: 'Shadow Hand (Right)', path: 'shadow_hand', side: 'right' },
  { id: 'allegro_left', name: 'Allegro Hand (Left)', path: 'allegro_hand', side: 'left' },
  { id: 'allegro_right', name: 'Allegro Hand (Right)', path: 'allegro_hand', side: 'right' },
  { id: 'inspire_left', name: 'Inspire Hand (Left)', path: 'inspire_hand', side: 'left' },
  { id: 'inspire_right', name: 'Inspire Hand (Right)', path: 'inspire_hand', side: 'right' },
  { id: 'leap_left', name: 'Leap Hand (Left)', path: 'leap_hand', side: 'left' },
  { id: 'leap_right', name: 'Leap Hand (Right)', path: 'leap_hand', side: 'right' },
  { id: 'schunk_left', name: 'Schunk SVH Hand (Left)', path: 'schunk_hand', side: 'left' },
  { id: 'schunk_right', name: 'Schunk SVH Hand (Right)', path: 'schunk_hand', side: 'right' },
  { id: 'barrett', name: 'Barrett Hand', path: 'barrett_hand', side: null },
  { id: 'dclaw', name: 'DClaw Gripper', path: 'dclaw_gripper', side: null },
  { id: 'panda', name: 'Panda Gripper', path: 'panda_gripper', side: null },
]

// Initialize joint rotations for all 21 joints
const createInitialJointRotations = () => {
  const joints = {}
  const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky']
  const segments = ['mcp', 'pip', 'dip', 'tip']

  joints.wrist = 0
  fingers.forEach(finger => {
    segments.forEach(segment => {
      joints[`${finger}_${segment}`] = 0
    })
  })
  return joints
}

export default function App() {
  const [selectedModel, setSelectedModel] = useState('ability_left')
  const [handTrackingData, setHandTrackingData] = useState(null)
  const [jointRotations, setJointRotations] = useState(createInitialJointRotations())
  const [selectedJoint, setSelectedJoint] = useState('wrist')

  const currentModel = useMemo(() =>
    HAND_MODELS.find(m => m.id === selectedModel),
    [selectedModel]
  )

  const handleJointRotationChange = useCallback((rotation) => {
    setJointRotations(prev => ({
      ...prev,
      [selectedJoint]: rotation
    }))
  }, [selectedJoint])

  const handleHandResults = useCallback((results) => {
    setHandTrackingData(results)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Scene3D
        selectedModel={currentModel}
        handTrackingData={handTrackingData}
        jointRotations={jointRotations}
      />

      <HandTrackingCamera onHandResults={handleHandResults} />

      <ControlPanel
        jointRotations={jointRotations}
        selectedJoint={selectedJoint}
        onSelectedJointChange={setSelectedJoint}
        onJointRotationChange={handleJointRotationChange}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        models={HAND_MODELS}
      />

      <DebugPanel handTrackingData={handTrackingData} />
    </div>
  )
}
