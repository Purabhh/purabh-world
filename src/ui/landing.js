// Landing overlay — the full-screen "3D PORTFOLIO" title screen.
//
// Mounts into #ui. Shows a huge wordmark, a tagline, a glowing green
// "▶ Enter World" CTA, and a rounded pill nav (Projects / Resume / GitHub /
// LinkedIn). Enter World (and Projects) drop the player into the 3D world.
//
//   import { createLanding } from './ui/landing.js';
//   const landing = createLanding({ onEnter: () => { ... } });
//   landing.hide();  // fade out + display:none
//   landing.show();  // reverse
//
// Styles are injected from JS (no bundler) via injectStyles() in ./styles.js.
import { profile } from '../data/resume.js';
import { injectStyles, uiRoot } from './styles.js';

export function createLanding({ onEnter, onTour, tutorial } = {}) {
  injectStyles();

  const root = document.createElement('section');
  root.className = 'pw-root pw-landing';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', "3D Portfolio: start screen");

  root.innerHTML = `
    <div class="pw-landing__inner">
      <h1 class="pw-landing__title"><span class="pw-apos">3D</span> PORTFOLIO</h1>
      <p class="pw-landing__name">${escapeHtml(profile.name)}</p>
      <p class="pw-landing__subtitle">${escapeHtml(profile.tagline)}</p>
      <p class="pw-landing__school">${escapeHtml(profile.school)}</p>

      <div class="pw-landing__cta">
        <button class="pw-btn-enter" type="button" data-tour>🧭 Take the Tour</button>
        <button class="pw-btn-secondary" type="button" data-enter>Enter World</button>
      </div>

      <nav class="pw-nav" aria-label="Portfolio sections">
        <button class="pw-pill" type="button" data-projects>
          <span class="pw-pill__ico" aria-hidden="true">🧩</span>Projects
        </button>
        <a class="pw-pill" data-resume target="_blank" rel="noopener">
          <span class="pw-pill__ico" aria-hidden="true">📄</span>Resume
        </a>
        <a class="pw-pill" data-github target="_blank" rel="noopener">
          <span class="pw-pill__ico" aria-hidden="true">🐙</span>GitHub
        </a>
        <a class="pw-pill" data-linkedin target="_blank" rel="noopener">
          <span class="pw-pill__ico" aria-hidden="true">in</span>LinkedIn
        </a>
        <button class="pw-pill" type="button" data-tutorial aria-pressed="true">
          <span class="pw-pill__ico" aria-hidden="true">🎓</span><span data-tutorial-label>Tutorial: On</span>
        </button>
      </nav>

      <div class="pw-landing__hintwrap"><div class="pw-landing__hint">
        <p class="pw-hint__row">New here? <b>Take the Tour</b> needs no controls at all.</p>
        <p class="pw-hint__row pw-hint__keys">
          <span>Exploring on foot:</span>
          <span><b>W/S</b> walk</span>
          <span><b>A/D</b> turn</span>
          <span><b>E</b> read a sign</span>
        </p>
      </div></div>
    </div>
  `;

  // Wire external links from the profile (single source of truth).
  root.querySelector('[data-resume]').href = profile.resume;
  root.querySelector('[data-github]').href = profile.github;
  root.querySelector('[data-linkedin]').href = profile.linkedin;

  // Tutorial toggle: on for first-time visitors, off once they've done or skipped it.
  const tutBtn = root.querySelector('[data-tutorial]');
  const tutLabel = root.querySelector('[data-tutorial-label]');
  function syncTutorial() {
    const on = !!(tutorial && tutorial.enabled);
    tutLabel.textContent = `Tutorial: ${on ? 'On' : 'Off'}`;
    tutBtn.setAttribute('aria-pressed', String(on));
  }
  if (tutorial) {
    tutBtn.addEventListener('click', () => { tutorial.setEnabled(!tutorial.enabled); syncTutorial(); });
    syncTutorial();
  } else tutBtn.remove();

  // Touch screens have no keyboard: swap the key hints for touch wording.
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    const keys = root.querySelector('.pw-hint__keys');
    if (keys) keys.innerHTML = '<span>Exploring on foot:</span><span><b>Stick</b> walk</span><span><b>Drag</b> look</span><span><b>Button</b> read a sign</span>';
  }

  let hidden = false;

  function enter() {
    if (hidden) return;
    try { onEnter && onEnter(); } catch (e) { console.error('[landing] onEnter failed', e); }
    hide();
  }

  function startTour() {
    if (hidden) return;
    try { onTour && onTour(); } catch (e) { console.error('[landing] onTour failed', e); }
    hide();
  }

  // Take the Tour → guided walkthrough. Enter World + Projects → free roam
  // (Projects lets the player walk straight to the Projects district).
  root.querySelector('[data-tour]').addEventListener('click', startTour);
  root.querySelector('[data-enter]').addEventListener('click', enter);
  root.querySelector('[data-projects]').addEventListener('click', enter);

  function hide() {
    hidden = true;
    root.classList.add('pw-hidden');
    // Drop out of layout once the fade finishes so it never blocks the canvas.
    const done = () => { if (hidden) root.style.display = 'none'; };
    let settled = false;
    const onEnd = () => { if (!settled) { settled = true; done(); } };
    root.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(onEnd, 520); // fallback if transitionend never fires
  }

  function show() {
    hidden = false;
    if (tutorial) syncTutorial();
    root.style.display = '';
    // Force reflow so removing .pw-hidden animates the fade back in.
    void root.offsetWidth;
    root.classList.remove('pw-hidden');
  }

  uiRoot().appendChild(root);

  return { hide, show, el: root, get visible() { return !hidden; } };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
