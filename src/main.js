// Bootstrap + integration. Builds the engine context, assembles the world from
// each module, and runs the interaction -> UI loop.
import * as THREE from 'three';
import { createEngine } from './core/engine.js';
import * as voxel from './voxel/voxel.js';
import { palette, layout, css, config } from './core/constants.js';
import * as resume from './data/resume.js';
import * as interaction from './core/interaction.js';
import { createPlayer } from './player/player.js';

import { buildTerrain } from './world/terrain.js';
import { buildEnvironment } from './world/environment.js';
import { buildLanterns } from './world/lanterns.js';
import { buildAtmosphere } from './world/atmosphere.js';
import { buildPet } from './world/pet.js';
import { buildLandmarks } from './landmarks/index.js';
import { buildProjectsDistrict } from './projects/projectsDistrict.js';
import { createHUD } from './ui/hud.js';
import { createPanel } from './ui/panel.js';
import { createLanding } from './ui/landing.js';
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

// --- player (gated behind the landing screen) -------------------------------
const player = createPlayer(ctx);
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
if (touch.active) {
  hud.setControlsHint(
    'Left stick to move · drag right side to look · ' +
    '<span class="pw-kbd">⦿</span> interact · <span class="pw-kbd">»</span> sprint',
  );
}

// While an intro/tour owns the camera the player is suspended; both hand control
// back to free-roam at spawn when they finish.
function suspendPlayer() {
  player.setEnabled(false);
  player.setCinematic(true);
  player.root.visible = false;
  touch.setVisible(false);
}
function handoffToPlayer() {
  player.setCinematic(false);
  player.setEnabled(true);
  player.root.visible = true;
  hud.setControlsVisible(true);
  touch.setVisible(true);
  if (!touch.active) nudge.show();
}

// Cinematic intro: a labeled fly-through past every landmark (captions only).
const cinematic = createCinematic(ctx, { onComplete: handoffToPlayer });
// Recruiter Tour: a guided, hands-free walkthrough that pops each landmark's full
// info card with auto-advance + controls, ending on a "Let's connect" CTA.
const tour = createTour(ctx, { panel, onComplete: handoffToPlayer });

const landing = createLanding({
  onEnter: () => { suspendPlayer(); cinematic.play(); },   // free roam (after the quick intro)
  onTour: () => { suspendPlayer(); tour.play(); },         // guided recruiter tour
});

// Home button (HUD, top-left): bail out of free-roam back to the landing
// screen. Rewinds the intro/tour so "Enter World" / "Take the Tour" play
// again cleanly next time, instead of no-op'ing because they'd already run.
hud.onHome(() => {
  if (panel.isOpen()) panel.hide();
  if (pet.isMounted()) pet.dismount();
  suspendPlayer();
  cinematic.reset();
  tour.reset();
  nudge.hide();
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
  if (cinematic.playing || tour.playing) { hud.setPrompt(null); near = null; touch.setInteract(false); return; } // mute during intro/tour
  if (pet.isMounted()) {
    hud.setPrompt('Riding Raja · WASD drive · Shift sprint · Space leap · E to hop off');
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
  if (cinematic.playing || tour.playing) return;        // the tour drives its own cards
  if (pet.isMounted()) { pet.dismount(); return; }      // hop off from anywhere
  if (panel.isOpen()) panel.hide();
  else if (near && near.action) near.action();          // mount Raja / open a card
  else if (near) { openAnchor = near.position; panel.show({ ...near.data, eyebrow: eyebrowFor(near.id) }); }
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE') triggerInteract();
});
touch.onInteract(triggerInteract);

// --- debug handle (harmless; handy for tuning) ------------------------------
window.PW = { engine, player, ctx, THREE, interaction, panel, hud, pet, cinematic, tour, touch, landing, nudge };

// --- go ---------------------------------------------------------------------
engine.start();
document.getElementById('loading')?.remove();

// Projects district loads asynchronously (live GitHub fetch); the rest of the
// world is already interactive while it populates.
buildProjectsDistrict(ctx).catch((err) => console.warn('[projects] failed to build:', err));
