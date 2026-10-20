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
    new THREE.IcosahedronGeometry(1.25, 1),   // more facets = more sparkle
    new THREE.MeshStandardMaterial({ color: 0xffd95a, metalness: 1, roughness: 0.15, flatShading: true, envMap, envMapIntensity: 1.5, emissive: 0xffd95a, emissiveIntensity: 0.18 }),
  );
  gem.position.y = topY + 4.2; trophy.add(gem);

  // --- detail pass: everything below is parented to the trophy, so it spins with it
  // heptagon ring that lines up with the 7-sided lathe (first vertex on +Z)
  const hepRing = (r, tube, y, mat) => {
    const g = new THREE.TorusGeometry(r, tube, 8, 7);
    g.rotateX(Math.PI / 2); g.rotateY(-Math.PI / 2);
    const m = new THREE.Mesh(g, mat); m.position.y = y; trophy.add(m); return m;
  };
  hepRing(1.86, 0.07, topY + 3.47, gold);      // rolled lip on the rim
  hepRing(1.33, 0.06, topY + 2.3, goldDark);   // band where the bowl flares out
  // stem: snug collars top + bottom and a round knop in the middle
  const collar = (r, y) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 10, 28), goldDark);
    m.rotation.x = Math.PI / 2; m.position.y = y; trophy.add(m);
  };
  collar(0.43, topY + 0.5); collar(0.47, topY + 1.4);
  const knop = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 12), gold);
  knop.scale.set(1, 0.55, 1); knop.position.y = topY + 0.95; trophy.add(knop);

  // two scrolled handles; both ends sink into the bowl so they're attached
  for (const s of [-1, 1]) {
    const pts = [[1.45, 3.25], [2.3, 3.45], [2.85, 3.0], [2.75, 2.3], [2.2, 1.95], [1.4, 2.05], [0.85, 2.1]]
      .map(([x, y]) => new THREE.Vector3(s * x, topY + y, 0));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.11, 12, false), gold);
    trophy.add(tube);
    // little curl at the top + decorative bands along the handle
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 8, 20), goldDark);
    curl.position.set(s * 2.95, topY + 3.25, 0); trophy.add(curl);
    for (const [x, y] of [[2.8, 2.7], [2.45, 2.05]]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), goldDark);
      b.position.set(s * x, topY + y, 0); trophy.add(b);
    }
  }

  // gem setting: six prongs from the rim up to the gem's waist, ball tips
  const prongMat = goldDark;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const from = new THREE.Vector3(Math.cos(a) * 1.45, topY + 3.45, Math.sin(a) * 1.45);
    const to = new THREE.Vector3(Math.cos(a) * 1.0, topY + 4.35, Math.sin(a) * 1.0);
    const len = from.distanceTo(to);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, len, 8), prongMat);
    p.position.copy(from).lerp(to, 0.5);
    p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    trophy.add(p);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), gold);
    tip.position.copy(to); trophy.add(tip);
  }
  // detail riding on the gem (spins with it): a waist band + a star finial on top
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 40), goldDark);
  band.rotation.x = Math.PI / 2; gem.add(band);
  const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), gem.material);
  finial.scale.set(0.7, 1.5, 0.7); finial.position.y = 1.55; gem.add(finial);
  const finBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.3, 10), goldDark);
  finBase.position.y = 1.15; gem.add(finBase);

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
    bounds: { x: cx, z: cz, hw: 8, hd: 8 },                   // the whole trophy plinth
    data: {
      title: 'LeaseLink',
      subtitle: 'MusaLabs Hackathon Winner, 1st of 50+ teams',
      accent: css.achievement,
      lines: [leaselink.description],
      tags: ['React', 'Tailwind', 'Express.js', 'PostgreSQL', 'Google OAuth', 'WebSockets'],
    },
  });
}
