import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import HandTrackingCamera from './components/HandTrackingCamera'
import Scene3D from './components/Scene3D'
import ControlPanel from './components/ControlPanel'
import DebugPanel from './components/DebugPanel'
import { CalibrationManager } from './utils/coordinateMapping'

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
  const [manualJointRotations, setManualJointRotations] = useState(createInitialJointRotations())
  const [cameraJointRotations, setCameraJointRotations] = useState({})
  const [selectedJoint, setSelectedJoint] = useState('wrist')
  const [controlMode, setControlMode] = useState('manual') // 'manual' or 'camera'
  const [calibrationStatus, setCalibrationStatus] = useState({ isCalibrated: false })

  // Initialize calibration manager (persistent across renders)
  const calibrationManagerRef = useRef(new CalibrationManager())

  // Update calibration status on mount
  useEffect(() => {
    setCalibrationStatus(calibrationManagerRef.current.getStatus())
  }, [])

  const currentModel = useMemo(() =>
    HAND_MODELS.find(m => m.id === selectedModel),
    [selectedModel]
  )

  // Determine which joint rotations to use based on control mode
  const activeJointRotations = useMemo(() => {
    return controlMode === 'camera' ? cameraJointRotations : manualJointRotations
  }, [controlMode, cameraJointRotations, manualJointRotations])

  const handleJointRotationChange = useCallback((rotation) => {
    setManualJointRotations(prev => ({
      ...prev,
      [selectedJoint]: rotation
    }))
  }, [selectedJoint])

  const handleHandResults = useCallback((results) => {
    setHandTrackingData(results)
  }, [])

  const handleCameraJointRotations = useCallback((rotations) => {
    setCameraJointRotations(rotations)
  }, [])

  const handleControlModeChange = useCallback((mode) => {
    setControlMode(mode)
  }, [])

  const handleCalibrate = useCallback(() => {
    if (Object.keys(cameraJointRotations).length === 0) {
      alert('No hand detected. Please show your hand to the camera first.')
      return
    }

    const success = calibrationManagerRef.current.calibrate(cameraJointRotations)
    if (success) {
      setCalibrationStatus(calibrationManagerRef.current.getStatus())
      console.log('Calibration successful!')
    }
  }, [cameraJointRotations])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Scene3D
        selectedModel={currentModel}
        handTrackingData={handTrackingData}
        jointRotations={activeJointRotations}
      />

      <HandTrackingCamera
        onHandResults={handleHandResults}
        onJointRotations={handleCameraJointRotations}
        calibrationManager={calibrationManagerRef.current}
      />

      <ControlPanel
        jointRotations={activeJointRotations}
        selectedJoint={selectedJoint}
        onSelectedJointChange={setSelectedJoint}
        onJointRotationChange={handleJointRotationChange}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        models={HAND_MODELS}
        controlMode={controlMode}
        onControlModeChange={handleControlModeChange}
        onCalibrate={handleCalibrate}
        calibrationStatus={calibrationStatus}
      />

      <DebugPanel handTrackingData={handTrackingData} />
    </div>
  )
}
