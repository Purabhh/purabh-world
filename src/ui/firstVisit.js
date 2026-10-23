// First-visit coach marks on the landing screen. DRAFT.
//
// A brand-new visitor doesn't know the tour is the easy path, so once the landing's
// own entrance animation settles (~2.3s):
//   1. A "New here? Start here" tag drops in above Take the Tour and bobs.
//   2. Ripple rings spread from the Tour button a few times.
//   3. Everything else dims briefly so the eye lands on the Tour + the hint card.
//   4. A light sweeps across the "New here?" card, then its keys light up one by
//      one (walk, turn, read), like a tiny demo of the controls.
// It runs until they leave the landing (Tour or Enter World), then never again on
// that browser. `?firstvisit` forces it for previewing.
//
//   import { coachFirstVisit } from './ui/firstVisit.js';
//   coachFirstVisit(landing);
const SEEN_KEY = 'pw-landing-seen';

const CSS = `
/* Room above the Tour button for the tag, reserved from the start so nothing jumps. */
.pw-root.pw-landing.pw-fv .pw-landing__cta { position: relative; margin-top: 66px; }
.pw-fv-tag {
  position: absolute; left: 50%; bottom: calc(100% + 12px); z-index: 2;
  padding: 7px 14px; border-radius: 999px; white-space: nowrap;
  font-family: inherit; font-weight: 700; font-size: 14px; line-height: 1; color: #0e2a15; background: #ffe08a;
  box-shadow: 0 8px 22px rgba(0, 0, 0, .28);
  opacity: 0; transform: translate(-50%, -10px);
  animation: pwfv-drop .5s cubic-bezier(.2, .9, .3, 1.3) forwards 2.3s, pwfv-bob 1.8s ease-in-out infinite 2.8s;
  pointer-events: none;
}
.pw-fv-tag::after {
  content: ''; position: absolute; left: 50%; top: 100%; margin-left: -7px;
  border: 7px solid transparent; border-top-color: #ffe08a;
}
.pw-fv [data-tour] { position: relative; }
.pw-fv [data-tour]::before, .pw-fv [data-tour]::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  border: 2px solid rgba(255, 224, 138, .9); opacity: 0;
  animation: pwfv-ripple 1.6s ease-out 4 2.4s;
}
.pw-fv [data-tour]::after { animation-delay: 3.2s; }

/* Brief spotlight: dim the rest, keep the Tour button and the hint card bright.
   filter, not opacity, so it doesn't fight the landing's own rise-in animations. */
.pw-fv .pw-landing__title, .pw-fv .pw-landing__name, .pw-fv .pw-landing__subtitle,
.pw-fv .pw-landing__school, .pw-fv [data-enter], .pw-fv .pw-nav { transition: filter .6s ease; }
.pw-fv-dim .pw-landing__title, .pw-fv-dim .pw-landing__name, .pw-fv-dim .pw-landing__subtitle,
.pw-fv-dim .pw-landing__school, .pw-fv-dim [data-enter], .pw-fv-dim .pw-nav { filter: brightness(.55) saturate(.7); }

.pw-fv .pw-landing__hint { overflow: hidden; border-color: rgba(91, 208, 106, .45); }
.pw-fv .pw-landing__hint::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(100deg, transparent 30%, rgba(255, 244, 220, .22) 50%, transparent 70%);
  transform: translateX(-100%); animation: pwfv-sweep 1.4s ease-in-out 2.9s;
}
.pw-fv .pw-hint__keys b { animation: pwfv-key 5.4s ease-in-out infinite; }
.pw-fv .pw-hint__keys span:nth-child(2) b { animation-delay: 3.4s; }
.pw-fv .pw-hint__keys span:nth-child(3) b { animation-delay: 4.2s; }
.pw-fv .pw-hint__keys span:nth-child(4) b { animation-delay: 5s; }

@keyframes pwfv-drop { to { opacity: 1; transform: translate(-50%, 0); } }
@keyframes pwfv-bob { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -5px); } }
@keyframes pwfv-ripple { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35, 1.7); } }
@keyframes pwfv-dim { 0%, 100% { opacity: 1; } 20%, 75% { opacity: .45; } }
@keyframes pwfv-sweep { to { transform: translateX(100%); } }
@keyframes pwfv-key {
  0%, 14%, 100% { background: rgba(91, 208, 106, .14); color: #5bd06a; transform: none; box-shadow: none; }
  4%, 10% { background: #5bd06a; color: #0e2a15; transform: translateY(-2px) scale(1.12); box-shadow: 0 0 14px rgba(91, 208, 106, .7); }
}

@media (max-width: 600px) {
  .pw-root.pw-landing.pw-fv .pw-landing__cta { margin-top: 52px; }
  .pw-fv-tag { font-size: 13px; padding: 6px 12px; bottom: calc(100% + 10px); }
}
@media (prefers-reduced-motion: reduce) {
  .pw-fv-tag { animation: none; opacity: 1; transform: translate(-50%, 0); }
  .pw-fv [data-tour]::before, .pw-fv [data-tour]::after, .pw-fv .pw-landing__hint::after,
  .pw-fv .pw-hint__keys b { animation: none; }
}
`;

function seen() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
}

export function coachFirstVisit(landing) {
  const force = new URLSearchParams(location.search).has('firstvisit');
  if (seen() && !force) return;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = landing.el;
  const tour = root.querySelector('[data-tour]');
  const tag = document.createElement('span');
  tag.className = 'pw-fv-tag';
  tag.textContent = '👋 New here? Start here';
  tour.before(tag);
  root.classList.add('pw-fv');
  // Spotlight on for ~3s once the entrance settles; reduced motion skips it.
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers = calm ? [] : [
    setTimeout(() => root.classList.add('pw-fv-dim'), 2400),
    setTimeout(() => root.classList.remove('pw-fv-dim'), 5600),
  ];

  // Leaving the landing counts as "seen"; the coach marks come off for good.
  const done = () => { markSeen(); timers.forEach(clearTimeout); root.classList.remove('pw-fv', 'pw-fv-dim'); tag.remove(); };
  root.querySelectorAll('[data-tour], [data-enter], [data-projects]').forEach((b) => b.addEventListener('click', done, { once: true }));
}
