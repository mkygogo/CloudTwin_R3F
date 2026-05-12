import React from 'react';

export default function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[100, 150, 100]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-camera-near={1}
        shadow-camera-far={500}
      />
      <directionalLight position={[-80, 100, -80]} intensity={0.5} />
      <hemisphereLight args={['#b1e1ff', '#b97a20', 0.3]} />
    </>
  );
}
