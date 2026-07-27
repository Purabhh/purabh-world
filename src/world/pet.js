// Raja — a voxel tiger that prowls the world, follows you when you're near, and
// every so often pounces onto a nearby rock or low kiosk, perches a few seconds,
// then leaps back down. Pet her with E (close by) for a happy wiggle and hearts.
//
// This file is mostly rig + animation: a two-segment-legged, multi-jointed-tail
// tiger with a head that watches you, blinking amber eyes, ear twitches, a walk
// cycle with knee flex + spine roll, a crouch-and-recoil pounce, and a sit pose.
//
// buildPet(ctx, player): the player is passed in (created after the world) so
// Raja can follow you and so petting can be gated by proximity. She resolves
// against the collider registry and reads leapTargets() to choose perches.
import * as THREE from 'three';
import { resolve, leapTargets, addBox, addCircle, colliders } from '../core/colliders.js';

const T = {
  orange: 0xee8a2b, flank: 0xe07d1f, white: 0xf6ece0,
  stripe: 0x241a12, nose: 0xcf5f74, ear: 0x33251a,
  eye: 0xffb02e, paw: 0xcf7320,
};

const HOME = new THREE.Vector3(0, 0, 0);
const ROAM = 30;
const BOUND = 100;
const SPEED = 3.9;
// Riding (E to mount): a bit faster than walking, plus a big bound on Space.
const RIDE_WALK = 14, RIDE_RUN = 23, RIDE_JUMP = 13, RIDE_G = 26, SEAT_Y = 0.5;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v) => THREE.MathUtils.clamp(v, -BOUND, BOUND);
const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
}

function makeHeart() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#ff5d8f';
  g.beginPath(); g.arc(22, 24, 13, 0, 7); g.fill();
  g.beginPath(); g.arc(42, 24, 13, 0, 7); g.fill();
  g.beginPath(); g.moveTo(9, 30); g.lineTo(55, 30); g.lineTo(32, 58); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// === obstacle avoidance (steering) ==========================================
// Pure helpers over the shared collider registry so Raja can route AROUND solid
// things before she touches them, instead of bumping a wall and stalling there.

// Would a body of radius `rad` centered at (x,z) overlap any solid collider?
// Skips her own collider and anything currently off (e.g. a creature mid-leap).
function blockedAt(x, z, rad, self) {
  for (const c of colliders()) {
    if (c === self || c.off) continue;
    if (c.kind === 'box') {
      if (x > c.cx - c.hw - rad && x < c.cx + c.hw + rad && z > c.cz - c.hd - rad && z < c.cz + c.hd + rad) return true;
    } else {
      const dx = x - c.x, dz = z - c.z, rr = c.r + rad;
      if (dx * dx + dz * dz < rr * rr) return true;
    }
  }
  return false;
}

// How far the straight path from (px,pz) along (dx,dz) stays clear, capped at
// `look`. Returns `look` for a fully clear path, less if something is in the way.
function clearAhead(px, pz, dx, dz, look, rad, self) {
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const tt = (i / steps) * look;
    if (blockedAt(px + dx * tt, pz + dz * tt, rad, self)) return ((i - 1) / steps) * look;
  }
  return look;
}

// Choose the heading nearest the desired one whose look-ahead path is clearest.
// Fans probes left/right of the goal direction and scores clearance vs. how far
// it deviates, so she veers smoothly around obstacles (and can U-turn if boxed
// in). Returns an angle in atan2(x,z) space.
function steerAngle(px, pz, desx, desz, self) {
  const base = Math.atan2(desx, desz);
  const LOOK = 5.0, RAD = 1.05;
  let bestAng = base, bestScore = -Infinity;
  for (const off of [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6, 2.3, -2.3, Math.PI]) {
    const ang = base + off;
    const clear = clearAhead(px, pz, Math.sin(ang), Math.cos(ang), LOOK, RAD, self);
    const score = clear - Math.abs(off) * 1.6; // prefer clear AND close to the goal heading
    if (score > bestScore) { bestScore = score; bestAng = ang; }
  }
  return bestAng;
}

export function buildPet(ctx, player) {
  const { scene, camera, voxel, palette, registerInteractable, onUpdate } = ctx;
  const { box } = voxel;
  const A = (parent, size, color, pos, opts) => { const m = box({ size, color, pos, ...(opts || {}) }); parent.add(m); return m; };

  // === rig =================================================================
  const root = new THREE.Group();           // world transform (position + yaw)
  const torso = new THREE.Group();           // body container: bob, roll, breathe
  root.add(torso);

  // --- body masses (deep chest, bulked haunches + shoulders) ---
  A(torso, [0.96, 0.72, 1.7], T.orange, [0, 0.98, -0.15]);   // barrel
  A(torso, [1.06, 0.82, 0.78], T.orange, [0, 1.0, -0.92]);   // haunches (rear)
  A(torso, [0.98, 0.74, 0.62], T.orange, [0, 0.99, 0.66]);   // shoulders (front)
  A(torso, [0.8, 0.34, 1.86], T.white, [0, 0.63, -0.12]);    // pale belly
  A(torso, [0.74, 0.5, 0.5], T.white, [0, 0.74, 0.95]);      // brisket / chest
  A(torso, [0.62, 0.56, 0.55], T.orange, [0, 1.14, 1.1]);    // neck

  // --- flank + back + haunch stripes ---
  for (const z of [-0.7, -0.25, 0.2, 0.62]) {
    A(torso, [0.5, 0.09, 0.17], T.stripe, [0, 1.36, z], { shadow: false });        // spine
    A(torso, [0.1, 0.46, 0.18], T.stripe, [-0.5, 0.98, z], { shadow: false });     // left flank
    A(torso, [0.1, 0.46, 0.18], T.stripe, [0.5, 0.98, z], { shadow: false });      // right flank
  }
  A(torso, [0.12, 0.5, 0.2], T.stripe, [-0.55, 1.0, -0.9], { shadow: false });     // haunch L
  A(torso, [0.12, 0.5, 0.2], T.stripe, [0.55, 1.0, -0.9], { shadow: false });      // haunch R

  // === head (own pivot so it can bob + watch you) ==========================
  const head = new THREE.Group();
  head.position.set(0, 1.34, 1.32);
  torso.add(head);
  A(head, [0.8, 0.72, 0.66], T.orange, [0, 0.04, 0.2]);     // skull
  A(head, [0.84, 0.2, 0.6], T.orange, [0, 0.34, 0.16]);     // brow
  A(head, [0.52, 0.4, 0.36], T.white, [0, -0.1, 0.58]);     // muzzle
  A(head, [0.22, 0.15, 0.14], T.nose, [0, 0.0, 0.78]);      // nose
  A(head, [0.26, 0.36, 0.24], T.white, [-0.36, -0.06, 0.4]);// cheek ruff L
  A(head, [0.26, 0.36, 0.24], T.white, [0.36, -0.06, 0.4]); // cheek ruff R
  // face stripes
  A(head, [0.08, 0.26, 0.1], T.stripe, [-0.16, 0.3, 0.46], { shadow: false });
  A(head, [0.08, 0.26, 0.1], T.stripe, [0.16, 0.3, 0.46], { shadow: false });
  A(head, [0.08, 0.18, 0.1], T.stripe, [-0.34, 0.12, 0.34], { shadow: false });
  A(head, [0.08, 0.18, 0.1], T.stripe, [0.34, 0.12, 0.34], { shadow: false });
  // amber eyes (faint glow → eyeshine at dusk) with dark pupils
  const eyeL = A(head, [0.15, 0.17, 0.08], T.eye, [-0.21, 0.14, 0.5], { emissive: T.eye, emissiveIntensity: 0.5, shadow: false });
  const eyeR = A(head, [0.15, 0.17, 0.08], T.eye, [0.21, 0.14, 0.5], { emissive: T.eye, emissiveIntensity: 0.5, shadow: false });
  A(head, [0.07, 0.1, 0.05], T.stripe, [-0.21, 0.13, 0.55], { shadow: false });
  A(head, [0.07, 0.1, 0.05], T.stripe, [0.21, 0.13, 0.55], { shadow: false });
  // whiskers
  for (const sx of [-1, 1]) {
    for (const wy of [-0.04, 0.06]) {
      const w = A(head, [0.5, 0.018, 0.018], T.white, [sx * 0.5, wy - 0.06, 0.55], { shadow: false });
      w.rotation.y = sx * 0.35;
    }
  }
  // ears on pivots (dark back + cream spot + pink inner)
  function ear(sx) {
    const piv = new THREE.Group();
    piv.position.set(sx * 0.27, 0.42, 0.06);
    A(piv, [0.28, 0.3, 0.14], T.ear, [0, 0.14, 0]);
    A(piv, [0.12, 0.12, 0.06], T.white, [0, 0.18, -0.06], { shadow: false }); // white spot on back
    A(piv, [0.15, 0.17, 0.06], T.nose, [0, 0.12, 0.08], { shadow: false });   // pink inner
    head.add(piv);
    return piv;
  }
  const earL = ear(-1), earR = ear(1);

  // === legs: two segments (thigh + shin + paw) so they bend ================
  function legRig(px, pz) {
    const hip = new THREE.Group();
    hip.position.set(px, 0.96, pz);
    A(hip, [0.32, 0.52, 0.36], T.orange, [0, -0.26, 0]);
    A(hip, [0.34, 0.08, 0.38], T.stripe, [0, -0.16, 0], { shadow: false }); // leg stripe
    const knee = new THREE.Group();
    knee.position.set(0, -0.52, 0);
    hip.add(knee);
    A(knee, [0.27, 0.44, 0.31], T.orange, [0, -0.22, 0]);
    A(knee, [0.33, 0.17, 0.42], T.paw, [0, -0.44, 0.05]); // paw
    root.add(hip);
    return { hip, knee };
  }
  const legFL = legRig(-0.34, 0.78), legFR = legRig(0.34, 0.78);
  const legBL = legRig(-0.4, -0.86), legBR = legRig(0.4, -0.86);
  const legs = [legFL, legFR, legBL, legBR];
  const setLeg = (l, hipX, kneeX) => { l.hip.rotation.x = hipX; l.knee.rotation.x = kneeX; };

  // === tail: a 4-joint chain that flows ====================================
  const tailBase = new THREE.Group();
  tailBase.position.set(0, 1.04, -1.28);
  torso.add(tailBase);
  const tail = [];
  let tparent = tailBase;
  for (let i = 0; i < 4; i++) {
    const j = new THREE.Group();
    j.position.set(0, 0, i === 0 ? 0 : -0.46);
    tparent.add(j);
    const col = i < 2 ? T.orange : i < 3 ? T.flank : T.stripe;
    A(j, [0.22 - i * 0.02, 0.22 - i * 0.02, 0.48], col, [0, 0, -0.24]);
    if (i < 3) A(j, [0.25 - i * 0.02, 0.25 - i * 0.02, 0.08], T.stripe, [0, 0, -0.4], { shadow: false });
    tail.push(j);
    tparent = j;
  }
  const tailWave = (amp, speed, baseX, t) => {
    for (let i = 0; i < tail.length; i++) {
      tail[i].rotation.y = Math.sin(t * speed - i * 0.7) * amp;
      tail[i].rotation.x = damp(tail[i].rotation.x, baseX, 8, 0.016);
    }
  };

  root.position.set(7, 0, 3);
  scene.add(root);

  // Raja is solid to the player: a circle collider that follows her, flagged
  // `off` while she's airborne / perched so she never blocks you from the ground.
  const myCol = addCircle(root.position.x, root.position.z, 1.0, { top: 1.6, leap: false });

  // === guaranteed pounce perches near spawn ================================
  for (const [bx, bz] of [[15, -5], [-13, 11], [19, 13]]) {
    const h = 1.6;
    scene.add(box({ size: [2.6, h, 2.4], color: palette.stone, pos: [bx, h / 2, bz] }));
    scene.add(box({ size: [2.0, 0.5, 1.8], color: palette.stoneDark, pos: [bx, h + 0.2, bz] }));
    addBox(bx, bz, 1.35, 1.25, { top: h + 0.45, leap: true });
  }

  // === hearts (petting reaction) ===========================================
  const heartTex = makeHeart();
  const heartGeo = new THREE.PlaneGeometry(0.6, 0.6);
  const hearts = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(heartGeo, new THREE.MeshBasicMaterial({ map: heartTex, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false; scene.add(m);
    hearts.push({ m, life: 0, vx: 0, vy: 0, vz: 0 });
  }
  let hc = 0;
  function spawnHearts(x, y, z, n) {
    for (let k = 0; k < n; k++) {
      const h = hearts[hc++ % hearts.length];
      h.life = 1;
      h.vx = (Math.random() - 0.5) * 0.9; h.vz = (Math.random() - 0.5) * 0.9; h.vy = 1.2 + Math.random() * 0.7;
      h.m.position.set(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6);
      h.m.visible = true;
    }
  }
  function updateHearts(dt) {
    for (const h of hearts) {
      if (h.life <= 0) continue;
      h.life -= dt / 1.1;
      if (h.life <= 0) { h.m.visible = false; continue; }
      h.m.position.x += h.vx * dt; h.m.position.y += h.vy * dt; h.m.position.z += h.vz * dt;
      h.vy -= 0.5 * dt;
      h.m.scale.setScalar(0.4 + 0.6 * (1 - h.life));
      h.m.material.opacity = Math.min(1, h.life * 1.5);
      h.m.quaternion.copy(camera.quaternion);
    }
  }

  // === behaviour ===========================================================
  const S = {
    st: 'prowl', target: null, idle: 1.0, gait: 0,
    leapCD: 5 + Math.random() * 5,
    from: new THREE.Vector3(), to: new THREE.Vector3(), lt: 0, ldur: 0.66, larc: 1.6,
    crouchT: 0, perchT: 0, perchY: 0, land: 0,
    blink: 0, blinkT: 2, earT: 3,
    stuck: 0, prev: new THREE.Vector3(),
    ridden: false, rideVY: 0, rideGrounded: true, prevJump: false,
  };

  function faceDir(dx, dz, dt, rate) { root.rotation.y = lerpAngle(root.rotation.y, Math.atan2(dx, dz), 1 - Math.exp(-rate * dt)); }

  function pickTarget() {
    const pp = player.position;
    const near = Math.hypot(pp.x - root.position.x, pp.z - root.position.z) < 16;
    S.stuck = 0;
    for (let tries = 0; tries < 8; tries++) {
      let x, z;
      if (near && Math.random() < 0.55) { const a = Math.random() * 7, r = 3 + Math.random() * 3; x = pp.x + Math.cos(a) * r; z = pp.z + Math.sin(a) * r; }
      else { const a = Math.random() * 7, r = 7 + Math.random() * ROAM; x = HOME.x + Math.cos(a) * r; z = HOME.z + Math.sin(a) * r; }
      x = clamp(x); z = clamp(z);
      // don't aim at a spot inside a solid object — she'd never "arrive" there
      if (!blockedAt(x, z, 1.2, myCol)) { S.target = new THREE.Vector3(x, 0, z); return; }
    }
    // everything sampled was blocked: fall back to the open home plaza
    S.target = new THREE.Vector3(HOME.x, 0, HOME.z);
  }

  function findLeapTarget() {
    let best = null, bd = 1e9;
    for (const c of leapTargets()) {
      if (c.top < 0.8 || c.top > 5) continue;
      const d = Math.hypot(c.x - root.position.x, c.z - root.position.z);
      if (d > 2.5 && d < 16 && d < bd) { bd = d; best = c; }
    }
    return best;
  }

  // --- mounting: E hops the player onto Raja's back; her own AI pauses and you
  //     drive her (WASD, Shift to sprint, Space to leap, E to hop off). ---
  function seatRider() {
    const yaw = root.rotation.y;
    // Seat just behind her shoulders, facing the SAME way she travels (her head is
    // at +Z, but the rider's sit pose reaches toward its own -Z, so add PI to turn
    // the rider to face forward — hands toward her neck, not her tail).
    player.root.position.set(
      root.position.x + 0.2 * Math.sin(yaw),
      root.position.y + SEAT_Y,
      root.position.z + 0.2 * Math.cos(yaw),
    );
    player.root.rotation.y = yaw + Math.PI;
  }
  function mount() {
    if (S.ridden) return;
    S.ridden = true; S.st = 'prowl'; S.target = null;
    S.rideGrounded = true; S.rideVY = 0; S.prevJump = false;
    player.setMounted(true);
    ctx.spawnDust?.(root.position.x, 0.08, root.position.z, { count: 3, spread: 0.6, up: 0.4, scale: 0.9 });
  }
  function dismount() {
    if (!S.ridden) return;
    S.ridden = false; myCol.off = false;
    const yaw = root.rotation.y; // step off to her left, onto the ground
    const off = new THREE.Vector3(clamp(root.position.x - 1.8 * Math.cos(yaw)), 0, clamp(root.position.z + 1.8 * Math.sin(yaw)));
    player.setMounted(false, off);
    S.idle = 0.6; S.target = null;
  }
  function isMounted() { return S.ridden; }

  const ipos = new THREE.Vector3(root.position.x, 1.2, root.position.z);
  registerInteractable({ id: 'pet', position: ipos, radius: 3.8, data: { title: 'Ride Raja' }, action: mount });

  // shared per-frame face anim: blink + occasional ear twitch
  function updateFace(dt, t) {
    S.blinkT -= dt;
    if (S.blinkT <= 0) { S.blink = 0.12; S.blinkT = 2.5 + Math.random() * 3.5; }
    S.blink = Math.max(0, S.blink - dt);
    const e = S.blink > 0 ? 0.12 : 1;
    eyeL.scale.y = damp(eyeL.scale.y, e, 24, dt); eyeR.scale.y = eyeL.scale.y;
    S.earT -= dt;
    if (S.earT <= 0) { S.earT = 3 + Math.random() * 4; S.ear = 0.2; }
    S.ear = Math.max(0, (S.ear || 0) - dt);
  }

  // head watches the player when she's near (in body-local yaw), else faces front
  function headLook(dt, extraPitch) {
    const pp = player.position;
    const d = Math.hypot(pp.x - root.position.x, pp.z - root.position.z);
    let wy = 0, wx = extraPitch || 0;
    if (d < 16) {
      let a = Math.atan2(pp.x - root.position.x, pp.z - root.position.z) - root.rotation.y;
      while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
      wy = THREE.MathUtils.clamp(a, -0.7, 0.7);
      wx = (extraPitch || 0) - 0.08;
    }
    head.rotation.y = damp(head.rotation.y, wy, 6, dt);
    head.rotation.x = damp(head.rotation.x, wx, 6, dt);
  }

  const earsTo = (target, dt) => { earL.rotation.x = damp(earL.rotation.x, target, 10, dt); earR.rotation.x = earL.rotation.x; };

  onUpdate((dt, t) => {
    updateHearts(dt);
    updateFace(dt, t);
    const p = root.position;
    // how far she actually moved since last frame (drives stuck detection below)
    const movedLast = Math.hypot(p.x - S.prev.x, p.z - S.prev.z);
    S.prev.set(p.x, 0, p.z);
    // keep her solid-to-the-player collider on her, but disabled while she's up
    // in the air or perched (so she never blocks you from the ground).
    myCol.x = p.x; myCol.z = p.z;
    myCol.off = S.st === 'leapUp' || S.st === 'leapDown' || S.st === 'perch';
    // reset transient body transforms each frame; states re-apply
    torso.position.set(0, 0, 0); torso.rotation.set(0, 0, 0); torso.scale.set(1, 1, 1);
    // ear twitch flick
    const tw = S.ear > 0 ? Math.sin(t * 40) * 0.25 : 0;

    // === RIDDEN: you drive her (E to mount); her own AI is paused ============
    if (S.ridden) {
      const intent = player.rideIntent();
      if (intent.jump && !S.prevJump && S.rideGrounded) { S.rideVY = RIDE_JUMP; S.rideGrounded = false; }
      S.prevJump = intent.jump;
      S.rideVY -= RIDE_G * dt; p.y += S.rideVY * dt;
      if (p.y <= 0) { p.y = 0; S.rideVY = 0; S.rideGrounded = true; }
      const air = !S.rideGrounded;
      if (intent.moving) {
        const spd = intent.sprint ? RIDE_RUN : RIDE_WALK;
        faceDir(intent.x, intent.z, dt, 12);
        p.x += intent.x * spd * dt; p.z += intent.z * spd * dt;
        S.gait += dt * (8 + spd * 0.35);
      }
      if (air) {                                   // stretched leap pose
        torso.scale.set(1, 0.96, 1.12);
        setLeg(legFL, -0.6, -0.3); setLeg(legFR, -0.6, -0.3);
        setLeg(legBL, 0.6, 0.3); setLeg(legBR, 0.6, 0.3);
        earL.rotation.x = earR.rotation.x = -0.5;
      } else if (intent.moving && intent.sprint) { // SPRINT: bounding gallop
        const g = S.gait;
        const rO = 0.18;                            // tiny L/R desync so it isn't robotic
        const f = Math.sin(g), fR = Math.sin(g + rO);
        const h = Math.sin(g + 2.1), hR = Math.sin(g + 2.1 + rO); // hind pair leads the push
        // front pair reach forward together (hip swings ahead), then pull under
        setLeg(legFL, -f * 0.75 - 0.1, -(Math.max(0, f) * 0.55 + 0.2));
        setLeg(legFR, -fR * 0.75 - 0.1, -(Math.max(0, fR) * 0.55 + 0.2));
        // hind pair drive back together, then tuck up under the belly
        setLeg(legBL, h * 0.85 + 0.1, Math.max(0, h) * 0.75 + 0.2);
        setLeg(legBR, hR * 0.85 + 0.1, Math.max(0, hR) * 0.75 + 0.2);
        // suspension: body lifts + stretches between push-off and the front plant
        const bnd = Math.max(0, Math.sin(g + 1.0));
        torso.position.y = bnd * 0.32;
        torso.rotation.x = Math.sin(g + 0.4) * 0.16; // gallop rock (pitch)
        torso.rotation.z = Math.sin(g) * 0.03;
        torso.scale.set(1, 1 - bnd * 0.05, 1 + bnd * 0.18);
        earL.rotation.x = earR.rotation.x = -0.55;   // ears pinned in the wind
      } else if (intent.moving) {                  // run gait (trot)
        const g = S.gait;
        const sA = Math.sin(g), sB = Math.sin(g + Math.PI);
        const kA = Math.max(0, Math.sin(g + 0.6)) * 0.7, kB = Math.max(0, Math.sin(g + Math.PI + 0.6)) * 0.7;
        setLeg(legFL, sA * 0.5, -kA); setLeg(legBR, sA * 0.5, kA);
        setLeg(legFR, sB * 0.5, -kB); setLeg(legBL, sB * 0.5, kB);
        torso.position.y = Math.abs(Math.sin(g)) * 0.05; torso.rotation.z = Math.sin(g) * 0.05;
        earL.rotation.x = damp(earL.rotation.x, 0, 8, dt); earR.rotation.x = earL.rotation.x;
      } else {                                     // standing still
        for (const l of legs) { l.hip.rotation.x = damp(l.hip.rotation.x, 0, 8, dt); l.knee.rotation.x = damp(l.knee.rotation.x, 0, 8, dt); }
        earL.rotation.x = damp(earL.rotation.x, 0, 8, dt) + tw; earR.rotation.x = earL.rotation.x;
      }
      const galloping = intent.moving && intent.sprint && !air;
      // head pitched well DOWN so she dives head-first into the dash
      head.rotation.x = damp(head.rotation.x, galloping ? 0.85 : -0.05, galloping ? 10 : 8, dt);
      head.rotation.y = damp(head.rotation.y, 0, 8, dt);
      if (galloping) {                             // tail streams out behind, tip whipping
        for (let i = 0; i < tail.length; i++) { tail[i].rotation.x = damp(tail[i].rotation.x, -0.3 - i * 0.05, 10, dt); tail[i].rotation.y = Math.sin(S.gait * 1.3 - i * 0.6) * 0.22; }
      } else {
        tailWave(0.2, 4, 0.0, t);
      }
      resolve(p, 0.9, myCol);
      p.x = clamp(p.x); p.z = clamp(p.z);
      myCol.x = p.x; myCol.z = p.z; myCol.off = air;
      seatRider();
      ipos.set(p.x, 1.2, p.z);
      return;
    }

    if (S.st === 'crouch') {           // anticipation wind-up before a pounce
      S.crouchT -= dt;
      const c = Math.min(1, 1 - S.crouchT / 0.22);
      torso.position.y = -0.22 * c;
      setLeg(legFL, 0.15 * c, -0.55 * c); setLeg(legFR, 0.15 * c, -0.55 * c);
      setLeg(legBL, 0.35 * c, 0.8 * c); setLeg(legBR, 0.35 * c, 0.8 * c);
      headLook(dt, 0.15 * c); earsTo(0, dt);
      tailWave(0.1, 4, -0.2 * c, t);
      if (S.crouchT <= 0) { S.st = 'leapUp'; S.lt = 0; }
      ipos.set(p.x, 1.2, p.z); return;
    }

    if (S.st === 'leapUp' || S.st === 'leapDown') {
      S.lt += dt / S.ldur;
      const u = Math.min(1, S.lt);
      p.x = lerp(S.from.x, S.to.x, u); p.z = lerp(S.from.z, S.to.z, u);
      p.y = lerp(S.from.y, S.to.y, u) + Math.sin(u * Math.PI) * S.larc;
      faceDir(S.to.x - S.from.x, S.to.z - S.from.z, dt, 6);
      const air = Math.sin(u * Math.PI);
      torso.scale.set(1, 1 - 0.05 * air, 1 + 0.16 * air);   // stretch lengthwise
      setLeg(legFL, -0.6 + air * 0.3, -0.5 * air); setLeg(legFR, -0.6 + air * 0.3, -0.5 * air);
      setLeg(legBL, 0.6 - air * 0.3, 0.5 * air); setLeg(legBR, 0.6 - air * 0.3, 0.5 * air);
      head.rotation.x = damp(head.rotation.x, -0.15 - air * 0.1, 8, dt); head.rotation.y = damp(head.rotation.y, 0, 8, dt);
      earL.rotation.x = earR.rotation.x = -0.6;             // ears pinned back
      for (let i = 0; i < tail.length; i++) { tail[i].rotation.x = -0.35; tail[i].rotation.y = Math.sin(t * 6 - i) * 0.12; }
      if (u >= 1) {
        if (S.st === 'leapUp') { S.st = 'perch'; S.perchT = 2.6 + Math.random() * 2.6; p.y = S.perchY; S.land = 0.2; }
        else { S.st = 'prowl'; S.idle = 0.3; S.target = null; S.leapCD = 7 + Math.random() * 8; p.y = 0; S.land = 0.16; }
      }
      ipos.set(p.x, p.y + 0.2, p.z); return;
    }

    if (S.st === 'perch') {
      S.perchT -= dt;
      p.y = S.perchY;
      S.land = Math.max(0, S.land - dt);
      torso.position.y = -0.16 * (S.land / 0.2);   // landing recoil settling
      torso.rotation.x = -0.12;                     // sit upright (front raised)
      setLeg(legFL, -0.1, 0.05); setLeg(legFR, -0.1, 0.05);    // front legs straight
      setLeg(legBL, -0.7, 1.2); setLeg(legBR, -0.7, 1.2);      // haunches folded under
      headLook(dt, -0.05);
      head.rotation.y += Math.sin(t * 0.5) * 0.18;  // slow look-around on top of look
      earL.rotation.x = damp(earL.rotation.x, 0, 8, dt) + tw; earR.rotation.x = earL.rotation.x;
      // tail wraps around to the side and the tip flicks
      tail[0].rotation.y = damp(tail[0].rotation.y, 0.8, 6, dt); tail[0].rotation.x = damp(tail[0].rotation.x, 0.1, 6, dt);
      tail[1].rotation.y = damp(tail[1].rotation.y, 0.6, 6, dt);
      tail[2].rotation.y = 0.4 + Math.sin(t * 5) * 0.25; tail[3].rotation.y = Math.sin(t * 6) * 0.4;
      if (S.perchT <= 0) {
        const a = Math.random() * 7, r = 3 + Math.random() * 2;
        S.from.copy(p); S.to.set(clamp(p.x + Math.cos(a) * r), 0, clamp(p.z + Math.sin(a) * r));
        S.lt = 0; S.ldur = 0.6; S.larc = 1.5; S.st = 'leapDown';
      }
      ipos.set(p.x, p.y + 0.2, p.z); return;
    }

    // === prowl ============================================================
    S.leapCD -= dt;
    if (S.leapCD <= 0) {
      const tgt = findLeapTarget();
      if (tgt) {
        S.from.copy(p); S.to.set(tgt.x, tgt.top, tgt.z); S.perchY = tgt.top;
        S.lt = 0; S.ldur = 0.66; S.larc = Math.max(1.6, tgt.top * 0.6 + 1.0);
        S.crouchT = 0.22; S.st = 'crouch'; S.target = null;
        ctx.spawnDust?.(p.x, 0.07, p.z, { count: 2, spread: 0.4, up: 0.3, scale: 0.6 });
        ipos.set(p.x, 1.2, p.z); return;
      }
      S.leapCD = 4 + Math.random() * 4;
    }

    if (!S.target) {                       // idle: breathe, watch you, gentle tail
      S.idle -= dt;
      p.y = damp(p.y, 0, 10, dt);
      const br = 1 + Math.sin(t * 1.7) * 0.02;
      torso.scale.set(1, br, br);
      for (const l of legs) { l.hip.rotation.x = damp(l.hip.rotation.x, 0, 8, dt); l.knee.rotation.x = damp(l.knee.rotation.x, 0, 8, dt); }
      headLook(dt, 0);
      earL.rotation.x = damp(earL.rotation.x, 0, 8, dt) + tw; earR.rotation.x = earL.rotation.x;
      tailWave(0.12, 1.3, 0.08, t);
      if (S.idle <= 0) pickTarget();
    } else {                               // walk toward target
      const dx = S.target.x - p.x, dz = S.target.z - p.z, dist = Math.hypot(dx, dz);
      if (dist < 0.9) { S.target = null; S.idle = 0.6 + Math.random() * 1.5; S.stuck = 0; }
      else {
        // steer around anything in the way before stepping that direction
        const ang = steerAngle(p.x, p.z, dx / dist, dz / dist, myCol);
        const dirx = Math.sin(ang), dirz = Math.cos(ang);
        faceDir(dirx, dirz, dt, 10);
        p.x += dirx * SPEED * dt; p.z += dirz * SPEED * dt;
        // wedged (barely moving though she's trying)? give up on this target and repick
        if (movedLast < SPEED * dt * 0.45) S.stuck += dt; else S.stuck = 0;
        if (S.stuck > 0.55) { S.target = null; S.idle = 0.12; S.stuck = 0; }
        S.gait += dt * 7.5;
        const g = S.gait;
        // diagonal gait: FL+BR share phase, FR+BL the opposite
        const sA = Math.sin(g), sB = Math.sin(g + Math.PI);
        const kA = Math.max(0, Math.sin(g + 0.6)) * 0.7, kB = Math.max(0, Math.sin(g + Math.PI + 0.6)) * 0.7;
        setLeg(legFL, sA * 0.5, -kA); setLeg(legBR, sA * 0.5, kA);
        setLeg(legFR, sB * 0.5, -kB); setLeg(legBL, sB * 0.5, kB);
        torso.position.y = Math.abs(Math.sin(g)) * 0.05;     // body bob
        torso.rotation.z = Math.sin(g) * 0.05;               // spine roll / weight shift
        headLook(dt, Math.sin(g * 2) * 0.04);                // head bob folded into look-at
        earL.rotation.x = damp(earL.rotation.x, 0, 8, dt); earR.rotation.x = earL.rotation.x;
        tailWave(0.2, 3, 0.05, t);
      }
    }

    resolve(p, 0.9, myCol);   // she bumps around solid things (skipping herself)
    p.x = clamp(p.x); p.z = clamp(p.z);
    ipos.set(p.x, 1.2, p.z);
  });

  return { root, mount, dismount, isMounted, state: S };
}
