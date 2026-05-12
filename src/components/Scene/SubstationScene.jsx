import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Grid,
  Stats,
  Html,
  useProgress,
} from '@react-three/drei';
import SceneLights from './SceneLights';
import SubstationModel from '../Model/SubstationModel';
import useTwinStore from '../../store/useTwinStore';

/**
 * 变电站设备布局配置
 * 所有设备默认放在原点，用户通过编辑器模式手动布局
 */
const SUBSTATION_LAYOUT = [
  { name: 'GIS_LMJ',   file: '/models/GIS_LMJ.glb',   position: [0, 0, 0],     rotation: [0, 0, 0], scale: 1, label: 'GIS联络母线' },
  { name: 'LMJ',        file: '/models/LMJ.glb',        position: [0, 0, -160],  rotation: [0, 0, 0], scale: 1, label: '母线' },
  { name: '4BYZB',      file: '/models/4BYZB.glb',      position: [-55, 0, -80], rotation: [0, 0, 0], scale: 1, label: '4号变压器组' },
  { name: '500KVGIS',   file: '/models/500KVGIS.glb',   position: [55, 0, -80],  rotation: [0, 0, 0], scale: 1, label: '500KV GIS' },
  { name: 'BLQ',        file: '/models/BLQ.glb',        position: [-85, 0, 40],  rotation: [0, 0, 0], scale: 1, label: '避雷器' },
  { name: 'DLDRQ',      file: '/models/DLDRQ.glb',      position: [-45, 0, 60],  rotation: [0, 0, 0], scale: 1, label: '电力电容器' },
  { name: 'DKQ_GLB',    file: '/models/DKQ_GLB.glb',    position: [45, 0, 60],   rotation: [0, 0, 0], scale: 1000, label: '电抗器' },
  { name: 'HKGS',       file: '/models/HKGS.glb',       position: [85, 0, 80],   rotation: [0, 0, 0], scale: 1, label: '汇控柜室' },
  { name: 'KGGS',       file: '/models/KGGS.glb',       position: [85, 0, 40],   rotation: [0, 0, 0], scale: 1, label: '开关柜室' },
  { name: 'JYZZZ',      file: '/models/JYZZZ.glb',      position: [85, 0, 0],    rotation: [0, 0, 0], scale: 1, label: '继电保护装置' },
  { name: 'XQSKG',      file: '/models/XQSKG.glb',      position: [-85, 0, -40], rotation: [0, 0, 0], scale: 1, label: 'SF6断路器' },
];

function LoadingScreen() {
  const { progress, item, loaded, total } = useProgress();
  return (
    <Html center>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        color: '#a0c4ff', fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap',
      }}>
        <div style={{ fontSize: '20px', fontWeight: 600 }}>加载变电站模型...</div>
        <div style={{
          width: '300px', height: '6px', background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px', overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg, #648cff, #00d4ff)',
            borderRadius: '3px', transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize: '13px', color: '#888' }}>{loaded}/{total} — {progress.toFixed(0)}%</div>
        <div style={{ fontSize: '11px', color: '#555', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item?.split('/').pop()}
        </div>
      </div>
    </Html>
  );
}

function SceneContent({ orbitRef }) {
  const setModelsTotalCount = useTwinStore((s) => s.setModelsTotalCount);

  useEffect(() => {
    setModelsTotalCount(SUBSTATION_LAYOUT.length);
  }, []);

  return (
    <>
      {SUBSTATION_LAYOUT.map((item) => (
        <SubstationModel key={item.name} config={item} orbitRef={orbitRef} />
      ))}

      <ContactShadows position={[0, -0.05, 0]} opacity={0.3} scale={500} blur={2} far={20} />

      <Grid
        position={[0, -0.1, 0]}
        args={[600, 600]}
        cellSize={5}
        cellThickness={0.4}
        cellColor="#2a2a4c"
        sectionSize={25}
        sectionThickness={0.8}
        sectionColor="#3a3a6c"
        fadeDistance={400}
        infiniteGrid
      />

      <Environment preset="city" />
    </>
  );
}

export default function SubstationScene() {
  const orbitRef = useRef();

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [200, 150, 250], fov: 45, near: 0.5, far: 2000 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ background: '#1a1a2e' }}
      onPointerMissed={() => useTwinStore.getState().setSelectedObject(null)}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 300, 800]} />

      <SceneLights />

      <Suspense fallback={<LoadingScreen />}>
        <SceneContent orbitRef={orbitRef} />
      </Suspense>

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 20, 0]}
      />

      {import.meta.env.DEV && <Stats />}
    </Canvas>
  );
}
