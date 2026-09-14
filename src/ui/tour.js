// Recruiter Tour — a guided, hands-free walkthrough of the whole portfolio.
//
// Unlike the quick cinematic intro (captions only), the tour flies to each stop
// and pops the landmark's REAL info card (the resume bullets), auto-advances on a
// comfortable read timer, and gives the viewer a control bar — Prev / Pause /
// Next / Exit plus clickable progress dots. It ends on a "Let's connect" CTA card
// (Resume / GitHub / LinkedIn / Email), then hands control to free-roam.
//
//   const tour = createTour(ctx, { panel, onComplete });
//   tour.play();      tour.playing
//
// While it plays the player is suspended (see main.js) and the interaction loop
// is muted, so nothing fights the camera or the card. The tour drives the shared
// info `panel`: it shows each stop's card and pins it beside the landmark by
// projecting a world anchor to the screen every frame.
import { profile, projectsFallback } from '../data/resume.js';
import { getInteractables } from '../core/interaction.js';
import { injectStyles, uiRoot } from './styles.js';

const TRAVEL = 1.7; // seconds to fly between stops

export function createTour(ctx, { panel, onComplete } = {}) {
  injectStyles();
  const { THREE, camera, onUpdate } = ctx;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  const projLines = (projectsFallback || []).slice(0, 5).map((p) => p.name);

  // Each stop: a camera pose (pos + look), the caption (name/sub), how long to
  // dwell, and the card to show. `id` pulls the live landmark's card + position
  // from the interaction registry; `card` is inline data (welcome / projects /
  // CTA); `anchor` overrides the world point the card pins to.
  const STOPS = [
    { name: "PURABH'S WORLD", sub: 'A 60-second tour', pos: V(0, 28, 52), look: V(0, 5, 0), hold: 6.5, anchor: V(0, 7, 0),
      card: {
        eyebrow: 'Welcome', title: "Hi, I'm Purabh", subtitle: profile.tagline + ' · ' + profile.school, accent: '#5fd06a',
        lines: [
          "This walkable world is my portfolio. I'll fly you past each stop: school, internships, projects, and my stack.",
          'Use the bar below to step through, pause to read, or exit any time to explore on foot.',
        ],
      } },
    { id: 'achievements', eyebrow: 'Hackathon', name: 'MusaLabs Hackathon', sub: 'Winner, 1st of 50+ teams', pos: V(0, 9, 15), look: V(0, 4.5, 0), hold: 7 },
    { id: 'education', eyebrow: 'Education', name: 'Rutgers University', sub: 'B.S. Computer Science', pos: V(0, 13, -30), look: V(0, 9, -52), hold: 7 },
    { id: 'azonix', eyebrow: 'Internship', name: 'Azonix Tech', sub: 'Edge CV · IoT telemetry · predictive ML', pos: V(33, 12, -22), look: V(54, 9, -28), hold: 8 },
    { id: 'essex', eyebrow: 'Internship', name: 'Essex Securities', sub: 'AI EPS agent · crypto exchange · Bloomberg', pos: V(33, 12, 31), look: V(54, 9, 28), hold: 9 },
    { name: 'Projects', sub: 'Live from GitHub', pos: V(0, 16, 42), look: V(0, 6, 66), hold: 7, anchor: V(0, 8, 60),
      card: {
        eyebrow: 'Projects', title: 'Projects District', subtitle: 'Hackathon wins + side projects', accent: '#3fb14e',
        lines: projLines.length ? projLines : ['Walk in after the tour to browse my projects.'],
        meta: 'Walk in on foot to open each one',
        links: [{ label: 'GitHub', url: profile.github }],
      } },
    { id: 'bny', eyebrow: 'Internship', name: 'BNY', sub: 'On-chain audit trail · SWIFT blotter · observability', pos: V(-28, 17, 22), look: V(-54, 14, 28), hold: 9 },
    { id: 'skills', eyebrow: 'Tech Stack', name: 'My Stack', sub: 'Java · Python · TypeScript · Rust · Solidity', pos: V(-40, 11, -20), look: V(-54, 8, -28), hold: 7 },
    { name: "Let's connect", sub: 'Open to SWE roles', pos: V(0, 15, 40), look: V(0, 5, 0), final: true, anchor: V(0, 7, 0),
      card: {
        eyebrow: 'Get in touch', title: "Let's connect", subtitle: 'Open to SWE internships & new-grad roles', accent: '#5fd06a',
        lines: ['Thanks for taking the tour. The fastest ways to reach me are right here.'],
        links: [
          { label: 'Resume', url: profile.resume },
          { label: 'GitHub', url: profile.github },
          { label: 'LinkedIn', url: profile.linkedin },
          { label: 'Email', url: 'mailto:' + profile.email },
        ],
      } },
  ];

  // Resolve a stop's card + world anchor lazily (interactables exist by play time).
  function resolve(stop) {
    if (stop._resolved) return;
    stop._resolved = true;
    if (stop.id) {
      const it = getInteractables().find((i) => i.id === stop.id);
      stop._card = it ? { ...it.data, eyebrow: stop.eyebrow } : { title: stop.name, lines: [stop.sub || ''] };
      if (stop.anchor) stop._anchor = stop.anchor.clone();
      else if (it && it.position) { const a = it.position.clone(); a.y += 4; stop._anchor = a; } // float above the marker
      else stop._anchor = stop.look.clone();
    } else {
      stop._card = stop.card;
      stop._anchor = (stop.anchor || stop.look).clone();
    }
  }

  // --- overlay: control bar --------------------------------------------------
  const root = document.createElement('div');
  root.className = 'pw-root pw-tour';
  root.innerHTML = `
    <div class="pw-tour__bar">
      <div class="pw-tour__meta">
        <span class="pw-tour__count"></span>
        <span class="pw-tour__name"></span>
      </div>
      <div class="pw-tour__ctrls">
        <button class="pw-tour__btn" data-prev type="button" aria-label="Previous stop">◀</button>
        <button class="pw-tour__btn pw-tour__btn--play" data-play type="button" aria-label="Pause">⏸</button>
        <button class="pw-tour__btn" data-next type="button" aria-label="Next stop">▶</button>
      </div>
      <div class="pw-tour__dots"></div>
      <button class="pw-tour__exit" data-exit type="button">Exit ✕</button>
      <div class="pw-tour__fill"><i></i></div>
    </div>
  `;
  uiRoot().appendChild(root);
  const elCount = root.querySelector('.pw-tour__count');
  const elName = root.querySelector('.pw-tour__name');
  const elPlay = root.querySelector('[data-play]');
  const elDots = root.querySelector('.pw-tour__dots');
  const elExit = root.querySelector('[data-exit]');
  const elFill = root.querySelector('.pw-tour__fill > i');

  const dots = STOPS.map((_, i) => {
    const d = document.createElement('button');
    d.className = 'pw-tour__dot'; d.type = 'button';
    d.setAttribute('aria-label', `Go to stop ${i + 1}`);
    d.addEventListener('click', () => jump(i));
    elDots.appendChild(d);
    return d;
  });

  root.querySelector('[data-prev]').addEventListener('click', () => jump(idx - 1));
  root.querySelector('[data-next]').addEventListener('click', () => jump(idx + 1));
  elPlay.addEventListener('click', () => setPaused(!paused));
  elExit.addEventListener('click', () => finish());
  // Clicks on the bar must not reach the panel's outside-click dismiss handler.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());

  // --- playback state --------------------------------------------------------
  let playing = false, done = false, paused = false;
  let idx = 0, phase = 'travel', t = 0;
  const fromPos = V(0, 0, 0), fromLook = V(0, 0, 0), lookTmp = V(0, 0, 0), projTmp = V(0, 0, 0);

  function syncChrome() {
    const s = STOPS[idx];
    elCount.textContent = `${idx + 1} / ${STOPS.length}`;
    elName.textContent = s.name || '';
    dots.forEach((d, i) => d.classList.toggle('pw-on', i === idx));
    root.classList.toggle('pw-tour--final', !!s.final);
    elExit.textContent = s.final ? 'Explore freely ▶' : 'Exit ✕';
    elPlay.style.display = s.final ? 'none' : '';
    elPlay.textContent = paused ? '▶' : '⏸';
  }

  function beginSegment(i) {
    idx = Math.max(0, Math.min(STOPS.length - 1, i));
    const s = STOPS[idx];
    resolve(s);
    phase = 'travel'; t = 0;
    fromPos.copy(camera.position);
    camera.getWorldDirection(lookTmp);                 // approximate current look point
    fromLook.copy(camera.position).addScaledVector(lookTmp, 12);
    if (panel) panel.hide();                           // card pops back in on arrival
    elFill.style.width = '0%';
    syncChrome();
  }

  function applyPose(e) {
    const s = STOPS[idx];
    camera.position.lerpVectors(fromPos, s.pos, e);
    lookTmp.lerpVectors(fromLook, s.look, e);
    camera.lookAt(lookTmp);
  }

  function pinCard(s) {
    if (!panel) return;
    if (!panel.isOpen()) panel.show(s._card);          // (re)open, resilient to stray clicks
    projTmp.copy(s._anchor).project(camera);
    panel.setAnchor(
      (projTmp.x * 0.5 + 0.5) * window.innerWidth,
      (-projTmp.y * 0.5 + 0.5) * window.innerHeight,
      projTmp.z < 1,                                    // false = behind the camera
    );
  }

  function jump(i) {
    if (done) return;
    i = Math.max(0, Math.min(STOPS.length - 1, i));
    if (i === idx && phase === 'hold') return;
    beginSegment(i);
  }

  function setPaused(v) {
    paused = v;
    elPlay.textContent = v ? '▶' : '⏸';
    elPlay.setAttribute('aria-label', v ? 'Play' : 'Pause');
  }

  function play() {
    if (playing || done) return;
    playing = true;
    root.classList.add('pw-tour--on');
    beginSegment(0);
  }

  function finish() {
    if (done) return;
    done = true; playing = false;
    if (panel) panel.hide();
    root.classList.remove('pw-tour--on');
    setTimeout(() => root.remove(), 400);
    if (onComplete) onComplete();
  }

  onUpdate((dt) => {
    if (!playing) return;
    const s = STOPS[idx];
    if (phase === 'travel') {
      t += dt;
      const u = Math.min(1, t / TRAVEL);
      applyPose(u * u * (3 - 2 * u));                  // smoothstep ease
      if (u >= 1) { phase = 'hold'; t = 0; if (panel) panel.show(s._card); }
    } else {
      pinCard(s);                                      // keep the card beside its landmark
      if (!paused && !s.final) {
        t += dt;
        elFill.style.width = Math.min(100, (t / s.hold) * 100) + '%';
        if (t >= s.hold) { idx < STOPS.length - 1 ? beginSegment(idx + 1) : finish(); }
      }
    }
  });

  // Rewind so play() can run again (e.g. after the Home button sends the
  // player back to the landing screen). Only safe to call while not playing.
  function reset() {
    if (playing) return;
    done = false; paused = false; idx = 0; phase = 'travel'; t = 0;
    root.classList.remove('pw-tour--on', 'pw-tour--final');
    uiRoot().appendChild(root); // finish() detaches it; re-attach for the next play()
  }

  return { play, exit: finish, reset, get playing() { return playing && !done; } };
}
