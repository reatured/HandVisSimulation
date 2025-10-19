import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function AbilityHand({ side = 'left', jointRotations = {} }) {
  // Extract individual joint rotations with defaults
  const wristRot = jointRotations.wrist || 0
  const thumbMcp = jointRotations.thumb_mcp || 0
  const thumbPip = jointRotations.thumb_pip || 0
  const indexMcp = jointRotations.index_mcp || 0
  const indexPip = jointRotations.index_pip || 0
  const middleMcp = jointRotations.middle_mcp || 0
  const middlePip = jointRotations.middle_pip || 0
  const ringMcp = jointRotations.ring_mcp || 0
  const ringPip = jointRotations.ring_pip || 0
  const pinkyMcp = jointRotations.pinky_mcp || 0
  const pinkyPip = jointRotations.pinky_pip || 0
  const PUBLIC_URL = process.env.PUBLIC_URL || ''
  const basePath = `${PUBLIC_URL}/assets/robots/hands/ability_hand/meshes/visual`

  const wrist = useLoader(GLTFLoader, `${basePath}/wristmesh.glb`)
  const palm = useLoader(GLTFLoader, side === 'left' ? `${basePath}/FB_palm_ref.glb` : `${basePath}/FB_palm_ref_MIR.glb`)
  const thumbF1 = useLoader(GLTFLoader, side === 'left' ? `${basePath}/thumb-F1.glb` : `${basePath}/thumb-F1-MIR.glb`)
  const thumbF2 = useLoader(GLTFLoader, `${basePath}/thumb-F2.glb`)
  const idxF1 = useLoader(GLTFLoader, `${basePath}/idx-F1.glb`)
  const idxF2 = useLoader(GLTFLoader, `${basePath}/idx-F2.glb`)

  return (
    <group scale={[1, 1, 1]}>
      {/* Wrist rotation wraps entire hand */}
      <group rotation={[0, 0, wristRot]}>
        <primitive object={wrist.scene.clone()} />
        <group position={[0.0240476665, 0.00378124745, 0.03232964923]} rotation={[3.14148426, 0.08848813, 3.14036612]}>
          <primitive object={palm.scene.clone()} />
        <group rotation={[0, 0, 3.330437]}>
          {/* Thumb MCP - rotation at pivot, then position */}
          <group rotation={[4.450589592585541 + thumbMcp, 0, 0]}>
            <group position={[0.0278283501, 0, -0.0147507]}>
              <primitive object={thumbF1.scene.clone()} />
              {/* Thumb PIP - rotation at pivot, then position */}
              <group rotation={[3.141592 + thumbPip, 0, 0.343830]}>
                <group position={[0.06518669, 0.02334021, -0.00393483]}>
                  <primitive object={thumbF2.scene.clone()} />
                </group>
              </group>
            </group>
          </group>
        </group>
        {/* Index Finger */}
        <group position={[-0.00949, -0.01304, -0.06295]} rotation={[-1.982050, 1.284473, -2.090591]}>
          {/* Index MCP - rotation at pivot, then position */}
          <group rotation={[0, 0, 0.084474 + indexMcp]}>
            <group position={[0.038472723, 0.003257695, 0]}>
              <primitive object={idxF1.scene.clone()} />
              {/* Index PIP - rotation at pivot, then position */}
              <group rotation={[0, 0, indexPip]}>
                <group position={[0.0091241, 0, 0]}>
                  <primitive object={idxF2.scene.clone()} />
                </group>
              </group>
            </group>
          </group>
        </group>
        {/* Middle Finger */}
        <group position={[0.009653191, -0.015310271, -0.067853949]} rotation={[-1.860531, 1.308458, -1.896217]}>
          {/* Middle MCP - rotation at pivot, then position */}
          <group rotation={[0, 0, 0.084474 + middleMcp]}>
            <group position={[0.038472723, 0.003257695, 0]}>
              <primitive object={idxF1.scene.clone()} />
              {/* Middle PIP - rotation at pivot, then position */}
              <group rotation={[0, 0, middlePip]}>
                <group position={[0.0091241, 0, 0]}>
                  <primitive object={idxF2.scene.clone()} />
                </group>
              </group>
            </group>
          </group>
        </group>
        {/* Ring Finger */}
        <group position={[0.029954260, -0.014212492, -0.067286105]} rotation={[-1.716598, 1.321452, -1.675862]}>
          {/* Ring MCP - rotation at pivot, then position */}
          <group rotation={[0, 0, 0.084474 + ringMcp]}>
            <group position={[0.038472723, 0.003257695, 0]}>
              <primitive object={idxF1.scene.clone()} />
              {/* Ring PIP - rotation at pivot, then position */}
              <group rotation={[0, 0, ringPip]}>
                <group position={[0.0091241, 0, 0]}>
                  <primitive object={idxF2.scene.clone()} />
                </group>
              </group>
            </group>
          </group>
        </group>
        {/* Pinky Finger */}
        <group position={[0.049521293, -0.011004583, -0.063029065]} rotation={[-1.765110, 1.322220, -1.658383]}>
          {/* Pinky MCP - rotation at pivot, then position */}
          <group rotation={[0, 0, 0.084474 + pinkyMcp]}>
            <group position={[0.038472723, 0.003257695, 0]}>
              <primitive object={idxF1.scene.clone()} />
              {/* Pinky PIP - rotation at pivot, then position */}
              <group rotation={[0, 0, pinkyPip]}>
                <group position={[0.0091241, 0, 0]}>
                  <primitive object={idxF2.scene.clone()} />
                </group>
              </group>
            </group>
          </group>
        </group>
        </group>
      </group>
    </group>
  )
}
