// Essex Securities landmark — the "ROTUNDA": a cylindrical glass-and-stone tower
// with a dark mirror curtain-wall arc, a red lobby base, a rotating stock-ticker
// crown, and a street lamp out front. Ported from the CASCADE 3D component.
//
// The two Essex roles (essex2: AI tool + crypto exchange; essex1: Bloomberg EMSX)
// stay as two plaque kiosks flanking the entrance, each its own interactable zone.
import * as THREE from 'three';
import { makeWordmarkTexture, addFloatingLogo } from './floatingLogo.js';
import { addCircle } from '../core/colliders.js';

// soft radial sprite (lamp glow + crown halo)
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
  const W = 2048, H = 1180;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  // Column/row counts scaled to the taller, wider tower so window panes keep
  // their proportions instead of stretching.
  const cols = 68, rows = 50, cw = W / cols, rh = H / rows;
  let s = 20231; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  x.fillStyle = '#e7eaee'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const wx = i * cw + cw * 0.24, wy = j * rh + rh * 0.16, ww = cw * 0.52, wh = rh * 0.66;
    const g = x.createLinearGradient(wx, wy, wx, wy + wh);
    g.addColorStop(0, '#5d7186'); g.addColorStop(.5, '#33485b'); g.addColorStop(1, '#465e72');
    x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
    x.fillStyle = 'rgba(220,234,248,.25)'; x.fillRect(wx, wy, ww, wh * 0.18);
  }

  const gx0 = Math.floor(0.30 * W), gx1 = Math.floor(0.70 * W), gW = gx1 - gx0;
  const gg = x.createLinearGradient(0, 0, 0, H);
  gg.addColorStop(0, '#d4ddee'); gg.addColorStop(.30, '#7c8ca6'); gg.addColorStop(.52, '#3d4d61'); gg.addColorStop(.78, '#26333f'); gg.addColorStop(1, '#1a232e');
  x.fillStyle = gg; x.fillRect(gx0, 0, gW, H);
  const sweep = x.createLinearGradient(gx0, 0, gx1, H * 0.5);
  sweep.addColorStop(0, 'rgba(225,232,245,.30)'); sweep.addColorStop(.45, 'rgba(225,232,245,0)');
  x.fillStyle = sweep; x.fillRect(gx0, 0, gW, H);
  const gcols = 30, gstep = gW / gcols;
  for (let i = 0; i <= gcols; i++) {
    const lx = gx0 + i * gstep;
    x.strokeStyle = 'rgba(12,18,26,.55)'; x.lineWidth = 2; x.beginPath(); x.moveTo(lx, 0); x.lineTo(lx, H); x.stroke();
    x.strokeStyle = 'rgba(200,218,242,.16)'; x.lineWidth = 1; x.beginPath(); x.moveTo(lx + 1.5, 0); x.lineTo(lx + 1.5, H); x.stroke();
  }
  for (let j = 0; j <= rows; j++) { const ly = j * rh; x.strokeStyle = 'rgba(12,18,26,.5)'; x.lineWidth = 2; x.beginPath(); x.moveTo(gx0, ly); x.lineTo(gx1, ly); x.stroke(); }
  x.fillStyle = 'rgba(232,238,250,.12)';
  x.save(); x.beginPath(); x.rect(gx0, 0, gW, H); x.clip();
  x.translate(gx0 + gW * 0.35, 0); x.rotate(0.12); x.fillRect(0, -50, gW * 0.10, H + 100); x.fillRect(gW * 0.28, -50, gW * 0.05, H + 100); x.restore();
  x.strokeStyle = '#f1f3f6'; x.lineWidth = 5;
  x.beginPath(); x.moveTo(gx0, 0); x.lineTo(gx0, H); x.stroke();
  x.beginPath(); x.moveTo(gx1, 0); x.lineTo(gx1, H); x.stroke();

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping; map.wrapT = THREE.ClampToEdgeWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;

  const e = document.createElement('canvas'); e.width = W; e.height = H; const ex = e.getContext('2d');
  ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
  for (let i = 0; i < cols; i++) {
    const inGlass = (i * cw > gx0 - cw && i * cw < gx1);
    for (let j = 0; j < rows; j++) {
      const p = inGlass ? 0.05 : 0.12;
      if (rnd() < p) {
        const warm = rnd() > 0.25; const a = 0.4 + rnd() * 0.3;
        ex.fillStyle = warm ? `rgba(232,170,96,${a})` : `rgba(150,185,225,${a})`;
        ex.fillRect(i * cw + cw * 0.24, j * rh + rh * 0.16, cw * 0.52, rh * 0.66);
      }
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

// scrolling stock-ticker strip for the crown. Each item is drawn large enough to
// read as actual market data; the strip wraps the cylinder roughly once (repeat
// ~1) so it never compresses into a blur of colored lines.
function makeTickerTex() {
  // symbol, last price, change — a realistic spread of equities, indices, crypto,
  // rates and FX. Up = green, down = red (derived from the ▲/▼ glyph below).
  const items = [
    'ESX ▲ 142.50 +1.8%', 'SPX ▲ 5,821.00 +0.4%', 'NDX ▲ 20,140 +0.7%',
    'BTC ▲ 68,420 +2.3%', 'ETH ▼ 3,540 -0.9%', 'AAPL ▲ 226.10 +0.6%',
    'NVDA ▲ 131.40 +3.1%', 'GLD ▲ 2,410 +0.2%', '10Y ▲ 4.18%',
    'VIX ▼ 12.90 -4.0%', 'EUR/USD ▼ 1.0843', 'OIL ▼ 71.30 -1.1%',
  ];
  const colFor = (t) => (t.includes('▼') ? '#ff5b5b' : '#46e07a');
  // High-res canvas + anisotropy keep the text sharp where the band curves away.
  const H = 192, font = '700 104px "IBM Plex Mono", monospace', gap = 130;
  let c = document.createElement('canvas'); let x = c.getContext('2d');
  x.font = font;
  let seqW = 0; items.forEach((t) => { seqW += x.measureText(t).width + gap; });
  c.width = Math.round(seqW); c.height = H;
  x = c.getContext('2d');
  x.fillStyle = '#05080f'; x.fillRect(0, 0, c.width, H);
  x.font = font; x.textBaseline = 'middle';
  // thin LED rails top and bottom so the band still reads as a ticker up close
  x.fillStyle = 'rgba(120,150,190,.22)'; x.fillRect(0, 10, c.width, 4); x.fillRect(0, H - 14, c.width, 4);
  let px = gap / 2;
  for (let i = 0; i < items.length; i++) {
    x.fillStyle = colFor(items[i]);
    // crisp edge: dark stroke under the glyphs so they stay legible over bloom
    x.lineWidth = 6; x.strokeStyle = 'rgba(0,8,16,.9)'; x.strokeText(items[i], px, H / 2 + 2);
    x.fillText(items[i], px, H / 2 + 2);
    px += x.measureText(items[i]).width + gap;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 16; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}

export function buildEssex(ctx) {
  const { scene, css, layout, resume, registerInteractable, onUpdate, envMap } = ctx;
  const [cx, cz] = layout.DISTRICTS.essex.center; // [54, 28]

  // Solid round footprint so you can't walk through the tower.
  addCircle(cx, cz, 6.7, { top: 40 });

  // Stone plaza disc, raised a hair above the terrain paint with a polygon offset
  // so the near-coplanar surfaces don't z-fight.
  const plazaMat = new THREE.MeshStandardMaterial({ color: 0xa7adb5, roughness: 0.82, metalness: 0.08, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.5, 64), plazaMat);
  plaza.position.set(cx, -0.03, cz); // top face ~0.22
  plaza.receiveShadow = true; scene.add(plaza);

  // Everything is authored in LOCAL coords (front on +Z), then the group is yawed
  // -90 deg so the entrance/logo/glass face the origin (-X) where players approach.
  const essex = new THREE.Group();
  essex.position.set(cx, 0, cz);
  essex.rotation.y = -Math.PI / 2;
  scene.add(essex);

  // Sized to stand as tall as the BNY tower (~y39 at the crown).
  const R = 6, TH = 34, baseTop = 5, towerCy = baseTop + TH / 2;

  // ---- tower (glass + stone cylinder) ----
  const { map, emis } = makeCylinderTex();
  const towerMat = new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: emis, emissiveIntensity: 0.55, color: 0xdfe4ea, roughness: 0.4, metalness: 0.38, envMap, envMapIntensity: 0.7 });
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

  // ---- rotating stock-ticker crown + halo ----
  const tickTex = makeTickerTex();
  tickTex.repeat.set(1, 1); // one legible wrap around the crown, not a blur of lines
  const crownY = baseTop + TH - 1.4;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.12, R + 0.12, 1.7, 80, 1, true), new THREE.MeshBasicMaterial({ map: tickTex, side: THREE.DoubleSide }));
  crown.position.y = crownY; essex.add(crown);
  const crownHalo = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.22, R + 0.22, 1.9, 80, 1, true), new THREE.MeshBasicMaterial({ map: makeRadial('rgb(150,185,230)', 0.5), transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: new THREE.Color(0x8fb4e0) }));
  crownHalo.position.y = crownY; essex.add(crownHalo);

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
  const lampLight = new THREE.PointLight(0xfff0d8, 1.1, 22, 2); lampLight.position.set(11, 8.4, 7); essex.add(lampLight);

  // ---- two role interactable zones flanking the entrance (front, -X world) ----
  // The blue plaque signs were removed per request; the zones stay so walking up to
  // either side of the entrance still opens that role. local (lx, lz) maps to world
  // (cx - lz, cz + lx) under the -90deg group yaw.
  const kLz = 7.8;
  const worldA = new THREE.Vector3(cx - kLz, 1.5, cz + (-3.5)); // essex2
  const worldB = new THREE.Vector3(cx - kLz, 1.5, cz + 3.5);    // essex1

  // Floating "ESSEX SECURITIES" banner so the tower is identifiable from afar.
  addFloatingLogo(ctx, {
    tex: makeWordmarkTexture({ primary: 'ESSEX', secondary: 'SECURITIES', bg: '#0e1726', fg: '#eaf0fb' }),
    center: [cx, cz], y: 48, size: [9.5, 3.8], bob: 0.35,
  });

  // ---- animation: scroll the ticker + spin the crown ----
  onUpdate((dt) => {
    tickTex.offset.x = (tickTex.offset.x + dt * 0.03) % 1;
    crown.rotation.y -= dt * 0.12;
    crownHalo.rotation.y = crown.rotation.y;
  });

  // ---- interactables (one per Essex role) ----
  const essex2 = resume.experience.find((e) => e.id === 'essex2');
  const essex1 = resume.experience.find((e) => e.id === 'essex1');

  registerInteractable({
    id: 'essex2',
    position: worldA,
    radius: 3.4,
    data: {
      title: 'Essex Securities: ' + essex2.role,
      subtitle: essex2.dates + ' · ' + essex2.location,
      accent: css.essex,
      lines: essex2.bullets,
      tags: essex2.tags,
    },
  });

  registerInteractable({
    id: 'essex1',
    position: worldB,
    radius: 3.4,
    data: {
      title: 'Essex Securities: ' + essex1.role,
      subtitle: essex1.dates + ' · ' + essex1.location,
      accent: css.essex,
      lines: essex1.bullets,
      tags: essex1.tags,
    },
  });
}
