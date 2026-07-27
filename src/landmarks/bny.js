// BNY landmark — the signature tower.
// A tall gold bank skyscraper: 14 tapering floors with a lit-window facade, a
// rooftop mechanical cluster, a blinking aircraft beacon, a glowing lobby, the BNY
// wordmark, and a column of "increment" lights that climb the front corner on a
// loop (a nod to the Hyperledger Besu audit trail filling up). Ported from the
// standalone BNY Tower component; its plaza base is kept as flush plaza patches.
import * as THREE from 'three';
import { addFloatingLogo } from './floatingLogo.js';
import { addBox } from '../core/colliders.js';

// The BNY wordmark (teal arrowhead + navy "BNY") drawn to a canvas, used as a
// transparent sign texture on the tower's front face.
function makeBnyLogoTexture() {
  const w = 1024, h = 410;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');

  // teal arrowhead / chevron
  const cy = h / 2;
  g.fillStyle = '#2E9CB8';
  g.beginPath();
  g.moveTo(150, cy - 150);
  g.lineTo(372, cy);
  g.lineTo(150, cy + 150);
  g.lineTo(226, cy);
  g.closePath();
  g.fill();

  // navy "BNY"
  g.fillStyle = '#0C2340';
  g.font = '900 232px Arial, "Arial Black", sans-serif';
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillText('BNY', 432, cy + 6);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Gold facade: a base color map (windows + mullions) plus an emissive map with a
// scatter of lit windows so some panes glow at dusk through the bloom pass.
function makeFacadeTex() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const x = cv.getContext('2d');
  x.fillStyle = '#d9a52e'; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = 'rgba(120,80,10,0.25)'; x.lineWidth = 1;
  for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 128); x.stroke(); }
  const winCols = 7, top = 34, h = 60, gap = 256 / winCols;
  for (let c = 0; c < winCols; c++) {
    const wx = c * gap + 6;
    x.fillStyle = '#6f521a'; x.fillRect(wx, top, gap - 12, h);
    x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(wx, top, gap - 12, 6);
    x.fillStyle = 'rgba(60,40,8,0.5)'; x.fillRect(wx + (gap - 12) / 2 - 0.5, top, 1, h);
  }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 1); tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  const ev = document.createElement('canvas'); ev.width = 256; ev.height = 128; const ex = ev.getContext('2d');
  ex.fillStyle = '#000'; ex.fillRect(0, 0, 256, 128);
  for (let c = 0; c < winCols; c++) { if (Math.random() < 0.28) { ex.fillStyle = Math.random() < 0.5 ? '#caa45a' : '#8fb6d6'; ex.fillRect(c * gap + 6, top, gap - 12, h); } }
  const etex = new THREE.CanvasTexture(ev); etex.wrapS = etex.wrapT = THREE.RepeatWrapping; etex.repeat.set(2, 1);
  return { tex, etex };
}

export function buildBny(ctx) {
  const { scene, css, layout, resume, registerInteractable, onUpdate, envMap } = ctx;
  const [cx, cz] = layout.DISTRICTS.bny.center; // [-54, 28]

  // --- Base plaza (kept from the design). Raw slabs that sit just ABOVE the
  //     terrain's plaza paint, with a polygon offset so the near-coplanar
  //     surfaces don't z-fight (that coplanar fight was the flicker at the base). ---
  const padSlab = (size, color, top, off) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: off, polygonOffsetUnits: off });
    const s = new THREE.Mesh(new THREE.BoxGeometry(size, 0.5, size), m);
    s.position.set(cx, top - 0.25, cz); // 0.5-tall slab -> its top face sits at `top`
    s.castShadow = false; s.receiveShadow = true;
    scene.add(s);
  };
  padSlab(38, 0x20283a, 0.20, -2);
  padSlab(26, 0x39414f, 0.24, -4);

  // Solid podium footprint so you can't walk through the tower.
  addBox(cx, cz, 9, 9, { top: 42 });

  // The tower is authored in LOCAL coords with its front on +Z, then placed and
  // yawed +90 deg so the front (entrance, logo, climbing lights) faces the origin
  // (+X), which is where the player approaches from.
  const tower = new THREE.Group();
  tower.position.set(cx, 0, cz);
  tower.rotation.y = Math.PI / 2;
  scene.add(tower);

  const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const mat = (hex, opts = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.92, metalness: 0.02, ...opts });
  const add = (geo, m, x, y, z, shadow = true) => {
    const me = new THREE.Mesh(geo, m); me.position.set(x, y, z);
    if (shadow) { me.castShadow = true; me.receiveShadow = true; }
    tower.add(me); return me;
  };

  // ---- materials ----
  const fac = makeFacadeTex();
  // Exact component facade: the gold window map PLUS an emissive map that lights a
  // random scatter of windows (some lit, some dark) so the tower reads like the
  // reference BNY Tower component instead of a flat gold slab.
  const wallMat = new THREE.MeshStandardMaterial({ map: fac.tex, emissive: 0xffffff, emissiveMap: fac.etex, emissiveIntensity: 0.22, roughness: 0.55, metalness: 0.25 });
  const bandMat = mat(0xae7c1c, { roughness: 0.55, metalness: 0.3, envMap, envMapIntensity: 0.6 });
  const trimMat = mat(0x8a6314, { roughness: 0.5, metalness: 0.35, envMap, envMapIntensity: 0.6 });

  const baseW = 12, baseD = 12;
  const floors = 14, fH = 2.6;
  let y = 1;
  add(boxGeo(18, 2, 18), mat(0xc79722, { roughness: 0.6, metalness: 0.25, envMap, envMapIntensity: 0.5 }), 0, 1, 0); // podium
  y = 2;
  for (let i = 0; i < floors; i++) {
    const t = i / floors;
    const w = baseW - t * 2.2, d = baseD - t * 2.2;
    add(boxGeo(w, fH - 0.5, d), wallMat, 0, y + (fH - 0.5) / 2, 0);
    add(boxGeo(w + 0.25, 0.5, d + 0.25), bandMat, 0, y + (fH - 0.5) + 0.25, 0);
    y += fH;
  }
  add(boxGeo(baseW - 3.2, 1.6, baseD - 3.2), mat(0xe6bf4a, { roughness: 0.5, metalness: 0.3, envMap, envMapIntensity: 0.6 }), 0, y + 0.8, 0);
  add(boxGeo(2, 3, 2), mat(0xae7c1c, { roughness: 0.55, metalness: 0.3 }), 0, y + 1.6 + 1.5, 0);
  const topY = y;

  // vertical corner fins
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    add(boxGeo(0.6, topY - 2, 0.6), trimMat, sx * (baseW / 2 - 1.2), 2 + (topY - 2) / 2, sz * (baseD / 2 - 1.2));
  }

  // rooftop mechanical cluster
  const roofY = topY + 1.6;
  add(boxGeo(3.2, 1.4, 2.2), trimMat, -2.2, roofY + 0.7, 1.4);
  add(boxGeo(2.2, 1.0, 2.2), trimMat, 1.8, roofY + 0.5, -1.6);
  add(boxGeo(0.8, 1.8, 0.8), mat(0x5a4310), 2.6, roofY + 0.9, 1.8);
  add(boxGeo(1.6, 0.5, 1.6), trimMat, -2.0, roofY + 0.25, -1.8);
  const pW = baseW - 3.2;
  add(boxGeo(pW, 0.4, 0.4), trimMat, 0, roofY + 0.2, pW / 2);
  add(boxGeo(pW, 0.4, 0.4), trimMat, 0, roofY + 0.2, -pW / 2);
  add(boxGeo(0.4, 0.4, pW), trimMat, pW / 2, roofY + 0.2, 0);
  add(boxGeo(0.4, 0.4, pW), trimMat, -pW / 2, roofY + 0.2, 0);

  // antenna mast + blinking beacon
  add(boxGeo(0.35, 8, 0.35), mat(0x3a2c0c), 0, roofY + 4, 0);
  add(boxGeo(0.18, 5, 0.18), mat(0x3a2c0c), 0, roofY + 8 + 2.5, 0);
  const beaconMat = new THREE.MeshStandardMaterial({ color: 0xff3322, emissive: 0xff2a1a, emissiveIntensity: 2 });
  const beacon = add(new THREE.SphereGeometry(0.45, 12, 12), beaconMat, 0, roofY + 8, 0, false);
  const beaconLight = new THREE.PointLight(0xff3322, 0, 18, 2);
  beacon.add(beaconLight);

  // entrance canopy + lobby glow (front face = +Z local)
  add(boxGeo(9, 0.5, 3), trimMat, 0, 3.4, baseD / 2 + 1.2);
  add(boxGeo(0.4, 3.4, 0.4), trimMat, 3.8, 1.7, baseD / 2 + 2.4);
  add(boxGeo(0.4, 3.4, 0.4), trimMat, -3.8, 1.7, baseD / 2 + 2.4);
  const lobbyMat = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffe6a0, emissiveIntensity: 1.6 });
  add(boxGeo(7.5, 2.6, 0.2), lobbyMat, 0, 2.0, baseD / 2 + 0.02, false);
  const lobbyLight = new THREE.PointLight(0xffe2a0, 3, 16, 2);
  lobbyLight.position.set(0, 3, baseD / 2 + 2); tower.add(lobbyLight);

  // ---- BNY logo plate on the front face ----
  // Oversized wordmark: the visible mark spans wider than the tower itself
  // (~12.3 of ink vs the 12-wide base), centered on the facade. It overlaps the
  // climbing-light column on the right, so the column skips the cells behind it
  // (see the light loop below).
  const logoTex = makeBnyLogoTexture();
  const logoMat = new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, alphaTest: 0.4, roughness: 0.5, metalness: 0, emissive: 0xffffff, emissiveMap: logoTex, emissiveIntensity: 0.6, side: THREE.DoubleSide });
  const signW = 17, signH = 6.8;
  const signY = topY * 0.66;
  const logoPlate = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), logoMat);
  logoPlate.position.set(0, signY, baseD / 2 + 0.12);
  tower.add(logoPlate);

  // ---- climbing "increment" lights up the front corner (emissive; the world's
  //      bloom makes them glow). They fill bottom-to-top on a loop. ----
  const lightGroup = new THREE.Group(); tower.add(lightGroup);
  const lightX = baseW / 2 - 0.4, lightZ = baseD / 2 - 0.4; // front corner facing the player
  const cellH = 1.55;
  const cells = [];
  const onColor = new THREE.Color(0xbfe8ff);
  const offColor = new THREE.Color(0x2c3a52);
  for (let i = 0; i < 24; i++) {
    const cy = 2.4 + i * cellH;
    // The oversized wordmark covers this stretch of the column — drop the cells
    // behind it so the climb reads: lights, then the sign (no lights), then
    // lights again above it.
    if (cy + cellH * 0.43 > signY - signH / 2 && cy - cellH * 0.43 < signY + signH / 2) continue;
    const m = new THREE.MeshStandardMaterial({ color: offColor.clone(), emissive: offColor.clone(), emissiveIntensity: 0, roughness: 0.4, metalness: 0.1 });
    const cube = new THREE.Mesh(boxGeo(1.5, cellH * 0.86, 1.5), m);
    const tt = i / 24;
    cube.position.set(lightX - tt * 1.0, cy, lightZ - tt * 1.0);
    cube.castShadow = true;
    lightGroup.add(cube);
    cells.push({ mat: m, lit: 0, target: 0 });
  }

  // ---- animation: climbing-light fill loop + beacon blink ----
  let litCount = 0, incT = 0, holdT = 0;
  onUpdate((dt, elapsed) => {
    if (litCount < cells.length) {
      incT += dt;
      if (incT >= 0.42) { incT = 0; cells[litCount].target = 1; litCount++; } // light the next one
    } else {
      holdT += dt;
      if (holdT >= 2.2) { holdT = 0; litCount = 0; for (const c of cells) c.target = 0; } // hold full, then reset
    }
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      c.lit += (c.target - c.lit) * Math.min(1, dt * 6);
      const flick = c.target > 0.5 ? (0.85 + 0.15 * Math.sin(elapsed * 9 + i * 1.3)) : 1;
      c.mat.emissive.copy(offColor).lerp(onColor, c.lit);
      c.mat.emissiveIntensity = c.lit * flick * 3.2;
      c.mat.color.copy(offColor).lerp(onColor, c.lit * 0.8);
    }
    const b = Math.max(0, Math.sin(elapsed * 2.4)); const pulse = b * b;
    beaconMat.emissiveIntensity = 0.4 + pulse * 3.2;
    beaconLight.intensity = pulse * 6;
  });

  // Floating BNY logo above the tower (no background panel, just the mark),
  // billboarding toward the player like the Essex banner.
  addFloatingLogo(ctx, {
    tex: makeBnyLogoTexture(),
    center: [cx, cz], y: 56, size: [11, 4.4], bob: 0.4,
  });

  // --- Interactable from the BNY experience entry (anchored at the entrance) ---
  const bny = resume.experience.find((e) => e.id === 'bny');
  registerInteractable({
    id: 'bny',
    position: new THREE.Vector3(cx + 10, 2.2, cz),
    radius: 8,
    data: {
      title: 'BNY: ' + bny.role,
      subtitle: bny.dates + ' · ' + bny.location,
      accent: css.bny,
      lines: bny.bullets,
      tags: bny.tags,
    },
  });
}
