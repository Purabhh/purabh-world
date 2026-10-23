// Third-person blocky avatar with a Roblox-style orbit camera.
//   move:  W/S walk forward/back, A/D turn (the camera turns with you)
//   look:  optional: hold LEFT or RIGHT mouse + drag to swing the camera
//          (one-finger drag on touch)
//   zoom:  mouse wheel / pinch (scroll all the way in to enter first person)
//   jump:  space
import * as THREE from 'three';
import { layout } from '../core/constants.js';
import { resolve } from '../core/colliders.js';

export function createPlayer(ctx) {
  const { scene, camera, renderer } = ctx;
  const el = renderer.domElement;

  // --- avatar: jointed limbs that pivot at the hip / shoulder -----------------
  const root = new THREE.Group();
  root.userData.dynamic = true; // moves; keep it out of the static bake
  const C = { skin: 0xc88e5a, shirt: 0x4f86f2, pants: 0x394150, hair: 0x2a1c12, shoe: 0x2b2f3a };
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8 });
  const meshAt = (w, h, d, color, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  root.add(meshAt(1.1, 1.15, 0.62, C.shirt, 0, 1.55, 0));   // torso
  root.add(meshAt(0.86, 0.86, 0.86, C.skin, 0, 2.58, 0));   // head
  root.add(meshAt(0.96, 0.3, 0.96, C.hair, 0, 3.05, 0));    // hair

  // a limb hangs below its pivot, so rotating the pivot swings from the joint
  function limb(px, py, pz, w, h, d, color, footColor) {
    const pivot = new THREE.Group();
    pivot.position.set(px, py, pz);
    pivot.add(meshAt(w, h, d, color, 0, -h / 2, 0));
    if (footColor) pivot.add(meshAt(w + 0.04, 0.22, d + 0.14, footColor, 0, -h + 0.02, 0.06));
    root.add(pivot);
    return pivot;
  }
  const legL = limb(-0.28, 1.0, 0, 0.45, 1.0, 0.5, C.pants, C.shoe);
  const legR = limb(0.28, 1.0, 0, 0.45, 1.0, 0.5, C.pants, C.shoe);
  const armL = limb(-0.74, 2.08, 0, 0.34, 1.0, 0.42, C.shirt, null);
  const armR = limb(0.74, 2.08, 0, 0.34, 1.0, 0.42, C.shirt, null);
  scene.add(root);
  root.position.set(0, 0, 8); // spawn on the plaza, facing the centerpiece trophy

  // --- orbit camera (third-person only) ---------------------------------------
  // dist drives the zoom: large = far third-person, ~0 = first person.
  // zoomTo is where the wheel wants us; dist eases toward it so zoom glides.
  const cam = { yaw: 0, pitch: 0.4, dist: 24 };
  let zoomTo = cam.dist;
  const MIN_DIST = 0.5, MAX_DIST = 42, FP_DIST = 1.5; // below FP_DIST = first person
  const SENS = 0.0022;          // radians per pixel of mouse travel
  const MAX_STEP = 60;          // ignore pointer-lock spikes bigger than this (px)
  let dragging = false, lastX = 0, lastY = 0, pinchDist = 0;
  // Look input is queued here and eased in each frame, so the camera turns
  // smoothly instead of snapping on every raw mouse event.
  let lookDX = 0, lookDY = 0;
  const orbit = (dx, dy) => {
    cam.yaw -= dx;
    cam.pitch = THREE.MathUtils.clamp(cam.pitch - dy, -1.2, 1.45);
  };

  // Hold LEFT or RIGHT mouse + drag to orbit. Right-drag locks the pointer
  // (Roblox-style) so it stays put while you look; it comes back on release.
  // The canvas shows a grab hand so there's always a visible cursor.
  el.style.cursor = 'grab';
  const isLocked = () => document.pointerLockElement === el;
  window.addEventListener('contextmenu', (e) => { if (e.target === el) e.preventDefault(); });
  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0 && e.button !== 2) return;
    dragging = true;
    el.style.cursor = 'grabbing';
    if (e.button === 2 && el.requestPointerLock) {
      try { const r = el.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (_) {}
    }
  });
  const endDrag = () => {
    dragging = false;
    el.style.cursor = cam.dist > FP_DIST ? 'grab' : 'crosshair';
    if (isLocked()) document.exitPointerLock();
  };
  window.addEventListener('mouseup', endDrag);
  // If the lock lands after the button was already released, drop it right away
  // so the cursor never gets stuck hidden.
  document.addEventListener('pointerlockchange', () => { if (isLocked() && !dragging) document.exitPointerLock(); });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    if (!e.buttons && !isLocked()) { endDrag(); return; } // released outside the window
    const dx = e.movementX || 0, dy = e.movementY || 0;
    if (Math.abs(dx) > MAX_STEP || Math.abs(dy) > MAX_STEP) return;
    lookDX += dx * SENS; lookDY += dy * SENS * 0.85;
  });
  // Scroll forward = zoom in (closer, eventually first person); back = zoom out.
  el.addEventListener('wheel', (e) => {
    zoomTo = THREE.MathUtils.clamp(zoomTo + Math.sign(e.deltaY) * Math.max(1.2, zoomTo * 0.14), MIN_DIST, MAX_DIST);
  }, { passive: true });

  // Look/zoom from finger drags on the 3D canvas. Touches that began on the
  // on-screen joystick or action buttons have a different target, so we ignore
  // them here — otherwise a thumb on the stick would be miscounted as a second
  // finger (pinch) or steal the look drag.
  const onCanvas = (e) => Array.prototype.filter.call(e.touches, (t) => t.target === el);
  el.addEventListener('touchstart', (e) => {
    const ts = onCanvas(e);
    if (ts.length === 1) { dragging = true; lastX = ts[0].clientX; lastY = ts[0].clientY; }
    else if (ts.length === 2) { pinchDist = touchDist(ts); }
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    const ts = onCanvas(e);
    if (ts.length === 1 && dragging) {
      lookDX += (ts[0].clientX - lastX) * 0.005; lookDY += (ts[0].clientY - lastY) * 0.004;
      lastX = ts[0].clientX; lastY = ts[0].clientY;
    } else if (ts.length === 2) {
      const d = touchDist(ts);
      zoomTo = THREE.MathUtils.clamp(zoomTo + (pinchDist - d) * 0.06, MIN_DIST, MAX_DIST);
      pinchDist = d;
    }
  }, { passive: true });
  window.addEventListener('touchend', () => { dragging = false; });
  function touchDist(ts) { const a = ts[0], b = ts[1]; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }

  // --- keyboard ---------------------------------------------------------------
  const keys = {};
  const inField = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  const MOVE_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
  window.addEventListener('keydown', (e) => {
    if (inField(e.target)) return;
    keys[e.code] = true;
    if (enabled && MOVE_CODES.has(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  // Drop held keys if focus is lost (alt-tab, tab switch) — no stuck-key drift.
  const clearInput = () => { for (const k in keys) keys[k] = false; lookDX = lookDY = 0; endDrag(); };
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); });

  // --- movement ---------------------------------------------------------------
  const WALK = 12, RUN = 19, JUMP = 9.5, G = 26;
  const TURN_SPEED = 2.4; // radians/sec for A/D
  const half = layout.groundSize / 2 - 3;
  const vel = new THREE.Vector3();          // smoothed horizontal velocity
  const focus = new THREE.Vector3(0, 2.4, 8); // eased follow point for the camera
  // small center dot shown in first person so you know where you're looking
  const crosshair = document.createElement('div');
  crosshair.style.cssText = 'position:fixed;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#fff;box-shadow:0 0 0 1.5px rgba(0,0,0,.45);pointer-events:none;z-index:5;display:none';
  document.body.appendChild(crosshair);
  const tmpTarget = new THREE.Vector3();
  let yVel = 0, grounded = true, enabled = false, gait = 0;
  let mounted = false;        // true while riding Raja (movement is handed to pet.js)
  let stride = 0, squash = 0; // stride: distance since last footstep puff; squash: land bounce
  let suspended = false;      // true during the cinematic intro (camera driven elsewhere)

  let touch = null;                           // on-screen joystick + buttons (mobile)
  function setEnabled(v) { enabled = v; }
  function setTouch(t) { touch = t; }         // wired in main.js after the UI is built
  function setCinematic(v) { suspended = v; } // freeze movement + camera for the intro
  function lerpAngle(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return a + d * t;
  }

  // Third-person follow camera (shared by walking and riding).
  function followCam(dt) {
    // ease queued look + zoom in (fast enough to feel direct, no jitter)
    const lk = 1 - Math.exp(-28 * dt);
    orbit(lookDX * lk, lookDY * lk);
    lookDX -= lookDX * lk; lookDY -= lookDY * lk;
    cam.dist += (zoomTo - cam.dist) * (1 - Math.exp(-12 * dt));
    const EYE = 2.4;
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const px = root.position.x, py = root.position.y + EYE, pz = root.position.z;
    tmpTarget.set(px + Math.sin(cam.yaw) * cp * cam.dist, py + sp * cam.dist, pz + Math.cos(cam.yaw) * cp * cam.dist);
    // Orbit is applied exactly (no lag on rotation); only the follow point eases,
    // so the camera trails the player a hair without swimming when you turn.
    focus.x += (px - focus.x) * (1 - Math.exp(-20 * dt));
    focus.y += (py - focus.y) * (1 - Math.exp(-10 * dt));
    focus.z += (pz - focus.z) * (1 - Math.exp(-20 * dt));
    camera.position.set(focus.x + (tmpTarget.x - px), focus.y + (tmpTarget.y - py), focus.z + (tmpTarget.z - pz));
    if (camera.position.y < 0.6) camera.position.y = 0.6;   // don't dip below ground
    camera.lookAt(camera.position.x - Math.sin(cam.yaw) * cp, camera.position.y - sp, camera.position.z - Math.cos(cam.yaw) * cp);
    const fp = cam.dist <= FP_DIST;
    root.visible = !fp;                                      // hide avatar in first person
    if (crosshair) crosshair.style.display = fp ? 'block' : 'none';
    if (!dragging) el.style.cursor = fp ? 'crosshair' : 'grab';
  }

  function update(dt) {
    if (suspended) return; // cinematic intro owns the camera; don't move or follow
    // A/D (or left/right arrows) turn you and the camera together.
    if (enabled) {
      const turn = ((keys['KeyA'] || keys['ArrowLeft']) ? 1 : 0) - ((keys['KeyD'] || keys['ArrowRight']) ? 1 : 0);
      cam.yaw += turn * TURN_SPEED * dt;
    }
    if (mounted) {          // riding Raja: pet.js pins us onto her back each frame
      legL.rotation.x = 1.15; legR.rotation.x = 1.15;   // sit astride
      armL.rotation.x = 0.6; armR.rotation.x = 0.6;     // hands forward on her neck
      root.scale.set(1, 1, 1);
      followCam(dt);
      return;
    }
    let mx = 0, mz = 0;
    if (enabled) {
      if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
      if (touch) { const m = touch.getMove(); mx += m.x; mz += m.z; }  // joystick (analog)
    }
    // Analog magnitude: keyboard is always full tilt (mag 1); a half-pushed
    // joystick walks at half speed. Sprint comes from Shift or the sprint toggle.
    const mag = Math.min(1, Math.hypot(mx, mz));
    const sprinting = keys['ShiftLeft'] || keys['ShiftRight'] || (touch && touch.sprint);
    const maxSpeed = (sprinting ? RUN : WALK) * mag;

    let desiredX = 0, desiredZ = 0;
    if (mx || mz) {
      const fwdX = -Math.sin(cam.yaw), fwdZ = -Math.cos(cam.yaw);
      const rgtX = Math.cos(cam.yaw), rgtZ = -Math.sin(cam.yaw);   // screen-right (A/D)
      let wx = fwdX * -mz + rgtX * mx;
      let wz = fwdZ * -mz + rgtZ * mx;
      const len = Math.hypot(wx, wz) || 1;
      desiredX = (wx / len) * maxSpeed;
      desiredZ = (wz / len) * maxSpeed;
    }
    const k = 1 - Math.exp(-((mx || mz) ? 10 : 14) * dt);
    vel.x += (desiredX - vel.x) * k;
    vel.z += (desiredZ - vel.z) * k;
    root.position.x += vel.x * dt;
    root.position.z += vel.z * dt;

    const speed = Math.hypot(vel.x, vel.z);
    if (speed > 0.2) {
      root.rotation.y = lerpAngle(root.rotation.y, mz > 0 && !mx ? cam.yaw + Math.PI : Math.atan2(vel.x, vel.z), 1 - Math.exp(-14 * dt));
      gait += dt * (4 + speed * 0.95);
      const swing = Math.sin(gait) * THREE.MathUtils.clamp(speed / WALK, 0.15, 1.4) * 0.6;
      legL.rotation.x = swing; legR.rotation.x = -swing;
      armL.rotation.x = -swing; armR.rotation.x = swing;
    } else {
      const settle = Math.exp(-12 * dt);
      legL.rotation.x *= settle; legR.rotation.x *= settle;
      armL.rotation.x *= settle; armR.rotation.x *= settle;
    }

    // Kick up a little dust each stride while walking on the ground.
    if (enabled && grounded && speed > 2.5) {
      stride += speed * dt;
      if (stride > 2.2) { stride = 0; ctx.spawnDust?.(root.position.x, 0.12, root.position.z, { count: 1, spread: 0.5, up: 0.35, scale: 0.8 }); }
    } else {
      stride = Math.min(stride, 2.2);
    }

    const jumpInput = keys['Space'] || (touch && touch.consumeJump());
    if (enabled && jumpInput && grounded) { yVel = JUMP; grounded = false; }
    yVel -= G * dt;
    root.position.y += yVel * dt;
    if (root.position.y <= 0) {
      const impact = -yVel; // downward speed at touchdown
      root.position.y = 0; yVel = 0;
      if (!grounded) {       // just landed: burst of dust + a squash bounce
        grounded = true;
        if (impact > 3) {
          squash = Math.min(1, impact / JUMP);
          ctx.spawnDust?.(root.position.x, 0.12, root.position.z, { count: 7, spread: 1.3, up: 0.6, scale: 1.15 });
        }
      }
    }

    // Squash & stretch: the bounce decays each frame; in the air the body stretches
    // a touch when rising and squishes when falling fast. Volume-ish preserving.
    squash *= Math.exp(-9 * dt);
    const stretch = grounded ? 0 : THREE.MathUtils.clamp(yVel * 0.012, -0.12, 0.16);
    const sy = (1 - squash * 0.22) * (1 + stretch);
    const sxz = (1 + squash * 0.16) * (1 - stretch * 0.5);
    root.scale.set(sxz, sy, sxz);

    root.position.x = THREE.MathUtils.clamp(root.position.x, -half, half);
    root.position.z = THREE.MathUtils.clamp(root.position.z, -half, half);
    resolve(root.position, 0.8); // slide out of solid buildings / trees / props

    followCam(dt);
  }

  // Mount/dismount: pet.js drives Raja and pins us to her back while mounted.
  function setMounted(v, placePos) {
    mounted = v;
    if (v) { vel.set(0, 0, 0); yVel = 0; }
    else if (placePos) { root.position.copy(placePos); root.position.y = 0; grounded = true; }
  }
  // The camera-relative move intent pet.js reads to drive Raja while you ride.
  function rideIntent() {
    let mx = 0, mz = 0;
    if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
    if (touch) { const m = touch.getMove(); mx += m.x; mz += m.z; }   // joystick steers Raja too
    let wx = 0, wz = 0;
    const moving = Math.hypot(mx, mz) > 0.12;
    if (moving) {
      const fwdX = -Math.sin(cam.yaw), fwdZ = -Math.cos(cam.yaw);
      const rgtX = Math.cos(cam.yaw), rgtZ = -Math.sin(cam.yaw);
      wx = fwdX * -mz + rgtX * mx; wz = fwdZ * -mz + rgtZ * mx;
      const len = Math.hypot(wx, wz) || 1; wx /= len; wz /= len;
    }
    const sprint = !!(keys['ShiftLeft'] || keys['ShiftRight']) || (touch && touch.sprint);
    const jump = !!keys['Space'] || (touch && touch.consumeJump());
    return { x: wx, z: wz, moving, sprint: !!sprint, jump: !!jump };
  }

  return {
    root, update, setEnabled, setTouch, setCinematic, cam, setMounted, rideIntent,
    get position() { return root.position; },
  };
}
