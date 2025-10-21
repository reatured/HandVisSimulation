import { useEffect, useState, useRef } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import URDFLoader from 'urdf-loader'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { getURDFPath } from '../utils/urdfConfig'
import { mapUIJointToURDF, clampJointValue } from '../utils/urdfJointMapping'
import { parseJointConfig, createSemanticMapping, createMediaPipeToSemanticMap, getURDFDebugInfo } from '../utils/urdfParser'

/**
 * URDFHandModel Component
 * Loads and displays URDF hand models with optional joint control
 */
export default function URDFHandModel({
  modelPath,
  side = 'left',
  jointRotations = {},
  position = [0, 0, 0],
  cameraPosition = null,
  onRobotLoaded = null,
  useMultiDoF = false,
  semanticMapping = null,
  mediaPipeMap = null
}) {
  const [robot, setRobot] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const groupRef = useRef()

  // Load URDF model
  useEffect(() => {
    const urdfPath = getURDFPath(modelPath, side)

    if (!urdfPath) {
      setError(`No URDF found for ${modelPath} (${side})`)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const loader = new URDFLoader()

    // Set up loading manager for better error handling
    const manager = new THREE.LoadingManager()
    manager.onError = (url) => {
      console.error('Error loading:', url)
      setError(`Failed to load: ${url}`)
    }

    loader.manager = manager

    // Register loaders for different mesh file types
    // Using loadMeshCb as documented in urdf-loader
    const gltfLoader = new GLTFLoader(manager)
    const stlLoader = new STLLoader(manager)

    loader.loadMeshCb = (path, manager, onComplete) => {
      const extension = path.split('.').pop().toLowerCase()

      if (extension === 'stl') {
        // Load STL file
        stlLoader.load(
          path,
          (geometry) => {
            // STL loader returns geometry, need to create mesh
            const material = new THREE.MeshStandardMaterial({
              color: 0xcccccc,
              metalness: 0.3,
              roughness: 0.7
            })
            const mesh = new THREE.Mesh(geometry, material)
            onComplete(mesh)
          },
          undefined,
          (err) => {
            console.error('Error loading STL mesh:', path, err)
            onComplete(null, err)
          }
        )
      } else {
        // Load GLB/GLTF file (existing behavior)
        gltfLoader.load(
          path,
          (result) => {
            onComplete(result.scene)
          },
          undefined,
          (err) => {
            console.error('Error loading GLTF mesh:', path, err)
            onComplete(null, err)
          }
        )
      }
    }

    // Set the working path for resolving relative mesh paths
    // Extract the directory from the URDF path
    const urdfDir = urdfPath.substring(0, urdfPath.lastIndexOf('/'))
    loader.workingPath = urdfDir + '/'

    console.log(`Loading URDF from: ${urdfPath}`)
    console.log(`Working path set to: ${urdfDir}/`)

    // Load the URDF file
    loader.load(
      urdfPath,
      (loadedRobot) => {
        console.log('URDF loaded successfully:', urdfPath)
        console.log('Robot joints:', Object.keys(loadedRobot.joints))

        // Apply default rotation and scale adjustments if needed
        loadedRobot.rotation.set(0, 0, 0)
        loadedRobot.position.set(0, 0, 0)

        setRobot(loadedRobot)
        setLoading(false)

        // Parse URDF to extract joint configuration
        const jointConfig = parseJointConfig(loadedRobot)
        const parsedSemanticMapping = createSemanticMapping(jointConfig)
        const parsedMediaPipeMap = createMediaPipeToSemanticMap(parsedSemanticMapping)
        const debugInfo = getURDFDebugInfo(loadedRobot)

        console.log(`[${side.toUpperCase()}] URDF Debug Info:`, debugInfo)
        console.log(`[${side.toUpperCase()}] Semantic Mapping:`, parsedSemanticMapping)
        console.log(`[${side.toUpperCase()}] MediaPipe Map:`, parsedMediaPipeMap)

        // Notify parent component that robot is loaded with parsed config
        if (onRobotLoaded) {
          onRobotLoaded(loadedRobot, {
            jointConfig,
            semanticMapping: parsedSemanticMapping,
            mediaPipeMap: parsedMediaPipeMap,
            debugInfo
          }, side)
        }
      },
      (progress) => {
        // Optional: track loading progress
        // Progress can be null or undefined in some cases
        if (progress && progress.lengthComputable) {
          const percent = (progress.loaded / progress.total) * 100
          console.log(`Loading ${urdfPath}: ${percent.toFixed(2)}%`)
        }
      },
      (err) => {
        console.error('Failed to load URDF:', err)
        setError(`Failed to load URDF: ${err.message || 'Unknown error'}`)
        setLoading(false)
      }
    )

    // Cleanup
    return () => {
      if (robot) {
        robot.traverse((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
      }
    }
  }, [modelPath, side])

  // Apply joint rotations and position when they change
  useEffect(() => {
    if (!robot || !groupRef.current) return

    // Handle both old format (flat object) and new format (with joints property)
    const joints = jointRotations.joints || jointRotations

    // Check if we have 3D rotation data for multi-DoF mode
    const joints3D = jointRotations.joints3D
    const hasMultiDoFData = joints3D && useMultiDoF && semanticMapping

    // Use 3D rotations if available and multi-DoF is enabled, otherwise use single-axis
    const activeJoints = hasMultiDoFData ? joints3D : joints

    // DEBUG: Log multi-DoF state
    if (useMultiDoF) {
      console.log('[URDFHandModel] Multi-DoF Debug:', {
        useMultiDoF,
        hasSemanticMapping: !!semanticMapping,
        hasJoints3D: !!joints3D,
        hasMultiDoFData,
        activeJointsKeys: activeJoints ? Object.keys(activeJoints) : [],
        semanticMappingKeys: semanticMapping ? Object.keys(semanticMapping) : [],
        modelPath,
        side
      })
    }

    // Wrist orientation is now handled by GimbalControl in Scene3D
    // Do not apply wrist rotation here to avoid double rotation
    robot.rotation.set(0, 0, 0)

    // Apply position offset from camera if available
    if (cameraPosition) {
      groupRef.current.position.set(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z
      )
    } else {
      // Reset to origin
      groupRef.current.position.set(0, 0, 0)
    }

    // Apply each joint rotation
    if (Object.keys(activeJoints).length > 0) {
      Object.entries(activeJoints).forEach(([uiJointName, angleData]) => {
        // Check if this is multi-DoF data (object with pitch/yaw/roll)
        const isMultiDoF = typeof angleData === 'object' &&
                           (angleData.pitch !== undefined ||
                            angleData.yaw !== undefined ||
                            angleData.roll !== undefined)

        if (isMultiDoF && useMultiDoF && semanticMapping) {
          // NEW: Use dynamic semantic mapping for multi-DoF joints
          const jointMapping = semanticMapping[uiJointName]

          // DEBUG: Log mapping lookup
          if (jointMapping) {
            console.log(`[URDFHandModel] ✓ Found mapping for "${uiJointName}":`, {
              axes: jointMapping.axes,
              urdfJoints: jointMapping.urdfJoints,
              angleData
            })

            jointMapping.axes.forEach(axis => {
              const urdfJointName = jointMapping.urdfJoints[axis]
              const axisValue = angleData[axis] || 0
              const [lower, upper] = jointMapping.limits[axis]

              // Apply with dynamic limits
              const joint = robot.joints[urdfJointName]
              if (joint) {
                const clampedValue = Math.max(lower, Math.min(upper, axisValue))

                try {
                  joint.setJointValue(clampedValue)

                  // Handle mimic joints
                  const mimicInfo = jointMapping.mimics?.[axis]
                  if (mimicInfo) {
                    const mimicJoint = robot.joints[mimicInfo.joint]
                    if (mimicJoint) {
                      const mimicValue = clampedValue * mimicInfo.multiplier + mimicInfo.offset
                      mimicJoint.setJointValue(mimicValue)
                    }
                  }
                } catch (error) {
                  console.error(`Error setting multi-DoF joint value for ${urdfJointName}:`, error)
                }
              }
            })
          } else {
            console.warn(`[URDFHandModel] ✗ NO MAPPING found for "${uiJointName}"`, {
              availableMappings: semanticMapping ? Object.keys(semanticMapping) : []
            })
          }
        } else {
          // EXISTING: Single-axis fallback (unchanged)
          const angle = isMultiDoF ? angleData.pitch || 0 : angleData

          // Map UI joint name to URDF joint name
          const urdfJointName = mapUIJointToURDF(uiJointName, modelPath)

          if (!urdfJointName) {
            // Skip if no mapping exists
            return
          }

          // Check if the joint exists in the robot
          const joint = robot.joints[urdfJointName]
          if (!joint) {
            // Only warn once per joint
            return
          }

          // Clamp the angle to joint limits
          const clampedAngle = clampJointValue(angle, urdfJointName, modelPath)

          // Apply the rotation
          try {
            joint.setJointValue(clampedAngle)
          } catch (error) {
            console.error(`Error setting joint value for ${urdfJointName}:`, error)
          }
        }
      })
    }
  }, [robot, jointRotations, modelPath, cameraPosition, useMultiDoF, semanticMapping])

  // Render loading state
  if (loading) {
    return (
      <group position={position}>
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="gray" opacity={0.5} transparent />
        </mesh>
      </group>
    )
  }

  // Render error state
  if (error) {
    console.error('URDFHandModel error:', error)
    return (
      <group position={position}>
        <mesh>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color="red" opacity={0.5} transparent />
        </mesh>
      </group>
    )
  }

  // Render loaded robot
  if (robot) {
    return (
      <group ref={groupRef} position={position}>
        <primitive object={robot} />
      </group>
    )
  }

  return null
}

/**
 * Apply metal material to all meshes in a robot model
 * @param {Object} robotModel - The URDF robot model object
 */
export function applyMetalMaterial(robotModel) {
  if (!robotModel) {
    console.warn('Cannot apply metal material: robot model is null')
    return
  }

  // Create a stainless steel-like metal material
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0, // Light gray/silver color
    metalness: 0.95, // Very metallic
    roughness: 0.1, // Polished/smooth surface
    envMapIntensity: 1.0
  })

  // Traverse all children and replace materials
  robotModel.traverse((child) => {
    if (child.isMesh) {
      // Dispose old material to prevent memory leaks
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }

      // Apply new metal material
      child.material = metalMaterial
      child.material.needsUpdate = true
    }
  })

  console.log('Metal material applied to robot model')
}
