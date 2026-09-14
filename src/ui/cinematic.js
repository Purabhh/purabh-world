// Cinematic intro fly-through. On "Enter World" the camera glides past each
// landmark with a captioned lower-third (documentary style, with letterbox
// bars), then settles onto the player's spawn follow-cam pose and hands control
// over. A "Skip intro" button jumps straight to control at any time.
//
//   const cine = createCinematic(ctx, { onComplete });
//   cine.play();           // start the tour (called from landing onEnter)
//   cine.playing           // true while the tour is running
//
// While it plays, the player is suspended (player.setCinematic(true)) so nothing
// fights the camera; onComplete re-enables the player at spawn. The final
// waypoint matches the spawn follow-cam pose exactly, so the handoff is seamless.
import { layout } from '../core/constants.js';
import { injectStyles, uiRoot } from './styles.js';

export function createCinematic(ctx, { onComplete } = {}) {
  injectStyles();
  const { THREE, camera, onUpdate } = ctx;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // Tour waypoints: a camera pose (pos + look-at point), how long to fly there,
  // how long to dwell, and the caption to show. Ordered as a loop around the map.
  const W = [
    { name: '3D PORTFOLIO', sub: 'A walkable portfolio', pos: V(0, 28, 52), look: V(0, 5, 0), travel: 0, hold: 2.2 },
    { name: 'MusaLabs Hackathon', sub: 'Winner, 1st of 50+ teams', pos: V(0, 9, 15), look: V(0, 4.5, 0), travel: 1.8, hold: 1.8 },
    { name: 'Rutgers University', sub: 'B.S. Computer Science', pos: V(0, 13, -30), look: V(0, 9, -52), travel: 2.0, hold: 1.6 },
    { name: 'Azonix Technologies', sub: 'Computer vision + dashboards', pos: V(33, 12, -22), look: V(54, 9, -28), travel: 2.2, hold: 1.6 },
    { name: 'Essex Securities', sub: 'AI + Crypto tooling', pos: V(33, 12, 31), look: V(54, 9, 28), travel: 2.4, hold: 1.6 },
    { name: 'Projects', sub: 'Live from GitHub', pos: V(0, 16, 42), look: V(0, 6, 66), travel: 2.4, hold: 1.6 },
    { name: 'BNY', sub: 'Software Engineering Intern', pos: V(-28, 17, 22), look: V(-54, 14, 28), travel: 2.6, hold: 1.6 },
    { name: 'My Stack', sub: 'React · Node · Python · Solidity', pos: V(-40, 11, -20), look: V(-54, 8, -28), travel: 2.4, hold: 1.8 },
    { name: '', sub: '', pos: V(0, 11.74, 30.1), look: V(0, 2.4, 8), travel: 2.2, hold: 0.4 }, // = spawn follow pose
  ];

  // --- overlay: letterbox bars + caption + skip button -----------------------
  const root = document.createElement('div');
  root.className = 'pw-root pw-cine';
  root.innerHTML = `
    <div class="pw-cine-bar pw-cine-bar--top"></div>
    <div class="pw-cine-bar pw-cine-bar--bottom"></div>
    <div class="pw-cine-cap"><div class="pw-cine-cap__name"></div><div class="pw-cine-cap__sub"></div></div>
    <button class="pw-cine-skip" type="button">Skip intro ▶</button>
  `;
  uiRoot().appendChild(root);
  const cap = root.querySelector('.pw-cine-cap');
  const capName = root.querySelector('.pw-cine-cap__name');
  const capSub = root.querySelector('.pw-cine-cap__sub');
  root.querySelector('.pw-cine-skip').addEventListener('click', () => skip());

  function setCaption(name, sub) {
    if (!name) { cap.classList.remove('pw-show'); return; }
    capName.textContent = name;
    capSub.textContent = sub || '';
    cap.classList.remove('pw-show');
    void cap.offsetWidth;          // restart the rise animation
    cap.classList.add('pw-show');
  }

  // --- playback state --------------------------------------------------------
  let playing = false, done = false, idx = 0, phase = 'travel', t = 0;
  const fromPos = V(0, 0, 0), fromLook = V(0, 0, 0), lookTmp = V(0, 0, 0);

  function beginSegment(i) {
    idx = i; phase = 'travel'; t = 0;
    const w = W[i];
    fromPos.copy(i === 0 ? w.pos : W[i - 1].pos);
    fromLook.copy(i === 0 ? w.look : W[i - 1].look);
    setCaption(w.name, w.sub);
  }

  function applyPose(e) {
    const w = W[idx];
    camera.position.lerpVectors(fromPos, w.pos, e);
    lookTmp.lerpVectors(fromLook, w.look, e);
    camera.lookAt(lookTmp);
  }

  function finish() {
    if (done) return;
    done = true; playing = false;
    root.classList.remove('pw-cine--on');   // letterbox slides out
    setCaption('', '');
    setTimeout(() => root.remove(), 600);
    if (onComplete) onComplete();
  }

  function play() {
    if (playing || done) return;
    playing = true;
    root.classList.add('pw-cine--on');
    beginSegment(0);
    applyPose(1);                             // snap to the opening wide shot
  }

  function skip() {
    if (done) return;
    const last = W[W.length - 1];
    camera.position.copy(last.pos);           // jump to the spawn pose so the
    camera.lookAt(last.look);                 // handoff to the follow cam is clean
    finish();
  }

  onUpdate((dt) => {
    if (!playing) return;
    const w = W[idx];
    if (phase === 'travel') {
      t += dt;
      const u = w.travel > 0 ? Math.min(1, t / w.travel) : 1;
      applyPose(u * u * (3 - 2 * u));          // smoothstep ease
      if (u >= 1) { phase = 'hold'; t = 0; }
    } else {
      t += dt;
      const k = Math.min(1, t / Math.max(0.0001, w.hold));
      camera.position.lerpVectors(w.pos, w.look, 0.05 * k); // slow push-in while dwelling
      camera.lookAt(w.look);
      if (t >= w.hold) { idx < W.length - 1 ? beginSegment(idx + 1) : finish(); }
    }
  });

  // Rewind so play() can run again (e.g. after the Home button sends the
  // player back to the landing screen). Only safe to call while not playing.
  function reset() {
    if (playing) return;
    done = false; idx = 0; phase = 'travel'; t = 0;
    root.classList.remove('pw-cine--on');
    setCaption('', '');
    uiRoot().appendChild(root); // finish() detaches it; re-attach for the next play()
  }

  return { play, skip, reset, get playing() { return playing && !done; } };
}
