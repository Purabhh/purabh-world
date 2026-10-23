// Voxel building toolkit. Everything in the world is made from these helpers so
// the art style (clean, flat-shaded stylized voxels) stays consistent.
//
// Conventions:
//  - World is the XZ plane, Y is up. The ground top sits at y = 0.
//  - box() positions are the CENTER of the box.
//  - pillar()/building()/tree() positions are [x, z] on the ground and grow UP.
import * as THREE from 'three';
import { addCircle } from '../core/colliders.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canopy, CANOPY_COLORS } from '../world/foliage.js';

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

// Soft bevelled edges catch a thin highlight, which is most of what makes a box
// read as "made" instead of "default cube". Shared per size; the bake merges them.
const _boxGeo = new Map();
function boxGeometry(w, h, d, bevel) {
  const key = `${w}|${h}|${d}|${bevel}`;
  if (!_boxGeo.has(key)) {
    const r = Math.min(0.08, 0.18 * Math.min(w, h, d));
    _boxGeo.set(key, bevel && r > 0.01 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d));
  }
  return _boxGeo.get(key);
}

// Core primitive. size=[w,h,d]; pos=[x,y,z] is the center. mat opts pass through.
export function box({ size = [1, 1, 1], color = 0xffffff, pos = [0, 0, 0], shadow = true, bevel = true, ...mat } = {}) {
  const mesh = new THREE.Mesh(boxGeometry(size[0], size[1], size[2], bevel), material(color, mat));
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
  const mesh = box({ size: [size, thickness, size], color, pos: [pos[0], -thickness / 2, pos[1]], roughness: 1, bevel: false });
  mesh.castShadow = false;
  return mesh;
}

// Paving stones for ground patches: a grayscale 4x4 grid of stones (running bond,
// thin grout, a little speckle) that each patch's color tints. Every patch shares
// this one texture, so the static bake still merges all of them into one mesh in
// creation order. Stone 0 (top-left) is plain white, so an untiled patch samples
// just that spot and keeps its flat color.
const TILE_STONES = 4;
const FLAT_UV = [0.5 / TILE_STONES, 1 - 0.5 / TILE_STONES];
let _tileTex = null;
function tileTexture() {
  if (_tileTex) return _tileTex;
  const S = 512, cell = S / TILE_STONES, grout = 5;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#b4b0aa';
  g.fillRect(0, 0, S, S);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stone = (x, y, w, h, v) => {
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.beginPath(); g.roundRect(x + grout, y + grout, w - grout * 2, h - grout * 2, 9); g.fill();
    // soft lit top edge so each stone reads as raised a touch
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(x + grout + 6, y + grout + 2, w - grout * 2 - 12, 3);
  };
  for (let r = 0; r < TILE_STONES; r++) {
    const off = r % 2 ? cell / 2 : 0;   // running bond: odd rows shift half a stone
    for (let i = -1; i < TILE_STONES; i++) {
      const x = i * cell + off;
      const v = r === 0 && i === 0 ? 255 : Math.round(224 + rnd() * 31);
      stone(x, r * cell, cell, cell, v);
      if (x + cell > S) stone(x - S, r * cell, cell, cell, v); // wrap the half stone
    }
  }
  // speckle, kept off the middle of stone 0 so flat patches stay clean
  for (let k = 0; k < 2600; k++) {
    const x = rnd() * S, y = rnd() * S;
    if (x > 16 && x < cell - 16 && y > 16 && y < cell - 16) continue;
    g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';
    g.fillRect(x, y, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  _tileTex = new THREE.CanvasTexture(c);
  _tileTex.colorSpace = THREE.SRGBColorSpace;
  _tileTex.wrapS = _tileTex.wrapT = THREE.RepeatWrapping;
  _tileTex.anisotropy = 8;
  return _tileTex;
}

// A thin colored floor patch (plazas, paths) laid just above the ground.
// tiles: meters per texture repeat (4 = 1 m stones), or false for a flat color.
export function patch({ size = [10, 10], color = 0xead9a8, pos = [0, 0], y = 0.06, tiles = false } = {}) {
  // Ground decals don't write depth (and are nudged toward the camera) so that
  // overlapping coplanar patches — paths merging into the plaza, plaza edges,
  // district pads sitting on grass — never z-fight. The stable opaque paint order
  // (creation order) layers them instead of the depth buffer.
  const mesh = box({
    size: [size[0], 0.2, size[1]], color, pos: [pos[0], y, pos[1]], roughness: 1, bevel: false,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  // Own geometry (not the shared box cache): its UVs are in world space, so stones
  // line up across every overlapping patch.
  const geo = new THREE.BoxGeometry(size[0], 0.2, size[1]);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    if (tiles) uv.setXY(i, (p.getX(i) + pos[0]) / tiles, -(p.getZ(i) + pos[1]) / tiles);
    else uv.setXY(i, FLAT_UV[0], FLAT_UV[1]);
  }
  mesh.geometry = geo;
  mesh.material.map = tileTexture();
  mesh.castShadow = false;
  return mesh;
}

// Trees register here so the atmosphere layer can sway them on the wind. It's a
// live shared array: trees pushed later (e.g. the async Projects district) are
// picked up automatically by whoever iterates it each frame.
export const swayables = [];

// A fluffy tree: tapered trunk plus a leaf-card canopy (world/foliage.js). Built at
// LOCAL origin with the group planted at [pos], so rotating the group leans the
// whole tree from its base (used for wind sway).
const _trunkGeo = new Map();
export function tree({ pos = [0, 0], h = 4.5, trunk = 0x8a5a2b, leaf = CANOPY_COLORS.green } = {}) {
  const key = h.toFixed(2);
  if (!_trunkGeo.has(key)) _trunkGeo.set(key, new THREE.CylinderGeometry(0.22, 0.38, h + 1, 6).translate(0, (h + 1) / 2, 0));
  const stem = new THREE.Mesh(_trunkGeo.get(key), material(trunk));
  stem.castShadow = true; stem.receiveShadow = true;
  const seed = Math.round(pos[0] * 73 + pos[1] * 151) >>> 0;
  const leaves = canopy({
    color: leaf, seed,
    clusters: [
      { center: [0, h + 0.8, 0], radius: 2.2, cards: 520 },
      { center: [0.95, h - 0.1, 0.3], radius: 1.4, cards: 230 },
      { center: [-0.85, h + 0.1, -0.45], radius: 1.4, cards: 230 },
    ],
  });
  const g = group([stem, leaves]);
  g.position.set(pos[0], 0, pos[1]);
  g.userData.sway = true;
  swayables.push(g);
  addCircle(pos[0], pos[1], 0.95, { top: h + 3, leap: false }); // solid trunk/canopy
  return g;
}
