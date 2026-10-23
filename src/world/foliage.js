// Fluffy tree canopies made of leaf cards: hundreds of small alpha-tested quads
// scattered through a few spheres, all merged into ONE mesh per tree.
//
// The trick that makes it read as a soft ball instead of confetti: every card's
// normal points out from its sphere's center, not along the card. Lighting then
// shades the whole canopy like one round shape, while the cut-out leaves break up
// the silhouette. Cards also get a vertex color: darker underneath, lighter on top.
import * as THREE from 'three';

export const CANOPY_COLORS = { green: 0x9cc84a, yellow: 0xe8c840, pink: 0xf08fb4, red: 0xe8683e };

function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A few white leaves on transparency; the material color tints them.
let _leafTex = null;
export function leafTexture() {
  if (_leafTex) return _leafTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  const leaf = (x, y, rot, s) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.beginPath(); g.moveTo(0, -14); g.quadraticCurveTo(10, 0, 0, 14); g.quadraticCurveTo(-10, 0, 0, -14); g.fill();
    g.restore();
  };
  leaf(32, 30, 0.3, 1.5); leaf(18, 42, -0.9, 1.0); leaf(46, 44, 1.1, 1.0); leaf(22, 18, -0.4, 0.9); leaf(45, 18, 0.8, 0.9);
  _leafTex = new THREE.CanvasTexture(c);
  _leafTex.colorSpace = THREE.SRGBColorSpace;
  return _leafTex;
}

const _mats = new Map();
function leafMaterial(color) {
  if (!_mats.has(color)) {
    _mats.set(color, new THREE.MeshLambertMaterial({
      map: leafTexture(), color, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide,
      // a little self-light so the inside of the canopy stays colored, not black
      emissive: new THREE.Color(color).multiplyScalar(0.18),
    }));
  }
  return _mats.get(color);
}

const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _n = new THREE.Vector3();
const CORNERS = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];

// clusters: [{ center: [x, y, z], radius, cards }] in the tree's local space.
export function canopy({ clusters, color, seed = 1 }) {
  const rng = makeRng(seed);
  const total = clusters.reduce((s, c) => s + c.cards, 0);
  const pos = new Float32Array(total * 12), nor = new Float32Array(total * 12);
  const uv = new Float32Array(total * 8), col = new Float32Array(total * 12);
  const idx = new Uint32Array(total * 6);
  let k = 0;
  for (const { center, radius, cards } of clusters) {
    for (let i = 0; i < cards; i++, k++) {
      // random point in the sphere, biased toward the surface
      _v.set(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1);
      if (_v.lengthSq() < 1e-4) _v.set(0, 1, 0);
      _v.normalize().multiplyScalar(radius * (0.55 + 0.45 * Math.sqrt(rng())));
      _n.copy(_v).normalize();
      const size = 0.38 + rng() * 0.26;
      _q.setFromEuler(_e.set(rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2));
      // darker underneath, lighter on top
      const shade = 0.84 + 0.16 * (_n.y * 0.5 + 0.5) + (rng() - 0.5) * 0.08;
      for (let j = 0; j < 4; j++) {
        const p = new THREE.Vector3(CORNERS[j][0] * size, CORNERS[j][1] * size, 0).applyQuaternion(_q).add(_v);
        const o = (k * 4 + j) * 3;
        pos[o] = p.x + center[0]; pos[o + 1] = p.y + center[1]; pos[o + 2] = p.z + center[2];
        nor[o] = _n.x; nor[o + 1] = _n.y; nor[o + 2] = _n.z;
        col[o] = col[o + 1] = col[o + 2] = shade;
        uv[(k * 4 + j) * 2] = CORNERS[j][0] + 0.5; uv[(k * 4 + j) * 2 + 1] = CORNERS[j][1] + 0.5;
      }
      const b = k * 4;
      idx.set([b, b + 1, b + 2, b, b + 2, b + 3], k * 6);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const mesh = new THREE.Mesh(geo, leafMaterial(color));
  mesh.castShadow = true; mesh.receiveShadow = false;
  mesh.userData.canopy = true;
  return mesh;
}

// Leaves drifting down from the canopies: one Points cloud. Each leaf falls,
// sways on the same breeze as the grass, and respawns under a random tree's
// canopy (read live from swayables, so the Projects district trees count too).
export function buildFallingLeaves(ctx, trees, low) {
  const { scene, onUpdate } = ctx;
  const N = low ? 150 : 400;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const speed = new Float32Array(N), phase = new Float32Array(N);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const _c = new THREE.Color(), _s = new THREE.Sphere();

  function respawn(i, anywhere) {
    const tr = trees[(Math.random() * trees.length) | 0];
    const leaves = tr && tr.children.find((c) => c.userData.canopy);
    if (!leaves) { pos[i * 3 + 1] = -10; return; }
    if (!leaves.geometry.boundingSphere) leaves.geometry.computeBoundingSphere();
    _s.copy(leaves.geometry.boundingSphere).applyMatrix4(leaves.matrixWorld);
    const a = Math.random() * Math.PI * 2, r = Math.random() * _s.radius * 0.8;
    pos[i * 3] = _s.center.x + Math.cos(a) * r;
    pos[i * 3 + 2] = _s.center.z + Math.sin(a) * r;
    pos[i * 3 + 1] = anywhere ? Math.random() * _s.center.y : _s.center.y - Math.random() * 1.2;
    _c.copy(leaves.material.color).multiplyScalar(0.9 + Math.random() * 0.2);
    col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
    geo.attributes.color.needsUpdate = true;
    speed[i] = 0.4 + Math.random() * 0.4;
    phase[i] = Math.random() * 10;
  }

  const points = new THREE.Points(geo, new THREE.PointsMaterial({
    map: leafTexture(), size: 0.35, sizeAttenuation: true, vertexColors: true,
    alphaTest: 0.5, depthWrite: true,
  }));
  points.frustumCulled = false;
  points.name = 'falling-leaves';
  scene.add(points);

  let started = false;
  onUpdate((dt, t) => {
    if (!trees.length) return;
    if (!started) { for (let i = 0; i < N; i++) respawn(i, true); started = true; }
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      pos[k + 1] -= speed[i] * dt;
      // the same gentle breeze as the tree sway, plus a little flutter
      const wind = Math.sin(t * 1.7 + pos[k] * 0.35 + pos[k + 2] * 0.22) * 0.22 + 0.3;
      pos[k] += (0.8 * wind + Math.sin(t * 3 + phase[i]) * 0.4) * dt;
      pos[k + 2] += (0.45 * wind + Math.cos(t * 2.3 + phase[i]) * 0.3) * dt;
      if (pos[k + 1] < 0.05) respawn(i, false);
    }
    geo.attributes.position.needsUpdate = true;
  });
  return points;
}
