// Landmarks district assembler. Builds one distinct voxel monument at each
// district center and registers its proximity interactable(s). Each builder
// pulls its text straight from ctx.resume, so the world stays in sync with the
// resume data.
//
// Usage (from main.js):
//   import { buildLandmarks } from './landmarks/index.js';
//   buildLandmarks(ctx);
import { buildEducation } from './education.js';
import { buildBny } from './bny.js';
import { buildEssex } from './essex.js';
import { buildAzonix } from './azonix.js';
import { buildAchievements } from './achievements.js';
import { buildSkills } from './skills.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Blender detail passes (handles, trim, portico...) layered over the code-built
// landmarks. Each GLB is authored around its landmark's center at ground level.
const DETAIL_MODELS = [
  { url: 'public/models/trophy_detail.glb', at: [0, 0] },
  { url: 'public/models/bny_detail.glb', at: [-54, 28] },
  { url: 'public/models/essex_detail.glb', at: [54, 28] },
  { url: 'public/models/azonix_detail.glb', at: [54, -28] },
];

function loadDetails(ctx) {
  const loader = new GLTFLoader();
  for (const { url, at } of DETAIL_MODELS) {
    loader.load(url, (gltf) => {
      gltf.scene.position.set(at[0], 0, at[1]);
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = true;
        // Full metal goes black with nothing to reflect; borrow the world's env map
        // when there is one, otherwise tone metal down so the gold still reads.
        const m = o.material;
        if (m && m.metalness > 0.5) {
          if (ctx.scene.environment) m.envMap = ctx.scene.environment;
          else { m.metalness = 0.35; m.roughness = Math.max(m.roughness, 0.35); }
        }
      });
      ctx.scene.add(gltf.scene);
    }, undefined, (e) => console.warn('[landmarks] detail model failed', url, e));
  }
}

export function buildLandmarks(ctx) {
  buildEducation(ctx);     // Rutgers University clock-tower hall         @ [0, -52]
  buildBny(ctx);           // BNY gold tower + pulsing blockchain         @ [54, -28]
  buildEssex(ctx);         // Essex Securities HQ + two role kiosks       @ [54, 28]
  buildAzonix(ctx);        // Azonix Tech + panning CCTV camera           @ [-54, 28]
  buildSkills(ctx);        // Skills constellation (glowing tech icons)   @ [-54, -28]
  buildAchievements(ctx);  // Gold trophy centerpiece                     @ [0, 0]
  loadDetails(ctx);        // Blender detail layers (trophy, BNY, Essex, Azonix)
}
