// Movement nudge — a one-time, hard-to-miss overlay shown the instant free-roam
// starts, so a non-gamer isn't left guessing why the mouse alone doesn't turn
// the camera. The permanent HUD controls chip (bottom-left) is easy to miss
// while looking at the 3D world; this sits center-top for a few seconds, then
// self-dismisses on the player's first real move/look/interact input, or after
// a timeout regardless. Shows once per browser tab (sessionStorage) so it
// doesn't nag on repeat "Enter World" visits after Home.
//
//   import { createNudge } from './ui/nudge.js';
//   const nudge = createNudge();
//   nudge.show();   // call once free-roam actually has control
import { injectStyles, uiRoot } from './styles.js';

const SEEN_KEY = 'pw:nudge-seen';

export function createNudge() {
  injectStyles();

  const root = document.createElement('div');
  root.className = 'pw-root pw-nudge';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="pw-nudge__card">
      <span class="pw-kbd">W/S</span> to walk &nbsp;·&nbsp; <span class="pw-kbd">A/D</span> to turn &nbsp;·&nbsp;
      <span class="pw-kbd">E</span> to read a sign
    </div>
  `;
  uiRoot().appendChild(root);

  let visible = false;
  let cleanup = null;

  function alreadySeen() {
    try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
  }
  function markSeen() {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch {}
  }

  function hide() {
    if (!visible) return;
    visible = false;
    root.classList.remove('pw-show');
    if (cleanup) { cleanup(); cleanup = null; }
  }

  function show() {
    if (visible || alreadySeen()) return;
    visible = true;
    markSeen();
    root.classList.add('pw-show');

    const dismiss = () => hide();
    // Any real attempt to move, look, or interact dismisses it immediately —
    // the point is to get out of the way the second it's done its job.
    const onKey = (e) => { if (/^[wasd]$/i.test(e.key)) dismiss(); };
    const onPointerDown = () => dismiss();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown);
    const timer = setTimeout(dismiss, 6000);

    cleanup = () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
      clearTimeout(timer);
    };
  }

  return { show, hide, el: root };
}
