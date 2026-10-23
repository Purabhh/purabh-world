// Grass field: one InstancedMesh of thin blades, drawn in a single call.
//
// The blades live in a square patch centered where the camera looks. Each blade's spot
// repeats every 2R meters, so as the camera moves a blade that falls off one
// edge reappears on the far edge, and each blade stays put in the world. That
// gives dense grass where you look without covering the whole island in blades.
//
// The shader does all the work: a root-to-tip color gradient, wind, blades
// bending away from the player, fading out toward the patch edge, and a mask
// texture (from groundMask.isGround) that keeps grass off paths, plazas and sand.
import * as THREE from 'three';
import { isGround } from './groundMask.js';

const GRASS_HIGH = 80000, GRASS_LOW = 25000;
const R_HIGH = 46, R_LOW = 34;   // half-size of the patch around the camera
const MASK_RES = 256;

function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One blade: 5 vertices, 3 triangles, tapering to a point. aT is 0 at the root, 1 at the tip.
function bladeGeometry() {
  const w = 0.2;
  const pos = [-w / 2, 0, 0, w / 2, 0, 0, -w * 0.32, 0.5, 0, w * 0.32, 0.5, 0, 0, 1, 0];
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute([0, 0, 0.5, 0.5, 1], 1));
  g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  return g;
}

function maskTexture(size) {
  const data = new Uint8Array(MASK_RES * MASK_RES * 4);
  for (let j = 0; j < MASK_RES; j++) {
    for (let i = 0; i < MASK_RES; i++) {
      const x = ((i + 0.5) / MASK_RES - 0.5) * size;
      const z = ((j + 0.5) / MASK_RES - 0.5) * size;
      const k = (j * MASK_RES + i) * 4;
      data[k] = isGround(x, z) ? 255 : 0;
      data[k + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, MASK_RES, MASK_RES);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

const vertexShader = /* glsl */`
  attribute float aT;
  attribute vec2 aOffset;
  attribute vec3 aBlade;          // yaw, height, random 0..1
  uniform float uTime, uR, uWorld;
  uniform vec2 uCenter;
  uniform vec3 uPlayer;
  uniform sampler2D uMask;
  varying float vT, vRand, vLight, vPatch;
  #include <fog_pars_vertex>
  void main() {
    // Wrap the blade into the patch around uCenter (stable in world space).
    vec2 base = uCenter + mod(aOffset - uCenter + uR, 2.0 * uR) - uR;
    float mask = texture2D(uMask, base / uWorld + 0.5).r;
    float edge = 1.0 - smoothstep(uR * 0.6, uR, length(base - uCenter));
    float h = aBlade.y * smoothstep(0.35, 0.75, mask) * edge;

    float c = cos(aBlade.x), s = sin(aBlade.x);
    vec3 p = vec3(position.x * c, position.y * h, position.x * s);
    vec3 wp = vec3(base.x, 0.0, base.y) + p;

    // Wind: two waves rolling across the field, plus a steady lean.
    float wind = sin(uTime * 1.7 + wp.x * 0.35 + wp.z * 0.22) * 0.22
               + sin(uTime * 0.63 + wp.x * 0.11 - wp.z * 0.17) * 0.18 + 0.12;
    float bend = aT * aT;
    wp.xz += vec2(0.8, 0.45) * wind * bend * h;

    // Bend away from the player's feet.
    vec2 d = wp.xz - uPlayer.xz;
    float dl = length(d);
    float push = (1.0 - smoothstep(0.0, 1.6, dl)) * step(uPlayer.y, 1.5);
    wp.xz += d / max(dl, 0.001) * push * 0.7 * bend;
    wp.y -= push * 0.35 * bend * h;

    vT = aT; vRand = aBlade.z;
    // Light: blades side-on to the camera catch a bit more, like the reference's sheen.
    vLight = 0.8 + 0.2 * abs(dot(vec2(c, s), normalize(cameraPosition.xz - wp.xz + 0.001)));
    // Big soft color patches across the field.
    vPatch = 0.5 + 0.5 * sin(wp.x * 0.07 + sin(wp.z * 0.05) * 2.0) * sin(wp.z * 0.06 + 1.3);

    vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const fragmentShader = /* glsl */`
  uniform vec3 uRoot, uTip, uTip2;
  varying float vT, vRand, vLight, vPatch;
  #include <fog_pars_fragment>
  void main() {
    vec3 tip = mix(uTip, uTip2, vPatch);
    vec3 col = mix(uRoot, tip, smoothstep(0.0, 1.0, vT));
    col *= vLight * (0.92 + vRand * 0.16);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;

export function buildGrass(ctx, player, engine) {
  const { scene, layout, palette, onUpdate } = ctx;
  const low = engine.lowQuality || new URLSearchParams(location.search).get('quality') === 'low';
  const count = low ? GRASS_LOW : GRASS_HIGH;
  const R = low ? R_LOW : R_HIGH;

  const geo = bladeGeometry();
  const rng = makeRng(0x6a55);
  const offs = new Float32Array(count * 2), blade = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    offs[i * 2] = (rng() * 2 - 1) * R;
    offs[i * 2 + 1] = (rng() * 2 - 1) * R;
    blade[i * 3] = rng() * Math.PI * 2;
    blade[i * 3 + 1] = 0.45 + rng() * 0.6;
    blade[i * 3 + 2] = rng();
  }
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offs, 2));
  geo.setAttribute('aBlade', new THREE.InstancedBufferAttribute(blade, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, fog: true, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 }, uR: { value: R }, uWorld: { value: layout.groundSize },
      uPlayer: { value: new THREE.Vector3(0, 99, 0) },
      uCenter: { value: new THREE.Vector2() },
      uMask: { value: null },
      uRoot: { value: new THREE.Color(palette.grassRoot) },
      uTip: { value: new THREE.Color(palette.grassTip) },
      uTip2: { value: new THREE.Color(palette.grassLight) },
    }]),
  });
  material.uniforms.uMask.value = maskTexture(layout.groundSize);

  // InstancedMesh so the static bake skips it; the blades place themselves in the shader.
  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.frustumCulled = false;
  mesh.castShadow = false; mesh.receiveShadow = false;
  mesh.name = 'grass';
  scene.add(mesh);

  // Patch center: where the view ray meets the ground, pulled toward the camera so
  // the near grass is never cut off.
  const fwd = new THREE.Vector3();
  onUpdate((dt, t) => {
    const cam = ctx.camera;
    cam.getWorldDirection(fwd);
    const hit = fwd.y < -0.05 ? cam.position.y / -fwd.y : R;
    const reach = Math.min(hit * Math.hypot(fwd.x, fwd.z), R * 0.55);
    const f = Math.hypot(fwd.x, fwd.z) || 1;
    material.uniforms.uCenter.value.set(cam.position.x + fwd.x / f * reach, cam.position.z + fwd.z / f * reach);
    material.uniforms.uTime.value = t;
    if (player) material.uniforms.uPlayer.value.copy(player.position);
    // Adaptive quality can drop to low after boot; draw fewer blades from then on.
    if (engine.lowQuality && mesh.count > GRASS_LOW) mesh.count = GRASS_LOW;
  });
  console.info('[grass]', count);
  return { mesh, count };
}
