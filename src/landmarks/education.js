// Education landmark — Rutgers University.
// A stylized university hall flanked by two towers, crowned by a scarlet
// clock-tower with a banner facing the plaza. Text comes from resume.education.
import * as THREE from 'three';
import { addBox } from '../core/colliders.js';

// Rutgers Block "R", solid scarlet on a transparent background (no outline),
// drawn to a canvas and used for the big logo that floats above the building.
function makeRutgersLogoTexture() {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const g = c.getContext('2d');

  // Transparent background, just the solid scarlet block "R" (no outline).
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '900 460px "Arial Black", Arial, sans-serif';
  g.fillStyle = '#CC0033';
  g.fillText('R', s / 2, s / 2 + 26);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function buildEducation(ctx) {
  const { scene, voxel, palette, css, layout, resume, registerInteractable, onUpdate, camera } = ctx;
  const { box, pillar, group, patch } = voxel;
  const [cx, cz] = layout.DISTRICTS.education.center; // [0, -52]
  addBox(cx, cz, 7.8, 4, { top: 21 }); // solid hall + towers footprint

  // This district sits at -Z, so "front" (toward origin) is the +Z face.
  const frontZ = cz + 4.5; // a touch in front of the hall body

  const parts = [];

  // Stone plaza pad under the monument.
  parts.push(patch({ size: [22, 18], color: palette.stone, pos: [cx, cz], y: 0.08 }));

  // --- Main hall body (wide, stone) ---
  const hallW = 14, hallH = 8, hallD = 7;
  parts.push(pillar({ footprint: [hallW, hallD], height: hallH, color: palette.stone, pos: [cx, cz] }));
  // Roof slab.
  parts.push(box({ size: [hallW + 1, 1.2, hallD + 1], color: palette.stoneDark, pos: [cx, hallH + 0.6, cz] }));

  // Row of scarlet "windows" along the front face.
  for (let i = -2; i <= 2; i++) {
    parts.push(box({
      size: [1.4, 2.6, 0.4], color: palette.rutgers,
      pos: [cx + i * 2.6, 3.6, cz + hallD / 2 + 0.05],
      emissive: palette.rutgers, emissiveIntensity: 0.18,
    }));
  }

  // --- Two corner towers (stone) ---
  for (const sx of [-1, 1]) {
    const tx = cx + sx * (hallW / 2 - 0.5);
    parts.push(pillar({ footprint: [3, 3], height: hallH + 3, color: palette.stoneDark, pos: [tx, cz] }));
    // Little scarlet pyramidal cap (stepped boxes).
    parts.push(box({ size: [3.4, 1, 3.4], color: palette.rutgers, pos: [tx, hallH + 3.5, cz] }));
    parts.push(box({ size: [1.8, 1.2, 1.8], color: palette.rutgersDark, pos: [tx, hallH + 4.4, cz] }));
  }

  // --- Central clock tower (the silhouette) ---
  const towX = cx, towBase = hallH;
  parts.push(pillar({ footprint: [5, 5], height: 10, color: palette.stone, pos: [towX, cz], y0: towBase }));
  // Clock face (scarlet) on the front, glowing softly.
  parts.push(box({
    size: [3, 3, 0.5], color: palette.white,
    pos: [towX, towBase + 6.5, cz + 2.55], emissive: palette.white, emissiveIntensity: 0.25,
  }));
  parts.push(box({
    size: [3.6, 3.6, 0.3], color: palette.rutgers,
    pos: [towX, towBase + 6.5, cz + 2.4], emissive: palette.rutgers, emissiveIntensity: 0.2,
  }));
  // Clock hands.
  parts.push(box({ size: [0.3, 1.6, 0.6], color: palette.ink, pos: [towX, towBase + 7.0, cz + 2.75] }));
  parts.push(box({ size: [1.2, 0.3, 0.6], color: palette.ink, pos: [towX + 0.4, towBase + 6.5, cz + 2.75] }));
  // Tower roof + scarlet spire flag.
  parts.push(box({ size: [5.6, 1.2, 5.6], color: palette.stoneDark, pos: [towX, towBase + 10.6, cz] }));
  parts.push(pillar({ footprint: [0.5, 0.5], height: 3, color: palette.stoneDark, pos: [towX, cz], y0: towBase + 11.2 }));
  parts.push(box({ size: [2.4, 1.4, 0.3], color: palette.rutgers, pos: [towX + 1.4, towBase + 13.5, cz], emissive: palette.rutgers, emissiveIntensity: 0.3 }));

  // --- Banner over the entrance (scarlet sign block) ---
  parts.push(box({
    size: [8, 1.8, 0.5], color: palette.rutgers,
    pos: [cx, hallH + 0.4, cz + hallD / 2 + 0.4],
    emissive: palette.rutgers, emissiveIntensity: 0.35,
  }));
  // Banner support posts.
  for (const sx of [-1, 1]) {
    parts.push(pillar({ footprint: [0.4, 0.4], height: hallH, color: palette.stoneDark, pos: [cx + sx * 3.6, cz + hallD / 2 + 0.4] }));
  }

  // --- Entrance steps + door, facing the plaza ---
  parts.push(box({ size: [6, 0.5, 1.4], color: palette.stoneDark, pos: [cx, 0.25, cz + hallD / 2 + 1.1] }));
  parts.push(box({ size: [5, 0.5, 1.0], color: palette.stone, pos: [cx, 0.75, cz + hallD / 2 + 0.7] }));
  parts.push(box({ size: [3, 4.5, 0.4], color: palette.rutgersDark, pos: [cx, 2.25, cz + hallD / 2 + 0.06] }));

  // A pair of trees framing the approach.
  parts.push(voxel.tree({ pos: [cx - 9, frontZ + 2], h: 4 }));
  parts.push(voxel.tree({ pos: [cx + 9, frontZ + 2], h: 4 }));

  scene.add(group(parts));

  // --- Big Rutgers logo floating above the building ---
  const logoTex = makeRutgersLogoTexture();
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({
      map: logoTex, emissive: 0xffffff, emissiveMap: logoTex, emissiveIntensity: 0.5,
      transparent: true, alphaTest: 0.2, roughness: 0.8, metalness: 0, side: THREE.DoubleSide,
    }),
  );
  const logoBaseY = 27;
  logo.position.set(cx, logoBaseY, cz);
  scene.add(logo);
  // Gently bob, and billboard toward the camera (kept upright).
  onUpdate((dt, elapsed) => {
    logo.position.y = logoBaseY + Math.sin(elapsed * 1.1) * 0.3;
    logo.rotation.y = Math.atan2(camera.position.x - logo.position.x, camera.position.z - logo.position.z);
  });

  // --- Interactable: in front of the entrance ---
  registerInteractable({
    id: 'education',
    position: new THREE.Vector3(cx, 1.5, cz + hallD / 2 + 3),
    radius: 8,
    data: {
      title: 'Rutgers University',
      subtitle: resume.education.degree,
      accent: css.rutgers,
      lines: [
        resume.education.dates + ' · ' + resume.education.location,
        ...resume.education.honors,
      ],
    },
  });
}
