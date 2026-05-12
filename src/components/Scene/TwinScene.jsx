import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid, Stats } from '@react-three/drei';
import ModelLoader from '../Model/ModelLoader';
import SceneLights from './SceneLights';

/**
 * 主3D场景容器
 * props.modelUrl - GLB模型路径
 */
export default function TwinScene({ modelUrl = '/models/scene.glb' }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [10, 8, 10], fov: 50, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 30, 80]} />

      <Suspense fallback={null}>
        <SceneLights />
        <ModelLoader url={modelUrl} />
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.4}
          scale={40}
          blur={2}
          far={10}
        />
        <Grid
          position={[0, -0.02, 0]}
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#3a3a5c"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#5a5a8c"
          fadeDistance={60}
          infiniteGrid
        />
        <Environment preset="city" />
      </Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.1}
      />

      {import.meta.env.DEV && <Stats />}
    </Canvas>
  );
}
