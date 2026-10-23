// Education landmark — Rutgers University.
// A stylized university hall flanked by two towers, crowned by a scarlet
// clock-tower with a banner facing the plaza. Text comes from resume.education.
import * as THREE from 'three';
import { addBox } from '../core/colliders.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { prepareGlb } from '../core/glb.js';

export function buildEducation(ctx) {
  const { scene, voxel, palette, css, layout, resume, registerInteractable, } = ctx;
  const [cx, cz] = layout.DISTRICTS.education.center; // [0, -52]
  // Rutgers Business School: Blender-built GLB (centered on its footprint, base at y=0),
  // scaled up so it reads from across the map. Entrance faces +Z, toward the origin.
  const SCALE = 1.25;               // GLB is ~24 x 24 x 14 m at 1.0
  const halfW = 12 * SCALE;
  // Only the solid ground-floor blocks collide (measured from the GLB at this scale), so the
  // plaza, the V-column entrance and the space under the overhang stay walkable.
  addBox(cx - 8.4, cz + 7.6, 4.4, 4.4, { top: 5.3 });  // west block
  addBox(cx + 9.6, cz + 7.6, 3.2, 3.6, { top: 5.3 });  // east block
  addBox(cx - 8.4, cz - 5.0, 4.4, 8.2, { top: 1.7 });  // north wing base
  const hallD = halfW * 2;          // depth, used to place the interactable in front
  new GLTFLoader().load('public/models/rutgers_business.glb', (gltf) => {
    prepareGlb(gltf.scene, scene);
    gltf.scene.position.set(cx, 0, cz);
    gltf.scene.scale.setScalar(SCALE);
    scene.add(gltf.scene);
    ctx.invalidateShadows();
  }, undefined, (e) => console.warn('[education] model failed', e));

  // --- Interactable: in front of the entrance ---
  registerInteractable({
    id: 'education',
    position: new THREE.Vector3(cx, 1.5, cz + hallD / 2 + 3),
    radius: 8,
    bounds: { x: cx, z: cz, hw: halfW + 2, hd: halfW + 2 },   // whole 30x30 building footprint + a margin
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
