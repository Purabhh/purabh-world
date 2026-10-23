// Terrain: the ground "dressing" that sits on top of the existing grass slab.
// Adds the central spawn plaza, walkways out to every district, a tinted plaza
// floor under each district, and a sandy beach rim at the island's edge.
//
// All floors are thin patches (see voxel.patch) laid just above y=0 so they read
// as paint on the grass rather than geometry the player can trip on. Nothing here
// casts shadows (patches/slabs disable it) which keeps the look clean + flat.
import * as THREE from 'three';
import { PLAZA, PATH_W } from './groundMask.js';

// Blend two hex color numbers. t=0 -> a, t=1 -> b. Used to tint district plazas
// toward stone so each accent stays soft instead of a screaming solid color.
function mix(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

export function buildTerrain(ctx) {
  const { scene, voxel, palette, layout } = ctx;
  const { patch } = voxel;

  const add = (m) => { if (m) scene.add(m); };

  // ---------------------------------------------------------------------------
  // 1) Central SPAWN PLAZA at [0,0] — a rounded stone floor with an accent ring.
  //    "Rounded" is faked by layering a big square + chamfer squares + corner
  //    nibs so the silhouette reads octagonal-ish without any non-box geometry.
  // ---------------------------------------------------------------------------
  const ringColor = palette.gold; // warm accent border that matches the sunny palette

  // Accent border ring: a slightly larger square just under the plaza, so its
  // edge peeks out as a thin frame around the stone.
  add(patch({ size: [PLAZA + 2.4, PLAZA + 2.4], color: ringColor, pos: [0, 0], y: 0.05 }));

  // Plaza body (stone), plus chamfer strips to round the corners.
  add(patch({ size: [PLAZA, PLAZA], color: palette.stone, pos: [0, 0], y: 0.08, tiles: 4 }));
  add(patch({ size: [PLAZA - 6, PLAZA + 4], color: palette.stone, pos: [0, 0], y: 0.08, tiles: 4 }));
  add(patch({ size: [PLAZA + 4, PLAZA - 6], color: palette.stone, pos: [0, 0], y: 0.08, tiles: 4 }));

  // Inner medallion: a lighter sand inlay + tiny center stud, gives the plaza a
  // focal point right where the player spawns.
  add(patch({ size: [9, 9], color: palette.sand, pos: [0, 0], y: 0.1, tiles: 2 }));
  add(patch({ size: [3.4, 3.4], color: palette.stoneDark, pos: [0, 0], y: 0.12 }));

  // ---------------------------------------------------------------------------
  // 2) PATHS from the plaza out to each district center.
  //    Walkways are built by stepping overlapping square patches along the line
  //    from origin to the district edge. Square steps mean diagonal paths still
  //    look chunky-voxel rather than a thin rotated ribbon. A darker edge patch
  //    sits just under each step to give the walkway a border.
  // ---------------------------------------------------------------------------
  for (const key in layout.DISTRICTS) {
    const d = layout.DISTRICTS[key];
    const [cx, cz] = d.center;
    const dist = Math.hypot(cx, cz);
    if (dist < 1) continue;
    const ux = cx / dist, uz = cz / dist;

    // Start just outside the plaza, end just inside the district plaza.
    const start = PLAZA / 2 - 1;
    const end = dist - d.radius * 0.55;
    const step = PATH_W * 0.7;           // overlap so there are no gaps
    const steps = [];
    for (let t = start; t <= end; t += step) steps.push([ux * t, uz * t]);
    // Every edge (slightly larger) first, then every paving step, so no step's
    // edge paints over the end of the step before it.
    for (const pos of steps) add(patch({ size: [PATH_W + 1.2, PATH_W + 1.2], color: palette.pathEdge, pos, y: 0.06 }));
    for (const pos of steps) add(patch({ size: [PATH_W, PATH_W], color: palette.path, pos, y: 0.08, tiles: 3 }));
  }

  // ---------------------------------------------------------------------------
  // 3) DISTRICT PLAZA floor under each district center.
  //    Square footprint ~ radius*1.8, tinted lightly from stone toward the
  //    district accent (75% stone / 25% accent) so the zone is marked but calm.
  //    A thin accent frame underneath echoes the spawn plaza treatment.
  // ---------------------------------------------------------------------------
  for (const key in layout.DISTRICTS) {
    const d = layout.DISTRICTS[key];
    const [cx, cz] = d.center;
    const s = d.radius * 1.8;
    const floorColor = mix(palette.stone, d.accent, 0.25);
    add(patch({ size: [s + 2.2, s + 2.2], color: d.accent, pos: [cx, cz], y: 0.05 }));
    add(patch({ size: [s, s], color: floorColor, pos: [cx, cz], y: 0.07, tiles: 6 }));
    // soft inner inlay
    add(patch({ size: [s * 0.55, s * 0.55], color: mix(palette.stone, d.accent, 0.12), pos: [cx, cz], y: 0.09, tiles: 4 }));
  }

  // 4) The sandy beach ring at the island's edge is painted into the ground
  //    itself (world/ground.js), with ripples and a wet outer edge.
}
