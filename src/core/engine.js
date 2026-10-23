// The engine: renderer, scene, camera, lights, resize, and a frame loop with a
// simple onUpdate(fn) registry. Returns a context other modules build into.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { palette } from './constants.js';
import { createShadowCache } from './shadowCache.js';

// A clear blue-white vertical sky gradient, baked once into a canvas texture.
function makeSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0.0, '#bcdcf2');   // zenith — clear light blue
  grd.addColorStop(0.55, '#d6ebf6');  // mid sky
  grd.addColorStop(1.0, '#eef5fb');   // horizon — blueish white
  g.fillStyle = grd;
  g.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createEngine(mount) {
  // Perf budget (Sep 2026 pass, measured on an Intel Iris Xe at 1280x720):
  //   - DPR is capped at 1.5 everywhere. Retina at 2x renders ~1.8x the pixels
  //     of 1.5x for no visible gain on flat-shaded voxels.
  //   - Shadow map is 1024 with plain PCF; PCFSoft at 2048 was ~4x the shadow cost.
  //   - `?quality=low` (or a slow first few seconds) turns shadows + bloom off.
  const DPR_CAP = 1.5;
  const SHADOW = 1024;
  const params = new URLSearchParams(location.search);
  const forcedQuality = params.get('quality'); // 'low' | 'high' | null (auto)

  // powerPreference matters: without it, some browsers (Opera, Firefox, and
  // Chrome under battery saver) default a multi-GPU laptop to its weak
  // integrated chip instead of the discrete one, even on the same hardware
  // where another browser picks the fast GPU automatically. Asking explicitly
  // fixes the "runs fine in Chrome, chugs in Opera" gap.
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // cinematic highlight rolloff (applied by OutputPass)
  renderer.toneMappingExposure = 1.12;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = makeSkyTexture();
  scene.fog = new THREE.Fog(palette.worldSkyHaze, 150, 430);

  // A small PMREM env map so opted-in metallic materials (e.g. the gold LeaseLink
  // kiosk) get real reflections. We deliberately do NOT set scene.environment, so
  // only materials that set material.envMap react — the rest of the world is
  // unchanged and keeps its flat dusk look.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1400);
  camera.position.set(0, 20, 30);

  // Soft sunny lighting.
  const hemi = new THREE.HemisphereLight(palette.worldSkyLight, palette.grassDark, 0.95);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff4e0, 1.15);
  sun.position.set(70, 110, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.set(SHADOW, SHADOW);
  const s = 170;
  sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
  sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 420;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);
  // Static casters are cached; only moving ones redraw into the map each frame.
  const shadows = createShadowCache(renderer, scene, camera, sun);

  // --- post-processing: bloom so emissive things (trophy, blockchain, the Skills
  // constellation, lanterns, fireflies, gold LeaseLink) actually glow, then an
  // OutputPass that applies the ACES tone map + sRGB at the end. ---
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // strength, radius, threshold — threshold keeps the bloom on bright/emissive bits.
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.5, 0.6);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP));
  composer.setSize(window.innerWidth, window.innerHeight);

  const updates = [];
  function onUpdate(fn) { updates.push(fn); return fn; }

  // --- adaptive quality: shadows + bloom are the two big optional costs. -----
  let lowQuality = false;
  function setLowQuality() {
    if (lowQuality) return;
    lowQuality = true;
    renderer.shadowMap.enabled = false;
    bloom.enabled = false;
    // Materials compiled with shadow code need a recompile to drop it.
    scene.traverse((o) => { if (o.isMesh) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
    console.info('[PW] low-quality mode: shadows + bloom off');
  }
  // Some browser configs (locked-down corporate installs, certain sandboxed
  // or remote setups) can't reach a real GPU at all and fall back to a
  // software rasterizer (SwiftShader / llvmpipe). That's 10-50x slower than
  // any dedicated or integrated GPU, so don't make it sit through 3 seconds
  // of a slideshow before we notice — drop straight to low quality.
  let softwareRenderer = false;
  try {
    const dbg = renderer.getContext().getExtension('WEBGL_debug_renderer_info');
    const info = dbg ? renderer.getContext().getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
    softwareRenderer = /swiftshader|llvmpipe|software|microsoft basic render/i.test(info || '');
  } catch {}

  if (forcedQuality === 'low' || softwareRenderer) setLowQuality();

  // Auto mode: sample the first ~3s of real play. If the average frame is slower
  // than ~28fps, drop to low quality for the rest of the session. Hidden tabs
  // and the first (shader-compile) frames are skipped so we don't misjudge.
  const AUTO = forcedQuality !== 'high' && forcedQuality !== 'low' && !softwareRenderer;
  let sampleT = 0, sampleN = 0, warm = 0, decided = !AUTO;
  function sampleFrame(dt) {
    if (decided) return;
    if (warm < 30) { warm++; return; }           // skip shader-compile hitching
    if (dt >= 0.05) return;                        // clamped frame = tab was hidden/stalled
    sampleT += dt; sampleN++;
    if (sampleT >= 3) {
      decided = true;
      const fps = sampleN / sampleT;
      if (fps < 28) setLowQuality();
      else console.info(`[PW] auto quality: high (${fps.toFixed(0)} fps)`);
    }
  }

  const clock = new THREE.Clock();
  let running = false;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    for (const fn of updates) fn(dt, t);
    renderFrame();
    sampleFrame(rawDt);
  }
  function renderFrame() {
    shadows.update();
    if (lowQuality) renderer.render(scene, camera); else composer.render();
  }
  function start() { if (running) return; running = true; clock.start(); loop(); }
  function stop() { running = false; }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return { THREE, scene, camera, renderer, composer, bloom, onUpdate, start, stop, clock, sun, hemi, envMap, setLowQuality, renderFrame, invalidateShadows: shadows.invalidate, get lowQuality() { return lowQuality; } };
}
