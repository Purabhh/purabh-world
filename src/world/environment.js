// Environment: decorative props scattered across the open grass — tree clusters,
// bushes, rocks, lamp posts along the plaza/path edges, and a few drifting
// clouds. None of it overlaps a district or the spawn plaza.
//
// Placement is deterministic (a tiny seeded RNG) so the world looks the same on
// every load, which makes it easy to tune. Total mesh count is kept modest
// (well under ~350) for performance: trees are 3 meshes, lamps 3, clouds ~3.
import * as THREE from 'three';
import { CANOPY_COLORS } from './foliage.js';
import { addCircle } from '../core/colliders.js';

// ---- deterministic RNG (mulberry32) ----------------------------------------
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildEnvironment(ctx) {
  const { scene, voxel, palette, layout, onUpdate } = ctx;
  const { tree, box, pillar, group } = voxel;
  const half = layout.groundSize / 2;
  const rng = makeRng(0x50ada1); // fixed seed -> stable layout
  const add = (m) => { if (m) scene.add(m); };

  const districts = Object.values(layout.DISTRICTS);
  const SPAWN_CLEAR = 14;        // keep props out of the spawn plaza
  const PLANT_LIMIT = half - 18; // stay inside the beach ring (no props on the sand)

  // True if [x,z] is far enough from spawn, every district, and the island rim
  // to safely drop a prop. `pad` is extra breathing room around districts.
  function isOpen(x, z, pad = 6) {
    if (Math.hypot(x, z) < SPAWN_CLEAR) return false;
    if (Math.abs(x) > PLANT_LIMIT || Math.abs(z) > PLANT_LIMIT) return false;
    for (const d of districts) {
      if (Math.hypot(x - d.center[0], z - d.center[1]) < d.radius + pad) return false;
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // TREE CLUSTERS — pick a handful of cluster anchors in open grass, then sprout
  // a few trees around each with varied height/leaf tone. Clustering reads more
  // "natural" than a uniform scatter.
  // ---------------------------------------------------------------------------
  // One canopy color per grove, so groves read as groups (mostly green).
  const groveTones = [CANOPY_COLORS.green, CANOPY_COLORS.green, CANOPY_COLORS.yellow, CANOPY_COLORS.pink, CANOPY_COLORS.red];
  let clusters = 0, tries = 0;
  while (clusters < 9 && tries < 400) {
    tries++;
    const ax = (rng() * 2 - 1) * PLANT_LIMIT;
    const az = (rng() * 2 - 1) * PLANT_LIMIT;
    if (!isOpen(ax, az, 9)) continue;
    clusters++;
    const n = 3 + Math.floor(rng() * 4); // 3–6 trees per cluster
    // from the anchor, not rng(), so the tree layout stays exactly as it was
    const leaf = groveTones[Math.abs(Math.round(ax * 7 + az * 13)) % groveTones.length];
    for (let i = 0; i < n; i++) {
      const tx = ax + (rng() * 2 - 1) * 9;
      const tz = az + (rng() * 2 - 1) * 9;
      if (!isOpen(tx, tz, 5)) continue;
      const h = 3.6 + rng() * 3.4;
      add(tree({ pos: [tx, tz], h, trunk: palette.trunk, leaf }));
    }
  }

  // ---------------------------------------------------------------------------
  // BUSHES + ROCKS — small low boxes sprinkled around open grass. Cheap single
  // boxes, slightly sunk so they sit on the ground.
  // ---------------------------------------------------------------------------
  let props = 0, ptries = 0;
  while (props < 26 && ptries < 500) {
    ptries++;
    const x = (rng() * 2 - 1) * PLANT_LIMIT;
    const z = (rng() * 2 - 1) * PLANT_LIMIT;
    if (!isOpen(x, z, 4)) continue;
    props++;
    if (rng() < 0.55) {
      // bush: a squat green cube cluster
      const s = 1.4 + rng() * 1.2;
      add(box({ size: [s, s * 0.8, s], color: rng() < 0.5 ? palette.leaf : palette.leafDark, pos: [x, s * 0.4, z] }));
      addCircle(x, z, s * 0.5, { top: s * 0.8, leap: false });
    } else {
      // rock: a stony block, randomly tinted between stone/stoneDark
      const s = 1.1 + rng() * 1.6;
      add(box({ size: [s, s * 0.7, s * (0.8 + rng() * 0.5)], color: rng() < 0.5 ? palette.stone : palette.stoneDark, pos: [x, s * 0.35, z] }));
      addCircle(x, z, s * 0.55, { top: s * 0.7, leap: true }); // tiger can pounce onto rocks
    }
  }

  // ---------------------------------------------------------------------------
  // LAMP POSTS — line them along the rim of the spawn plaza, facing outward.
  //    Each lamp: a dark post + a glowing warm head (emissive) so it pops in the
  //    sunny scene. 4 lamps × 2 meshes = 8 meshes.
  // ---------------------------------------------------------------------------
  function lamp(x, z) {
    const postH = 4.2;
    return group([
      pillar({ footprint: [0.4, 0.4], height: postH, color: palette.stoneDark, pos: [x, z] }),
      box({
        size: [1.1, 1.1, 1.1], color: palette.gold, pos: [x, postH + 0.3, z],
        emissive: palette.gold, emissiveIntensity: 0.6,
      }),
    ]);
  }
  const lampR = 15.5; // just outside the 24-wide plaza corners
  for (const [lx, lz] of [[lampR, lampR], [-lampR, lampR], [lampR, -lampR], [-lampR, -lampR]]) {
    add(lamp(lx, lz));
    addCircle(lx, lz, 0.6, { top: 4.5, leap: false });
  }

  // Clouds live in the atmosphere layer now (src/world/atmosphere.js) so they can
  // drift; this module stays purely the static, grounded props.
}
