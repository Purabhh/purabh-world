// Voxel building toolkit. Everything in the world is made from these helpers so
// the art style (clean, flat-shaded stylized voxels) stays consistent.
//
// Conventions:
//  - World is the XZ plane, Y is up. The ground top sits at y = 0.
//  - box() positions are the CENTER of the box.
//  - pillar()/building()/tree() positions are [x, z] on the ground and grow UP.
import * as THREE from 'three';
import { addCircle } from '../core/colliders.js';

const _matCache = new Map();

export function material(color, opts = {}) {
  const {
    flat = true, emissive = 0x000000, emissiveIntensity = 0,
    opacity = 1, metalness = 0, roughness = 0.85,
    envMap = null, envMapIntensity = 1,
    depthWrite = true, polygonOffset = false, polygonOffsetFactor = 0, polygonOffsetUnits = 0,
  } = opts;
  // Env-mapped (reflective) OR decal (no depth write / polygon offset) materials
  // can't share the simple cache below, so build them fresh.
  if (envMap || !depthWrite || polygonOffset) {
    const m = new THREE.MeshStandardMaterial({
      color, flatShading: flat, emissive, emissiveIntensity,
      transparent: opacity < 1, opacity, metalness, roughness,
      depthWrite, polygonOffset, polygonOffsetFactor, polygonOffsetUnits,
    });
    if (envMap) { m.envMap = envMap; m.envMapIntensity = envMapIntensity; }
    return m;
  }
  const key = `${color}|${flat}|${emissive}|${emissiveIntensity}|${opacity}|${metalness}|${roughness}`;
  if (_matCache.has(key)) return _matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, flatShading: flat, emissive, emissiveIntensity,
    transparent: opacity < 1, opacity, metalness, roughness,
  });
  _matCache.set(key, m);
  return m;
}

// Core primitive. size=[w,h,d]; pos=[x,y,z] is the center. mat opts pass through.
export function box({ size = [1, 1, 1], color = 0xffffff, pos = [0, 0, 0], shadow = true, ...mat } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material(color, mat));
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = shadow;
  mesh.receiveShadow = shadow;
  return mesh;
}

export function group(children = []) {
  const g = new THREE.Group();
  for (const c of children) if (c) g.add(c);
  return g;
}

// A box grounded at y0 that grows UP. pos=[x,z]. footprint=[w,d].
export function pillar({ footprint = [1, 1], height = 1, color = 0xffffff, pos = [0, 0], y0 = 0, ...mat } = {}) {
  return box({ size: [footprint[0], height, footprint[1]], color, pos: [pos[0], y0 + height / 2, pos[1]], ...mat });
}

// A simple voxel building: body + optional roof slab, grounded at y0.
export function building({ footprint = [6, 6], height = 8, color = 0xcccccc, roof = null, roofHeight = 1.4, pos = [0, 0], y0 = 0, ...mat } = {}) {
  const parts = [pillar({ footprint, height, color, pos, y0, ...mat })];
  if (roof !== null) {
    parts.push(box({
      size: [footprint[0] + 1, roofHeight, footprint[1] + 1],
      color: roof, pos: [pos[0], y0 + height + roofHeight / 2, pos[1]],
    }));
  }
  return group(parts);
}

// Flat ground slab centered at origin; its TOP is at y = 0.
export function groundSlab({ size = 200, thickness = 2, color = 0x8fce6b, pos = [0, 0] } = {}) {
  const mesh = box({ size: [size, thickness, size], color, pos: [pos[0], -thickness / 2, pos[1]], roughness: 1 });
  mesh.castShadow = false;
  return mesh;
}

// A thin colored floor patch (plazas, paths) laid just above the ground.
export function patch({ size = [10, 10], color = 0xead9a8, pos = [0, 0], y = 0.06 } = {}) {
  // Ground decals don't write depth (and are nudged toward the camera) so that
  // overlapping coplanar patches — paths merging into the plaza, plaza edges,
  // district pads sitting on grass — never z-fight. The stable opaque paint order
  // (creation order) layers them instead of the depth buffer.
  const mesh = box({
    size: [size[0], 0.2, size[1]], color, pos: [pos[0], y, pos[1]], roughness: 1,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  mesh.castShadow = false;
  return mesh;
}

// Trees register here so the atmosphere layer can sway them on the wind. It's a
// live shared array: trees pushed later (e.g. the async Projects district) are
// picked up automatically by whoever iterates it each frame.
export const swayables = [];

// A chunky low-poly tree. Built at LOCAL origin with the group planted at [pos],
// so rotating the group leans the whole tree from its base (used for wind sway).
export function tree({ pos = [0, 0], h = 4.5, trunk = 0x8a5a2b, leaf = 0x6fbf52 } = {}) {
  const g = group([
    pillar({ footprint: [0.8, 0.8], height: h, color: trunk, pos: [0, 0] }),
    box({ size: [3.2, 3, 3.2], color: leaf, pos: [0, h + 0.6, 0] }),
    box({ size: [2.1, 2.1, 2.1], color: leaf, pos: [0, h + 2.4, 0] }),
  ]);
  g.position.set(pos[0], 0, pos[1]);
  g.userData.sway = true;
  swayables.push(g);
  addCircle(pos[0], pos[1], 0.95, { top: h + 3, leap: false }); // solid trunk/canopy
  return g;
}
