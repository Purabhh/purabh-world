// Painted ground for the island slab. Replaces the flat olive box material with:
//   - an island-wide turf map (1 texel ~ 0.94 m), painted once at load (~50 ms):
//       soft warm/cool color patches, worn soil where the turf meets paths and
//       plazas, and dark soil under every tree;
//   - a tiled stroke texture that makes turf read as short grass up close;
//   - the sandy beach band, worked out in the shader from the distance to the
//     rim: a ragged inner edge, shore-parallel ripples, a wet darker outer edge
//     (it used to be 4 flat sand strips);
//   - layered cliff sides on the slab's edges: a grass lip, soil, then stone blocks.
// One mesh, one material, so it costs no extra draw calls.
import * as THREE from 'three';
import { isGround, BEACH_INSET, BEACH_W } from './groundMask.js';

const RES = 256;           // island map resolution (fine detail comes from the shader)
const DETAIL_M = 2.5;      // meters per repeat of the stroke texture

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, z) => noise(x, z) * 0.6 + noise(x * 2.1, z * 2.1) * 0.28 + noise(x * 4.3, z * 4.3) * 0.12;
const rgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// How close each 1 m cell is to paving (0 = far, 1 = touching), so turf can wear
// into soil right along path and plaza edges.
function pavedProximity(size, grassLimit) {
  const n = Math.round(size), half = size / 2;
  let a = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = i + 0.5 - half, z = j + 0.5 - half;
    a[j * n + i] = Math.max(Math.abs(x), Math.abs(z)) < grassLimit && !isGround(x, z) ? 1 : 0;
  }
  for (let pass = 0; pass < 3; pass++) {           // box blur, radius 1, both axes
    const b = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      let s = 0, c = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= n || jj >= n) continue;
        s += a[jj * n + ii]; c++;
      }
      b[j * n + i] = Math.max(a[j * n + i], s / c);
    }
    a = b;
  }
  return (x, z) => {
    const fx = Math.min(n - 1.001, Math.max(0, x + half - 0.5)), fz = Math.min(n - 1.001, Math.max(0, z + half - 0.5));
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const p = (ii, jj) => a[jj * n + ii];
    return lerp(lerp(p(i, j), p(i + 1, j), u), lerp(p(i, j + 1), p(i + 1, j + 1), u), v);
  };
}

function islandMap({ size, palette, trees }) {
  const half = size / 2;
  const grassLimit = half - BEACH_INSET - BEACH_W - 0.5;
  const near = pavedProximity(size, grassLimit);
  const grass = rgb(palette.grass), soil = rgb(0x7d6044), soilDark = rgb(0x5e4834);
  const warm = [grass[0] * 1.1, grass[1] * 1.04, grass[2] * 0.82], cool = [grass[0] * 0.84, grass[1] * 0.97, grass[2] * 1.0];
  const px = size / RES;
  const col = new Float32Array(RES * RES * 3);
  for (let j = 0; j < RES; j++) {
    const z = (j + 0.5) * px - half;
    for (let i = 0; i < RES; i++) {
      const x = (i + 0.5) * px - half, k = (j * RES + i) * 3;
      // turf: big soft patches, warm <-> cool, plus a little small-scale mottling
      const m = smooth(0.35, 0.65, fbm(x / 26, z / 26));
      const b = 0.94 + 0.12 * noise(x / 5 + 40, z / 5 + 40);
      // worn soil along paving, ragged with noise
      const wear = smooth(0.15, 0.75, near(x, z) * (0.7 + 0.6 * noise(x * 0.8, z * 0.8))) * 0.75;
      for (let c = 0; c < 3; c++) col[k + c] = lerp(lerp(cool[c], warm[c], m) * b, soil[c], wear);
    }
  }
  // dark soil under the trees: stamp only the texels around each trunk
  for (const t of trees) {
    const tx = t.position.x, tz = t.position.z;
    const i0 = Math.max(0, Math.floor((tx - 3.5 + half) / px)), i1 = Math.min(RES - 1, Math.ceil((tx + 3.5 + half) / px));
    const j0 = Math.max(0, Math.floor((tz - 3.5 + half) / px)), j1 = Math.min(RES - 1, Math.ceil((tz + 3.5 + half) / px));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * px - half, z = (j + 0.5) * px - half, k = (j * RES + i) * 3;
      const a = (1 - smooth(1.0, 2.8 + noise(x * 1.3, z * 1.3) * 0.6, Math.hypot(x - tx, z - tz))) * 0.8;
      for (let c = 0; c < 3; c++) col[k + c] = lerp(col[k + c], soilDark[c], a);
    }
  }
  const data = new Uint8Array(RES * RES * 4);
  for (let n = 0; n < RES * RES; n++) {
    data[n * 4] = Math.min(255, col[n * 3]); data[n * 4 + 1] = Math.min(255, col[n * 3 + 1]);
    data[n * 4 + 2] = Math.min(255, col[n * 3 + 2]); data[n * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, RES, RES);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

// Short top-down grass strokes, gray around 0.5 (shader turns it into +-brightness).
function strokeTexture() {
  const S = 256, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 4200; k++) {
    const x = rnd() * S, y = rnd() * S, len = 5 + rnd() * 9, ang = -1.2 + rnd() * 0.5;
    g.strokeStyle = rnd() < 0.5 ? `rgba(255,255,255,${0.25 + rnd() * 0.3})` : `rgba(0,0,0,${0.22 + rnd() * 0.25})`;
    g.lineWidth = 1.5 + rnd() * 1.5;
    for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) {   // wrap so it tiles
      g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(ang) * len, y + oy + Math.sin(ang) * len); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// Call after trees are planted (so they get soil) and before the static bake.
export function paintGround(slab, { size, palette, trees }) {
  const t0 = performance.now();
  const uniforms = {
    uIsland: { value: islandMap({ size, palette, trees }) },
    uDetail: { value: strokeTexture() },
    uSize: { value: size },
    uSoil: { value: new THREE.Color(0x6e5038) },
    uSand: { value: new THREE.Color(palette.sand) },
    uBeach: { value: new THREE.Vector2(size / 2 - BEACH_INSET - BEACH_W, size / 2 - BEACH_INSET) }, // inner, outer
    uStone: { value: new THREE.Color(0x857a8c) },
  };
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, flatShading: true });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGroundPos;\nvarying float vGroundUp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvGroundUp = normal.y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uIsland, uDetail;
        uniform float uSize;
        uniform vec3 uSoil, uStone, uSand;
        uniform vec2 uBeach;
        varying vec3 vGroundPos;
        varying float vGroundUp;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 gp = vGroundPos.xz;
        vec4 isl = texture2D(uIsland, gp / uSize + 0.5);
        float det = texture2D(uDetail, gp / ${DETAIL_M.toFixed(1)}).r;
        // strokes up close, plus the same texture 4x larger so far turf isn't flat either
        float det2 = texture2D(uDetail, gp / ${(DETAIL_M * 4).toFixed(1)} + 0.37).r;
        vec3 ground = isl.rgb * (0.72 + 0.56 * det) * (0.88 + 0.24 * det2);
        // beach: distance to the rim, with a ragged inner edge and a wet outer band
        float r = max(abs(gp.x), abs(gp.y));
        float edgeN = (sin(gp.x * 0.37 + sin(gp.y * 0.21) * 2.0) + sin(gp.y * 0.43 + 1.3 + sin(gp.x * 0.17) * 2.0)) * 0.45;
        float sandAmt = smoothstep(uBeach.x - 0.4, uBeach.x + 0.4, r + edgeN) * (1.0 - smoothstep(uBeach.y - 0.3, uBeach.y + 0.3, r - edgeN * 0.4));
        float ripple = sin(r * 5.0 + sin(gp.x * 0.4 + gp.y * 0.3) * 1.2);
        float wet = smoothstep(uBeach.y - 3.0, uBeach.y - 0.2, r);
        vec3 sand = uSand * (0.97 + ripple * 0.035 + (det - 0.5) * 0.06) * (1.0 - 0.18 * wet);
        ground = mix(ground, sand, sandAmt);
        if (vGroundUp < 0.5) {
          // cliff sides: grass lip, soil, then stone blocks with mortar lines
          float y = vGroundPos.y, along = gp.x + gp.y;
          vec3 soil = uSoil * (0.85 + 0.3 * texture2D(uDetail, vec2(along, y) / 1.5).r);
          vec2 bc = vec2(along * 0.8 + floor(y * 1.4) * 0.5, y * 1.4);
          float mortar = max(step(0.92, fract(bc.x)), step(0.86, fract(bc.y)));
          float shade = 0.88 + 0.2 * fract(sin(dot(floor(bc), vec2(12.9898, 78.233))) * 43758.5453);
          vec3 stone = uStone * shade * (1.0 - 0.3 * mortar);
          ground = y > -0.22 ? ground : (y > -0.95 ? soil : stone);
        }
        diffuseColor.rgb = ground;`);
  };
  slab.material = m;
  slab.receiveShadow = true;
  console.info('[ground] painted in', Math.round(performance.now() - t0), 'ms');
  return slab;
}
