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

export function buildLandmarks(ctx) {
  buildEducation(ctx);     // Rutgers University clock-tower hall         @ [0, -52]
  buildBny(ctx);           // BNY gold tower + pulsing blockchain         @ [54, -28]
  buildEssex(ctx);         // Essex Securities HQ + two role kiosks       @ [54, 28]
  buildAzonix(ctx);        // Azonix Tech + panning CCTV camera           @ [-54, 28]
  buildSkills(ctx);        // Skills constellation (glowing tech icons)   @ [-54, -28]
  buildAchievements(ctx);  // Gold trophy centerpiece                     @ [0, 0]
}
