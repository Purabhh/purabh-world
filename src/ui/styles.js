// Single source of truth for all UI-layer styling.
//
// Importing a .css file from JS does not work here (no bundler), so the CSS
// lives as a string in this module and is injected once via a <style> tag.
// src/ui/ui.css holds an identical copy for human readability ONLY — the
// runtime never reads it. If you edit one, mirror the change in the other.
//
// injectStyles() is idempotent: landing.js, panel.js, and hud.js all call it on
// construction, but the stylesheet is only ever added to <head> once.

const STYLE_ID = 'purabh-ui-styles';

export const UI_CSS = `
/* ============================================================================
   3D PORTFOLIO — UI overlay styles
   Warm "Friendly Game Title" look: sunny gradient, rounded Baloo 2 type,
   glowing green CTA, cream cards, soft shadows.
   Palette (from index.html / constants.js):
     --sky-top #ffe6ba  --sky-mid #ffd183  --sky-bottom #ffc06b
     --cta #5fd06a  --cta-dark #3fb14e  --ink #2b2620  --panel #fffaf0
   All components are scoped under .pw- so nothing leaks into the 3D canvas.
   ============================================================================ */

.pw-root,
.pw-root * {
  box-sizing: border-box;
  font-family: 'Baloo 2', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

/* Local fallbacks so the UI is correct even outside index.html. */
.pw-root {
  --pw-sky-top: var(--sky-top, #ffe6ba);
  --pw-sky-mid: var(--sky-mid, #ffd183);
  --pw-sky-bottom: var(--sky-bottom, #ffc06b);
  --pw-cta: var(--cta, #5fd06a);
  --pw-cta-dark: var(--cta-dark, #3fb14e);
  --pw-ink: var(--ink, #2b2620);
  --pw-panel: var(--panel, #fffaf0);
  --pw-shadow: 0 14px 34px rgba(74, 48, 14, 0.22);
  --pw-shadow-sm: 0 6px 16px rgba(74, 48, 14, 0.18);
}

/* ---------------------------------------------------------------------------
   LANDING — full-screen title overlay
   --------------------------------------------------------------------------- */
.pw-landing {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  padding: 32px 22px calc(32px + env(safe-area-inset-bottom, 0px));
  text-align: center;
  color: var(--pw-ink);
  /* Warm sunny backdrop so it matches the template before the 3D loads. */
  background:
    radial-gradient(120% 90% at 50% 8%, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 55%),
    linear-gradient(180deg, var(--pw-sky-top) 0%, var(--pw-sky-mid) 52%, var(--pw-sky-bottom) 100%);
  opacity: 1;
  transition: opacity 0.45s ease;
  -webkit-user-select: none;
  user-select: none;
}
.pw-landing.pw-hidden {
  opacity: 0;
  pointer-events: none;
}

/* Soft floating sun glow behind the wordmark. */
.pw-landing::before {
  content: '';
  position: absolute;
  top: -14vh;
  left: 50%;
  width: min(70vw, 620px);
  height: min(70vw, 620px);
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(255, 247, 224, 0.9) 0%, rgba(255, 209, 131, 0) 68%);
  pointer-events: none;
  z-index: 0;
}

.pw-landing__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  max-width: 860px;
  width: 100%;
  animation: pw-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.pw-landing__eyebrow {
  font-size: clamp(0.78rem, 2.4vw, 0.98rem);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #b9802f;
  margin: 0;
}

.pw-landing__title {
  margin: 0;
  font-weight: 800;
  line-height: 0.94;
  font-size: clamp(2.7rem, 11vw, 6.6rem);
  letter-spacing: -0.01em;
  color: var(--pw-ink);
  text-shadow:
    0 2px 0 rgba(255, 255, 255, 0.6),
    0 14px 30px rgba(120, 78, 18, 0.28);
}
.pw-landing__title .pw-apos {
  color: var(--pw-cta-dark);
}

.pw-landing__name {
  margin: -8px 0 0;
  font-size: clamp(1rem, 2.8vw, 1.3rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #8a6c3c;
}

.pw-landing__subtitle {
  margin: 0;
  font-size: clamp(1rem, 3.4vw, 1.42rem);
  font-weight: 600;
  color: #5f4a2c;
  max-width: 30ch;
}

/* Glowing green primary CTA. */
.pw-btn-enter {
  appearance: none;
  border: 0;
  cursor: pointer;
  margin-top: 4px;
  padding: 17px 40px;
  font-family: inherit;
  font-size: clamp(1.1rem, 3.2vw, 1.4rem);
  font-weight: 800;
  letter-spacing: 0.01em;
  color: #073b12;
  background: linear-gradient(180deg, var(--pw-cta) 0%, var(--pw-cta-dark) 100%);
  border-radius: 999px;
  box-shadow:
    0 0 0 6px rgba(95, 208, 106, 0.18),
    0 14px 26px rgba(63, 177, 78, 0.45),
    inset 0 2px 0 rgba(255, 255, 255, 0.45);
  transition: transform 0.14s ease, box-shadow 0.2s ease, filter 0.2s ease;
  animation: pw-glow 2.6s ease-in-out infinite;
}
.pw-btn-enter:hover {
  transform: translateY(-2px) scale(1.02);
  filter: brightness(1.04);
  box-shadow:
    0 0 0 7px rgba(95, 208, 106, 0.24),
    0 18px 32px rgba(63, 177, 78, 0.5),
    inset 0 2px 0 rgba(255, 255, 255, 0.5);
}
.pw-btn-enter:active { transform: translateY(0) scale(0.99); }
.pw-btn-enter:focus-visible { outline: 3px solid #073b12; outline-offset: 4px; }

/* Rounded pill nav. */
.pw-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}
.pw-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 20px;
  font-family: inherit;
  font-size: clamp(0.92rem, 2.6vw, 1.04rem);
  font-weight: 700;
  text-decoration: none;
  color: var(--pw-ink);
  background: var(--pw-panel);
  border: 0;
  cursor: pointer;
  border-radius: 999px;
  box-shadow: var(--pw-shadow-sm);
  transition: transform 0.14s ease, box-shadow 0.18s ease, background 0.18s ease;
}
.pw-pill:hover {
  transform: translateY(-2px);
  background: #fffefb;
  box-shadow: 0 10px 22px rgba(74, 48, 14, 0.24);
}
.pw-pill:active { transform: translateY(0); }
.pw-pill:focus-visible { outline: 3px solid var(--pw-cta-dark); outline-offset: 3px; }
.pw-pill__ico { font-size: 1.05em; line-height: 1; }

.pw-landing__hint {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: clamp(0.86rem, 2.4vw, 1rem);
  font-weight: 600;
  color: #6f5530;
  background: rgba(255, 250, 240, 0.66);
  padding: 8px 16px;
  border-radius: 999px;
}
.pw-landing__hint b { color: var(--pw-cta-dark); }

.pw-landing__footer {
  position: absolute;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  left: 0;
  right: 0;
  z-index: 1;
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: #8a6c3c;
  opacity: 0.85;
}

/* ---------------------------------------------------------------------------
   CARD — compact info pop-up that floats beside a landmark.
   main.js projects the landmark's 3D point to the screen each frame and calls
   panel.setAnchor(x,y) to place it (left/top). Warm dusk-glass, accent top edge,
   springs in, caps height + scrolls for long content.
   --------------------------------------------------------------------------- */
.pw-card {
  position: fixed;
  left: 0; top: 0;
  z-index: 30;
  width: min(440px, 90vw);
  display: flex;
  flex-direction: column;
  color: #fbf3e6;
  background: linear-gradient(180deg, rgba(55, 39, 24, 0.94), rgba(37, 25, 14, 0.95));
  border: 1px solid rgba(255, 240, 214, 0.12);
  border-top: 3px solid var(--pw-accent, #3fb14e);
  border-radius: 14px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5);
  -webkit-backdrop-filter: blur(8px) saturate(1.1);
  backdrop-filter: blur(8px) saturate(1.1);
  padding: 14px 15px 12px;
  opacity: 0;
  pointer-events: none;
  transform: scale(0.85);
  transition: opacity 0.18s ease;
}
.pw-card.pw-open { opacity: 1; pointer-events: auto; }
.pw-card.pw-pop { animation: pw-card-pop 0.34s cubic-bezier(0.22, 1.4, 0.4, 1) both; }

.pw-card__close {
  position: absolute; top: 9px; right: 9px;
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.05rem; line-height: 1; color: #fbf3e6;
  background: rgba(255, 255, 255, 0.12); border: 0; border-radius: 50%; cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease;
}
.pw-card__close:hover { background: rgba(255, 255, 255, 0.24); transform: scale(1.08); }
.pw-card__close:active { transform: scale(0.95); }
.pw-card__close:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

/* enlarge toggle, sits left of the x */
.pw-card__grow {
  position: absolute; top: 9px; right: 39px;
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; line-height: 1; color: #fbf3e6;
  background: rgba(255, 255, 255, 0.12); border: 0; border-radius: 50%; cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease;
}
.pw-card__grow:hover { background: rgba(255, 255, 255, 0.24); transform: scale(1.08); }
.pw-card__grow:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
/* enlarged: scaled as a whole so text grows with the card. panel.js sets --z from
   the card's content so it fills ~80% of the screen (more for short content). */
.pw-card.pw-card--big {
  --z: 1;
  left: 50% !important; top: 50% !important;
  width: min(440px, 90vw); min-height: 0;
  translate: -50% -50%; scale: var(--z);
  padding: 22px 26px 18px;
}
.pw-card--big .pw-card__body { max-height: calc(80vh / var(--z)); }
/* first-time hint pointing at the two buttons */
.pw-card__hint {
  position: absolute; top: 42px; right: 4px; display: flex; gap: 8px; z-index: 2;
  pointer-events: none; animation: pw-hint-in 0.4s ease both;
}
.pw-card__hint span {
  position: relative; font-size: 0.72rem; font-weight: 800; color: #2b2620;
  background: #ffd34e; padding: 5px 9px; border-radius: 999px; white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35); animation: pw-hint-bob 1s ease-in-out infinite alternate;
}
.pw-card__hint span::after {
  content: ''; position: absolute; top: -6px; right: 12px;
  border: 6px solid transparent; border-top: 0; border-bottom-color: #ffd34e;
}
.pw-card--hinting .pw-card__close, .pw-card--hinting .pw-card__grow {
  animation: pw-hint-ring 1.1s ease-out infinite;
}
@keyframes pw-hint-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@keyframes pw-hint-bob { to { transform: translateY(4px); } }
@keyframes pw-hint-ring { 0% { box-shadow: 0 0 0 0 rgba(255, 211, 78, 0.8); } 100% { box-shadow: 0 0 0 10px rgba(255, 211, 78, 0); } }

.pw-card__eyebrow {
  align-self: flex-start;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  color: #fff; background: var(--pw-accent, #3fb14e);
  padding: 3px 9px; border-radius: 999px; margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
}
.pw-card__title { margin: 0; font-size: 1.16rem; font-weight: 800; line-height: 1.12; padding-right: 22px; }
.pw-card__sub { margin: 4px 0 0; font-size: 0.82rem; font-weight: 600; color: #e7cfa8; }

.pw-card__body { margin-top: 11px; max-height: min(280px, 45vh); overflow-y: auto; padding-right: 5px; scrollbar-width: thin; scrollbar-color: rgba(255, 240, 214, 0.3) transparent; }
.pw-card__body::-webkit-scrollbar { width: 6px; }
.pw-card__body::-webkit-scrollbar-thumb { background: rgba(255, 240, 214, 0.3); border-radius: 999px; }

.pw-card__lines { margin: 0; padding: 0; list-style: none; display: grid; gap: 9px; }
.pw-card__line {
  position: relative; padding-left: 16px;
  font-size: 0.92rem; font-weight: 500; line-height: 1.4; color: #f3e6d2;
}
.pw-card__line::before {
  content: ''; position: absolute; left: 0; top: 0.5em;
  width: 7px; height: 7px; border-radius: 2px; background: var(--pw-accent, #3fb14e);
}

.pw-card__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 11px; }
.pw-card .pw-tag {
  font-size: 0.7rem; font-weight: 700; padding: 4px 9px; border-radius: 999px;
  color: #f3e6d2; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 240, 214, 0.16);
}

.pw-card__links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.pw-card__link {
  display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
  font-size: 0.8rem; font-weight: 700; color: #fff;
  padding: 8px 13px; border-radius: 10px;
  background: color-mix(in srgb, var(--pw-accent, #3fb14e) 30%, transparent);
  border: 1.5px solid var(--pw-accent, #3fb14e);
  transition: filter 0.15s ease, transform 0.12s ease;
}
.pw-card__link:hover { filter: brightness(1.14); transform: translateY(-1px); }
.pw-card__link:active { transform: translateY(0); }
.pw-card__link:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

.pw-card__meta {
  margin: 11px 0 0; padding-top: 10px; border-top: 1px solid rgba(255, 240, 214, 0.12);
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #c9b08a;
}

@keyframes pw-card-pop {
  from { opacity: 0; transform: scale(0.85); }
  55%  { opacity: 1; }
  to   { opacity: 1; transform: scale(1); }
}

/* ---------------------------------------------------------------------------
   HUD — controls chip (bottom-left) + contextual prompt (bottom-center)
   --------------------------------------------------------------------------- */
.pw-hud { position: fixed; inset: 0; z-index: 20; pointer-events: none; }

/* Home chip (top-left). Clickable, so it opts back into pointer events even
   though the HUD layer itself is click-through. */
.pw-hud__home {
  position: absolute;
  left: calc(16px + env(safe-area-inset-left, 0px));
  top: calc(16px + env(safe-area-inset-top, 0px));
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  color: #5f4a2c;
  background: rgba(255, 250, 240, 0.82);
  border: 0;
  cursor: pointer;
  border-radius: 999px;
  box-shadow: var(--pw-shadow-sm);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 0.25s ease, transform 0.25s ease, background 0.18s ease;
}
.pw-hud__home.pw-show { opacity: 1; transform: translateY(0); }
.pw-hud__home:hover { background: #fffefb; }
.pw-hud__home:active { transform: translateY(1px); }
.pw-hud__home:focus-visible { outline: 3px solid var(--pw-cta-dark); outline-offset: 3px; }

.pw-hud__controls {
  position: absolute;
  left: calc(16px + env(safe-area-inset-left, 0px));
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 15px;
  font-size: 0.86rem;
  font-weight: 600;
  color: #5f4a2c;
  background: rgba(255, 250, 240, 0.82);
  border-radius: 999px;
  box-shadow: var(--pw-shadow-sm);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.pw-hud__controls.pw-show { opacity: 1; transform: translateY(0); }
.pw-hud__controls .pw-kbd, .pw-nudge .pw-kbd {
  display: inline-block;
  padding: 1px 7px;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--pw-ink);
  background: #fff;
  border-radius: 7px;
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.12);
}

/* First-move nudge (center-top): hard to miss, gone the moment it's used.
   See ui/nudge.js. */
.pw-nudge {
  position: absolute;
  top: calc(20px + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translate(-50%, -10px);
  z-index: 5;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.pw-nudge.pw-show { opacity: 1; transform: translate(-50%, 0); animation: pw-nudge-bob 2.2s ease-in-out infinite; }
.pw-nudge__card {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 11px 20px;
  font-size: clamp(0.84rem, 2vw, 0.96rem);
  font-weight: 700;
  color: #5f4a2c;
  background: rgba(255, 250, 240, 0.94);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(74, 48, 14, 0.3);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  white-space: nowrap;
}
@keyframes pw-nudge-bob {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -4px); }
}
@media (max-width: 640px) {
  .pw-nudge__card { white-space: normal; text-align: center; max-width: 88vw; }
}

/* Day/dusk toggle chip (bottom-right). Clickable, so it opts back into pointer
   events even though the HUD layer itself is click-through. */
.pw-hud__toggle {
  position: absolute;
  right: calc(16px + env(safe-area-inset-right, 0px));
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  color: #5f4a2c;
  background: rgba(255, 250, 240, 0.82);
  border: 0;
  cursor: pointer;
  border-radius: 999px;
  box-shadow: var(--pw-shadow-sm);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.25s ease, transform 0.25s ease, background 0.18s ease;
}
.pw-hud__toggle.pw-show { opacity: 1; transform: translateY(0); }
.pw-hud__toggle:hover { background: #fffefb; }
.pw-hud__toggle:active { transform: translateY(1px); }
.pw-hud__toggle:focus-visible { outline: 3px solid var(--pw-cta-dark); outline-offset: 3px; }

.pw-hud__prompt {
  position: absolute;
  left: 50%;
  bottom: calc(30px + env(safe-area-inset-bottom, 0px));
  transform: translate(-50%, 10px);
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 12px 22px;
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  color: #073b12;
  background: linear-gradient(180deg, var(--pw-cta) 0%, var(--pw-cta-dark) 100%);
  border-radius: 999px;
  box-shadow:
    0 0 0 5px rgba(95, 208, 106, 0.2),
    0 10px 22px rgba(63, 177, 78, 0.4),
    inset 0 2px 0 rgba(255, 255, 255, 0.4);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.pw-hud__prompt.pw-show {
  opacity: 1;
  transform: translate(-50%, 0);
  animation: pw-bob 1.8s ease-in-out infinite;
}
.pw-hud__prompt .pw-kbd-e {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--pw-cta-dark);
  background: #fff;
  border-radius: 8px;
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.14);
}

/* rich prompt (e.g. riding Raja): title, then spaced keycap + label groups */
.pw-hud__prompt.pw-hud__prompt--rich { gap: 0; padding: 10px 12px 10px 20px; }
.pw-hud__prompt.pw-hud__prompt--rich > .pw-kbd-e { display: none; }
.pw-hud__prompt.pw-hud__prompt--rich .pw-hud__prompt-text { display: inline-flex; align-items: center; flex-wrap: nowrap; gap: 16px; }
.pw-hud__prompt-title {
  padding-right: 18px; font-size: 1.02rem; font-weight: 800; letter-spacing: .01em;
  border-right: 2px solid rgba(7, 59, 18, 0.22);
}
.pw-hud__prompt .pw-hud__prompt-item { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; font-size: .9rem; font-weight: 600; color: #0b4a18; }
.pw-hud__prompt-item kbd {
  display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 26px; padding: 0 8px;
  font: 800 .78rem/1 ui-monospace, 'SFMono-Regular', Consolas, monospace; letter-spacing: .04em;
  color: var(--pw-cta-dark); background: #fff; border-radius: 7px;
  box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.16), 0 1px 0 rgba(255, 255, 255, 0.5);
}
.pw-hud__prompt--rich.pw-show { animation: none; }
@media (max-width: 640px) {
  .pw-hud__prompt--rich { white-space: normal; max-width: calc(100vw - 32px); border-radius: 22px; }
  .pw-hud__prompt--rich .pw-hud__prompt-text { flex-wrap: wrap; justify-content: center; gap: 8px 14px; }
  .pw-hud__prompt-title { flex-basis: 100%; text-align: center; border-right: 0; padding-right: 0; }
}

/* ---------------------------------------------------------------------------
   CINEMATIC INTRO — letterbox bars, lower-third caption, skip button
   --------------------------------------------------------------------------- */
.pw-cine { position: fixed; inset: 0; z-index: 35; pointer-events: none; }
.pw-cine-bar {
  position: absolute; left: 0; right: 0; height: 0; background: #000;
  transition: height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.pw-cine-bar--top { top: 0; }
.pw-cine-bar--bottom { bottom: 0; }
.pw-cine--on .pw-cine-bar { height: 9vh; }

.pw-cine-cap {
  position: absolute; left: 0; right: 0; bottom: 13vh;
  text-align: center; color: #fff; opacity: 0;
  padding: 0 18px;
}
.pw-cine-cap.pw-show { animation: pw-cine-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.pw-cine-cap__name {
  font-size: clamp(1.8rem, 6vw, 3.4rem); font-weight: 800; line-height: 1.05;
  text-shadow: 0 3px 16px rgba(0, 0, 0, 0.55);
}
.pw-cine-cap__sub {
  margin-top: 6px; font-size: clamp(0.95rem, 2.6vw, 1.25rem); font-weight: 600;
  color: #ffe6ba; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}
.pw-cine-skip {
  position: absolute; top: calc(9vh + 14px); right: 18px;
  font-family: inherit; font-size: 0.9rem; font-weight: 700; color: #fff;
  background: rgba(0, 0, 0, 0.45); border: 1.5px solid rgba(255, 255, 255, 0.5);
  cursor: pointer; padding: 9px 16px; border-radius: 999px;
  /* Only interactive/visible while the intro actually plays — otherwise it would
     leak on screen once the landing hides (e.g. during the recruiter tour). */
  opacity: 0; pointer-events: none;
  transition: background 0.16s ease, transform 0.12s ease, opacity 0.3s ease;
}
.pw-cine--on .pw-cine-skip { opacity: 1; pointer-events: auto; }
.pw-cine-skip:hover { background: rgba(0, 0, 0, 0.65); transform: translateY(-1px); }
.pw-cine-skip:active { transform: translateY(0); }
.pw-cine-skip:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }

/* ---------------------------------------------------------------------------
   LANDING — CTA group: primary "Take the Tour" + secondary "Enter World"
   --------------------------------------------------------------------------- */
.pw-landing__cta { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.pw-btn-secondary {
  appearance: none; border: 0; cursor: pointer;
  padding: 12px 30px;
  font-family: inherit; font-size: clamp(0.95rem, 2.6vw, 1.12rem); font-weight: 700;
  color: #5f4a2c; background: var(--pw-panel);
  border-radius: 999px; box-shadow: var(--pw-shadow-sm);
  transition: transform 0.14s ease, box-shadow 0.18s ease, background 0.18s ease;
}
.pw-btn-secondary:hover { transform: translateY(-2px); background: #fffefb; box-shadow: 0 10px 22px rgba(74, 48, 14, 0.24); }
.pw-btn-secondary:active { transform: translateY(0); }
.pw-btn-secondary:focus-visible { outline: 3px solid var(--pw-cta-dark); outline-offset: 3px; }

/* ---------------------------------------------------------------------------
   RECRUITER TOUR — control bar (bottom-center): Prev / Pause / Next / dots / Exit
   --------------------------------------------------------------------------- */
.pw-tour-intro {
  position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 16px;
  background: rgba(20, 14, 8, 0.35); pointer-events: auto;
}
.pw-tour-intro__card {
  max-width: 400px; background: rgba(36, 28, 20, 0.94); color: #fff4e2; border-radius: 22px;
  padding: 22px 24px; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4); font-weight: 600; line-height: 1.45;
}
.pw-tour-intro__eyebrow { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #5fd06a; margin-bottom: 10px; }
.pw-tour-intro__card ul { margin: 0 0 18px; padding-left: 18px; }
.pw-tour-intro__card li { margin-bottom: 8px; }
.pw-tour-intro__go { width: 100%; }
.pw-tour {
  position: fixed;
  left: 50%;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  transform: translate(-50%, 16px);
  z-index: 36;
  pointer-events: auto;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.pw-tour.pw-tour--on { opacity: 1; transform: translate(-50%, 0); }
.pw-tour__bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: min(94vw, 700px);
  padding: 10px 14px;
  color: #fbf3e6;
  background: linear-gradient(180deg, rgba(45, 32, 20, 0.93), rgba(30, 21, 12, 0.95));
  border: 1px solid rgba(255, 240, 214, 0.14);
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  overflow: hidden;
}
.pw-tour__meta { display: flex; flex-direction: column; line-height: 1.12; min-width: 88px; }
.pw-tour__count { font-size: 0.62rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #c9b08a; }
.pw-tour__name { font-size: 0.95rem; font-weight: 800; white-space: nowrap; }
.pw-tour__ctrls { display: flex; align-items: center; gap: 6px; }
.pw-tour__btn {
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.86rem; color: #fbf3e6;
  background: rgba(255, 255, 255, 0.1); border: 0; border-radius: 50%; cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease;
}
.pw-tour__btn:hover { background: rgba(255, 255, 255, 0.22); transform: translateY(-1px); }
.pw-tour__btn:active { transform: translateY(0); }
.pw-tour__btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.pw-tour__btn--play { background: var(--pw-cta-dark); color: #073b12; }
.pw-tour__btn--play:hover { background: var(--pw-cta); }
.pw-tour__dots { display: flex; align-items: center; gap: 7px; }
.pw-tour__dot {
  width: 9px; height: 9px; padding: 0;
  /* Upcoming stops: a visible ring, not a near-invisible tinted fill — the old
     0.28-alpha cream on a near-black bar read as "missing dots" on a lot of
     displays. */
  border: 1.5px solid rgba(255, 240, 214, 0.55);
  border-radius: 50%; background: transparent; cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.pw-tour__dot:hover { border-color: #fff; background: rgba(255, 255, 255, 0.25); }
.pw-tour__dot.pw-done { border-color: rgba(255, 240, 214, 0.7); background: rgba(255, 240, 214, 0.7); }
.pw-tour__dot.pw-on { border-color: var(--pw-cta); background: var(--pw-cta); transform: scale(1.35); }
.pw-tour__dot:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.pw-tour__exit {
  font-family: inherit; font-size: 0.82rem; font-weight: 700; color: #fbf3e6;
  background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 240, 214, 0.2);
  border-radius: 999px; padding: 8px 14px; cursor: pointer; white-space: nowrap;
  transition: background 0.15s ease, transform 0.12s ease, box-shadow 0.18s ease;
}
.pw-tour__exit:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
.pw-tour__exit:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.pw-tour--final .pw-tour__exit {
  color: #073b12; border-color: transparent; font-weight: 800;
  background: linear-gradient(180deg, var(--pw-cta), var(--pw-cta-dark));
  box-shadow: 0 8px 18px rgba(63, 177, 78, 0.45);
}
.pw-tour__fill { position: absolute; left: 0; top: 0; height: 3px; width: 100%; background: rgba(255, 255, 255, 0.08); }
.pw-tour__fill > i { display: block; height: 100%; width: 0%; background: var(--pw-cta); transition: width 0.12s linear; }

/* Tighten the bar on phones: drop the stop name, keep the essential controls. */
@media (max-width: 560px) {
  .pw-tour__bar { gap: 9px; padding: 9px 11px; }
  .pw-tour__name { display: none; }
  .pw-tour__meta { min-width: 0; }
}

/* ---------------------------------------------------------------------------
   TOUCH CONTROLS — virtual joystick (left) + action cluster (right).
   Shown only on touch devices, only during free-roam. The HUD layer is
   click-through; these opt their own children back into pointer events.
   --------------------------------------------------------------------------- */
.pw-touch { position: fixed; inset: 0; z-index: 22; pointer-events: none; opacity: 0; transition: opacity 0.25s ease; }
.pw-touch.pw-touch--on { opacity: 1; }
.pw-touch.pw-touch--on .pw-touch__stick,
.pw-touch.pw-touch--on .pw-touch__actions { pointer-events: auto; }

.pw-touch__stick {
  position: absolute;
  left: calc(26px + env(safe-area-inset-left, 0px));
  bottom: calc(34px + env(safe-area-inset-bottom, 0px));
  width: 124px; height: 124px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 250, 240, 0.18), rgba(255, 250, 240, 0.07));
  border: 2px solid rgba(255, 255, 255, 0.34);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28), inset 0 0 18px rgba(255, 255, 255, 0.12);
  touch-action: none; -webkit-user-select: none; user-select: none;
}
.pw-touch__nub {
  position: absolute; left: 50%; top: 50%;
  width: 56px; height: 56px; margin: -28px 0 0 -28px; border-radius: 50%;
  background: radial-gradient(circle at 38% 34%, #fffef9, #f4dcae);
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35); will-change: transform;
}

.pw-touch__actions {
  position: absolute;
  right: calc(24px + env(safe-area-inset-right, 0px));
  bottom: calc(30px + env(safe-area-inset-bottom, 0px));
  display: grid; gap: 14px; justify-items: end; touch-action: none;
}
.pw-touch__btn {
  -webkit-appearance: none; appearance: none;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: inherit; font-weight: 800; color: #fbf3e6;
  border: 2px solid rgba(255, 255, 255, 0.34);
  background: rgba(45, 32, 20, 0.5);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  border-radius: 50%; cursor: pointer; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.32);
  touch-action: none; -webkit-user-select: none; user-select: none;
  transition: transform 0.1s ease, background 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease;
}
.pw-touch__btn.pw-down { transform: scale(0.92); }
.pw-touch__sprint { width: 56px; height: 56px; font-size: 1.5rem; }
.pw-touch__sprint.pw-on {
  background: var(--pw-cta-dark); color: #073b12; border-color: transparent;
  box-shadow: 0 0 0 4px rgba(95, 208, 106, 0.25), 0 8px 18px rgba(63, 177, 78, 0.4);
}
.pw-touch__jump { width: 64px; height: 64px; font-size: 1.7rem; }
.pw-touch__act {
  position: relative; flex-direction: column; gap: 1px;
  width: 88px; height: 88px;
  border-color: rgba(95, 208, 106, 0.7); color: #073b12;
  background: linear-gradient(180deg, rgba(95, 208, 106, 0.92), rgba(63, 177, 78, 0.95));
  box-shadow: 0 0 0 5px rgba(95, 208, 106, 0.2), 0 10px 22px rgba(63, 177, 78, 0.4);
}
.pw-touch__act-ico { font-size: 1.5rem; line-height: 1; }
.pw-touch__act-label { font-size: 0.66rem; font-weight: 800; letter-spacing: 0.02em; }
.pw-touch__act.pw-live { animation: pw-act-pulse 1.6s ease-in-out infinite; }
.pw-touch__act.pw-dim {
  background: rgba(45, 32, 20, 0.42); color: #c9b08a; border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3); opacity: 0.6; cursor: default; animation: none;
}
@keyframes pw-act-pulse {
  0%, 100% { box-shadow: 0 0 0 5px rgba(95, 208, 106, 0.18), 0 10px 22px rgba(63, 177, 78, 0.4); }
  50%      { box-shadow: 0 0 0 9px rgba(95, 208, 106, 0.3), 0 12px 26px rgba(63, 177, 78, 0.5); }
}

/* On touch, the action cluster owns the bottom-right thumb zone, so move the
   day/dusk chip up to the top-right where it won't collide with Interact. */
.pw-touch-active .pw-hud__toggle { top: calc(14px + env(safe-area-inset-top, 0px)); bottom: auto; }

/* Short / landscape phones: shrink the rig so it never dominates the view. */
@media (max-height: 480px) {
  .pw-touch__stick { width: 104px; height: 104px; }
  .pw-touch__nub { width: 48px; height: 48px; margin: -24px 0 0 -24px; }
  .pw-touch__act { width: 76px; height: 76px; }
  .pw-touch__jump { width: 56px; height: 56px; }
  .pw-touch__sprint { width: 48px; height: 48px; }
}

/* ---------------------------------------------------------------------------
   Keyframes
   --------------------------------------------------------------------------- */
@keyframes pw-cine-rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pw-rise {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pw-glow {
  0%, 100% { box-shadow: 0 0 0 6px rgba(95, 208, 106, 0.16), 0 14px 26px rgba(63, 177, 78, 0.42), inset 0 2px 0 rgba(255, 255, 255, 0.45); }
  50%      { box-shadow: 0 0 0 10px rgba(95, 208, 106, 0.26), 0 16px 30px rgba(63, 177, 78, 0.55), inset 0 2px 0 rgba(255, 255, 255, 0.5); }
}
@keyframes pw-bob {
  0%, 100% { transform: translate(-50%, 0); }
  50%      { transform: translate(-50%, -4px); }
}

@media (prefers-reduced-motion: reduce) {
  .pw-landing, .pw-landing__inner, .pw-card, .pw-card.pw-pop,
  .pw-btn-enter, .pw-hud__prompt.pw-show, .pw-hud__controls {
    animation: none !important;
    transition-duration: 0.001s !important;
  }
}

/* ---------------------------------------------------------------------------
   LANDING (dusk redesign): transparent over the live 3D world, which orbits
   behind it. Staggered rise-in animations per element.
   --------------------------------------------------------------------------- */
.pw-root.pw-landing {
  font-family: 'Ubuntu', 'Baloo 2', system-ui, sans-serif;
  background: radial-gradient(ellipse 48% 60% at 50% 48%, rgba(16, 10, 32, 0.6) 0%, rgba(16, 10, 32, 0.4) 55%, rgba(16, 10, 32, 0) 100%);
  gap: 0; padding: 48px 24px 96px;
}
.pw-root.pw-landing::before { display: none; }
.pw-landing .pw-landing__inner { gap: 0; animation: none; }
.pw-landing .pw-landing__title {
  font-weight: 700; font-size: clamp(54px, 7.5vw, 88px); line-height: 1; letter-spacing: -1px; color: #fff4dc;
  text-shadow: 0 5px 0 rgba(12, 8, 30, 0.55), 0 18px 40px rgba(12, 8, 30, 0.45);
  animation: pwl-title 1.1s cubic-bezier(.2, .7, .2, 1) both .2s;
}
.pw-landing .pw-landing__title .pw-apos { color: #4ccc5c; text-shadow: 0 5px 0 #1e6b2b, 0 18px 40px rgba(12, 8, 30, 0.45); }
.pw-landing .pw-landing__name {
  margin: 22px 0 0; font-weight: 700; font-size: 18px; letter-spacing: .3px; color: #ffd47c;
  animation: pwl-rise .8s cubic-bezier(.2, .7, .2, 1) both .55s, pwl-name 4s ease-in-out infinite 1.6s;
}
.pw-landing .pw-landing__subtitle {
  margin: 20px 0 0; max-width: 520px; font-weight: 400; font-size: clamp(17px, 1.5vw, 20px); line-height: 1.5; color: #f6eedc;
  text-wrap: pretty; animation: pwl-rise .8s cubic-bezier(.2, .7, .2, 1) both .7s;
}
.pw-landing .pw-landing__school {
  margin: 14px 0 0; font-size: clamp(14px, 1.2vw, 16px); line-height: 1.5; color: #c9bfd0;
  animation: pwl-rise .8s cubic-bezier(.2, .7, .2, 1) both .82s;
}
.pw-landing .pw-landing__cta { margin-top: 32px; gap: 14px; }
.pw-landing .pw-btn-enter {
  font-family: inherit; display: inline-flex; align-items: center; gap: 10px; margin: 0;
  padding: 16px 40px; font-weight: 700; font-size: 20px; line-height: 1; color: #0e2a15; background: #3fbf52;
  box-shadow: 0 0 0 7px rgba(63, 191, 82, .25), 0 14px 36px rgba(63, 191, 82, .35);
  animation: pwl-pop .7s cubic-bezier(.2, .8, .2, 1.2) both 1s, pwl-cta 2.8s ease-in-out infinite 1.8s;
}
.pw-landing .pw-btn-enter:hover { background: #56d368; transform: translateY(-2px); filter: none; }
.pw-landing .pw-btn-secondary, .pw-landing .pw-pill {
  font-family: inherit; color: #fff4dc; font-weight: 700; line-height: 1.1;
  background: rgba(255, 244, 220, .12); border: 1.5px solid rgba(255, 244, 220, .38); box-shadow: none;
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
}
.pw-landing .pw-btn-secondary { padding: 14px 30px; font-size: 16px; animation: pwl-rise .7s cubic-bezier(.2, .7, .2, 1) both 1.15s; }
.pw-landing .pw-btn-secondary:hover, .pw-landing .pw-pill:hover { background: rgba(255, 244, 220, .24); box-shadow: none; }
.pw-landing .pw-nav { margin-top: 30px; gap: 12px; }
.pw-landing .pw-pill { padding: 14px 22px; font-size: 15px; gap: 8px; background: rgba(255, 244, 220, .1); border-color: rgba(255, 244, 220, .28); }
.pw-landing .pw-pill:nth-child(1) { animation: pwl-rise .7s cubic-bezier(.2, .7, .2, 1) both 1.3s; }
.pw-landing .pw-pill:nth-child(2) { animation: pwl-rise .7s cubic-bezier(.2, .7, .2, 1) both 1.4s; }
.pw-landing .pw-pill:nth-child(3) { animation: pwl-rise .7s cubic-bezier(.2, .7, .2, 1) both 1.5s; }
.pw-landing .pw-pill:nth-child(4) { animation: pwl-rise .7s cubic-bezier(.2, .7, .2, 1) both 1.6s; }
.pw-landing .pw-landing__hintwrap { margin-top: 22px; animation: pwl-rise .8s cubic-bezier(.2, .7, .2, 1) both 1.85s; }
.pw-landing .pw-landing__hint {
  padding: 14px 26px; border-radius: 22px; background: rgba(20, 14, 36, .55); border: 1px solid rgba(255, 244, 220, .16);
  color: #ece3cf; font-weight: 400; font-size: 15px; line-height: 1.75;
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); animation: pwl-float 5s ease-in-out infinite 2.7s;
}
.pw-landing .pw-landing__hint b { color: #5bd06a; }
.pw-landing .pw-landing__footer { font-size: 12px; font-weight: 400; color: #c3bac9; opacity: 1; animation: pwl-fade 1.2s ease both 2.2s; }
@keyframes pwl-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pwl-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pwl-pop { from { opacity: 0; transform: scale(.86) translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes pwl-title { from { opacity: 0; transform: translateY(-22px); letter-spacing: 8px; } to { opacity: 1; transform: none; letter-spacing: -1px; } }
@keyframes pwl-cta { 0%, 100% { box-shadow: 0 0 0 7px rgba(63, 191, 82, .25), 0 14px 36px rgba(63, 191, 82, .35); } 50% { box-shadow: 0 0 0 13px rgba(63, 191, 82, .1), 0 16px 46px rgba(63, 191, 82, .55); } }
@keyframes pwl-name { 0%, 100% { text-shadow: 0 0 0 rgba(255, 212, 124, 0); } 50% { text-shadow: 0 0 18px rgba(255, 212, 124, .6); } }
@keyframes pwl-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@media (prefers-reduced-motion: reduce) {
  .pw-landing *, .pw-landing .pw-landing__hint { animation-duration: .01s !important; animation-iteration-count: 1 !important; }
}

.pw-landing .pw-landing__hint { padding: 16px 30px; line-height: 1.5; }
.pw-landing .pw-hint__row { margin: 0; }
.pw-landing .pw-hint__keys { margin-top: 10px; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 22px; }
.pw-landing .pw-hint__keys b { display: inline-block; padding: 1px 8px; margin-right: 4px; border-radius: 6px; background: rgba(91, 208, 106, .14); border: 1px solid rgba(91, 208, 106, .35); }

/* readability: a soft dark glass panel behind the intro text so it reads over a busy scene */
.pw-landing .pw-landing__subtitle,
.pw-landing .pw-landing__school {
  display: inline-block; padding: 6px 20px; border-radius: 16px;
  background: rgba(16, 10, 32, .5); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  text-shadow: 0 2px 8px rgba(0, 0, 0, .65), 0 0 2px rgba(0, 0, 0, .5);
}
.pw-landing .pw-landing__school { margin-top: 10px; }

/* home-screen backdrop: blur the 3D world behind the intro text (strongest in the middle) */
.pw-root.pw-landing::before {
  content: ''; display: block; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: rgba(16, 10, 32, .2);
  -webkit-backdrop-filter: blur(7px); backdrop-filter: blur(7px);
  -webkit-mask-image: radial-gradient(ellipse 50% 60% at 50% 48%, #000 55%, transparent 100%);
          mask-image: radial-gradient(ellipse 50% 60% at 50% 48%, #000 55%, transparent 100%);
}

/* home text: no box color, just the blurred world behind it */
.pw-landing .pw-landing__subtitle,
.pw-landing .pw-landing__school {
  background: none; -webkit-backdrop-filter: none; backdrop-filter: none; padding: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, .75), 0 0 3px rgba(0, 0, 0, .6);
}
.pw-root.pw-landing::before {
  background: rgba(16, 10, 32, .08);
  -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
}

/* View mode button: top right, free roam only; #ui is click-through so opt in */
.pw-view-btn {
  position: fixed; top: 14px; right: 14px; z-index: 12; pointer-events: auto;
  padding: 10px 18px; font-family: inherit; font-size: 0.95rem; font-weight: 700; cursor: pointer;
  color: #fff4dc; background: rgba(20, 14, 36, .6); border: 1.5px solid rgba(255, 244, 220, .3);
  border-radius: 999px; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
}
.pw-view-btn:hover { background: rgba(20, 14, 36, .8); }

/* HUD in the dusk theme: dark glass chips, cream text, green key badges (matches the home screen) */
.pw-hud__home, .pw-hud__controls, .pw-hud__toggle, .pw-view-btn {
  font-family: 'Ubuntu', 'Baloo 2', system-ui, sans-serif;
  color: #fff4dc; background: rgba(20, 14, 36, .6);
  border: 1.5px solid rgba(255, 244, 220, .28); box-shadow: 0 8px 22px rgba(8, 4, 20, .35);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
}
.pw-hud__home, .pw-hud__toggle, .pw-view-btn { font-weight: 700; font-size: .95rem; padding: 10px 18px; border-radius: 999px; }
.pw-hud__home:hover, .pw-hud__toggle:hover, .pw-view-btn:hover { background: rgba(20, 14, 36, .82); }
.pw-hud__controls { display: flex; align-items: center; gap: 16px; padding: 10px 18px; border-radius: 16px; font-size: .9rem; font-weight: 500; }
.pw-hud__controls .pw-ctl { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }
.pw-hud__controls .pw-kbd {
  margin: 0; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: .8rem; color: #5bd06a;
  background: rgba(91, 208, 106, .14); border: 1px solid rgba(91, 208, 106, .35); box-shadow: none;
}

/* first-visit tutorial card ("Tutorial 2a" design): bottom-center dark glass,
   segmented progress, inline keycaps that press while held, green ring when done */
.pw-tut {
  position: fixed; left: 50%; top: 18px; z-index: 35; pointer-events: auto;
  width: 340px; max-width: calc(100vw - 32px); box-sizing: border-box; padding: 16px;
  font-family: 'Lexend', 'Ubuntu', system-ui, sans-serif; color: #F5EBDD;
  background: rgba(28, 20, 36, .86); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  border-radius: 12px; box-shadow: 0 0 0 1px rgba(255, 255, 255, .08), 0 8px 24px rgba(10, 6, 14, .45);
  opacity: 0; visibility: hidden; translate: -50% -10px;
  transition: opacity .25s ease, translate .25s ease, box-shadow .25s ease, visibility 0s linear .25s;
}
.pw-tut.pw-show { opacity: 1; visibility: visible; translate: -50% 0; transition: opacity .25s ease, translate .25s ease, box-shadow .25s ease; }
.pw-tut.pw-tut--done { box-shadow: 0 0 0 2px #6BE584, 0 8px 24px rgba(10, 6, 14, .45); }
.pw-tut__head { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #5EDB76; }
.pw-tut__segs { display: flex; gap: 4px; margin-top: 8px; }
.pw-tut__segs i { flex: 1; height: 4px; border-radius: 2px; background: #463C50; transition: background .25s; }
.pw-tut__segs i.past, .pw-tut__segs i.cur { background: #46C95E; }
.pw-tut--done .pw-tut__segs i.cur { background: #6BE584; }
.pw-tut__fade { opacity: 0; transform: translateY(6px); transition: opacity .25s ease, transform .25s ease; }
.pw-tut--in .pw-tut__fade { opacity: 1; transform: none; }
.pw-tut__title { margin-top: 16px; font-size: 1.15rem; font-weight: 700; color: #FFF6EA; }
.pw-tut__body { margin-top: 8px; font-size: .92rem; line-height: 1.75; color: #E6DAD0; }
.pw-tut__key {
  display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 26px;
  padding: 0 8px; margin: 0 2px; box-sizing: border-box; vertical-align: middle; border-radius: 6px; cursor: pointer;
  font: 700 12px/1 'JetBrains Mono', ui-monospace, monospace; color: #B8F5C4;
  background: #24412C; border: 1px solid #46C95E; border-bottom-width: 3px;
  transition: transform 80ms, background .15s, border-color .15s;
}
.pw-tut__key.held { border-bottom-width: 1px; transform: translateY(2px); }
.pw-tut--done .pw-tut__key { background: #2F5A3A; border-color: #6BE584; }
.pw-tut__foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 16px; }
.pw-tut__next {
  height: 32px; padding: 0 16px; border: 0; border-radius: 16px; cursor: pointer;
  background: #46C95E; color: #14261A; font-family: inherit; font-size: 14px; font-weight: 700; box-shadow: 0 2px 0 #2E8F42;
}
.pw-tut__next:hover { background: #57D86E; }
.pw-tut__next:focus-visible { outline: 2px solid #F5EBDD; outline-offset: 2px; }
.pw-tut__skip {
  height: 32px; padding: 0 12px; border: 0; border-radius: 16px; cursor: pointer;
  background: transparent; color: #A99BB3; font-family: inherit; font-size: 13px; font-weight: 500;
}
.pw-tut__skip:hover { background: rgba(255, 255, 255, .08); color: #F5EBDD; }
.pw-tut__skip:focus-visible { outline: 2px solid #5EDB76; outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) { .pw-tut, .pw-tut__fade, .pw-tut__key, .pw-tut__segs i { transition: none; } }
/* the home-screen tutorial toggle rises in with the other pills */
.pw-landing .pw-pill:nth-child(5) { animation: pwl-rise .7s cubic-bezier(.2, .7, .2, 1) both 1.7s; }

/* eye button: hides the HUD chips; sits in the top-right corner, View mode moves left of it */
.pw-hud-eye {
  position: fixed; top: 14px; right: 14px; z-index: 12; pointer-events: auto;
  width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; cursor: pointer; border-radius: 50%;
  color: #fff4dc; background: rgba(20, 14, 36, .6); border: 1.5px solid rgba(255, 244, 220, .28);
  box-shadow: 0 8px 22px rgba(8, 4, 20, .35); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
}
.pw-hud-eye:hover { background: rgba(20, 14, 36, .82); }
.pw-view-btn { right: 64px; }
body.pw-hud-hidden .pw-hud__home, body.pw-hud-hidden .pw-hud__controls,
body.pw-hud-hidden .pw-hud__toggle, body.pw-hud-hidden .pw-view-btn, body.pw-hud-hidden .pw-hud__prompt {
  opacity: 0 !important; pointer-events: none !important; transition: opacity .2s ease;
}


/* ---- phone pass: home screen fits short/narrow screens ---- */
@media (max-width: 480px) {
  .pw-root.pw-landing { padding: 18px 14px 24px; overflow-y: auto; justify-content: flex-start; }
  .pw-landing .pw-landing__inner { margin: auto 0; }
  .pw-landing .pw-landing__title { font-size: clamp(38px, 11.5vw, 52px); }
  .pw-landing .pw-landing__name { margin-top: 12px; font-size: 16px; }
  .pw-landing .pw-landing__subtitle { margin-top: 10px; font-size: 16px; max-width: 320px; }
  .pw-landing .pw-landing__school { margin-top: 4px; font-size: 16px; }
  .pw-landing .pw-landing__cta { margin-top: 20px; gap: 10px; }
  .pw-landing .pw-btn-enter { padding: 14px 32px; font-size: 18px; }
  .pw-landing .pw-btn-secondary { padding: 12px 26px; font-size: 15px; }
  .pw-landing .pw-nav { margin-top: 18px; gap: 8px; }
  .pw-landing .pw-pill { padding: 10px 14px; font-size: 14px; }
  .pw-landing .pw-landing__hintwrap { margin-top: 14px; }
  .pw-landing .pw-landing__hint { padding: 10px 14px; font-size: 13px; line-height: 1.5; }
  .pw-landing .pw-hint__keys { gap: 4px 12px; margin-top: 6px; }
}

/* ---- phone pass: top-right buttons stack instead of overlapping ----
   eye (top right), Day to its left, View mode on the row below */
.pw-touch-active .pw-hud__toggle { right: calc(64px + env(safe-area-inset-right, 0px)); top: calc(14px + env(safe-area-inset-top, 0px)); padding: 9px 14px; }
.pw-touch-active .pw-view-btn { right: 14px; top: calc(62px + env(safe-area-inset-top, 0px)); padding: 9px 14px; }
.pw-touch-active .pw-hud__home { padding: 9px 14px; }

/* ---- phone pass: enlarged card sits a bit higher, clear of the joystick ---- */
.pw-touch-active .pw-card.pw-card--big { top: 44% !important; }

/* ---- phone pass: tour bar counter stays on one line ---- */
@media (max-width: 480px) {
  .pw-tour__meta { min-width: 0; flex-shrink: 0; }
  .pw-tour__count { white-space: nowrap; }
  .pw-tour__name { display: none; }
}
`;

/**
 * Inject the UI stylesheet into <head> exactly once. Safe to call from every
 * component constructor — subsequent calls are no-ops.
 */
export function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = UI_CSS;
  document.head.appendChild(style);
}

/** The overlay mount node (index.html's #ui), falling back to <body>. */
export function uiRoot() {
  return document.getElementById('ui') || document.body;
}
