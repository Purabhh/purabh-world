// First-visit tutorial (ported from the "Tutorial 2a" design): a dark glass card
// at the bottom center that walks through the controls one at a time. The keys
// in the text are keycaps that press down while you hold the real key, the card
// rings green when you do the step, then it moves on by itself. Next and Skip
// tutorial are always there.
//
//   const tut = createTutorial({ onDone });
//   tut.shouldRun()   // true on a first visit (or after turning it back on), once per page load
//   tut.start()
//   tut.enabled / tut.setEnabled(v)   // the home-screen toggle
//
// Finishing or skipping turns it off in localStorage, so returning visitors don't
// see it again unless they flip the toggle back on.
import { injectStyles, uiRoot } from './styles.js';

const KEY = 'pw-tutorial';

// body: text pieces; a piece that matches a LABEL key is drawn as a keycap.
const STEPS = [
  { title: 'Walk', codes: ['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'], body: ['Hold ', 'KeyW', ' to walk forward, ', 'KeyS', ' to back up.'] },
  { title: 'Turn', codes: ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'], body: ['Press ', 'KeyA', ' or ', 'KeyD', ' to turn. The camera turns with you.'] },
  { title: 'Sprint', codes: ['ShiftLeft', 'ShiftRight'], body: ['Hold ', 'ShiftLeft', ' while walking to sprint.'] },
  { title: 'Jump', codes: ['Space'], body: ['Tap ', 'Space', ' to jump.'] },
  { title: 'Look around', codes: ['mouse'], body: ['Move the ', 'mouse', ' to look around.'] },
  { title: 'Zoom', codes: ['wheel'], body: ['', 'wheel', ' to zoom the camera.'] },
];
const LABEL = { KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyE: 'E', ShiftLeft: 'Shift', ShiftRight: 'Shift', Space: 'Space', mouse: 'Mouse', wheel: 'Scroll' };
const WIDTH = { ShiftLeft: 52, Space: 80, mouse: 56, wheel: 56 };
// keys that light the same keycap as another code
const ALIAS = { ArrowUp: 'KeyW', ArrowDown: 'KeyS', ArrowLeft: 'KeyA', ArrowRight: 'KeyD', ShiftRight: 'ShiftLeft' };

export function createTutorial({ onDone } = {}) {
  injectStyles();

  const read = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch (_) {} };
  let enabled = read() !== 'off';
  let ranThisLoad = false;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.createElement('div');
  root.className = 'pw-root pw-tut';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Controls tutorial');
  root.innerHTML = `
    <div class="pw-tut__head"></div>
    <div class="pw-tut__segs">${STEPS.map(() => '<i></i>').join('')}</div>
    <div class="pw-tut__fade">
      <div class="pw-tut__title"></div>
      <div class="pw-tut__body"></div>
    </div>
    <div class="pw-tut__foot">
      <button type="button" class="pw-tut__next">Next</button>
      <button type="button" class="pw-tut__skip">Skip tutorial</button>
    </div>
  `;
  uiRoot().appendChild(root);
  const elHead = root.querySelector('.pw-tut__head');
  const segs = [...root.querySelectorAll('.pw-tut__segs i')];
  const elTitle = root.querySelector('.pw-tut__title');
  const elBody = root.querySelector('.pw-tut__body');
  const elNext = root.querySelector('.pw-tut__next');

  let active = false, i = 0, done = false, timer = 0, fadeTimer = 0, mouseAcc = 0;
  const held = new Set();

  function keycap(code) {
    const k = document.createElement('span');
    k.className = 'pw-tut__key';
    k.dataset.code = code;
    k.textContent = LABEL[code];
    k.style.minWidth = (WIDTH[code] || 32) + 'px';
    k.setAttribute('role', 'button');
    k.title = 'Press ' + LABEL[code];
    // clicking the keycap counts as pressing it (trackpads, touch)
    k.addEventListener('click', () => { flash(code); hit(code); });
    return k;
  }

  function render() {
    const s = STEPS[i];
    elHead.textContent = `Tutorial · ${i + 1} of ${STEPS.length}`;
    segs.forEach((el, j) => { el.classList.toggle('past', j < i); el.classList.toggle('cur', j === i); });
    elTitle.textContent = s.title;
    elBody.replaceChildren(...s.body.filter((x) => x !== '').map((piece) => (LABEL[piece] ? keycap(piece) : document.createTextNode(piece))));
    elNext.textContent = i === STEPS.length - 1 ? 'Got it' : 'Next';
    root.classList.toggle('pw-tut--done', done);
    syncHeld();
  }

  function syncHeld() {
    for (const k of elBody.querySelectorAll('.pw-tut__key')) k.classList.toggle('held', held.has(k.dataset.code));
  }
  function setHeld(code, on) {
    const c = ALIAS[code] || code;
    if (on) held.add(c); else held.delete(c);
    syncHeld();
  }
  function flash(code) { setHeld(code, true); setTimeout(() => setHeld(code, false), 160); }

  // The player did this step's action: ring green, then move on after a beat.
  function hit(code) {
    if (!active || done || !STEPS[i].codes.includes(code)) return;
    done = true;
    root.classList.add('pw-tut--done');
    timer = setTimeout(() => go(1), 1100);
  }

  function go(d) {
    clearTimeout(timer);
    if (i + d >= STEPS.length) { finish(); return; }
    root.classList.remove('pw-tut--in');            // fade the text out...
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {                  // ...swap it, fade back in
      i += d; done = false; render();
      root.classList.add('pw-tut--in');
    }, reduced ? 0 : 130);
  }

  // --- input: real keys/mouse/wheel drive the steps ---
  const onKeyDown = (e) => { if (!active || e.repeat) return; setHeld(e.code, true); hit(e.code); };
  const onKeyUp = (e) => { if (!active) return; setHeld(e.code, false); };
  const onMouseMove = (e) => {
    if (!active || !e.buttons) return;              // our look is click + drag
    mouseAcc += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
    if (mouseAcc > 300) { mouseAcc = 0; hit('mouse'); }
  };
  const onWheel = () => { if (!active) return; flash('wheel'); hit('wheel'); };
  function listen(on) {
    const f = on ? 'addEventListener' : 'removeEventListener';
    window[f]('keydown', onKeyDown, true);
    window[f]('keyup', onKeyUp, true);
    window[f]('mousemove', onMouseMove, true);
    window[f]('wheel', onWheel, { capture: true, passive: true });
  }

  function finish() {
    if (!active) return;
    active = false;
    clearTimeout(timer); clearTimeout(fadeTimer);
    root.classList.remove('pw-show', 'pw-tut--in', 'pw-tut--done');
    held.clear();
    listen(false);
    setEnabled(false);
    onDone && onDone();
  }

  function start() {
    if (active) return;
    active = true; ranThisLoad = true; i = 0; done = false; mouseAcc = 0;
    listen(true);
    render();
    root.classList.add('pw-show', 'pw-tut--in');
  }

  function setEnabled(v) {
    enabled = !!v;
    write(enabled ? 'on' : 'off');
    if (enabled) ranThisLoad = false;   // flipping it back on replays it next time you enter
  }

  elNext.addEventListener('click', () => go(1));
  root.querySelector('.pw-tut__skip').addEventListener('click', finish);

  return {
    start,
    stop: finish,
    shouldRun: () => enabled && !ranThisLoad,
    setEnabled,
    get enabled() { return enabled; },
    get active() { return active; },
  };
}
