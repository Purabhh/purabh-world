// Shared prep for Blender GLBs before they go in the scene. Call it on gltf.scene
// BEFORE positioning/scaling it, since the merge bakes node transforms relative
// to the root.
//   - Metal: borrow the world's env map, or tone metal down when there is none.
//   - Glass: transmission re-renders the whole scene into an extra target every
//     frame (~1,450 extra draw calls), so it becomes plain alpha glass instead.
//   - Merge: the models are static, so every mesh sharing a material is merged
//     into one, cutting ~250 draw calls (x2 with the shadow pass) to ~40.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function fixMaterial(m, scene) {
  if (m.metalness > 0.5) {
    if (scene.environment) m.envMap = scene.environment;
    else { m.metalness = 0.35; m.roughness = Math.max(m.roughness, 0.35); }
  }
  if (m.transmission > 0) {
    m.opacity = Math.min(m.opacity, 1 - m.transmission * 0.6);
    m.transmission = 0;
    m.transparent = true;
    m.depthWrite = false;
    m.needsUpdate = true;
  }
}

// Meshes can only merge when their attribute layout matches.
function layoutKey(g) {
  const attrs = Object.keys(g.attributes).sort()
    .map((k) => `${k}:${g.attributes[k].itemSize}:${g.attributes[k].normalized}`);
  return (g.index ? 'i|' : 'n|') + attrs.join(',');
}

export function prepareGlb(root, scene) {
  root.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map();
  const meshes = [];
  root.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    meshes.push(o);
    const key = o.material.uuid + '|' + layoutKey(o.geometry);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });

  const m = new THREE.Matrix4();
  const merged = [];
  for (const list of groups.values()) {
    const geos = list.map((o) => {
      m.multiplyMatrices(toRoot, o.matrixWorld);
      const g = o.geometry.clone().applyMatrix4(m);
      // Mirrored nodes flip winding once baked; flip it back so faces stay front-facing.
      if (m.determinant() < 0 && g.index) {
        const a = g.index.array;
        for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; }
      }
      return g;
    });
    const geo = geos.length > 1 ? mergeGeometries(geos) : geos[0];
    if (!geo) continue; // layouts disagreed after all; leave those meshes as they were
    fixMaterial(list[0].material, scene);
    const mesh = new THREE.Mesh(geo, list[0].material);
    mesh.name = list[0].material.name || list[0].name;
    mesh.castShadow = true; mesh.receiveShadow = true;
    merged.push({ mesh, sources: list });
  }

  for (const { mesh, sources } of merged) {
    for (const o of sources) { o.removeFromParent(); o.geometry.dispose(); }
    root.add(mesh);
  }
  // Anything that could not merge (multi-material meshes) still gets the fixes.
  for (const o of meshes) {
    if (o.parent === null) continue;
    o.castShadow = true; o.receiveShadow = true;
    for (const mat of [].concat(o.material)) fixMaterial(mat, scene);
  }
  return root;
}
