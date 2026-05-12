import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs';
import path from 'path';

const MODELS_DIR = './public/models';

async function inspectModel(filePath) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(filePath);
  const root = doc.getRoot();
  const scene = root.listScenes()[0];
  
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let meshCount = 0;
  let vertexCount = 0;

  for (const mesh of root.listMeshes()) {
    meshCount++;
    for (const prim of mesh.listPrimitives()) {
      const posAccessor = prim.getAttribute('POSITION');
      if (posAccessor) {
        vertexCount += posAccessor.getCount();
        const posArr = posAccessor.getArray();
        for (let i = 0; i < posArr.length; i += 3) {
          minX = Math.min(minX, posArr[i]);
          maxX = Math.max(maxX, posArr[i]);
          minY = Math.min(minY, posArr[i + 1]);
          maxY = Math.max(maxY, posArr[i + 1]);
          minZ = Math.min(minZ, posArr[i + 2]);
          maxZ = Math.max(maxZ, posArr[i + 2]);
        }
      }
    }
  }

  return {
    file: path.basename(filePath),
    meshes: meshCount,
    vertices: vertexCount,
    bounds: {
      min: [minX.toFixed(2), minY.toFixed(2), minZ.toFixed(2)],
      max: [maxX.toFixed(2), maxY.toFixed(2), maxZ.toFixed(2)],
      size: [(maxX - minX).toFixed(2), (maxY - minY).toFixed(2), (maxZ - minZ).toFixed(2)],
      center: [((minX + maxX) / 2).toFixed(2), ((minY + maxY) / 2).toFixed(2), ((minZ + maxZ) / 2).toFixed(2)],
    },
  };
}

async function main() {
  const files = fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith('.glb'));
  console.log(`Found ${files.length} GLB models\n`);

  for (const file of files) {
    try {
      const info = await inspectModel(path.join(MODELS_DIR, file));
      console.log(`=== ${info.file} ===`);
      console.log(`  Meshes: ${info.meshes}, Vertices: ${info.vertices.toLocaleString()}`);
      console.log(`  Size:   [${info.bounds.size.join(', ')}]`);
      console.log(`  Center: [${info.bounds.center.join(', ')}]`);
      console.log(`  Min:    [${info.bounds.min.join(', ')}]`);
      console.log(`  Max:    [${info.bounds.max.join(', ')}]`);
      console.log('');
    } catch (e) {
      console.error(`Error reading ${file}: ${e.message}`);
    }
  }
}

main();
