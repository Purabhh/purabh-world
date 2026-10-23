// Where open grass is. terrain.js paints the plaza, paths, district floors and
// beach from these same numbers, so the grass field (grass.js) can never grow
// over a walkway that terrain drew.
import { layout } from '../core/constants.js';

export const PLAZA = 24;         // spawn plaza footprint
export const PATH_W = 4;         // walkway width, plaza -> each district
export const BEACH_INSET = 8;    // how far the beach band sits in from the rim
export const BEACH_W = 12;       // width of the sandy band

const half = layout.groundSize / 2;
const grassLimit = half - BEACH_INSET - BEACH_W - 0.5;
const districts = Object.values(layout.DISTRICTS);

// True only on open grass: not the plaza, a path, a district floor or the beach.
export function isGround(x, z) {
  if (Math.abs(x) > grassLimit || Math.abs(z) > grassLimit) return false;
  if (Math.abs(x) < PLAZA / 2 + 2 && Math.abs(z) < PLAZA / 2 + 2) return false;
  for (const d of districts) {
    const [cx, cz] = d.center;
    const floor = d.radius * 0.9 + 1.5;
    if (Math.abs(x - cx) < floor && Math.abs(z - cz) < floor) return false;
    // distance to the path segment from the origin to this district
    const len2 = cx * cx + cz * cz;
    const t = Math.max(0, Math.min(1, (x * cx + z * cz) / len2));
    if (Math.hypot(x - cx * t, z - cz * t) < PATH_W / 2 + 0.6) return false;
  }
  return true;
}
