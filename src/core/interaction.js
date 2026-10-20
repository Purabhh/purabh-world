// Proximity interaction registry.
//
// Landmarks and project kiosks register a zone with a position + radius and a
// `data` payload describing the info card to show. Each frame the main loop
// calls getNearest(playerPosition) to find the zone the player is standing in,
// shows a "press E" prompt, and opens the card on demand.
//
// PanelData shape (what the UI renders):
//   {
//     title:    string,
//     subtitle: string,            // optional (e.g. role dates / location)
//     accent:   string,            // optional CSS color for the card header
//     lines:    string[],          // bullet points / paragraphs
//     tags:     string[],          // optional pill tags
//     links:    [{label, url}],    // optional buttons
//     meta:     string,            // optional small footer (e.g. "JavaScript · ★ 12")
//   }

const interactables = [];

export function registerInteractable(obj) {
  // obj: { id, position: THREE.Vector3, radius: number, data: PanelData,
  //        bounds?: { x, z, hw, hd } }
  // `position` is where the card pins and the fallback circle (radius) is centered.
  // `bounds` (optional) is the monument's base: standing anywhere inside that
  // rectangle counts, so big buildings don't need you at one exact spot.
  interactables.push(obj);
  return obj;
}

export function clearInteractables() {
  interactables.length = 0;
}

export function getInteractables() {
  return interactables;
}

// Nearest interactable whose radius contains `pos`, else null.
export function getNearest(pos) {
  let best = null;
  let bestDist = Infinity;
  for (const it of interactables) {
    if (!it.position) continue;
    let d, inside;
    if (it.bounds) {
      const b = it.bounds;
      inside = Math.abs(pos.x - b.x) <= b.hw && Math.abs(pos.z - b.z) <= b.hd;
      d = Math.hypot(pos.x - b.x, pos.z - b.z);
    } else {
      d = it.position.distanceTo(pos);
      inside = d <= it.radius;
    }
    if (inside && d < bestDist) {
      best = it;
      bestDist = d;
    }
  }
  return best;
}
