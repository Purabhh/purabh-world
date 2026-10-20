// Lanterns — three hand-styled lamp designs (ported faithfully from the
// "Lamp Posts Static" Claude Design component) arranged with clear intent:
//
//   • lampHanging — dark iron post with a drooping arm. Used as STREETLIGHTS,
//     staggered along every path, the arm reaching out over the walkway.
//   • lampToro    — grey stone toro lantern. Frames the SPAWN PLAZA at its
//     four corners like formal garden markers.
//   • lampBox     — stacked-wood lantern. Flanks each DISTRICT ENTRANCE as a
//     pair of gateposts where the path meets the plaza.
//
// Warm emissive cores glow through the bloom pass. No real PointLights: each
// one costs every lit pixel in the scene, and on integrated GPUs a dozen of
// them was the single biggest shading cost (see perf pass, Sep 2026).
import * as THREE from 'three';
import { addCircle } from '../core/colliders.js';

export function buildLanterns(ctx) {
  const { scene, layout } = ctx;
  const root = new THREE.Group();
  scene.add(root);

  // --- material + primitive helpers (kept close to the source component) ------
  const flat = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.82, metalness: 0.05 });
  const metal = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.45, metalness: 0.6 });
  const glowMat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.1, flatShading: true, roughness: 0.4 });

  let _halo = null;
  function haloTex() {
    if (_halo) return _halo;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,240,200,0.95)');
    g.addColorStop(0.35, 'rgba(255,214,140,0.45)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    _halo = new THREE.CanvasTexture(c);
    return _halo;
  }

  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function addLight(group, color, intensity, x, y, z) {
    const L = new THREE.PointLight(color, intensity, 11, 2.0);
    L.position.set(x, y, z); group.add(L);
  }
  function addGlow(group, color, size, x, y, z) {
    const mat = new THREE.SpriteMaterial({ map: haloTex(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7 });
    const s = new THREE.Sprite(mat);
    s.scale.setScalar(size); s.position.set(x, y, z); group.add(s);
  }

  // --- the three lamps. `lit` adds a real PointLight (budgeted by the caller) --
  function lampBox(lit) {
    const g = new THREE.Group();
    const wood = flat(0x6f4a33), woodDk = flat(0x5a3a28);
    const segH = 0.7;
    for (let i = 0; i < 6; i++) {
      const w = 0.42 - i * 0.012;
      const m = box(w, segH, w, i % 2 ? woodDk : wood, 0, 0.35 + i * segH, 0);
      m.rotation.y = (i % 2 ? 1 : -1) * 0.02; g.add(m);
    }
    const topY = 0.35 + 6 * segH;
    g.add(box(0.56, 0.18, 0.56, woodDk, 0, topY + 0.05, 0));
    const lampY = topY + 0.55, warm = 0xffd27a;
    g.add(box(0.82, 0.78, 0.82, glowMat(warm), 0, lampY, 0));
    g.add(box(0.86, 0.06, 0.86, woodDk, 0, lampY + 0.42, 0));
    g.add(box(0.86, 0.06, 0.86, woodDk, 0, lampY - 0.42, 0));
    g.add(box(0.96, 0.16, 0.96, woodDk, 0, lampY + 0.5, 0));
    g.add(box(0.5, 0.12, 0.5, woodDk, 0, lampY + 0.63, 0));
    if (lit) addLight(g, warm, 7, 0, lampY, 0);
    addGlow(g, 0xffcf86, 2.6, 0, lampY, 0);
    return g;
  }

  function lampToro(lit) {
    const g = new THREE.Group();
    const stone = flat(0xc7bcc4), stoneDk = flat(0xa99fa9);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.4, 8), stone);
    base.position.y = 0.2; g.add(base);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 2.0, 8), stoneDk);
    shaft.position.y = 1.4; g.add(shaft);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.32, 8), stone);
    plat.position.y = 2.55; g.add(plat);
    const chY = 3.1, warm = 0xffce82;
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.7, 0.66), glowMat(warm));
    core.position.y = chY; g.add(core);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.12, 0.74, 0.12, stoneDk, sx * 0.32, chY, sz * 0.32));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.5, 6), stone);
    roof.position.y = chY + 0.62; roof.rotation.y = Math.PI / 6; g.add(roof);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), stone);
    fin.position.y = chY + 0.92; g.add(fin);
    g.children.forEach((c) => { c.castShadow = true; c.receiveShadow = true; });
    if (lit) addLight(g, warm, 6, 0, chY, 0);
    addGlow(g, 0xffd28c, 2.3, 0, chY, 0);
    return g;
  }

  function lampHanging(lit) {
    const g = new THREE.Group();
    const iron = metal(0x3f3a4a), ironDk = metal(0x2c2834);
    g.add(box(0.56, 0.4, 0.56, ironDk, 0, 0.2, 0));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 4.0, 10), iron);
    post.position.y = 2.2; post.castShadow = true; g.add(post);
    [1.1, 3.6].forEach((y) => {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 10), ironDk);
      r.position.y = y; g.add(r);
    });
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4.2, 0), new THREE.Vector3(0.05, 4.7, 0), new THREE.Vector3(0.55, 4.95, 0),
      new THREE.Vector3(1.25, 4.85, 0), new THREE.Vector3(1.55, 4.55, 0),
    ]);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.1, 8), iron);
    arm.castShadow = true; g.add(arm);
    const lx = 1.55, ly = 4.0, warm = 0xffd07c;
    g.add(box(0.06, 0.36, 0.06, ironDk, lx, ly + 0.4, 0));
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.5, 10), glowMat(warm));
    glass.position.set(lx, ly, 0); g.add(glass);
    const dome = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.4, 10), ironDk);
    dome.position.set(lx, ly + 0.42, 0); dome.castShadow = true; g.add(dome);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), iron);
    tip.position.set(lx, ly + 0.66, 0); g.add(tip);
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), ironDk);
    bot.position.set(lx, ly - 0.3, 0); g.add(bot);
    if (lit) addLight(g, warm, 6, lx, ly, 0);
    addGlow(g, 0xffd086, 2.1, lx, ly, 0);
    return g;
  }

  // Drop a finished lamp into the world (XZ ground placement) + a small collider.
  function place(lamp, x, z, rotY, colliderR) {
    lamp.position.set(x, 0, z);
    if (rotY) lamp.rotation.y = rotY;
    root.add(lamp);
    if (colliderR) addCircle(x, z, colliderR, { top: 5 });
  }

  // === 1) SPAWN PLAZA — four stone toro lanterns framing the corners ==========
  const PC = 9.5; // plaza corner offset (on the stone, between the diagonal paths)
  const toroSpots = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    place(lampToro(false), sx * PC, sz * PC, 0, 0.9);
    toroSpots.push([sx * PC, sz * PC]);
  }
  // Two different lamp styles should never crowd each other: a streetlight is
  // skipped if it would land within these distances of a gatepost / spawn lantern.
  const MIN_GATE_GAP = 5.0, MIN_TORO_GAP = 4.5;

  // === 2) PATHS — drooping iron streetlights, staggered, arm over the walkway ==
  // and 3) DISTRICT ENTRANCES — a pair of wood gatepost lanterns at each plaza.
  for (const key in layout.DISTRICTS) {
    const d = layout.DISTRICTS[key];
    const [cx, cz] = d.center;
    const dist = Math.hypot(cx, cz);
    if (dist < 1) continue;                 // skip the spawn district itself
    const ux = cx / dist, uz = cz / dist;   // unit vector along the path
    const px = -uz, pz = ux;                // unit perpendicular (path "left")

    // Streetlights down the spoke, alternating sides; the curved arm always
    // reaches back toward the path centerline. Light only the first per spoke.
    const start = 16, end = dist - d.radius * 0.9, spacing = 15, sideOff = 3.4;
    // Gatepost spots first, so the streetlights below can keep clear of them.
    const gate = dist - d.radius - 1.5, sep = 4.0;
    const gx = ux * gate, gz = uz * gate;
    const gateSpots = [-1, 1].map((side) => [gx + px * side * sep, gz + pz * side * sep]);
    let idx = 0;
    for (let t = start; t <= end; t += spacing) {
      const side = idx % 2 === 0 ? 1 : -1;
      const x = ux * t + px * side * sideOff;
      const z = uz * t + pz * side * sideOff;
      idx++;                                   // keep the left/right alternation steady even if one is skipped
      const tooClose =
        gateSpots.some(([qx, qz]) => Math.hypot(x - qx, z - qz) < MIN_GATE_GAP) ||
        toroSpots.some(([qx, qz]) => Math.hypot(x - qx, z - qz) < MIN_TORO_GAP);
      if (tooClose) continue;
      // arm (local +X) should point inward, toward the path: dir = -side*perp
      const dirx = -side * px, dirz = -side * pz;
      const rotY = Math.atan2(-dirz, dirx);
      place(lampHanging(false), x, z, rotY, 0.4);
    }

    // Gateposts: a pair of wood lanterns flanking the path just outside the plaza.
    for (const [qx, qz] of gateSpots) place(lampBox(false), qx, qz, 0, 0.5);
  }
}
