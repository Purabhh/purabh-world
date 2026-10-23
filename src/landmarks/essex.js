// Essex Securities landmark — the "ROTUNDA": a cylindrical glass-and-stone tower
// with a blue glass curtain wall, a red lobby base, and a street lamp out front. Ported from the CASCADE 3D component.
//
// The single Essex role (AI EPS agent, crypto exchange MVP, Bloomberg EMSX)
// stay as two plaque kiosks flanking the entrance, each its own interactable zone.
import * as THREE from 'three';
import { makeWordmarkTexture, addFloatingLogo } from './floatingLogo.js';
import { addCircle } from '../core/colliders.js';
import { tileTexture, worldTileUVs } from '../voxel/voxel.js';

// soft radial sprite (lamp glow)
function makeRadial(rgb, soft) {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, rgb);
  g.addColorStop(soft || 0.5, rgb.replace('rgb', 'rgba').replace(')', ',0.35)'));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

// unrolled cylinder skin: white punched-window concrete + a dark mirror-glass
// curtain-wall arc on the front, plus an emissive map for a few lit windows.
function makeCylinderTex() {
  // Full 360-degree glass curtain wall: the same blue glass, mullions and floor
  // bands all the way round, so the back of the tower looks as good as the front.
  const W = 2048, H = 1180;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const cols = 48, rows = 34, cw = W / cols, rh = H / rows;   // 34 floors, 48 bays
  let s = 20231; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  // sky reflection: pale at the top, deep steel blue at the bottom
  const sky = x.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#9fb6cf'); sky.addColorStop(.35, '#5a718a'); sky.addColorStop(.7, '#2f4152'); sky.addColorStop(1, '#1b2733');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);

  // glass panes: each pane slightly different so the wall shimmers
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const px = i * cw, py = j * rh;
    const t = j / rows, v = (rnd() - 0.5) * 0.12;
    const top = `rgb(${Math.round(120 + 70 * (1 - t) + v * 80)},${Math.round(150 + 60 * (1 - t) + v * 80)},${Math.round(180 + 50 * (1 - t) + v * 80)})`;
    const bot = `rgb(${Math.round(40 + 40 * (1 - t))},${Math.round(60 + 40 * (1 - t))},${Math.round(84 + 40 * (1 - t))})`;
    const g = x.createLinearGradient(px, py, px, py + rh);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    x.fillStyle = g; x.fillRect(px, py, cw, rh);
  }

  // two soft diagonal sheen stripes across the whole wrap
  x.save();
  x.fillStyle = 'rgba(235,242,252,.10)';
  for (const off of [W * 0.12, W * 0.62]) {
    x.save(); x.translate(off, 0); x.rotate(0.10);
    x.fillRect(0, -80, W * 0.09, H + 160); x.fillRect(W * 0.14, -80, W * 0.035, H + 160);
    x.restore();
  }
  x.restore();

  // floor spandrels: a dark band with a light edge between every floor
  for (let j = 0; j <= rows; j++) {
    const ly = j * rh;
    x.fillStyle = 'rgba(14,20,28,.78)'; x.fillRect(0, ly - rh * 0.11, W, rh * 0.22);
    x.fillStyle = 'rgba(210,222,238,.28)'; x.fillRect(0, ly + rh * 0.11, W, 2);
  }
  // mullions: thin dark line + light highlight on each bay
  for (let i = 0; i <= cols; i++) {
    const lx = i * cw;
    x.fillStyle = 'rgba(14,20,28,.7)'; x.fillRect(lx - 1.5, 0, 3, H);
    x.fillStyle = 'rgba(210,222,238,.22)'; x.fillRect(lx + 1.5, 0, 1, H);
  }
  // four evenly spaced metal fins for rhythm (one lands on the front)
  for (let k = 0; k < 4; k++) {
    const fx = (k / 4) * W;
    const fg = x.createLinearGradient(fx - 7, 0, fx + 7, 0);
    fg.addColorStop(0, '#9aa5b2'); fg.addColorStop(.5, '#eef2f6'); fg.addColorStop(1, '#8792a0');
    x.fillStyle = fg; x.fillRect(fx - 7, 0, 14, H);
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping; map.wrapT = THREE.ClampToEdgeWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;

  // emissive: lit windows scattered all the way round, warmer toward the bottom floors
  const e = document.createElement('canvas'); e.width = W; e.height = H; const ex = e.getContext('2d');
  ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    if (rnd() < 0.16) {
      const warm = rnd() > 0.35; const a = 0.45 + rnd() * 0.35;
      ex.fillStyle = warm ? `rgba(240,186,110,${a})` : `rgba(160,196,236,${a})`;
      ex.fillRect(i * cw + 3, j * rh + rh * 0.13, cw - 6, rh * 0.74);
    }
  }
  const emis = new THREE.CanvasTexture(e);
  emis.wrapS = THREE.RepeatWrapping; emis.wrapT = THREE.ClampToEdgeWrapping; emis.anisotropy = 8;
  return { map, emis };
}

// rounded white ESSEX SECURITIES plaque for the lobby base
function makeLogoTex() {
  const W = 1024, H = 300, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const r = 26; x.beginPath();
  x.moveTo(r, 0); x.arcTo(W, 0, W, H, r); x.arcTo(W, H, 0, H, r); x.arcTo(0, H, 0, 0, r); x.arcTo(0, 0, W, 0, r); x.closePath();
  x.fillStyle = '#f5f6f8'; x.fill();
  // flame + star mark
  x.save(); x.translate(40, 34); x.scale(4.0, 4.0);
  x.fillStyle = '#E0531E'; x.beginPath(); x.moveTo(8, 52); x.lineTo(40, 52); x.lineTo(34, 22); x.closePath(); x.fill();
  x.fillStyle = '#F2911E'; x.beginPath(); x.moveTo(26, 52); x.lineTo(56, 52); x.lineTo(48, 6); x.closePath(); x.fill();
  const pts = [[16, 2], [18.6, 9.4], [26.5, 9.6], [20.2, 14.4], [22.5, 21.9], [16, 17.4], [9.5, 21.9], [11.8, 14.4], [5.5, 9.6], [13.4, 9.4]];
  x.fillStyle = '#F2911E'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
  x.restore();
  x.textBaseline = 'alphabetic';
  x.fillStyle = '#4c5258'; x.font = '700 150px "Space Grotesk", Arial, sans-serif'; x.fillText('ESSEX', 300, 170);
  x.fillStyle = '#7c8086'; x.font = '500 56px "IBM Plex Mono", monospace';
  let sx = 304; for (const ch of 'SECURITIES') { x.fillText(ch, sx, 238); sx += x.measureText(ch).width + 9; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function buildEssex(ctx) {
  const { scene, css, layout, resume, registerInteractable, onUpdate, envMap } = ctx;
  const [cx, cz] = layout.DISTRICTS.essex.center; // [54, 28]

  // Solid round footprint so you can't walk through the tower.
  addCircle(cx, cz, 6.7, { top: 40 });

  // Stone plaza disc, raised a hair above the terrain paint with a polygon offset
  // so the near-coplanar surfaces don't z-fight.
  // Paved with the shared stone texture (world-space, so it lines up with the paths).
  const plazaMat = new THREE.MeshStandardMaterial({ color: 0xa7adb5, map: tileTexture(), roughness: 0.82, metalness: 0.08, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const plaza = new THREE.Mesh(worldTileUVs(new THREE.CylinderGeometry(14, 14, 0.5, 64), [cx, cz], 5), plazaMat);
  plaza.position.set(cx, -0.03, cz); // top face ~0.22
  plaza.receiveShadow = true; scene.add(plaza);

  // Everything is authored in LOCAL coords (front on +Z), then the group is yawed
  // -90 deg so the entrance/logo/glass face the origin (-X) where players approach.
  const essex = new THREE.Group();
  essex.position.set(cx, 0, cz);
  essex.rotation.y = -Math.PI / 2;
  scene.add(essex);

  // Sized to stand as tall as the BNY tower (~y39 at the roof).
  const R = 6, TH = 34, baseTop = 5, towerCy = baseTop + TH / 2;

  // ---- tower (glass + stone cylinder) ----
  const { map, emis } = makeCylinderTex();
  const towerMat = new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: emis, emissiveIntensity: 0.6, color: 0xffffff, roughness: 0.3, metalness: 0.45, envMap, envMapIntensity: 0.9 });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(R, R, TH, 80, 1, true), towerMat);
  tower.position.y = towerCy; tower.rotation.y = Math.PI; tower.castShadow = true; tower.receiveShadow = true;
  essex.add(tower);

  // cornice + roof
  const cornice = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.28, R + 0.28, 0.5, 80), new THREE.MeshStandardMaterial({ color: 0xeef0f3, roughness: 0.7, metalness: 0.15 }));
  cornice.position.y = baseTop + TH + 0.05; cornice.castShadow = true; essex.add(cornice);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.05, R + 0.05, 0.35, 80), new THREE.MeshStandardMaterial({ color: 0x2c3641, roughness: 0.6, metalness: 0.35 }));
  roof.position.y = baseTop + TH + 0.32; essex.add(roof);

  // red lobby base + glazing ring + canopy + ESSEX logo plaque
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.25, R + 0.45, baseTop - 0.5, 80), new THREE.MeshStandardMaterial({ color: 0x7a2f29, roughness: 0.72, metalness: 0.12 }));
  base.position.y = 0.5 + (baseTop - 0.5) / 2; base.castShadow = true; base.receiveShadow = true; essex.add(base);
  const lobby = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.27, R + 0.27, 1.3, 80, 1, true), new THREE.MeshStandardMaterial({ color: 0x11202c, roughness: 0.25, metalness: 0.6, emissive: 0x1a2e3a, emissiveIntensity: 0.5, side: THREE.DoubleSide, envMap, envMapIntensity: 0.8 }));
  lobby.position.y = 1.35; essex.add(lobby);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 1.2), new THREE.MeshStandardMaterial({ color: 0x20262e, roughness: 0.5, metalness: 0.4 }));
  canopy.position.set(0, 1.9, R + 0.55); canopy.castShadow = true; essex.add(canopy);
  // Lit (not unlit/emissive) so the plaque reads in daylight but never shines or
  // blooms at night.
  const logoSign = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.91), new THREE.MeshStandardMaterial({ map: makeLogoTex(), transparent: true, roughness: 1, metalness: 0 }));
  logoSign.position.set(0, 2.62, R + 0.52); essex.add(logoSign);

  // ---- street lamp (out on the plaza) ----
  const lampMetal = new THREE.MeshStandardMaterial({ color: 0x1c2027, roughness: 0.6, metalness: 0.5 });
  const lampG = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 9, 16), lampMetal); pole.position.y = 4.5; pole.castShadow = true; lampG.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), lampMetal); arm.position.set(-0.5, 8.9, 0); lampG.add(arm);
  for (const dx of [-1.0, -0.1]) {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff3da, emissive: 0xffe6b0, emissiveIntensity: 1.4 }));
    head.position.set(dx, 8.82, 0); lampG.add(head);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeRadial('rgb(255,225,160)', 0.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    gl.position.set(dx, 8.82, 0); gl.scale.set(2.2, 2.2, 1); lampG.add(gl);
  }
  lampG.position.set(11, 0.5, 7); essex.add(lampG);

  // ---- two role interactable zones flanking the entrance (front, -X world) ----
  // The blue plaque signs were removed per request; the zones stay so walking up to
  // either side of the entrance still opens that role. local (lx, lz) maps to world
  // (cx - lz, cz + lx) under the -90deg group yaw.
  const kLz = 7.8;
  const worldA = new THREE.Vector3(cx - kLz, 1.5, cz + (-3.5)); // left of entrance
  const worldB = new THREE.Vector3(cx - kLz, 1.5, cz + 3.5);    // right of entrance

  // Floating "ESSEX SECURITIES" banner so the tower is identifiable from afar.
  addFloatingLogo(ctx, {
    tex: makeWordmarkTexture({ primary: 'ESSEX', secondary: 'SECURITIES', bg: '#0e1726', fg: '#eaf0fb' }),
    center: [cx, cz], y: 48, size: [9.5, 3.8], bob: 0.35,
  });

  // ---- interactable (one Essex role, zone centered on the entrance) ----
  const role = resume.experience.find((e) => e.id === 'essex');
  const worldE = new THREE.Vector3((worldA.x + worldB.x) / 2, 1.5, (worldA.z + worldB.z) / 2);

  registerInteractable({
    id: 'essex',
    position: worldE,
    radius: 4.5,
    bounds: { x: cx, z: cz, hw: 14, hd: 14 },                 // the round plaza the tower stands on
    data: {
      title: 'Essex Securities: ' + role.role,
      subtitle: role.dates + ' · ' + role.location,
      accent: css.essex,
      lines: role.bullets,
      tags: role.tags,
    },
  });
}
