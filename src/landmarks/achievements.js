// Achievements centerpiece — a faceted gold "Prism" trophy spinning in the middle
// of the spawn plaza for the MusaLabs hackathon win, under a floating "MUSALABS /
// HACKATHON" banner. No pedestal: it sits right on the plaza where you spawn.
//
// Ported from the standalone PrismTrophy component: a hex tiered base, an engraved
// MUSALABS plaque, a flat-shaded lathe goblet, a ring of facet diamonds, and a big
// faceted gem on top. The gold reflects the world env map (like the LeaseLink
// kiosk) with a touch of emissive so it stays bright and catches the dusk bloom.
import * as THREE from 'three';
import { makeWordmarkTexture, addFloatingLogo } from './floatingLogo.js';
import { addCircle } from '../core/colliders.js';

export function buildAchievements(ctx) {
  const { scene, voxel, palette, css, resume, registerInteractable, onUpdate, envMap } = ctx;
  const { patch } = voxel;
  const cx = 0, cz = 0; // dead center of the world / spawn plaza

  // The native prism tops out ~6.55 units; the old box trophy reached ~6.9. Scale
  // it up so it stands about 1.5x the old one (~10.5 tall) as a grand centerpiece.
  const SCALE = 1.6;

  // Solid round footprint so you can't walk through the base (sized to the flared
  // hex foot, a touch inset). `top` well above 5 keeps Raja from pouncing it.
  addCircle(cx, cz, 4.8, { top: 10.5 });

  // Gold accent pads marking the centerpiece, widened to sit under the base.
  scene.add(patch({ size: [13, 13], color: palette.achievement, pos: [cx, cz], y: 0.12 }));
  scene.add(patch({ size: [10, 10], color: palette.gold, pos: [cx, cz], y: 0.14 }));

  // --- materials: reflective gold (env-mapped) + a dark marble plinth ----------
  const gold     = new THREE.MeshStandardMaterial({ color: 0xffcf45, metalness: 1.0, roughness: 0.22, envMap, envMapIntensity: 1.4, emissive: 0xffcf45, emissiveIntensity: 0.12 });
  const goldDark = new THREE.MeshStandardMaterial({ color: 0xb8841a, metalness: 1.0, roughness: 0.32, envMap, envMapIntensity: 1.1, emissive: 0xb8841a, emissiveIntensity: 0.10 });
  const goldFlat = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 0.95, roughness: 0.3, flatShading: true, envMap, envMapIntensity: 1.3, emissive: 0xffc83a, emissiveIntensity: 0.14 });
  const marble   = new THREE.MeshStandardMaterial({ color: 0x2a1c0d, metalness: 0.25, roughness: 0.5, envMap, envMapIntensity: 0.5 });

  // engraved MUSALABS plaque texture (etched look: dark fill + raised gold)
  function plaqueTex(text) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 200;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 200);
    g.addColorStop(0, '#7a5d18'); g.addColorStop(1, '#4a370c');
    x.fillStyle = g; x.fillRect(0, 0, 640, 200);
    x.strokeStyle = '#332408'; x.lineWidth = 8; x.strokeRect(14, 14, 612, 172);
    x.font = "700 72px Georgia, 'Times New Roman', serif";
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#2c2006'; x.fillText(text, 322, 104);   // shadow / etch
    x.fillStyle = '#caa23a'; x.fillText(text, 320, 100);   // gold face
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  const plaqueTexture = plaqueTex('MUSALABS');
  const plaqueMat = new THREE.MeshStandardMaterial({ map: plaqueTexture, bumpMap: plaqueTexture, bumpScale: 0.04, metalness: 0.85, roughness: 0.4, envMap, envMapIntensity: 0.8 });

  // --- build the prism trophy (authored in native units; the group is scaled) --
  const trophy = new THREE.Group();
  trophy.position.set(cx, 0, cz);
  trophy.scale.setScalar(SCALE);

  // hex tiered base
  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.4, 0.6, 6), marble); b1.position.y = 0.3; trophy.add(b1);
  const b2 = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.6, 0.5, 6), goldDark); b2.position.y = 0.85; trophy.add(b2);
  const topY = 1.1;

  // angled engraved plaque on the front of the base, tilted up toward the player
  const plBack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.64, 0.14), gold);
  plBack.position.set(0, 0.95, 2.3); plBack.rotation.x = -0.7; trophy.add(plBack);
  const pl = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.48, 0.06), plaqueMat);
  pl.position.set(0, 0.99, 2.36); pl.rotation.x = -0.7; trophy.add(pl);

  // faceted goblet from a low-segment lathe + flat shading
  const cupPts = [
    [0, 0], [0.7, 0], [0.4, 0.5], [0.45, 1.4], [1.3, 2.3], [1.9, 3.4], [1.85, 3.5], [0, 3.45],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(cupPts, 7), goldFlat);
  cup.position.y = topY; trophy.add(cup);

  // big faceted gem on top (its own material so it can pulse + counter-spin)
  const gem = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, 0),
    new THREE.MeshStandardMaterial({ color: 0xffd95a, metalness: 1, roughness: 0.15, flatShading: true, envMap, envMapIntensity: 1.5, emissive: 0xffd95a, emissiveIntensity: 0.18 }),
  );
  gem.position.y = topY + 4.2; trophy.add(gem);

  // facet diamonds ringing the cup
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const dm = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), goldFlat);
    dm.position.set(Math.cos(a) * 1.75, topY + 2.9, Math.sin(a) * 1.75); trophy.add(dm);
  }

  trophy.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(trophy);

  // Floating "MUSALABS / HACKATHON" banner above the trophy (cleared of the gem).
  addFloatingLogo(ctx, {
    tex: makeWordmarkTexture({ primary: 'MUSALABS', secondary: 'HACKATHON', bg: '#2b2620', fg: '#ffd34e' }),
    center: [cx, cz], y: 13.5, size: [9, 3.4], bob: 0.4,
  });

  // Gentle spin; the gem counter-rotates and its glow pulses (the 1st-place sparkle).
  const gemBase = gem.material.emissiveIntensity;
  onUpdate((dt, elapsed) => {
    trophy.rotation.y = elapsed * 0.5;
    gem.rotation.y = -elapsed * 0.6;
    gem.material.emissiveIntensity = gemBase + 0.22 * (0.5 + 0.5 * Math.sin(elapsed * 4.0));
  });

  // --- Interactable at the trophy: LeaseLink, the project that won the hackathon ---
  const leaselink = resume.projectsFallback.find((p) => p.name === 'LeaseLink');
  registerInteractable({
    id: 'achievements',
    position: new THREE.Vector3(cx, 1.5, cz),
    radius: 6.5,
    data: {
      title: 'LeaseLink',
      subtitle: 'MusaLabs Hackathon Winner, 1st of 50+ teams',
      accent: css.achievement,
      lines: [leaselink.description],
      tags: ['React', 'Tailwind', 'Express.js', 'PostgreSQL', 'Google OAuth', 'WebSockets'],
    },
  });
}
