// Skills constellation — the tech stack as glowing icons that slowly orbit a
// central core, low enough that you walk under and among them. Each node is a
// brand emblem drawn to a canvas (with a soft color glow), shown on a
// billboarded, emissive plane; faint constellation lines link the ring; an info
// card lists the full categorized stack from resume.skills.
import * as THREE from 'three';
import { addFloatingLogo, makeWordmarkTexture } from './floatingLogo.js';

// --- tiny canvas helpers -----------------------------------------------------
const rr = (g, x, y, w, h, r, fill) => {
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
  g.fill();
};
const dot = (g, x, y, r, fill) => { g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
const tri = (g, pts, fill) => {
  g.fillStyle = fill;
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.closePath();
  g.fill();
};
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

// Build a 256x256 icon texture: a soft brand-color glow halo + the drawn emblem.
function makeIcon(glow, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 8, 128, 128, 122);
  grd.addColorStop(0, hexA(glow, 0.55));
  grd.addColorStop(0.7, hexA(glow, 0.12));
  grd.addColorStop(1, hexA(glow, 0));
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  draw(g);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// --- the six brand emblems ---------------------------------------------------
const icons = {
  react: () => makeIcon('#61dafb', (g) => {
    g.save(); g.translate(128, 128);
    g.strokeStyle = '#61dafb'; g.lineWidth = 9;
    for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * Math.PI / 3); g.beginPath(); g.ellipse(0, 0, 86, 32, 0, 0, 7); g.stroke(); g.restore(); }
    dot(g, 0, 0, 17, '#61dafb');
    g.restore();
  }),
  node: () => makeIcon('#83cd29', (g) => {
    const hex = (rad, fill) => { g.fillStyle = fill; g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const x = 128 + Math.cos(a) * rad, y = 128 + Math.sin(a) * rad; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fill(); };
    hex(96, '#539e43'); hex(74, '#3d7a30');
    g.fillStyle = '#fff'; g.font = '700 50px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('node', 128, 132);
  }),
  python: () => makeIcon('#ffd43b', (g) => {
    const blue = '#3776ab', yellow = '#ffd43b';
    rr(g, 52, 54, 150, 56, 22, blue);   // blue: top bar
    rr(g, 52, 54, 56, 118, 22, blue);   //       + left bar  -> upper-left hook
    rr(g, 54, 146, 150, 56, 22, yellow); // yellow: bottom bar
    rr(g, 148, 84, 56, 118, 22, yellow); //         + right bar -> lower-right hook
    dot(g, 170, 82, 9, '#fff');         // blue eye
    dot(g, 86, 174, 9, '#fff');         // yellow eye
  }),
  solidity: () => makeIcon('#b8bcc4', (g) => {
    g.save(); g.translate(128, 128);
    tri(g, [[-72, -92], [72, -92], [0, -8]], '#c7ccd4');   // top facet (down triangle)
    tri(g, [[-44, 6], [44, 6], [0, 70]], '#8a9099');       // mid diamond lower
    tri(g, [[-72, 92], [72, 92], [0, 8]], '#5b6068');      // bottom facet (up triangle)
    g.restore();
  }),
  typescript: () => makeIcon('#3178c6', (g) => {
    rr(g, 44, 44, 168, 168, 26, '#3178c6');
    g.fillStyle = '#fff'; g.font = '800 96px Arial, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    g.fillText('TS', 196, 186);
  }),
  javascript: () => makeIcon('#f7df1e', (g) => {
    rr(g, 44, 44, 168, 168, 14, '#f7df1e');
    g.fillStyle = '#000'; g.font = '800 96px Arial, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    g.fillText('JS', 196, 186);
  }),
};

export function buildSkills(ctx) {
  const { scene, voxel, palette, css, layout, resume, registerInteractable, camera, onUpdate } = ctx;
  const { patch } = voxel;
  const [cx, cz] = layout.DISTRICTS.skills.center; // [-54, -28]

  // A small glowing pad anchoring the constellation to the plaza.
  scene.add(patch({ size: [9, 9], color: palette.skillsDark, pos: [cx, cz], y: 0.12 }));
  scene.add(patch({ size: [3.4, 3.4], color: palette.skills, pos: [cx, cz], y: 0.14 }));

  // --- the orbiting ring of skill nodes --------------------------------------
  const order = ['react', 'node', 'python', 'solidity', 'typescript', 'javascript'];
  const R = 8.6;
  const nodes = [];
  order.forEach((key, i) => {
    const tex = icons[key]();
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshStandardMaterial({
        map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.9,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 1, metalness: 0,
      }),
    );
    scene.add(mesh);
    nodes.push({ mesh, base: (i / order.length) * Math.PI * 2, y0: 6.2 + (i % 3) * 0.9, bob: i * 1.7 });
  });

  // --- constellation lines: a glowing loop threaded through the ring ----------
  const linePos = new Float32Array(order.length * 3);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lines = new THREE.LineLoop(lineGeo, new THREE.LineBasicMaterial({ color: palette.skills, transparent: true, opacity: 0.4, depthWrite: false }));
  lines.frustumCulled = false;
  scene.add(lines);

  // --- glowing core + floating label at the center ---------------------------
  const coreY = 7.4;
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.3),
    new THREE.MeshStandardMaterial({ color: palette.skills, emissive: palette.skills, emissiveIntensity: 0.9, flatShading: true, roughness: 0.4, metalness: 0.2 }),
  );
  core.position.set(cx, coreY, cz);
  scene.add(core);

  addFloatingLogo(ctx, {
    tex: makeWordmarkTexture({ primary: 'MY STACK', bg: '#0e2a2e', fg: '#7ff3e2' }),
    center: [cx, cz], y: 12.4, size: [7, 2.6], bob: 0.4,
  });

  // --- animate: orbit + bob + pulse; redraw the lines through live positions --
  const ORBIT = 0.14; // rad / sec
  onUpdate((dt, t) => {
    const cam = camera.position;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const ang = n.base + t * ORBIT;
      const x = cx + Math.cos(ang) * R;
      const z = cz + Math.sin(ang) * R;
      const y = n.y0 + Math.sin(t * 1.3 + n.bob) * 0.45;
      n.mesh.position.set(x, y, z);
      n.mesh.rotation.y = Math.atan2(cam.x - x, cam.z - z); // upright billboard
      n.mesh.material.emissiveIntensity = 0.75 + 0.45 * Math.sin(t * 2 + n.bob);
      linePos[i * 3] = x; linePos[i * 3 + 1] = y; linePos[i * 3 + 2] = z;
    }
    lineGeo.attributes.position.needsUpdate = true;
    core.rotation.y += dt * 0.6;
    core.rotation.x += dt * 0.25;
    core.position.y = coreY + Math.sin(t * 1.1) * 0.3;
  });

  // --- interactable: the full categorized stack ------------------------------
  const s = resume.skills;
  registerInteractable({
    id: 'skills',
    position: new THREE.Vector3(cx, 1.5, cz),
    radius: 6,
    data: {
      title: 'My Stack',
      subtitle: 'The tools I build with',
      accent: css.skills,
      lines: [
        'Languages: ' + s.Languages.join(', '),
        'Frontend: ' + s.Frontend.join(', '),
        'Backend: ' + s.Backend.join(', '),
        'Blockchain: ' + s.Blockchain.join(', '),
        'Database: ' + s.Database.join(', '),
      ],
      tags: ['React', 'Node.js', 'Python', 'Solidity', 'TypeScript', 'JavaScript'],
    },
  });
}
