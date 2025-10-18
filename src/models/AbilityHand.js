import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function AbilityHand({ side = 'left' }) {
  const basePath = `/assets/robots/hands/ability_hand/meshes/visual`

  const wrist = useLoader(GLTFLoader, `${basePath}/wristmesh.glb`)
  const palm = useLoader(GLTFLoader, side === 'left' ? `${basePath}/FB_palm_ref.glb` : `${basePath}/FB_palm_ref_MIR.glb`)
  const thumbF1 = useLoader(GLTFLoader, side === 'left' ? `${basePath}/thumb-F1.glb` : `${basePath}/thumb-F1-MIR.glb`)
  const thumbF2 = useLoader(GLTFLoader, `${basePath}/thumb-F2.glb`)
  const idxF1 = useLoader(GLTFLoader, `${basePath}/idx-F1.glb`)
  const idxF2 = useLoader(GLTFLoader, `${basePath}/idx-F2.glb`)

  return (
    <group scale={[10, 10, 10]}>
      <primitive object={wrist.scene.clone()} />
      <group position={[0.024, 0.004, 0.032]} rotation={[3.14, 0.088, 3.14]}>
        <primitive object={palm.scene.clone()} />
        <group rotation={[0, 0, 3.33]}>
          <group position={[0.0278, 0, -0.0147]} rotation={[4.45, 0, 0]}>
            <primitive object={thumbF1.scene.clone()} />
            <group position={[0.0278, 0, -0.0147]} rotation={[4.45, 0, 0]}>
              <group position={[0.0651, 0.0233, -0.0039]} rotation={[3.14, 0, 0.343]}>
                <primitive object={thumbF2.scene.clone()} />
              </group>
            </group>
          </group>
        </group>
        <group position={[-0.00949, -0.01304, -0.06295]} rotation={[-1.98, 1.28, -2.09]}>
          <group position={[0.0384, 0.0032, 0]} rotation={[0, 0, 0.084]}>
            <primitive object={idxF1.scene.clone()} />
            <group position={[0.0384, 0.0032, 0]} rotation={[0, 0, 0.084]}>
              <group position={[0.00912, 0, 0]}>
                <primitive object={idxF2.scene.clone()} />
              </group>
            </group>
          </group>
        </group>
        <group position={[0.0096, -0.0153, -0.0678]} rotation={[-1.86, 1.31, -1.89]}>
          <group position={[0.0384, 0.0032, 0]} rotation={[0, 0, 0.084]}>
            <primitive object={idxF1.scene.clone()} />
            <group position={[0.0384, 0.0032, 0]} rotation={[0, 0, 0.084]}>
              <group position={[0.00912, 0, 0]}>
                <primitive object={idxF2.scene.clone()} />
              </group>
            </group>
          </group>
        </group>
        <group position={[0.0299, -0.0142, -0.0672]} rotation={[-1.71, 1.32, -1.67]}>
          <group position={[0.0384, 0.0032, 0]} rotation={[0, 0, 0.084]}>
            <primitive object={idxF1.scene.clone()} />
            <group position={[0.0384, 0.0032, 0]} rotation={[0, 0, 0.084]}>
              <group position={[0.00912, 0, 0]}>
                <primitive object={idxF2.scene.clone()} />
              </group>
            </group>
          </group>
        </group>
        <group position={[0.0495, -0.0110, -0.0630]} rotation={[-1.76, 1.32, -1.65]}>
          <group position={[0.0384, 0.0032, 0]} rotation={[0, 0, 0.084]}>
            <primitive object={idxF1.scene.clone()} />
            <group position={[0.0384, 0.0032, 0]} rotation={[0, 0, 0.084]}>
              <group position={[0.00912, 0, 0]}>
                <primitive object={idxF2.scene.clone()} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
