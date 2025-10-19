import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import HandModel from './HandModel'

export default function Scene3D({ selectedModel, handTrackingData, jointRotations = {} }) {
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

      <HandModel
        key={selectedModel.id}
        position={[0, 0, 0]}
        modelPath={selectedModel.path}
        side={selectedModel.side}
        handTrackingData={handTrackingData}
        jointRotations={jointRotations}
      />

      <OrbitControls />
    </Canvas>
  )
}
