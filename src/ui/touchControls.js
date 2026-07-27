// On-screen touch controls — makes free-roam playable on phones/tablets.
//
// Desktop has WASD + drag-look + scroll-zoom + E. Touch has none of that, so a
// recruiter on a phone could only orbit the camera and was stuck in place. This
// module adds the missing half:
//   • a left-thumb virtual joystick  -> analog camera-relative movement
//   • a right-thumb action cluster   -> Interact (E), Jump, Sprint (toggle)
// Camera look stays where it was: a finger dragging on the 3D canvas (player.js
// filters out touches that began on these controls, so the two never fight).
//
//   import { createTouchControls } from './ui/touchControls.js';
//   const touch = createTouchControls();
//   if (touch.active) { ... show it, feed it to the player ... }
//
// The player reads getMove()/sprint/consumeJump(); main.js wires onInteract().
import { injectStyles, uiRoot } from './styles.js';

// Coarse pointer == finger-first device. We also honour a manual override
// (?touch=1 or window.__PW_FORCE_TOUCH) so the controls can be exercised on a
// desktop preview where the pointer is "fine".
function detectTouch() {
  try {
    if (window.__PW_FORCE_TOUCH) return true;
    if (location.search.includes('touch=1')) return true;
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return !!coarse && (navigator.maxTouchPoints || 0) > 0;
  } catch { return false; }
}

export function createTouchControls() {
  injectStyles();
  const active = detectTouch();

  const root = document.createElement('div');
  root.className = 'pw-root pw-touch';
  root.setAttribute('aria-hidden', 'true');     // it's a redundant control surface

  root.innerHTML = `
    <div class="pw-touch__stick" data-stick>
      <div class="pw-touch__nub" data-nub></div>
    </div>
    <div class="pw-touch__actions">
      <button class="pw-touch__btn pw-touch__sprint" type="button" data-sprint title="Sprint">»</button>
      <button class="pw-touch__btn pw-touch__jump" type="button" data-jump title="Jump">⤒</button>
      <button class="pw-touch__btn pw-touch__act" type="button" data-act title="Interact">
        <span class="pw-touch__act-ico">⦿</span>
        <span class="pw-touch__act-label" data-act-label>Interact</span>
      </button>
    </div>
  `;
  uiRoot().appendChild(root);

  // Mark the document so other UI can step out of the thumb zone on touch (e.g.
  // the day/dusk chip relocates from bottom-right to top-right — see styles).
  if (active) document.body.classList.add('pw-touch-active');

  const stick = root.querySelector('[data-stick]');
  const nub = root.querySelector('[data-nub]');
  const sprintBtn = root.querySelector('[data-sprint]');
  const jumpBtn = root.querySelector('[data-jump]');
  const actBtn = root.querySelector('[data-act]');
  const actLabel = root.querySelector('[data-act-label]');

  // --- state the player polls each frame --------------------------------------
  const move = { x: 0, z: 0 };   // -1..1; x = strafe (right +), z = forward (up = -1)
  let sprintOn = false;
  let jumpQueued = false;
  const handlers = { interact: null };

  // --- joystick: drag a nub inside the ring, output a normalized vector --------
  const MAXR = 46;               // px the nub can travel from center
  let stickId = null;
  function stickStart(e) {
    stickId = e.pointerId;
    stick.setPointerCapture(stickId);
    stickMove(e);
  }
  function stickMove(e) {
    if (e.pointerId !== stickId) return;
    const r = stick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, MAXR);
    dx = (dx / len) * clamped;
    dy = (dy / len) * clamped;
    nub.style.transform = `translate(${dx}px, ${dy}px)`;
    move.x = dx / MAXR;          // right thumb -> strafe right
    move.z = dy / MAXR;          // up on screen (negative dy) -> forward
  }
  function stickEnd(e) {
    if (e.pointerId !== stickId) return;
    stickId = null;
    move.x = 0; move.z = 0;
    nub.style.transform = 'translate(0px, 0px)';
  }
  stick.addEventListener('pointerdown', (e) => { e.preventDefault(); stickStart(e); });
  stick.addEventListener('pointermove', (e) => { e.preventDefault(); stickMove(e); });
  stick.addEventListener('pointerup', stickEnd);
  stick.addEventListener('pointercancel', stickEnd);

  // --- buttons ----------------------------------------------------------------
  // Jump fires once per press (queued, consumed by the player on the next frame).
  jumpBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); jumpQueued = true; jumpBtn.classList.add('pw-down'); });
  const jumpUp = () => jumpBtn.classList.remove('pw-down');
  jumpBtn.addEventListener('pointerup', jumpUp);
  jumpBtn.addEventListener('pointercancel', jumpUp);

  // Sprint is a toggle (kinder on thumbs than a hold).
  sprintBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sprintOn = !sprintOn;
    sprintBtn.classList.toggle('pw-on', sprintOn);
  });

  // Interact -> the callback main.js supplies (mount Raja / open card / hop off).
  actBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (actBtn.classList.contains('pw-dim')) return;     // nothing nearby
    actBtn.classList.add('pw-down');
    handlers.interact && handlers.interact();
  });
  const actUp = () => actBtn.classList.remove('pw-down');
  actBtn.addEventListener('pointerup', actUp);
  actBtn.addEventListener('pointercancel', actUp);

  // --- API --------------------------------------------------------------------
  return {
    active,
    el: root,
    getMove() { return move; },
    get sprint() { return sprintOn; },
    consumeJump() { const j = jumpQueued; jumpQueued = false; return j; },
    onInteract(cb) { handlers.interact = cb; },
    // Light up the interact button when something's in range; dim it otherwise.
    setInteract(enabled, label) {
      actBtn.classList.toggle('pw-dim', !enabled);
      actBtn.classList.toggle('pw-live', !!enabled);
      if (label) actLabel.textContent = label;
    },
    setVisible(v) { root.classList.toggle('pw-touch--on', !!v && active); },
  };
}
