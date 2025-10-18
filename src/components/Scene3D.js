import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import HandModel from './HandModel'

export default function Scene3D({ selectedModel, handTrackingData }) {
  return (
    <Canvas
      camera={{ position: [0.5, 0.5, 1], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} />
      <pointLight position={[0, 2, 0]} intensity={0.5} />

      <HandModel
        key={selectedModel.id}
        position={[0, 0, 0]}
        modelPath={selectedModel.path}
        side={selectedModel.side}
        handTrackingData={handTrackingData}
      />

      <OrbitControls />
    </Canvas>
  )
}
