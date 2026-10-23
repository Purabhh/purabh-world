// Atmosphere pack — the "alive air" layer that sits on top of the static world.
// Everything here is motion + light, nothing structural:
//   1) drifting clouds      — slow lateral drift with wrap-around
//   2) sun-ray dust motes    — one cheap Points field lazily floating up the light
//   3) tree sway             — a shared, gentle wind on every tree
//   4) footstep / land puffs — a pooled dust system, exposed as ctx.spawnDust(...)
//   5) day <-> golden hour    — a smooth toggle (button + "N" key) over sky/fog/lights
//
// It reads `swayables` (tree groups, tagged in voxel.tree) so trees added later by
// the async Projects district still catch the wind. Built BEFORE the player so
// ctx.spawnDust exists when the player starts kicking up dust.
import * as THREE from 'three';
import { swayables } from '../voxel/voxel.js';

// A soft round sprite used by both the motes and the dust puffs.
function makeSoftDot() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0.0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  grd.addColorStop(1.0, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// White butterfly silhouette (tinted per-instance via material.color). Four wing
// blobs + a dark body.
function makeButterfly() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  const wing = (x, y, rx, ry, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.fill(); g.restore(); };
  wing(22, 24, 12, 15, -0.35); wing(24, 43, 9, 10, 0.3);   // left wings
  wing(42, 24, 12, 15, 0.35); wing(40, 43, 9, 10, -0.3);   // right wings
  g.fillStyle = '#33312b'; g.fillRect(31, 20, 2.5, 26);    // body
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Simple dark seagull "M" silhouette for distant birds.
function makeBird() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const g = c.getContext('2d');
  g.strokeStyle = '#2c2c36'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(6, 20); g.quadraticCurveTo(20, 5, 32, 15); g.quadraticCurveTo(44, 5, 58, 20); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A glowing sun disc: a bright white-gold core with a soft warm halo. Drawn bright
// so the bloom pass gives it a real sunny glow at dusk.
function makeSunDisc() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0.00, 'rgba(255,255,255,1)');
  grd.addColorStop(0.16, 'rgba(255,251,229,1)');
  grd.addColorStop(0.32, 'rgba(255,238,188,0.95)');
  grd.addColorStop(0.55, 'rgba(255,206,132,0.34)');
  grd.addColorStop(1.00, 'rgba(255,188,116,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A pale moon: a soft cool-white disc with a faint halo and a few subtle craters
// (clipped to the disc with 'source-atop' so nothing leaks into the halo).
function makeMoonDisc() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0.00, 'rgba(249,251,255,1)');
  grd.addColorStop(0.42, 'rgba(231,238,255,1)');
  grd.addColorStop(0.50, 'rgba(223,231,252,0.55)');
  grd.addColorStop(0.74, 'rgba(208,219,250,0.16)');
  grd.addColorStop(1.00, 'rgba(198,210,245,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(201,212,238,0.55)';
  for (const [mx, my, r] of [[54, 50, 7], [80, 60, 5], [62, 82, 6], [47, 70, 4], [82, 45, 3]]) {
    g.beginPath(); g.arc(mx, my, r, 0, Math.PI * 2); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildAtmosphere(ctx) {
  const { scene, camera, voxel, palette, layout, onUpdate, sun, hemi } = ctx;
  const { box, group } = voxel;
  const half = layout.groundSize / 2;
  const add = (m) => { if (m) scene.add(m); };
  const dot = makeSoftDot();

  // small deterministic rng so clouds / motes / tufts look the same each load
  let seed = 0x9e3779b9;
  const rng = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // ===========================================================================
  // 1) DRIFTING CLOUDS — flat white puffs, very slow lateral drift, wrap-around.
  // ===========================================================================
  const cloudSpan = half + 46;
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const g = group([
      box({ size: [10 + rng() * 6, 2.4, 6 + rng() * 4], color: palette.cloud, pos: [0, 0, 0], shadow: false, roughness: 1 }),
      box({ size: [6 + rng() * 4, 2.2, 4 + rng() * 3], color: palette.cloud, pos: [-3 - rng() * 2, 0.6, 1], shadow: false, roughness: 1 }),
      box({ size: [5 + rng() * 3, 2.0, 4 + rng() * 2], color: palette.cloud, pos: [3 + rng() * 2, 0.4, -1], shadow: false, roughness: 1 }),
    ]);
    g.position.set((rng() * 2 - 1) * cloudSpan, 40 + rng() * 22, (rng() * 2 - 1) * cloudSpan);
    g.userData.dynamic = true; // drifts; keep it out of the static bake
    add(g);
    clouds.push({ g, speed: 0.25 + rng() * 0.55 }); // units / sec, gentle parallax
  }
  onUpdate((dt) => {
    for (const c of clouds) {
      c.g.position.x += c.speed * dt;
      if (c.g.position.x > cloudSpan) c.g.position.x = -cloudSpan; // wrap
    }
  });

  // ===========================================================================
  // 2) DUST MOTES — a single Points field of warm specks drifting up through the
  //    light. One draw call; specks rise, sway, and wrap back down at the top.
  // ===========================================================================
  const MOTES = 620;
  const MOTE_AREA = half - 6;
  const MOTE_TOP = 30;
  const mpos = new Float32Array(MOTES * 3);
  const mrise = new Float32Array(MOTES);
  const mphase = new Float32Array(MOTES);
  for (let i = 0; i < MOTES; i++) {
    mpos[i * 3] = (rng() * 2 - 1) * MOTE_AREA;
    mpos[i * 3 + 1] = rng() * MOTE_TOP;
    mpos[i * 3 + 2] = (rng() * 2 - 1) * MOTE_AREA;
    mrise[i] = 0.25 + rng() * 0.55;
    mphase[i] = rng() * 6.28;
  }
  const mgeo = new THREE.BufferGeometry();
  mgeo.setAttribute('position', new THREE.BufferAttribute(mpos, 3));
  const motes = new THREE.Points(mgeo, new THREE.PointsMaterial({
    size: 0.5, map: dot, color: 0xfff3da, transparent: true, opacity: 0.5,
    depthWrite: false, sizeAttenuation: true,
  }));
  motes.frustumCulled = false;
  add(motes);
  onUpdate((dt, t) => {
    const a = mgeo.attributes.position.array;
    for (let i = 0; i < MOTES; i++) {
      a[i * 3 + 1] += mrise[i] * dt;                              // rise
      a[i * 3] += Math.sin(t * 0.4 + mphase[i]) * 0.012;          // sway
      if (a[i * 3 + 1] > MOTE_TOP) {                              // wrap to the floor
        a[i * 3 + 1] = 0;
        a[i * 3] = (rng() * 2 - 1) * MOTE_AREA;
        a[i * 3 + 2] = (rng() * 2 - 1) * MOTE_AREA;
      }
    }
    mgeo.attributes.position.needsUpdate = true;
  });

  // ===========================================================================
  // 3) TREE SWAY — every tree (tagged via swayables) leans on one gentle breeze.
  // ===========================================================================
  onUpdate((dt, t) => {
    // a slow, small lean (trees pivot at their base).
    for (const tr of swayables) {
      const ph = tr.position.x * 0.5 + tr.position.z * 0.5;
      tr.rotation.z = Math.sin(t * 1.05 + ph) * 0.05;
      tr.rotation.x = Math.cos(t * 0.9 + ph) * 0.03;
    }
  });

  // ===========================================================================
  // 4) DUST PUFFS — a small pool of billboarded soft sprites. ctx.spawnDust()
  //    kicks a few up at the player's feet (footsteps) or in a burst (landings).
  // ===========================================================================
  const POOL = 30;
  const puffGeo = new THREE.PlaneGeometry(1, 1);
  const puffs = [];
  for (let i = 0; i < POOL; i++) {
    const m = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({
      map: dot, color: 0xe9dabf, transparent: true, opacity: 0, depthWrite: false,
    }));
    m.visible = false;
    m.userData.dynamic = true;
    scene.add(m);
    puffs.push({ m, life: 0, dur: 0.5, vx: 0, vy: 0, vz: 0, s0: 0.4, s1: 1.4 });
  }
  let cursor = 0;
  function spawnDust(x, y, z, opts = {}) {
    const { count = 2, spread = 0.6, up = 0.5, scale = 1 } = opts;
    for (let k = 0; k < count; k++) {
      const p = puffs[cursor++ % POOL];
      p.life = 1;
      p.dur = 0.42 + Math.random() * 0.18;
      p.vx = (Math.random() * 2 - 1) * spread;
      p.vz = (Math.random() * 2 - 1) * spread;
      p.vy = up * (0.5 + Math.random() * 0.7);
      p.s0 = 0.35 * scale;
      p.s1 = (1.2 + Math.random() * 0.5) * scale;
      p.m.position.set(x + p.vx * 0.1, y, z + p.vz * 0.1);
      p.m.visible = true;
    }
  }
  ctx.spawnDust = spawnDust;
  onUpdate((dt) => {
    for (const p of puffs) {
      if (p.life <= 0) continue;
      p.life -= dt / p.dur;
      if (p.life <= 0) { p.m.visible = false; continue; }
      const k = 1 - p.life;
      p.m.position.x += p.vx * dt;
      p.m.position.y += p.vy * dt;
      p.m.position.z += p.vz * dt;
      p.vy -= 0.7 * dt;                       // dust rises then settles
      const s = p.s0 + (p.s1 - p.s0) * k;
      p.m.scale.setScalar(s);
      p.m.material.opacity = p.life * 0.6;
      p.m.quaternion.copy(camera.quaternion); // billboard
    }
  });

  // ===========================================================================
  // 5) DAY <-> GOLDEN HOUR — a smooth toggle over the sky gradient, fog, and the
  //    sun + hemisphere lights. `mix` eases toward `target` (0 day, 1 dusk).
  // ===========================================================================
  const SKY = {
    // [zenith, mid, horizon] RGB. Day: a deep sky-blue overhead easing down to the
    // pale haze at the horizon (kept == fog so the far world melts into the sky).
    // Dusk: a navy zenith melting through burnt orange into a warm horizon glow.
    day: [[92, 162, 232], [165, 205, 238], [238, 245, 251]],
    dusk: [[24, 34, 74], [234, 120, 60], [252, 196, 136]],
  };
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2; skyCanvas.height = 256;
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
  function drawSky(m) {
    const g = skyCanvas.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0.0, rgb(lerp3(SKY.day[0], SKY.dusk[0], m)));
    grd.addColorStop(0.55, rgb(lerp3(SKY.day[1], SKY.dusk[1], m)));
    grd.addColorStop(1.0, rgb(lerp3(SKY.day[2], SKY.dusk[2], m)));
    g.fillStyle = grd;
    g.fillRect(0, 0, 2, 256);
    skyTex.needsUpdate = true;
  }

  const fogDay = new THREE.Color(palette.worldSkyHaze), fogDusk = new THREE.Color(0xf4b078);
  const hemiDay = new THREE.Color(palette.worldSkyLight), hemiDusk = new THREE.Color(0xffc89c);
  // Ground bounce is purple, so shadowed sides read violet instead of grey.
  const bounceDay = new THREE.Color(0x6a4a8a), bounceDusk = new THREE.Color(0x5a3a7a);
  const sunDay = new THREE.Color(0xfff4e0), sunDusk = new THREE.Color(0xffab58);
  const sunPosDay = new THREE.Vector3(70, 110, 50), sunPosDusk = new THREE.Vector3(125, 24, 40);
  function applyEnv(m) {
    if (scene.fog) scene.fog.color.copy(fogDay).lerp(fogDusk, m);
    hemi.color.copy(hemiDay).lerp(hemiDusk, m);
    hemi.groundColor.copy(bounceDay).lerp(bounceDusk, m);
    if (ctx.grade) ctx.grade.setMix(m);
    hemi.intensity = 0.95 + (0.6 - 0.95) * m;
    sun.color.copy(sunDay).lerp(sunDusk, m);
    sun.intensity = 1.15 + (0.85 - 1.15) * m;
    sun.position.copy(sunPosDay).lerp(sunPosDusk, m);
    // Bloom is gorgeous at dusk (dark sky, only the glows bloom) but washes out
    // the bright daytime sky, so fade it down toward day and up toward dusk.
    if (ctx.bloom) {
      ctx.bloom.strength = 0.85 * m;         // day 0 (no bloom, clean) -> dusk 0.85
      ctx.bloom.threshold = 1.0 - 0.4 * m;   // day 1.00 -> dusk 0.60
    }
  }
  // Boot straight into golden hour (dusk). Press "N" / the HUD chip to go to day.
  drawSky(1);
  applyEnv(1);

  let mix = 1, target = 1;
  const listeners = [];
  function toggle() { target = target ? 0 : 1; for (const f of listeners) f(target === 1); }
  ctx.dayNight = {
    toggle,
    subscribe(f) { listeners.push(f); f(target === 1); },
    get isDusk() { return target === 1; },
  };
  onUpdate((dt) => {
    if (mix === target) return;
    const step = Math.sign(target - mix) * Math.min(Math.abs(target - mix), dt * 0.7);
    mix += step;
    drawSky(mix);
    applyEnv(mix);
  });

  // "N" toggles day/dusk too (the HUD chip is wired up in main.js).
  const inField = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyN' && !inField(e.target)) toggle(); });

  // ===========================================================================
  // SUN + MOON — a glowing sun that rides along the sun-light direction (so it
  // lines up with the shadows) and a pale moon on the far side of the sky. Both
  // track the camera so they read as distant sky and ignore fog, and they cross
  // fade with the day/dusk mix: a high white-gold sun by day; a big low orange
  // sun plus a risen moon at golden hour.
  // ===========================================================================
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeSunDisc(), transparent: true, depthWrite: false, fog: false,
    blending: THREE.AdditiveBlending,
  }));
  sunSprite.frustumCulled = false;
  add(sunSprite);

  const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeMoonDisc(), transparent: true, depthWrite: false, fog: false, opacity: 0,
  }));
  moonSprite.frustumCulled = false;
  add(moonSprite);

  const sunColDay = new THREE.Color(0xfff2cf), sunColDusk = new THREE.Color(0xff7a2e);
  const moonDir = new THREE.Vector3(-0.55, 0.6, -0.55).normalize(); // high, opposite the dusk sun
  const _sunDir = new THREE.Vector3();
  const SUN_DIST = 900, MOON_DIST = 950;
  const lerp = (a, b, t) => a + (b - a) * t;
  onUpdate(() => {
    // Sun sits far out along the directional light's direction, riding the camera.
    _sunDir.copy(sun.position).normalize();
    sunSprite.position.copy(camera.position).addScaledVector(_sunDir, SUN_DIST);
    sunSprite.scale.setScalar(lerp(150, 235, mix));            // swells into a big low sun at dusk
    sunSprite.material.color.copy(sunColDay).lerp(sunColDusk, mix);
    // Moon rides high on the far side, fading in only toward dusk.
    moonSprite.position.copy(camera.position).addScaledVector(moonDir, MOON_DIST);
    moonSprite.scale.setScalar(95);
    moonSprite.material.opacity = Math.max(0, mix - 0.04);
  });

  // ===========================================================================
  // FIREFLIES — warm glowing points that wander near the ground and fade in at
  // dusk. Additive blending + the bloom pass makes them sparkle.
  // ===========================================================================
  const FF = 160;
  const ffArr = new Float32Array(FF * 3);
  const ffAnchor = [];
  const ffPh = new Float32Array(FF);
  for (let i = 0; i < FF; i++) {
    const fx = (rng() * 2 - 1) * (half - 22);
    const fz = (rng() * 2 - 1) * (half - 22);
    ffAnchor.push([fx, fz]);
    ffPh[i] = rng() * 6.28;
    ffArr[i * 3] = fx; ffArr[i * 3 + 1] = 2; ffArr[i * 3 + 2] = fz;
  }
  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffArr, 3));
  const ffMat = new THREE.PointsMaterial({
    size: 0.6, map: dot, color: 0xffdf6e, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  fireflies.frustumCulled = false;
  add(fireflies);
  onUpdate((dt, t) => {
    if (mix < 0.02) { ffMat.opacity = 0; return; } // only out at dusk
    const a = ffGeo.attributes.position.array;
    for (let i = 0; i < FF; i++) {
      const p = ffPh[i];
      a[i * 3] = ffAnchor[i][0] + Math.sin(t * 0.4 + p) * 3.2;
      a[i * 3 + 1] = 1.6 + (0.5 + 0.5 * Math.sin(t * 0.5 + p * 1.7)) * 3 + Math.sin(t * 1.3 + p) * 0.4;
      a[i * 3 + 2] = ffAnchor[i][1] + Math.cos(t * 0.33 + p * 0.8) * 3.2;
    }
    ffGeo.attributes.position.needsUpdate = true;
    ffMat.opacity = mix * (0.68 + 0.32 * Math.sin(t * 3.5)); // gentle collective shimmer
  });

  // ===========================================================================
  // BUTTERFLIES — the daytime counterpart to fireflies: pastel sprites that
  // flutter near the ground and fade OUT at dusk. The "flap" is a horizontal
  // scale wobble on the billboard.
  // ===========================================================================
  const bfTex = makeButterfly();
  const bfGeo = new THREE.PlaneGeometry(1.4, 1.4);
  const bfCols = [0xff9ecb, 0xffd36e, 0x9ed0ff, 0xb6ff9e, 0xd6a6ff, 0xff8a5c];
  const butterflies = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(bfGeo, new THREE.MeshBasicMaterial({ map: bfTex, color: bfCols[i % bfCols.length], transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    const s = 0.7 + rng() * 0.5;
    m.scale.set(s, s, s);
    m.userData.dynamic = true;
    add(m);
    butterflies.push({ m, ax: (rng() * 2 - 1) * (half - 30), az: (rng() * 2 - 1) * (half - 30), ph: rng() * 6.28, sp: 0.4 + rng() * 0.5, s });
  }
  onUpdate((dt, t) => {
    const vis = Math.max(0, 1 - mix); // daytime only
    for (const b of butterflies) {
      b.m.visible = vis > 0.02;
      if (!b.m.visible) continue;
      const p = b.ph;
      const x = b.ax + Math.sin(t * b.sp + p) * 6 + Math.sin(t * 2.1 + p) * 0.6;
      const z = b.az + Math.cos(t * b.sp * 0.8 + p) * 6;
      const y = 1.6 + Math.sin(t * 1.7 + p) * 0.8 + (0.5 + 0.5 * Math.sin(t * 0.6 + p)) * 1.6;
      b.m.position.set(x, y, z);
      b.m.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z);
      b.m.scale.x = b.s * (0.4 + 0.6 * Math.abs(Math.sin(t * 9 + p))); // wing flap
      b.m.material.opacity = vis * 0.95;
    }
  });

  // ===========================================================================
  // BIRDS — a few distant silhouettes drifting across the sky, flapping. Subtle
  // and always present (they read fine in both day and dusk).
  // ===========================================================================
  const birdTex = makeBird();
  const birdGeo = new THREE.PlaneGeometry(3.4, 1.7);
  const birdSpan = half + 40;
  const birds = [];
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(birdGeo, new THREE.MeshBasicMaterial({ map: birdTex, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set((rng() * 2 - 1) * birdSpan, 30 + rng() * 18, (rng() * 2 - 1) * birdSpan);
    add(m);
    birds.push({ m, ph: rng() * 6.28, sp: 5 + rng() * 5, dir: rng() * 6.28, y: m.position.y });
  }
  onUpdate((dt, t) => {
    for (const b of birds) {
      const p = b.m.position;
      p.x += Math.cos(b.dir) * b.sp * dt;
      p.z += Math.sin(b.dir) * b.sp * dt;
      if (p.x > birdSpan) p.x = -birdSpan; else if (p.x < -birdSpan) p.x = birdSpan;
      if (p.z > birdSpan) p.z = -birdSpan; else if (p.z < -birdSpan) p.z = birdSpan;
      p.y = b.y + Math.sin(t * 0.8 + b.ph) * 1.2;
      b.m.scale.y = 0.7 + 0.3 * Math.abs(Math.sin(t * 6 + b.ph)); // flap
      b.m.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
    }
  });
}
