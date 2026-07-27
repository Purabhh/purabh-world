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
  // obj: { id, position: THREE.Vector3, radius: number, data: PanelData }
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
    const d = it.position.distanceTo(pos);
    if (d <= it.radius && d < bestDist) {
      best = it;
      bestDist = d;
    }
  }
  return best;
}
