// Solid-object registry + a simple XZ collision resolver.
//
// Modules that build solid things (buildings, trees, rocks, kiosks, the trophy)
// register a collider here; the player and the tiger resolve against it each
// frame so nothing is walk-through. Each collider also carries a flat `top`
// height and a `leap` flag, so the tiger can pick low ones to pounce onto.
//
// It's a module singleton (like voxel's `swayables`) so any builder can import
// and register without threading anything through ctx. A full page reload
// re-evaluates the module, clearing the list.

const list = [];

// Axis-aligned box footprint, centered at (cx,cz), half-extents (halfW,halfD).
// Returns the collider object so callers can move it (e.g. a moving creature) or
// toggle `.off`.
export function addBox(cx, cz, halfW, halfD, opts = {}) {
  const c = { kind: 'box', x: cx, z: cz, cx, cz, hw: halfW, hd: halfD, top: opts.top || 0, leap: !!opts.leap };
  list.push(c);
  return c;
}

// Circular footprint of radius r at (x,z). Returns the collider object.
export function addCircle(x, z, r, opts = {}) {
  const c = { kind: 'circle', x, z, r, top: opts.top || 0, leap: !!opts.leap };
  list.push(c);
  return c;
}

export function clearColliders() { list.length = 0; }
export function colliders() { return list; }
export function leapTargets() { return list.filter((c) => c.leap); }

// Push a point (with body radius `rad`) out of any collider it overlaps, on the
// XZ plane only. Mutates pos.x / pos.z. `skip` optionally ignores one collider
// (e.g. the rock the tiger is currently perched on). Colliders flagged `.off`
// (e.g. a creature mid-leap) are ignored.
export function resolve(pos, rad, skip) {
  for (const c of list) {
    if (c === skip || c.off) continue;
    if (c.kind === 'box') {
      const minX = c.cx - c.hw - rad, maxX = c.cx + c.hw + rad;
      const minZ = c.cz - c.hd - rad, maxZ = c.cz + c.hd + rad;
      if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
        // push out along the axis of least penetration
        const dl = pos.x - minX, dr = maxX - pos.x, dd = pos.z - minZ, du = maxZ - pos.z;
        const m = Math.min(dl, dr, dd, du);
        if (m === dl) pos.x = minX;
        else if (m === dr) pos.x = maxX;
        else if (m === dd) pos.z = minZ;
        else pos.z = maxZ;
      }
    } else {
      const dx = pos.x - c.x, dz = pos.z - c.z, rr = c.r + rad;
      const d2 = dx * dx + dz * dz;
      if (d2 < rr * rr) {
        const d = Math.sqrt(d2) || 0.0001;
        pos.x = c.x + (dx / d) * rr;
        pos.z = c.z + (dz / d) * rr;
      }
    }
  }
}
