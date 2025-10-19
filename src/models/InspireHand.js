import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function InspireHand({ side = 'left' }) {
  const basePath = `/assets/robots/hands/inspire_hand/meshes/visual`
  const prefix = side === 'left' ? 'left' : 'right'

  const baseLink = useLoader(GLTFLoader, `${basePath}/${prefix}_base_link.glb`)
  const thumbProximal = useLoader(GLTFLoader, `${basePath}/${prefix}_thumb_proximal.glb`)
  const thumbIntermediate = useLoader(GLTFLoader, `${basePath}/${prefix}_thumb_intermediate.glb`)
  const thumbDistal = useLoader(GLTFLoader, `${basePath}/${prefix}_thumb_distal.glb`)
  const indexProximal = useLoader(GLTFLoader, `${basePath}/${prefix}_index_proximal.glb`)
  const indexIntermediate = useLoader(GLTFLoader, `${basePath}/${prefix}_index_intermediate.glb`)

  return (
    <group scale={[1, 1, 1]}>
      <primitive object={baseLink.scene.clone()} />
      <group position={[0.01, 0.01, 0.01]}>
        <primitive object={thumbProximal.scene.clone()} />
        <group position={[0.02, 0, 0]}>
          <primitive object={thumbIntermediate.scene.clone()} />
          <group position={[0.02, 0, 0]}>
            <primitive object={thumbDistal.scene.clone()} />
          </group>
        </group>
      </group>
      <group position={[0.02, 0, 0]}>
        <primitive object={indexProximal.scene.clone()} />
        <group position={[0.03, 0, 0]}>
          <primitive object={indexIntermediate.scene.clone()} />
        </group>
      </group>
    </group>
  )
}
