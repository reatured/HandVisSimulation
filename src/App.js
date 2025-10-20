import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import HandTrackingCamera from './components/HandTrackingCamera'
import Scene3D from './components/Scene3D'
import ControlPanel from './components/ControlPanel'
import DebugPanel from './components/DebugPanel'
import { CalibrationManager } from './utils/coordinateMapping'
import { getShortestRotation } from './utils/handKinematics'

// Detect if user is on mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768)
}

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
  { id: 'linker_l6_left', name: 'Linker Hand L6 (Left)', path: 'linker_l6', side: 'left' },
  { id: 'linker_l6_right', name: 'Linker Hand L6 (Right)', path: 'linker_l6', side: 'right' },
  { id: 'linker_l10_left', name: 'Linker Hand L10 (Left)', path: 'linker_l10', side: 'left' },
  { id: 'linker_l10_right', name: 'Linker Hand L10 (Right)', path: 'linker_l10', side: 'right' },
  { id: 'linker_l20_left', name: 'Linker Hand L20 (Left)', path: 'linker_l20', side: 'left' },
  { id: 'linker_l20_right', name: 'Linker Hand L20 (Right)', path: 'linker_l20', side: 'right' },
  { id: 'linker_l20pro_right', name: 'Linker Hand L20 Pro (Right)', path: 'linker_l20pro', side: 'right' },
  { id: 'linker_l21_left', name: 'Linker Hand L21 (Left)', path: 'linker_l21', side: 'left' },
  { id: 'linker_l21_right', name: 'Linker Hand L21 (Right)', path: 'linker_l21', side: 'right' },
  { id: 'linker_l25_left', name: 'Linker Hand L25 (Left)', path: 'linker_l25', side: 'left' },
  { id: 'linker_l25_right', name: 'Linker Hand L25 (Right)', path: 'linker_l25', side: 'right' },
  { id: 'linker_l30_right', name: 'Linker Hand L30 (Right)', path: 'linker_l30', side: 'right' },
  { id: 'linker_o6_left', name: 'Linker Hand O6 (Left)', path: 'linker_o6', side: 'left' },
  { id: 'linker_o6_right', name: 'Linker Hand O6 (Right)', path: 'linker_o6', side: 'right' },
  { id: 'linker_o7_left', name: 'Linker Hand O7 (Left)', path: 'linker_o7', side: 'left' },
  { id: 'linker_o7_right', name: 'Linker Hand O7 (Right)', path: 'linker_o7', side: 'right' },
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
  // Detect if mobile and set initial panel visibility
  const isMobile = useMemo(() => isMobileDevice(), [])

  // Separate models for left and right hands
  const [selectedLeftModel, setSelectedLeftModel] = useState('ability_left')
  const [selectedRightModel, setSelectedRightModel] = useState('ability_right')

  const [handTrackingData, setHandTrackingData] = useState(null)

  // Separate joint rotations for left and right hands
  const [manualJointRotations, setManualJointRotations] = useState({
    left: createInitialJointRotations(),
    right: createInitialJointRotations()
  })
  const [cameraJointRotations, setCameraJointRotations] = useState({
    left: {},
    right: {}
  })

  // Hand positions from camera tracking
  const [cameraHandPositions, setCameraHandPositions] = useState({
    left: null,
    right: null
  })

  // Gimbal rotation offsets for each hand
  // Default: 90 degrees (π/2 radians) on X-axis for both hands
  const [leftHandGimbal, setLeftHandGimbal] = useState({ x: -Math.PI / 2, y: 0, z: 0 })
  const [rightHandGimbal, setRightHandGimbal] = useState({ x: -Math.PI / 2, y: 0, z: 0 })

  // Manual Z-axis rotation offsets for each hand (in radians)
  // Default: Left hand +90°, Right hand -90°
  const [leftHandZRotation, setLeftHandZRotation] = useState(Math.PI / 2)  // 90 degrees
  const [rightHandZRotation, setRightHandZRotation] = useState(-Math.PI / 2)  // -90 degrees

  // Gimbal visibility toggle
  const [showGimbals, setShowGimbals] = useState(false)

  // Coordinate axes visibility toggle (default: enabled for debugging)
  const [showAxes, setShowAxes] = useState(true)

  // Debug labels visibility toggle (default: disabled)
  const [showDebugLabels, setShowDebugLabels] = useState(true)

  // Camera position tracking toggle (default: disabled)
  const [enableCameraPosition, setEnableCameraPosition] = useState(false)

  // Mirror mode toggle (default: OFF = back view perspective)
  const [mirrorMode, setMirrorMode] = useState(false)

  // Hand control swap toggle (swap which hand controls which model)
  const [swapHandControls, setSwapHandControls] = useState(false)

  // Wrist rotation toggle (disable wrist rotation to keep hand orientation fixed)
  const [disableWristRotation, setDisableWristRotation] = useState(false)

  const [selectedJoint, setSelectedJoint] = useState('wrist')
  const [selectedHand, setSelectedHand] = useState('left') // Which hand to control in manual mode
  const [controlMode, setControlMode] = useState('camera') // 'manual' or 'camera' - default to camera
  const [calibrationStatus, setCalibrationStatus] = useState({ isCalibrated: false })

  // Panel visibility states - camera preview always visible, control panel only on desktop, debug enabled
  const [showCameraPreview, setShowCameraPreview] = useState(true)
  const [showControlPanel, setShowControlPanel] = useState(!isMobile)
  const [showDebugPanel] = useState(true) // Debug panel enabled

  // Initialize calibration manager (persistent across renders)
  const calibrationManagerRef = useRef(new CalibrationManager())

  // Update calibration status on mount
  useEffect(() => {
    setCalibrationStatus(calibrationManagerRef.current.getStatus())
  }, [])

  const currentLeftModel = useMemo(() =>
    HAND_MODELS.find(m => m.id === selectedLeftModel),
    [selectedLeftModel]
  )

  const currentRightModel = useMemo(() =>
    HAND_MODELS.find(m => m.id === selectedRightModel),
    [selectedRightModel]
  )

  // Determine which joint rotations to use based on control mode
  const activeJointRotations = useMemo(() => {
    if (controlMode === 'camera') {
      return {
        left: cameraJointRotations.left || {},
        right: cameraJointRotations.right || {}
      }
    } else {
      return {
        left: manualJointRotations.left || {},
        right: manualJointRotations.right || {}
      }
    }
  }, [controlMode, cameraJointRotations, manualJointRotations])

  // Apply hand control swap based on mirror mode and manual swap toggle
  // Mirror mode OFF automatically swaps hands (back view perspective)
  const finalJointRotations = useMemo(() => {
    const shouldSwap = !mirrorMode || swapHandControls
    if (shouldSwap) {
      return {
        left: activeJointRotations.right,
        right: activeJointRotations.left
      }
    }
    return activeJointRotations
  }, [mirrorMode, swapHandControls, activeJointRotations])

  const handleJointRotationChange = useCallback((rotation) => {
    setManualJointRotations(prev => ({
      ...prev,
      [selectedHand]: {
        ...prev[selectedHand],
        [selectedJoint]: rotation
      }
    }))
  }, [selectedJoint, selectedHand])

  const handleHandResults = useCallback((results) => {
    setHandTrackingData(results)
  }, [])

  const handleCameraJointRotations = useCallback((rotations) => {
    setCameraJointRotations(rotations)
  }, [])

  const handleCameraHandPositions = useCallback((positions) => {
    setCameraHandPositions(positions)
  }, [])

  const handleControlModeChange = useCallback((mode) => {
    setControlMode(mode)
  }, [])

  const handleCalibrate = useCallback(() => {
    // For now, calibrate using right hand (or first available)
    const calibrationData = cameraJointRotations.right || cameraJointRotations.left
    if (!calibrationData || Object.keys(calibrationData).length === 0) {
      alert('No hand detected. Please show your hand to the camera first.')
      return
    }

    const success = calibrationManagerRef.current.calibrate(calibrationData)
    if (success) {
      setCalibrationStatus(calibrationManagerRef.current.getStatus())
      console.log('Calibration successful!')
    }
  }, [cameraJointRotations])

  // Handlers for manual Z-axis rotation (90 degree increments)
  const handleLeftHandRotateZ = useCallback((direction) => {
    const increment = direction * (Math.PI / 2) // 90 degrees in radians
    setLeftHandZRotation(prev => getShortestRotation(prev, increment))
  }, [])

  const handleRightHandRotateZ = useCallback((direction) => {
    const increment = direction * (Math.PI / 2) // 90 degrees in radians
    setRightHandZRotation(prev => getShortestRotation(prev, increment))
  }, [])

  // Handler to reset both hand gimbals and wrist orientation to zero rotation
  const handleResetGimbals = useCallback(() => {
    setLeftHandGimbal(leftHandZRotation)
    setRightHandGimbal(rightHandZRotation)

    // Reset wrist orientation in camera joint rotations
    setCameraJointRotations(prev => ({
      left: {
        ...prev.left,
        wristOrientation: { x: 0, y: 0, z: 0 }
      },
      right: {
        ...prev.right,
        wristOrientation: { x: 0, y: 0, z: 0 }
      }
    }))
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Scene3D
        leftModel={currentLeftModel}
        rightModel={currentRightModel}
        handTrackingData={handTrackingData}
        leftJointRotations={finalJointRotations.left}
        rightJointRotations={finalJointRotations.right}
        leftHandPosition={controlMode === 'camera' ? cameraHandPositions.left : null}
        rightHandPosition={controlMode === 'camera' ? cameraHandPositions.right : null}
        leftHandGimbal={leftHandGimbal}
        rightHandGimbal={rightHandGimbal}
        onLeftGimbalChange={setLeftHandGimbal}
        onRightGimbalChange={setRightHandGimbal}
        showGimbals={showGimbals}
        showAxes={showAxes}
        showDebugLabels={showDebugLabels}
        enableCameraPosition={enableCameraPosition}
        leftHandZRotation={leftHandZRotation}
        rightHandZRotation={rightHandZRotation}
        disableWristRotation={disableWristRotation}
        mirrorMode={mirrorMode}
      />

      <HandTrackingCamera
        onHandResults={handleHandResults}
        onJointRotations={handleCameraJointRotations}
        onHandPositions={handleCameraHandPositions}
        calibrationManager={calibrationManagerRef.current}
        showPreview={showCameraPreview}
      />

      {showControlPanel && (
        <ControlPanel
          jointRotations={activeJointRotations}
          selectedJoint={selectedJoint}
          onSelectedJointChange={setSelectedJoint}
          onJointRotationChange={handleJointRotationChange}
          selectedHand={selectedHand}
          onSelectedHandChange={setSelectedHand}
          selectedLeftModel={selectedLeftModel}
          selectedRightModel={selectedRightModel}
          onLeftModelChange={setSelectedLeftModel}
          onRightModelChange={setSelectedRightModel}
          models={HAND_MODELS}
          controlMode={controlMode}
          onControlModeChange={handleControlModeChange}
          onCalibrate={handleCalibrate}
          calibrationStatus={calibrationStatus}
          showGimbals={showGimbals}
          onShowGimbalsChange={setShowGimbals}
          showAxes={showAxes}
          onShowAxesChange={setShowAxes}
          showDebugLabels={showDebugLabels}
          onShowDebugLabelsChange={setShowDebugLabels}
          enableCameraPosition={enableCameraPosition}
          onEnableCameraPositionChange={setEnableCameraPosition}
          swapHandControls={swapHandControls}
          onSwapHandControlsChange={setSwapHandControls}
          leftHandZRotation={leftHandZRotation}
          rightHandZRotation={rightHandZRotation}
          onLeftHandRotateZ={handleLeftHandRotateZ}
          onRightHandRotateZ={handleRightHandRotateZ}
          disableWristRotation={disableWristRotation}
          onDisableWristRotationChange={setDisableWristRotation}
          mirrorMode={mirrorMode}
          onMirrorModeChange={setMirrorMode}
        />
      )}

      {/* Mobile camera toggle button */}
      {isMobile && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 30
        }}>
          <button
            onClick={() => setShowCameraPreview(!showCameraPreview)}
            style={{
              padding: '10px 12px',
              fontSize: '12px',
              backgroundColor: showCameraPreview ? 'rgba(100, 200, 100, 0.9)' : 'rgba(60, 60, 60, 0.8)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            {showCameraPreview ? '📹 Hide' : '📹 Show'} Camera
          </button>
        </div>
      )}

      {/* Debug Panel - shows euler angles and reset button */}
      {showDebugPanel && (
        <DebugPanel
          leftHandRotation={finalJointRotations.left.wristOrientation || { x: 0, y: 0, z: 0 }}
          rightHandRotation={finalJointRotations.right.wristOrientation || { x: 0, y: 0, z: 0 }}
          onReset={handleResetGimbals}
        />
      )}
    </div>
  )
}
