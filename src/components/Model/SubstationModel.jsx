import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGLTF, Html, TransformControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useTwinStore from '../../store/useTwinStore';

const HIGHLIGHT_COLOR = new THREE.Color('#00d4ff');
const _v3 = new THREE.Vector3();
const _box = new THREE.Box3();

export default function SubstationModel({ config, orbitRef }) {
  const { name, file, position, rotation, scale, label } = config;
  const { scene } = useGLTF(file);
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [bbox, setBbox] = useState(null);

  const selectedObject = useTwinStore((s) => s.selectedObject);
  const setSelectedObject = useTwinStore((s) => s.setSelectedObject);
  const deviceData = useTwinStore((s) => s.deviceData);
  const appMode = useTwinStore((s) => s.appMode);
  const transformMode = useTwinStore((s) => s.transformMode);
  const layoutOverrides = useTwinStore((s) => s.layoutOverrides);
  const updateLayout = useTwinStore((s) => s.updateLayout);
  const incrementModelsLoaded = useTwinStore((s) => s.incrementModelsLoaded);

  const isSelected = selectedObject === name;
  const isEditor = appMode === 'editor';
  const data = deviceData[name];
  const override = layoutOverrides[name] || {};

  // 合并默认布局和用户覆盖
  const finalPosition = override.position || position;
  const finalRotation = override.rotation || rotation;
  const finalScale = override.scale ?? scale;

  // 模型加载 → 启用阴影 + 计算包围盒 + 通知加载完成
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (mat.emissive && !mat.userData._origEmissive) {
              mat.userData._origEmissive = mat.emissive.clone();
              mat.userData._origEmissiveIntensity = mat.emissiveIntensity;
            }
          });
        }
      }
    });

    // 计算包围盒高度（用于标签定位）
    _box.setFromObject(scene);
    const size = _box.getSize(_v3);
    setBbox({ height: size.y, center: _box.getCenter(_v3.clone()) });

    incrementModelsLoaded();
  }, [scene]);

  // 高亮
  useFrame(() => {
    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat.emissive) return;
        if (isSelected) {
          mat.emissive.copy(HIGHLIGHT_COLOR);
          mat.emissiveIntensity = 0.25;
        } else if (hovered) {
          mat.emissive.copy(HIGHLIGHT_COLOR);
          mat.emissiveIntensity = 0.1;
        } else {
          const orig = mat.userData._origEmissive;
          if (orig) {
            mat.emissive.copy(orig);
            mat.emissiveIntensity = mat.userData._origEmissiveIntensity || 0;
          }
        }
      });
    });
  });

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    setSelectedObject(isSelected ? null : name);
  }, [isSelected, name]);

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  // 编辑器拖拽完成 → 保存位置
  const handleTransformChange = useCallback(() => {
    if (!groupRef.current) return;
    const p = groupRef.current.position;
    const r = groupRef.current.rotation;
    const s = groupRef.current.scale;
    updateLayout(name, {
      position: [round(p.x), round(p.y), round(p.z)],
      rotation: [round(r.x), round(r.y), round(r.z)],
      scale: round(s.x),
    });
  }, [name]);

  const labelY = bbox ? bbox.height * (typeof finalScale === 'number' ? finalScale : 1) + 3 : 20;

  const modelGroup = (
    <group
      ref={groupRef}
      position={finalPosition}
      rotation={finalRotation}
      scale={typeof finalScale === 'number' ? [finalScale, finalScale, finalScale] : finalScale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <primitive object={scene} />

      {/* 设备名称标签 */}
      <Html
        position={[0, labelY / (typeof finalScale === 'number' ? finalScale : 1), 0]}
        center
        distanceFactor={80}
        occlude={false}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div style={{
          background: isSelected ? 'rgba(0,212,255,0.15)' : 'rgba(10,10,30,0.7)',
          border: `1px solid ${isSelected ? '#00d4ff' : 'rgba(100,140,255,0.15)'}`,
          borderRadius: '4px',
          padding: '3px 10px',
          color: isSelected ? '#00d4ff' : '#8888aa',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)',
        }}>
          {label}
          {isEditor && isSelected && (
            <span style={{ color: '#648cff', marginLeft: 6, fontSize: 10 }}>
              [{finalPosition.map((v) => round(v)).join(', ')}]
            </span>
          )}
        </div>
      </Html>

      {/* 选中详情浮窗 (仅查看模式) */}
      {isSelected && !isEditor && (
        <Html
          position={[0, (labelY + 6) / (typeof finalScale === 'number' ? finalScale : 1), 0]}
          center
          distanceFactor={60}
          style={{ pointerEvents: 'none' }}
        >
          <div className="twin-tooltip" style={{ minWidth: '160px' }}>
            <div className="twin-tooltip-title">{label} ({name})</div>
            {data ? (
              <div className="twin-tooltip-data">
                {Object.entries(data)
                  .filter(([k]) => !k.startsWith('_'))
                  .map(([key, val]) => (
                    <div key={key} className="twin-tooltip-row">
                      <span>{key}:</span>
                      <span>{typeof val === 'number' ? val.toFixed(1) : String(val)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="twin-tooltip-data" style={{ color: '#555' }}>点击启动模拟数据查看</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );

  // 编辑器模式 → 选中时显示 TransformControls
  if (isEditor && isSelected) {
    return (
      <TransformControls
        object={groupRef}
        mode={transformMode}
        onMouseUp={handleTransformChange}
        onObjectChange={() => {
          // 拖拽时禁用 OrbitControls
          if (orbitRef?.current) orbitRef.current.enabled = false;
        }}
        onMouseDown={() => {
          if (orbitRef?.current) orbitRef.current.enabled = false;
        }}
        ref={(tc) => {
          if (tc) {
            const cb = () => { if (orbitRef?.current) orbitRef.current.enabled = true; };
            tc.addEventListener('mouseUp', cb);
          }
        }}
      >
        {modelGroup}
      </TransformControls>
    );
  }

  return modelGroup;
}

function round(v) {
  return Math.round(v * 100) / 100;
}
