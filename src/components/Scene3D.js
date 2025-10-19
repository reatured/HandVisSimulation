import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { useRef } from 'react'
import HandModel from './HandModel'
import GimbalControl from './GimbalControl'

export default function Scene3D({
  leftModel,
  rightModel,
  handTrackingData,
  leftJointRotations,
  rightJointRotations,
  leftHandPosition,
  rightHandPosition,
  leftHandGimbal,
  rightHandGimbal,
  onLeftGimbalChange,
  onRightGimbalChange,
  showGimbals,
  enableCameraPosition,
  showAxes = true,
  leftHandZRotation = 0,
  rightHandZRotation = 0
}) {
  // Ref for OrbitControls to pass to gimbals
  const orbitControlsRef = useRef()

  // Ensure we always have valid objects for joint rotations
  const safeLeftRotations = leftJointRotations || {}
  const safeRightRotations = rightJointRotations || {}

  // Default gimbal values
  const safeLeftGimbal = leftHandGimbal || { x: 0, y: 0, z: 0 }
  const safeRightGimbal = rightHandGimbal || { x: 0, y: 0, z: 0 }
  return (
    <Canvas
      camera={{ position: [0.5, 0.5, 1], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Enhanced lighting setup */}
      <ambientLight intensity={2} />

      {/* Key light - main illumination from front-top */}
      <directionalLight position={[5, 5, 5]} intensity={2} castShadow />

      {/* Fill light - soften shadows from the side */}
      <directionalLight position={[-5, 3, 2]} intensity={1.5} />

      {/* Back light - highlight edges and depth */}
      <directionalLight position={[0, 2, -5]} intensity={1} />

      {/* Rim light from below to show underside details */}
      <pointLight position={[0, -2, 0]} intensity={1} />

      {/* Additional side lights for better structure visibility */}
      <pointLight position={[3, 0, 0]} intensity={0.8} />
      <pointLight position={[-3, 0, 0]} intensity={0.8} />

      {/* Environment map for realistic reflections */}
      <Environment preset="studio" />

      {/* Grid helper for spatial reference */}
      <Grid
        position={[0, -0.3, 0]}
        args={[10, 10]}
        cellSize={0.1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={5}
        fadeStrength={1}
        followCamera={false}
      />

      {/* Global coordinate system axes - shows scene orientation */}
      {showAxes && (
        <axesHelper args={[0.5]} position={[0, -0.29, 0]} />
      )}

      {/* Left Hand Model with Gimbal Control */}
      {leftModel && (
        <group
          position={[0.3, 0, 0]}
          rotation={[
            safeLeftRotations.wristOrientation?.x || 0,
            safeLeftRotations.wristOrientation?.y || 0,
            safeLeftRotations.wristOrientation?.z || 0
          ]}
        >
          {/* Axes rotate with wrist rotation from camera */}
          {showAxes && <axesHelper args={[0.15]} />}
          <GimbalControl
            position={[0, 0, 0]}
            rotation={safeLeftGimbal}
            onRotationChange={onLeftGimbalChange}
            visible={showGimbals}
            orbitControlsRef={orbitControlsRef}
          >
            <HandModel
              key={`left-${leftModel.id}`}
              position={[0, 0, 0]}
              modelPath={leftModel.path}
              side={leftModel.side}
              handTrackingData={handTrackingData}
              jointRotations={safeLeftRotations}
              cameraPosition={enableCameraPosition ? leftHandPosition : null}
              zRotationOffset={leftHandZRotation}
            />
          </GimbalControl>
        </group>
      )}

      {/* Right Hand Model with Gimbal Control */}
      {rightModel && (
        <group
          position={[-0.3, 0, 0]}
          rotation={[
            safeRightRotations.wristOrientation?.x || 0,
            safeRightRotations.wristOrientation?.y || 0,
            safeRightRotations.wristOrientation?.z || 0
          ]}
        >
          {/* Axes rotate with wrist rotation from camera */}
          {showAxes && <axesHelper args={[0.15]} />}
          <GimbalControl
            position={[0, 0, 0]}
            rotation={safeRightGimbal}
            onRotationChange={onRightGimbalChange}
            visible={showGimbals}
            orbitControlsRef={orbitControlsRef}
          >
            <HandModel
              key={`right-${rightModel.id}`}
              position={[0, 0, 0]}
              modelPath={rightModel.path}
              side={rightModel.side}
              handTrackingData={handTrackingData}
              jointRotations={safeRightRotations}
              cameraPosition={enableCameraPosition ? rightHandPosition : null}
              zRotationOffset={rightHandZRotation}
            />
          </GimbalControl>
        </group>
      )}

      <OrbitControls ref={orbitControlsRef} makeDefault />
    </Canvas>
  )
}
