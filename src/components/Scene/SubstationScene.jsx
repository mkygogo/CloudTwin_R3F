import { Component, Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Grid,
  Stats,
  Html,
} from '@react-three/drei';
import SceneLights from './SceneLights';
import SubstationModel from '../Model/SubstationModel';
import useTwinStore from '../../store/useTwinStore';
import { useModelManifest } from '../../hooks/useModelManifest';
import { useModelLoadQueue } from '../../hooks/useModelLoadQueue';
import { markLoadMetric, resetModelMetrics } from '../../utils/loadMetrics';

class ModelErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('[CloudTwin] 模型加载失败:', this.props.name, error);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.name !== this.props.name || prevProps.file !== this.props.file) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function LoadingProgressOverlay({ message, detail, progress = 0, error = false }) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        top: '42px',
        left: '50%',
        width: '390px',
        maxWidth: '42vw',
        transform: 'translateX(-50%)',
        background: 'rgba(8, 16, 38, 0.72)',
        border: `1px solid ${error ? 'rgba(255,92,119,0.48)' : 'rgba(78,151,255,0.36)'}`,
        borderRadius: '6px',
        padding: '10px 12px',
        color: error ? '#ff9aad' : '#c9dcff',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 12px 34px rgba(0,0,0,0.28)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '7px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: 0,
        }}>
          <span>{message}</span>
          {detail && <span style={{ color: error ? '#ffbac5' : '#7fa5e8', fontWeight: 500 }}>{detail}</span>}
        </div>
        <div style={{
          height: '5px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${clampedProgress}%`,
            height: '100%',
            background: error
              ? 'linear-gradient(90deg, #ff5c77, #ff9aad)'
              : 'linear-gradient(90deg, #648cff, #00d4ff)',
            borderRadius: '999px',
            transition: 'width 0.28s ease',
          }} />
        </div>
      </div>
    </Html>
  );
}

function ModelPlaceholder({ config, failed = false }) {
  const { position, rotation, scale, label } = config;
  return (
    <group
      position={position}
      rotation={rotation}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
    >
      <Html position={[0, 16 / (typeof scale === 'number' ? scale : 1), 0]} center distanceFactor={80}>
        <div style={{
          background: failed ? 'rgba(80,18,26,0.74)' : 'rgba(10,10,30,0.54)',
          border: `1px solid ${failed ? 'rgba(255,92,119,0.45)' : 'rgba(100,140,255,0.16)'}`,
          borderRadius: '4px',
          padding: '3px 9px',
          color: failed ? '#ff8fa3' : '#5f6f9e',
          fontSize: '11px',
          fontFamily: 'system-ui, sans-serif',
          whiteSpace: 'nowrap',
        }}>
          {failed ? `${label} 加载失败` : `${label} 加载中`}
        </div>
      </Html>
    </group>
  );
}

function SceneContent({ orbitRef }) {
  const resetModelLoadProgress = useTwinStore((s) => s.resetModelLoadProgress);
  const setModelsTotalCount = useTwinStore((s) => s.setModelsTotalCount);
  const modelsLoadedCount = useTwinStore((s) => s.modelsLoadedCount);
  const { models, loading, error, useRawModels } = useModelManifest();
  const { queuedModels, phase, totalCount } = useModelLoadQueue(models);
  const progress = totalCount > 0 ? (modelsLoadedCount / totalCount) * 100 : 0;

  useEffect(() => {
    resetModelLoadProgress();
    resetModelMetrics();
    setModelsTotalCount(models.length);
    if (models.length) {
      markLoadMetric('manifestReady', { totalCount: models.length, useRawModels });
    }
  }, [models.length, resetModelLoadProgress, setModelsTotalCount, useRawModels]);

  return (
    <>
      {loading && (
        <LoadingProgressOverlay message="加载核心场景" detail="准备模型清单" progress={8} />
      )}
      {error && (
        <LoadingProgressOverlay message="模型清单加载失败" detail={error.message} progress={100} error />
      )}

      {queuedModels.map((item) => (
        <ModelErrorBoundary
          key={`${item.name}:${item.file}`}
          name={item.name}
          file={item.file}
          fallback={<ModelPlaceholder config={item} failed />}
        >
          <Suspense fallback={<ModelPlaceholder config={item} />}>
            <SubstationModel
              config={{ ...item, totalCount }}
              orbitRef={orbitRef}
            />
          </Suspense>
        </ModelErrorBoundary>
      ))}

      {!loading && !error && modelsLoadedCount < totalCount && (
        <LoadingProgressOverlay
          message={phase}
          detail={`${modelsLoadedCount}/${totalCount} · ${Math.round(progress)}%`}
          progress={progress}
        />
      )}

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
  const showStats =
    import.meta.env.VITE_SHOW_STATS === 'true' ||
    new URLSearchParams(window.location.search).has('stats');

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
      <SceneContent orbitRef={orbitRef} />

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

      {showStats && <Stats />}
    </Canvas>
  );
}
