// Movement nudge — a one-time, hard-to-miss overlay shown the instant free-roam
// starts, so a non-gamer isn't left guessing why the mouse alone doesn't turn
// the camera. The permanent HUD controls chip (bottom-left) is easy to miss
// while looking at the 3D world; this sits center-top for a few seconds, then
// self-dismisses on the player's first real move/look/interact input, or after
// a timeout regardless. Shown every time free roam starts, and after the tutorial.
//
//   import { createNudge } from './ui/nudge.js';
//   const nudge = createNudge();
//   nudge.show();   // call once free-roam actually has control
import { injectStyles, uiRoot } from './styles.js';

export function createNudge() {
  injectStyles();

  const root = document.createElement('div');
  root.className = 'pw-root pw-nudge';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="pw-nudge__card">
      Move closer to any monument and press <span class="pw-kbd">E</span> to see what it's about
    </div>
  `;
  uiRoot().appendChild(root);

  let visible = false;
  let cleanup = null;

  function hide() {
    if (!visible) return;
    visible = false;
    root.classList.remove('pw-show');
    if (cleanup) { cleanup(); cleanup = null; }
  }

  function show() {
    if (visible) return;
    visible = true;
    root.classList.add('pw-show');

    const dismiss = () => hide();
    // Any real attempt to move, look, or interact dismisses it immediately —
    // the point is to get out of the way the second it's done its job.
    const onKey = (e) => { if (/^[wasd]$/i.test(e.key)) dismiss(); };
    const onPointerDown = () => dismiss();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown);
    const timer = setTimeout(dismiss, 8000);

    cleanup = () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
      clearTimeout(timer);
    };
  }

  return { show, hide, el: root };
}
