// Bootstrap + integration. Builds the engine context, assembles the world from
// each module, and runs the interaction -> UI loop.
import * as THREE from 'three';
import { createEngine } from './core/engine.js';
import { bakeStatic } from './core/bake.js';
import * as voxel from './voxel/voxel.js';
import { palette, layout, css, config } from './core/constants.js';
import * as resume from './data/resume.js';
import * as interaction from './core/interaction.js';
import { createPlayer } from './player/player.js';

import { buildTerrain } from './world/terrain.js';
import { buildEnvironment } from './world/environment.js';
import { buildLanterns } from './world/lanterns.js';
import { buildAtmosphere } from './world/atmosphere.js';
import { buildFallingLeaves } from './world/foliage.js';
import { buildPet } from './world/pet.js';
import { buildLandmarks } from './landmarks/index.js';
import { buildProjectsDistrict } from './projects/projectsDistrict.js';
import { createHUD } from './ui/hud.js';
import { createPanel } from './ui/panel.js';
import { createLanding } from './ui/landing.js';
import { coachFirstVisit } from './ui/firstVisit.js';
import { createTutorial } from './ui/tutorial.js';
import { createCinematic } from './ui/cinematic.js';
import { createTour } from './ui/tour.js';
import { createTouchControls } from './ui/touchControls.js';
import { createNudge } from './ui/nudge.js';

const mount = document.getElementById('game');
const engine = createEngine(mount);

// The context object every world-builder receives.
const ctx = {
  THREE,
  scene: engine.scene,
  camera: engine.camera,
  renderer: engine.renderer,
  voxel,
  palette,
  css,
  layout,
  resume,
  config,
  registerInteractable: interaction.registerInteractable,
  onUpdate: engine.onUpdate,
  sun: engine.sun,
  hemi: engine.hemi,
  envMap: engine.envMap,
  bloom: engine.bloom,
  grade: engine.grade,
  invalidateShadows: engine.invalidateShadows,
};

// --- world ------------------------------------------------------------------
engine.scene.add(voxel.groundSlab({ size: layout.groundSize, thickness: layout.groundHeight, color: palette.grass }));
buildTerrain(ctx);
buildEnvironment(ctx);
buildLanterns(ctx);
buildLandmarks(ctx);
// Atmosphere (clouds, motes, wind, day/dusk, ctx.spawnDust) goes
// in before the player so the player can kick up dust the moment it spawns.
buildAtmosphere(ctx);

// Which screen the player is on. Prompts, Raja and E only work in 'free' (walking).
//   home: start screen   view: intro/tour (camera drives)   free: free roam
let mode = 'home';

// --- player (gated behind the landing screen) -------------------------------
const player = createPlayer(ctx);
buildFallingLeaves(ctx, voxel.swayables, engine.lowQuality || new URLSearchParams(location.search).get('quality') === 'low');
player.setEnabled(false);
engine.onUpdate((dt) => player.update(dt));

// Raja the tiger: prowls on her own, follows you when near, pounces onto rocks,
// E to pet. Built after the player so she can track you (and her update runs
// after the player's each frame).
const pet = buildPet(ctx, player);

// --- UI ---------------------------------------------------------------------
const hud = createHUD();
// Wire the HUD's day/dusk chip to the atmosphere toggle (the "N" key works too).
hud.onDayNight(() => ctx.dayNight.toggle());
ctx.dayNight.subscribe((dusk) => hud.setDayNightLabel(dusk ? '☀ Day' : '🌇 Dusk'));
const panel = createPanel();

// On-screen joystick + action buttons (touch devices only). Free-roam is
// unplayable on a phone without these — touch alone only orbits the camera.
const touch = createTouchControls();
const nudge = createNudge(); // one-time "how to move" hint; desktop only, touch controls are self-explanatory
player.setTouch(touch);

// While an intro/tour owns the camera the player is suspended; both hand control
// back to free-roam at spawn when they finish.
function suspendPlayer() {
  mode = 'view';
  if (tutorial.active) tutorial.stop();   // leaving free roam ends the tutorial
  player.setEnabled(false);
  player.setCinematic(true);
  player.root.visible = false;
  touch.setVisible(false);
}
function handoffToPlayer() {
  mode = 'free';
  player.setCinematic(false);
  player.setEnabled(true);
  player.root.visible = true;
  hud.setControlsVisible(true);
  touch.setVisible(true);
  // First visit: the step-by-step tutorial. Otherwise just the one-line nudge.
  if (!touch.active) { if (tutorial.shouldRun()) tutorial.start(); else nudge.show(); }
}

// Cinematic intro: a labeled fly-through past every landmark (captions only).
const cinematic = createCinematic(ctx, { onComplete: handoffToPlayer });
// Recruiter Tour: a guided, hands-free walkthrough that pops each landmark's full
// info card with auto-advance + controls, ending on a "Let's connect" CTA.
const tour = createTour(ctx, { panel, onComplete: handoffToPlayer });

// When the tutorial ends (finished or skipped), show the one-line hint at the top.
const tutorial = createTutorial({ onDone: () => { if (!touch.active) nudge.show(); } });
const landing = createLanding({
  tutorial,
  onEnter: () => { suspendPlayer(); cinematic.play(); },   // free roam (after the quick intro)
  onTour: () => { suspendPlayer(); tour.play(); },         // guided recruiter tour
});
coachFirstVisit(landing); // first visit only: point new people at the tour

// Behind the landing screen the real world slowly orbits the plaza at dusk:
// a dolly-in on load, then an endless slow circle.
suspendPlayer();
let isDusk = false;
ctx.dayNight.subscribe((d) => { isDusk = d; });
if (!isDusk) ctx.dayNight.toggle();
let orbitA = 0.8, orbitT = 0;
engine.onUpdate((dt) => {
  if (!landing.visible || cinematic.playing || tour.playing) { orbitT = 0; return; }
  orbitT += dt;
  const e = 1 - Math.pow(1 - Math.min(1, orbitT / 4.5), 3);
  orbitA += 0.055 * dt * (1 + (1 - e) * 2.5);
  const r = 62 - 16 * e, h = 26 - 8 * e;
  ctx.camera.position.set(Math.cos(orbitA) * r, h, Math.sin(orbitA) * r);
  ctx.camera.lookAt(0, 4, 0);
});

// Home button (HUD, top-left): bail out of free-roam back to the landing
// screen. Rewinds the intro/tour so "Enter World" / "Take the Tour" play
// again cleanly next time, instead of no-op'ing because they'd already run.
// "View mode" button (top right, free roam only): drops into the guided tour.
const viewBtn = document.createElement('button');
viewBtn.type = 'button';
viewBtn.className = 'pw-pill pw-view-btn';
viewBtn.textContent = '🧭 View mode';
viewBtn.style.display = 'none';
viewBtn.addEventListener('click', () => {
  if (mode !== 'free') return;
  if (panel.isOpen()) panel.hide();
  if (pet.isMounted()) pet.dismount();
  suspendPlayer();
  tour.reset();
  tour.play();
});
document.getElementById('ui').appendChild(viewBtn);

// Hide/show the HUD chips (Home, View mode, controls, day/dusk) for a clean view.
// The eye button itself stays put so you can bring them back; H does the same.
const hudBtn = document.createElement('button');
hudBtn.type = 'button';
hudBtn.className = 'pw-hud-eye';
hudBtn.setAttribute('aria-label', 'Hide buttons');
hudBtn.title = 'Hide buttons (H)';
hudBtn.textContent = '👁';
hudBtn.style.display = 'none';
function toggleHud() {
  const hidden = document.body.classList.toggle('pw-hud-hidden');
  hudBtn.textContent = hidden ? '🙈' : '👁';
  hudBtn.setAttribute('aria-label', hidden ? 'Show buttons' : 'Hide buttons');
  hudBtn.title = hidden ? 'Show buttons (H)' : 'Hide buttons (H)';
}
hudBtn.addEventListener('click', toggleHud);
window.addEventListener('keydown', (e) => {
  const t = e.target;
  if (e.code !== 'KeyH' || mode !== 'free' || (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable))) return;
  toggleHud();
});
document.getElementById('ui').appendChild(hudBtn);


hud.onHome(() => {
  // Finish a running intro/tour first: reset() is a no-op while one is playing,
  // which is why Home used to leave the tour card on screen.
  cinematic.skip();
  tour.exit();
  if (panel.isOpen()) panel.hide();
  if (pet.isMounted()) pet.dismount();
  suspendPlayer();
  cinematic.reset();
  tour.reset();
  nudge.hide();
  mode = 'home';          // after skip/exit, which would otherwise hand off to free roam
  hud.setControlsVisible(false);   // the landing page shows no Home / Day chrome
  landing.show();
});

// --- interaction loop: prompt for the nearest zone, E opens its card --------
// A short category label shown as the card's eyebrow pill, by interactable id.
function eyebrowFor(id) {
  if (!id) return '';
  if (id === 'education') return 'Education';
  if (id === 'skills') return 'Tech Stack';
  if (id === 'achievements') return 'Hackathon';
  if (id.startsWith('project')) return 'Project';
  if (id === 'bny' || id === 'azonix' || id.startsWith('essex')) return 'Internship';
  return '';
}

let near = null;
let openAnchor = null;                 // world point of the open card's landmark
const _proj = new THREE.Vector3();
// One-line label for the touch interact button, mirroring what E would do.
function touchActionLabel() {
  if (pet.isMounted()) return 'Hop off';
  if (panel.isOpen()) return 'Close';
  if (near && near.id === 'pet') return 'Ride';
  if (near) return 'Open';
  return 'Interact';
}
engine.onUpdate(() => {
  // Only free roam shows prompts, Raja and the E button. Home, the intro and the
  // tour are all silent so nothing from the world pops up over them.
  viewBtn.style.display = mode === 'free' ? '' : 'none';
  hudBtn.style.display = mode === 'free' ? '' : 'none';
  pet.root.visible = mode === 'free';
  if (mode !== 'free') {
    // the tour shows its own cards; only the home screen forces them closed
    if (mode === 'home' && panel.isOpen()) panel.hide();
    hud.setPrompt(null); near = null; touch.setInteract(false);
    return;
  }
  // the tutorial owns the screen: no prompts, cards, Raja prompt or nudge over it
  if (tutorial.active) {
    if (panel.isOpen()) panel.hide();
    hud.setPrompt(null); near = null; touch.setInteract(false);
    return;
  }
  if (pet.isMounted()) {
    hud.setPrompt({ title: 'Riding Raja', keys: [['WASD', 'Drive'], ['Shift', 'Sprint'], ['Space', 'Leap'], ['E', 'Hop off']] });
    near = null; touch.setInteract(true, 'Hop off'); return;
  }
  near = interaction.getNearest(player.position);
  hud.setPrompt(near && !panel.isOpen() ? `Press E - ${near.data.title}` : null);
  touch.setInteract(!!near || panel.isOpen(), touchActionLabel());
  // Keep the open card pinned beside its landmark (project its 3D point to screen).
  if (panel.isOpen() && openAnchor) {
    _proj.copy(openAnchor); _proj.y += 4;              // float a touch above the marker
    _proj.project(engine.camera);
    panel.setAnchor(
      (_proj.x * 0.5 + 0.5) * window.innerWidth,
      (-_proj.y * 0.5 + 0.5) * window.innerHeight,
      _proj.z < 1,                                      // false = behind the camera
    );
  }
});
// Shared interact: the E key and the on-screen touch button both run this.
function triggerInteract() {
  if (mode !== 'free' || tutorial.active) return;                          // only free roam is interactive
  if (pet.isMounted()) { pet.dismount(); return; }      // hop off from anywhere
  if (panel.isOpen()) panel.hide();
  else if (near && near.action) near.action();          // mount Raja / open a card
  else if (near) { openAnchor = near.position; panel.show({ ...near.data, eyebrow: eyebrowFor(near.id) }, { big: true }); }
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE') triggerInteract();
});
touch.onInteract(triggerInteract);

// --- debug handle (harmless; handy for tuning) ------------------------------
window.PW = { engine, player, ctx, THREE, interaction, panel, hud, pet, cinematic, tour, touch, landing, nudge };

// --- go ---------------------------------------------------------------------
// Merge everything that never moves into a few big meshes (see core/bake.js).
bakeStatic(engine.scene);
engine.start();
document.getElementById('loading')?.remove();

// Projects district loads asynchronously (live GitHub fetch); the rest of the
// world is already interactive while it populates. Bake it in once it lands.
buildProjectsDistrict(ctx)
  .then(() => { bakeStatic(engine.scene); engine.invalidateShadows(); })
  .catch((err) => console.warn('[projects] failed to build:', err));
