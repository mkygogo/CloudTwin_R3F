import { useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import useTwinStore from '../../store/useTwinStore';

const HIGHLIGHT_COLOR = new THREE.Color('#00d4ff');
const HOVER_EMISSIVE = 0.15;

/**
 * 可交互Mesh包装器
 * - hover高亮
 * - 点击选中 → 显示设备信息浮窗
 */
export default function InteractiveMesh({ mesh }) {
  const selectedObject = useTwinStore((s) => s.selectedObject);
  const setSelectedObject = useTwinStore((s) => s.setSelectedObject);
  const deviceData = useTwinStore((s) => s.deviceData);

  const [hovered, setHovered] = useState(false);
  const isSelected = selectedObject === mesh.name;
  const data = deviceData[mesh.name];

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    setSelectedObject(isSelected ? null : mesh.name);
  }, [isSelected, mesh.name]);

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  // 动态高亮效果
  useFrame(() => {
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      if (mat.emissive) {
        if (isSelected) {
          mat.emissive.copy(HIGHLIGHT_COLOR);
          mat.emissiveIntensity = 0.3;
        } else if (hovered) {
          mat.emissive.copy(HIGHLIGHT_COLOR);
          mat.emissiveIntensity = HOVER_EMISSIVE;
        } else {
          mat.emissiveIntensity = 0;
        }
      }
    });
  });

  return (
    <>
      {/* 透明交互层（不影响原有材质渲染） */}
      <mesh
        geometry={mesh.geometry}
        position={mesh.getWorldPosition(new THREE.Vector3())}
        rotation={mesh.getWorldQuaternion(new THREE.Quaternion())}
        scale={mesh.getWorldScale(new THREE.Vector3())}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        visible={false}
      >
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* 选中时的信息浮窗 */}
      {isSelected && (
        <Html
          position={mesh.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.5, 0))}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div className="twin-tooltip">
            <div className="twin-tooltip-title">{mesh.name || 'Unnamed'}</div>
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
              <div className="twin-tooltip-data">无实时数据</div>
            )}
          </div>
        </Html>
      )}
    </>
  );
}
