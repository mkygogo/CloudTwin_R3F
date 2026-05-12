import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useTwinStore from '../../store/useTwinStore';
import InteractiveMesh from './InteractiveMesh';

/**
 * GLB模型加载器
 * - 自动遍历场景树，为每个Mesh添加交互
 * - 支持点击选中高亮
 */
export default function ModelLoader({ url, position = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF(url);
  const setModelLoaded = useTwinStore((s) => s.setModelLoaded);

  useEffect(() => {
    // 模型加载后启用阴影
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    setModelLoaded(true);
  }, [scene]);

  // 收集所有mesh节点
  const meshes = useMemo(() => {
    const list = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        list.push(child);
      }
    });
    return list;
  }, [scene]);

  return (
    <group position={position} scale={scale}>
      <primitive object={scene} />
      {/* 覆盖层用于交互检测 */}
      {meshes.map((mesh) => (
        <InteractiveMesh key={mesh.uuid} mesh={mesh} />
      ))}
    </group>
  );
}

// 预加载支持
ModelLoader.preload = (url) => useGLTF.preload(url);
