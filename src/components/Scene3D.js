import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import HandModel from './HandModel'
import GimbalControl from './GimbalControl'
import DebugLabels from './DebugLabels'

// Custom gradient ground plane
function GradientGround() {
  // Create gradient texture for directional reference
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    // Create gradient from front (darker blue) to back (lighter blue/white)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#1a1a2e')    // Dark blue at front (negative Z)
    gradient.addColorStop(0.5, '#16213e')  // Mid blue at center
    gradient.addColorStop(1, '#0f3460')    // Lighter blue at back (positive Z)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [])

  return (
    <group position={[0, -0.3, 0]}>
      {/* Gradient base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          map={texture}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Grid overlay for better spatial reference */}
      <Grid
        position={[0, 0.001, 0]}
        args={[10, 10]}
        cellSize={0.1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#4a90e2"
        fadeDistance={5}
        fadeStrength={1}
        followCamera={false}
      />
    </group>
  )
}

// Camera controller component to update camera position when mirror mode changes
// Uses lerp (linear interpolation) for smooth transitions
function CameraController({ position }) {
  const { camera } = useThree()
  const targetPosition = useRef(position)
  const animating = useRef(false)

  useEffect(() => {
    targetPosition.current = position
    animating.current = true
  }, [position])

  // Animate camera position smoothly using lerp
  useEffect(() => {
    let animationFrameId

    const animate = () => {
      if (!animating.current) return

      const current = camera.position
      const target = targetPosition.current

      // Lerp factor (0.1 = smooth, 1.0 = instant)
      const lerpFactor = 0.1

      // Linear interpolation for each axis
      current.x += (target[0] - current.x) * lerpFactor
      current.y += (target[1] - current.y) * lerpFactor
      current.z += (target[2] - current.z) * lerpFactor

      camera.updateProjectionMatrix()

      // Stop animating when close enough to target
      const distance = Math.sqrt(
        Math.pow(target[0] - current.x, 2) +
        Math.pow(target[1] - current.y, 2) +
        Math.pow(target[2] - current.z, 2)
      )

      if (distance > 0.01) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        // Snap to final position
        camera.position.set(...target)
        camera.updateProjectionMatrix()
        animating.current = false
      }
    }

    animate()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [camera, position])

  return null
}

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
  rightHandZRotation = 0,
  showDebugLabels = false,
  disableWristRotation = false,
  mirrorMode = true
}) {
  // Ref for OrbitControls to pass to gimbals
  const orbitControlsRef = useRef()

  // Calculate camera position based on mirror mode
  // Mirror ON: Front view (positive Z) - like looking in a mirror
  // Mirror OFF: Back view (negative Z) - looking from behind
  const cameraPosition = mirrorMode ? [0.5, 0.5, 1] : [0.5, 0.5, -1]

  // Ensure we always have valid objects for joint rotations
  const safeLeftRotations = leftJointRotations || {}
  const safeRightRotations = rightJointRotations || {}

  // Default gimbal values
  const safeLeftGimbal = leftHandGimbal || { x: 0, y: 0, z: 0 }
  const safeRightGimbal = rightHandGimbal || { x: 0, y: 0, z: 0 }

  // Calculate wrist rotation - use {x: 0, y: 0, z: 0} if wrist rotation is disabled
  const leftWristRotation = disableWristRotation
    ? { x: 0, y: 0, z: 0 }
    : (safeLeftRotations.wristOrientation || { x: 0, y: 0, z: 0 })
  const rightWristRotation = disableWristRotation
    ? { x: 0, y: 0, z: 0 }
    : (safeRightRotations.wristOrientation || { x: 0, y: 0, z: 0 })
  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Camera position controller - updates when mirror mode changes */}
      <CameraController position={cameraPosition} />

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

      {/* Gradient ground plane with grid overlay - helps understand world direction */}
      <GradientGround />

      {/* Global coordinate system axes - shows scene orientation */}
      {showAxes && (
        <axesHelper args={[0.5]} position={[0, -0.29, 0]} />
      )}

      {/* Left Hand Model with Gimbal Control */}
      {leftModel && (
        <group
          position={[0.3, 0, 0]}
          rotation={[
            leftWristRotation.x,
            leftWristRotation.y,
            leftWristRotation.z
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
            rightWristRotation.x,
            rightWristRotation.y,
            rightWristRotation.z
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

      {/* Debug labels for hand identification and scene orientation */}
      <DebugLabels visible={showDebugLabels} />

      <OrbitControls ref={orbitControlsRef} makeDefault />
    </Canvas>
  )
}
