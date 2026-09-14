// Azonix Tech landmark — the HQ building, ported faithfully from the
// "Azonix Building" 3D component: a 3-storey purple block with mullioned glass
// windows, a lit entrance canopy, a rooftop equipment deck (AC units, satellite
// dish, vents, cable tray), and a sweeping security camera/lamp on a mast — the
// camera nods to the facial-recognition work, panning back and forth with a
// glowing lens.
//
// The plaza pad it stands on is kept from the original landmark (the "base").
import * as THREE from 'three';
import { addBox } from '../core/colliders.js';

// --- AZONIX TECHNOLOGIES sign face (purple lightbox look, but LIT not emissive
// so it never glows/blooms at night) ---
function makeSignTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 320;
  const x = c.getContext('2d');
  x.fillStyle = '#2c1d52'; x.fillRect(0, 0, 1024, 320);
  x.strokeStyle = '#7b5fc0'; x.lineWidth = 10; x.strokeRect(14, 14, 996, 292);
  x.fillStyle = '#f3ecff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = "700 150px 'Space Grotesk', Arial, sans-serif";
  x.fillText('AZONIX', 512, 130);
  x.font = "600 60px 'Space Grotesk', Arial, sans-serif";
  x.save(); x.scale(1.6, 1); x.fillText('TECHNOLOGIES', 320, 250); x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function buildAzonix(ctx) {
  const { scene, voxel, palette, css, layout, resume, registerInteractable, onUpdate } = ctx;
  const { patch, group } = voxel;
  const [cx, cz] = layout.DISTRICTS.azonix.center; // [54, -28]

  const SCALE = 1.4; // building upscaled ~40% (the plaza base stays put)

  // Footprint collider covering the upscaled HQ (plus its front canopy/steps).
  addBox(cx, cz, 6.5, 6.5, { top: 17 });

  const mat = (color, opts) => new THREE.MeshStandardMaterial(
    Object.assign({ color, roughness: 0.82, metalness: 0.08 }, opts || {}),
  );

  // ---------- BASE (kept): plaza pad under the building ----------
  // Inner dark pad widened so the now-larger plinth seats cleanly on it.
  scene.add(group([
    patch({ size: [18, 18], color: palette.stone, pos: [cx, cz], y: 0.08 }),
    patch({ size: [14, 14], color: palette.azonixDark, pos: [cx, cz], y: 0.1 }),
  ]));

  // ---------- BUILDING ----------
  // Authored in LOCAL coords with the front on +Z, then the whole group is yawed
  // -90° so the entrance/sign/camera face -X world — the direction players
  // approach this district from.
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = -Math.PI / 2;
  g.scale.setScalar(SCALE); // grows up from the ground (y=0 stays on the pad)
  scene.add(g);

  // Soft cool-white glow that reads as light spilling out of each lit window.
  const winGlowTex = (() => {
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    const rg = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    rg.addColorStop(0, 'rgba(216,240,250,0.95)');
    rg.addColorStop(0.42, 'rgba(150,208,228,0.34)');
    rg.addColorStop(1, 'rgba(120,184,214,0)');
    x.fillStyle = rg; x.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();

  const BW = 9, BD = 8, FH = 3.6, FLOORS = 3, BH = FH * FLOORS;

  // body + plinth
  const body = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), mat(0x4a2f48, { roughness: 0.86 }));
  body.position.y = BH / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.5, 0.9, BD + 0.5), mat(0x2e1d30, { roughness: 0.95 }));
  plinth.position.y = 0.45; plinth.castShadow = true; plinth.receiveShadow = true; g.add(plinth);

  // floor divider trim bands
  const trimMat = mat(0x351f36, { roughness: 0.9 });
  [FH, FH * 2].forEach((yy) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.25, 0.32, BD + 0.25), trimMat);
    band.position.y = yy; band.castShadow = true; g.add(band);
  });

  // corner pilasters
  const pilMat = mat(0x3c2640, { roughness: 0.85 });
  [[BW / 2, BD / 2], [-BW / 2, BD / 2], [BW / 2, -BD / 2], [-BW / 2, -BD / 2]].forEach(([px, pz]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, BH, 0.7), pilMat);
    p.position.set(px, BH / 2, pz); p.castShadow = true; g.add(p);
  });

  // ---------- window "tiles" (edited for no z-fighting BEFORE the base) ----------
  // Layers sit at clearly separated local depths and the glass carries a
  // polygonOffset so its panes never z-fight with the dark inner panel behind
  // them. The whole window also stands proud of the wall by `eps`.
  const frameMat = mat(0x8a7a9e, { roughness: 0.65, metalness: 0.3 });
  const innerMat = mat(0x241a2e, { roughness: 0.6 });
  const mullMat = mat(0x9a8aae, { roughness: 0.45, metalness: 0.65 });
  let glassSeed = 7;
  const rand = () => { glassSeed = (glassSeed * 9301 + 49297) % 233280; return glassSeed / 233280; };

  const makeWindow = (w, h) => {
    const grp = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, h + 0.4, 0.35), frameMat);
    frame.castShadow = true; frame.receiveShadow = true;
    const inner = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.25), innerMat);
    inner.position.z = 0.04;

    // Every window is lit; a little variation keeps it from looking uniform.
    const intensity = 0.5 + rand() * 0.22;
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xbfe0ec, emissive: 0x8fd6e8, emissiveIntensity: intensity,
      roughness: 0.3, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });

    const pw = (w - 0.35) / 2, ph = (h - 0.35) / 2;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const pane = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.12), glassMat);
        pane.position.set((i - 0.5) * (pw + 0.25), (j - 0.5) * (ph + 0.25), 0.18);
        grp.add(pane);
      }
    }

    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.15, h - 0.35, 0.14), mullMat); vBar.position.z = 0.24;
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(w - 0.35, 0.15, 0.14), mullMat); hBar.position.z = 0.24;
    grp.add(frame, inner, vBar, hBar);

    // soft halo of light spilling out, in front of the glass (additive + bloom).
    // Kept small/dim so neighbouring windows don't stack into a white sheet.
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.45, h + 0.45),
      new THREE.MeshBasicMaterial({ map: winGlowTex, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    glow.position.z = 0.3; grp.add(glow);
    return grp;
  };

  const eps = 0.06;
  const placeOnFace = (grp, face, a, y, half) => {
    if (face === 'front') { grp.position.set(a, y, half + eps); }
    else if (face === 'back') { grp.position.set(-a, y, -half - eps); grp.rotation.y = Math.PI; }
    else if (face === 'left') { grp.position.set(-half - eps, y, -a); grp.rotation.y = -Math.PI / 2; }
    else if (face === 'right') { grp.position.set(half + eps, y, a); grp.rotation.y = Math.PI / 2; }
  };

  const rowY = [FH * 0.5, FH * 1.5, FH * 2.5];
  const frontCols = [-3, 0, 3];
  const sideCols = [-2.1, 2.1];
  ['front', 'back'].forEach((face) => {
    rowY.forEach((y, ri) => {
      frontCols.forEach((a) => {
        if (face === 'front' && ri === 0 && a === 0) return; // door spot
        const win = makeWindow(2.0, 2.3);
        placeOnFace(win, face, a, y, BD / 2); g.add(win);
      });
    });
  });
  ['left', 'right'].forEach((face) => {
    rowY.forEach((y) => {
      sideCols.forEach((a) => {
        const win = makeWindow(1.9, 2.3);
        placeOnFace(win, face, a, y, BW / 2); g.add(win);
      });
    });
  });

  // ---------- sign (lit, non-glowing) on the front face above the windows ----------
  const signMat = new THREE.MeshStandardMaterial({ map: makeSignTex(), roughness: 0.5, metalness: 0 });
  const signSide = mat(0x2c1d52, { roughness: 0.6 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.6, 0.4), [signSide, signSide, signSide, signSide, signMat, signSide]);
  sign.position.set(0, FH * 2.5 + 0.35, BD / 2 + 0.22); sign.castShadow = true; g.add(sign);

  // ---------- entrance: door, kick plate, canopy ----------
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.9, 0.4), mat(0x5a4a6e, { roughness: 0.5, metalness: 0.25 }));
  frame.position.set(0, 1.95, BD / 2 + 0.12); frame.castShadow = true; g.add(frame);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 0.16), mat(0x8a7a9e, { roughness: 0.4, metalness: 0.6 }));
  plate.position.set(0, 0.4, BD / 2 + 0.3); g.add(plate);
  const door = new THREE.Group();
  door.add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.4, 0.16), mat(0x6a7a8e, { roughness: 0.6, metalness: 0.4 })));
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), mat(0x9a8aae, { roughness: 0.3, metalness: 0.7 }));
  handle.rotation.z = Math.PI / 2; handle.position.set(1.05, 1.0, 0.25); door.add(handle);
  door.position.set(0, 1.95, BD / 2 + 0.3); g.add(door);
  const step = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 1.1), mat(0x2a1c2e, { roughness: 0.95 }));
  step.position.set(0, 0.15, BD / 2 + 0.6); step.castShadow = true; step.receiveShadow = true; g.add(step);
  const canopyMat = mat(0x3a2a3a, { roughness: 0.7, metalness: 0.35 });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.4, 1.6), canopyMat);
  awning.position.set(0, 3.4, BD / 2 + 0.95); awning.castShadow = true; g.add(awning);
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.25), canopyMat);
  bracket.position.set(-1.2, 2.88, BD / 2 + 0.5); bracket.rotation.z = -0.3; g.add(bracket);
  const bracket2 = bracket.clone(); bracket2.position.set(1.2, 2.88, BD / 2 + 0.5); bracket2.rotation.z = 0.3; g.add(bracket2);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.15, 0.3), mat(0x5a4a5a, { roughness: 0.6, metalness: 0.5 }));
  lip.position.set(0, 3.48, BD / 2 + 1.35); g.add(lip);

  // ---------- rooftop equipment deck ----------
  const roofMat = mat(0x201226, { roughness: 0.9 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(BW + 1.0, 1.1, BD + 1.0), roofMat);
  slab.position.y = BH + 0.55; slab.castShadow = true; slab.receiveShadow = true; g.add(slab);
  const top = BH + 1.1;
  const pMat = mat(0x281530, { roughness: 0.9 });
  const mkWall = (w, d, x, z) => {
    const wmesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, d), pMat);
    wmesh.position.set(x, top + 0.35, z); wmesh.castShadow = true; g.add(wmesh);
  };
  mkWall(BW + 1.0, 0.4, 0, (BD + 1.0) / 2 - 0.2);
  mkWall(BW + 1.0, 0.4, 0, -(BD + 1.0) / 2 + 0.2);
  mkWall(0.4, BD + 1.0, (BW + 1.0) / 2 - 0.2, 0);
  mkWall(0.4, BD + 1.0, -(BW + 1.0) / 2 + 0.2, 0);

  const acMat = mat(0x4a4452, { roughness: 0.7, metalness: 0.4 });
  const ac1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.6), acMat);
  ac1.position.set(-2.4, top + 0.5, -1.8); ac1.castShadow = true; g.add(ac1);
  const ac2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.4), acMat);
  ac2.position.set(2.6, top + 0.4, -2.2); ac2.castShadow = true; g.add(ac2);
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16), mat(0x2a2630, { roughness: 0.6 }));
  fan.position.set(-2.4, top + 1.02, -1.8); g.add(fan);
  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12), acMat);
  vent.position.set(3.0, top + 0.7, 1.6); vent.castShadow = true; g.add(vent);

  const dishBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 12), mat(0x5a5a6a, { roughness: 0.7, metalness: 0.5 }));
  dishBase.position.set(-3.2, top + 1.0, 2.4); dishBase.castShadow = true; g.add(dishBase);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), mat(0x7a7a8a, { roughness: 0.6, metalness: 0.7 }));
  dish.position.set(-3.2, top + 1.8, 2.4); dish.rotation.x = -0.4; dish.castShadow = true; g.add(dish);
  const dishArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 8), mat(0x6a6a7a, { roughness: 0.5, metalness: 0.6 }));
  dishArm.position.set(-3.2, top + 1.4, 2.4); dishArm.rotation.z = 0.5; dishArm.castShadow = true; g.add(dishArm);

  const trayMat = mat(0x5a5a6a, { roughness: 0.65, metalness: 0.5 });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 0.6), trayMat);
  tray.position.set(0, top + 0.8, -3.0); tray.castShadow = true; g.add(tray);
  for (let i = -2; i <= 2; i++) {
    const standoff = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), trayMat);
    standoff.position.set(i * 1.4, top + 0.5, -3.0); g.add(standoff);
  }
  const vent2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.8, 12), acMat);
  vent2.position.set(-3.5, top + 0.9, -3.2); vent2.castShadow = true; g.add(vent2);
  const utilBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.1), mat(0x4a4450, { roughness: 0.75, metalness: 0.35 }));
  utilBox.position.set(3.8, top + 0.6, -2.8); utilBox.castShadow = true; g.add(utilBox);

  // ---------- security camera / lamp on a mast (panning) ----------
  const lamp = new THREE.Group();
  const lbase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.0), mat(0x3a2a1e, { roughness: 0.8 }));
  lbase.position.y = top + 0.25; lbase.castShadow = true; lamp.add(lbase);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 3.2, 12), mat(0x6b5436, { roughness: 0.7, metalness: 0.3 }));
  pole.position.y = top + 2.0; pole.castShadow = true; lamp.add(pole);
  const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.3, 12), mat(0x6b5436, { roughness: 0.7, metalness: 0.3 }));
  lArm.position.set(0, top + 3.4, 0.5); lArm.rotation.x = Math.PI / 2.6; lArm.castShadow = true; lamp.add(lArm);

  const housing = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 1.4), mat(0x4a3320, { roughness: 0.65, metalness: 0.3 }));
  box.castShadow = true; housing.add(box);
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.3, 20),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: 2.6, roughness: 0.2 }),
  );
  lens.rotation.x = Math.PI / 2; lens.position.set(0, 0, 0.78); housing.add(lens);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2222, emissiveIntensity: 1.8, roughness: 0.3 }),
  );
  beacon.position.set(0, 0.62, 0.2); housing.add(beacon);
  housing.position.set(0, top + 4.0, 1.1); housing.rotation.x = 0.35; lamp.add(housing);

  const spot = new THREE.SpotLight(0xfff0d8, 7, 30, Math.PI / 5, 0.5, 1.4);
  spot.position.set(0, 0, 0.4); spot.target.position.set(0, -3, 9);
  housing.add(spot); housing.add(spot.target);
  g.add(lamp);

  // Slow surveillance pan + pulsing red beacon.
  onUpdate((dt, elapsed) => {
    housing.rotation.y = Math.sin(elapsed * 0.5) * 0.85; // ±~49° sweep
    beacon.material.emissiveIntensity = 1.2 + 0.8 * (0.5 + 0.5 * Math.sin(elapsed * 3.0));
  });

  // ---------- interactable (Azonix experience) ----------
  const az = resume.experience.find((e) => e.id === 'azonix');
  registerInteractable({
    id: 'azonix',
    position: new THREE.Vector3(cx - 9, 1.5, cz),
    radius: 9,
    data: {
      title: 'Azonix Tech, ' + az.role,
      subtitle: az.dates + ' · ' + az.location,
      accent: css.azonix,
      lines: az.bullets,
      tags: az.tags,
    },
  });
}
