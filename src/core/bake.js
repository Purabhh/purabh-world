// Static batching: merges every mesh that never moves into a few big meshes, so
// ~1,000 little voxel boxes become a few dozen draw calls. Nothing is simplified;
// the triangles are the same, just submitted together.
//
// How meshes group:
//   - Plain opaque materials merge ACROSS colors: the color moves into a vertex
//     color and the rest (emissive, roughness, metalness, map, env map...) must
//     match. That is what turns 600 one-off materials into a handful.
//   - Decals (no depth write / polygon offset) don't occlude each other, so they
//     paint in draw order, which three sorts by material id (voxel.patch() relies
//     on it). They merge into one mesh per world, in material-id order, so every
//     patch still paints over the ones made before it.
//   - Everything else is split into CELL-sized chunks of the map so off-screen
//     chunks are still frustum-culled.
//
// What is left alone:
//   - Anything tagged `userData.dynamic` or `userData.sway` (or under one): code
//     moves it each frame.
//   - Meshes whose material is tagged `userData.animated`: code changes its color
//     or glow, and baking the color into vertices would freeze it.
//   - Transparent, multi-material, morphing, instanced and skinned meshes.
//
// New animated things must be tagged, or they get frozen into the bake.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const CELL = 48;
const defaultBeforeRender = THREE.Object3D.prototype.onBeforeRender;
const defaultBeforeCompile = THREE.Material.prototype.onBeforeCompile;

function isFrozenSubtree(o) {
  for (let p = o; p; p = p.parent) if (p.userData.dynamic || p.userData.sway) return true;
  return false;
}

function bakeable(o) {
  if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return false;
  const m = o.material;
  if (!m || Array.isArray(m) || m.transparent || m.userData.animated || m.vertexColors) return false;
  if (m.onBeforeCompile !== defaultBeforeCompile || o.onBeforeRender !== defaultBeforeRender) return false;
  const g = o.geometry;
  if (!g.attributes.position || g.attributes.color || Object.keys(g.morphAttributes).length) return false;
  return !isFrozenSubtree(o);
}

function isDecal(m) { return !m.depthWrite || m.polygonOffset; }

// Everything about a material except its color.
function materialKey(m) {
  return [
    m.type, m.depthWrite, m.polygonOffset, m.polygonOffsetFactor, m.polygonOffsetUnits, m.flatShading, m.side, m.fog, m.toneMapped, m.alphaTest, m.wireframe,
    m.emissive?.getHexString(), m.emissiveIntensity, m.roughness, m.metalness,
    m.envMap?.uuid, m.envMapIntensity, m.map?.uuid, m.emissiveMap?.uuid, m.bumpMap?.uuid, m.bumpScale,
    m.normalMap?.uuid, m.roughnessMap?.uuid, m.metalnessMap?.uuid, m.aoMap?.uuid, m.alphaMap?.uuid,
  ].join('|');
}

function layoutKey(g) {
  return (g.index ? 'i|' : 'n|') + Object.keys(g.attributes).sort()
    .map((k) => `${k}:${g.attributes[k].itemSize}:${g.attributes[k].normalized}`).join(',');
}

const _sphere = new THREE.Sphere();

export function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const geoUsers = new Map();
  root.traverse((o) => {
    if (o.isMesh) geoUsers.set(o.geometry, (geoUsers.get(o.geometry) || 0) + 1);
    if (!bakeable(o)) return;
    const m = o.material, g = o.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    _sphere.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
    const cell = isDecal(m) ? 'decal' : Math.floor(_sphere.center.x / CELL) + ',' + Math.floor(_sphere.center.z / CELL);
    const key = [cell, materialKey(m), layoutKey(g), o.castShadow, o.receiveShadow, o.renderOrder, o.frustumCulled].join('#');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(o);
  });

  const mtx = new THREE.Matrix4();
  const shared = new Map(); // one vertex-colored material per material key, shared by all cells
  let merged = 0, sources = 0;
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    if (isDecal(list[0].material)) list.sort((a, b) => a.material.id - b.material.id);
    const first = list[0];
    const geos = list.map((o) => {
      mtx.multiplyMatrices(toRoot, o.matrixWorld);
      const g = o.geometry.clone().applyMatrix4(mtx);
      // Mirrored transforms flip the winding once baked; flip it back.
      if (mtx.determinant() < 0 && g.index) {
        const a = g.index.array;
        for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; }
      }
      const c = o.material.color, n = g.attributes.position.count;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    });
    const geo = mergeGeometries(geos);
    if (!geo) continue; // layouts disagreed after all; leave these meshes as they were
    const key = materialKey(first.material);
    if (!shared.has(key)) {
      const m = first.material.clone();
      m.color.setRGB(1, 1, 1);
      m.vertexColors = true;
      shared.set(key, m);
    }
    const mesh = new THREE.Mesh(geo, shared.get(key));
    mesh.name = 'baked';
    mesh.castShadow = first.castShadow; mesh.receiveShadow = first.receiveShadow;
    mesh.renderOrder = first.renderOrder; mesh.frustumCulled = first.frustumCulled;
    mesh.matrixAutoUpdate = false;
    for (const o of list) {
      o.removeFromParent();
      const left = geoUsers.get(o.geometry) - 1;
      geoUsers.set(o.geometry, left);
      if (left === 0) o.geometry.dispose();
    }
    root.add(mesh);
    merged++; sources += list.length;
  }
  return { merged, sources };
}
