// Info card — a compact, content-sized pop-up shown when the player presses E at
// a landmark. It floats next to the building: main.js projects the landmark's 3D
// position to the screen each frame and calls setAnchor(), so the card tracks the
// building. It springs in, caps its height and scrolls for long content, and
// closes on the × button, Esc, or hide().
//
//   import { createPanel } from './ui/panel.js';
//   const panel = createPanel();
//   panel.show(data);                  // render + reveal (data may include `eyebrow`)
//   panel.setAnchor(x, y, visible);    // place near a screen point (called per frame)
//   panel.hide();  panel.isOpen();
//
// PanelData: { title, subtitle?, accent?, eyebrow?, lines:string[], tags?:string[],
//              links?:[{label,url}], meta? }
import { injectStyles, uiRoot } from './styles.js';

const DEFAULT_ACCENT = '#3fb14e'; // brand green fallback when data.accent missing

export function createPanel() {
  injectStyles();

  const root = document.createElement('aside');
  root.className = 'pw-root pw-card';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <button class="pw-card__grow" type="button" aria-label="Enlarge" title="Enlarge">&#x2922;</button>
    <button class="pw-card__close" type="button" aria-label="Close" title="Close">&times;</button>
    <span class="pw-card__eyebrow"></span>
    <h2 class="pw-card__title"></h2>
    <p class="pw-card__sub"></p>
    <div class="pw-card__body"></div>
    <p class="pw-card__meta"></p>
  `;
  uiRoot().appendChild(root);

  const eyebrowEl = root.querySelector('.pw-card__eyebrow');
  const titleEl = root.querySelector('.pw-card__title');
  const subEl = root.querySelector('.pw-card__sub');
  const body = root.querySelector('.pw-card__body');
  const metaEl = root.querySelector('.pw-card__meta');
  const closeBtn = root.querySelector('.pw-card__close');
  const growBtn = root.querySelector('.pw-card__grow');

  let open = false;

  function render(data) {
    root.style.setProperty('--pw-accent', (data && data.accent) || DEFAULT_ACCENT);

    const eyebrow = data && data.eyebrow;
    eyebrowEl.textContent = eyebrow || '';
    eyebrowEl.style.display = eyebrow ? '' : 'none';

    titleEl.textContent = (data && data.title) || '';
    const sub = data && data.subtitle;
    subEl.textContent = sub || '';
    subEl.style.display = sub ? '' : 'none';

    body.replaceChildren();

    const lines = (data && Array.isArray(data.lines)) ? data.lines : [];
    if (lines.length) {
      const ul = document.createElement('ul');
      ul.className = 'pw-card__lines';
      for (const line of lines) {
        const li = document.createElement('li');
        li.className = 'pw-card__line';
        li.textContent = line;
        ul.appendChild(li);
      }
      body.appendChild(ul);
    }

    const tags = (data && Array.isArray(data.tags)) ? data.tags : [];
    if (tags.length) {
      const wrap = document.createElement('div');
      wrap.className = 'pw-card__tags';
      for (const t of tags) {
        const pill = document.createElement('span');
        pill.className = 'pw-tag';
        pill.textContent = t;
        wrap.appendChild(pill);
      }
      body.appendChild(wrap);
    }

    const links = (data && Array.isArray(data.links)) ? data.links : [];
    if (links.length) {
      const wrap = document.createElement('div');
      wrap.className = 'pw-card__links';
      for (const lnk of links) {
        if (!lnk || !lnk.url) continue;
        const a = document.createElement('a');
        a.className = 'pw-card__link';
        a.href = lnk.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.innerHTML = '<span aria-hidden="true">↗</span>';
        a.appendChild(document.createTextNode(lnk.label || lnk.url));
        wrap.appendChild(a);
      }
      if (wrap.childElementCount) body.appendChild(wrap);
    }

    const meta = data && data.meta;
    metaEl.textContent = meta || '';
    metaEl.style.display = meta ? '' : 'none';
  }

  // Enlarge toggles a centered, wide version of the same card.
  // Enlarged mode: measure the card at 1x, then scale it so it fills ~80% of the
  // screen. Short content gets a bigger scale; long content is capped by height.
  function fitBig() {
    if (!root.classList.contains('pw-card--big')) return;
    root.style.setProperty('--z', '1');
    const w = root.offsetWidth, h = root.offsetHeight;
    const z = Math.min(2.8, Math.max(0.6, Math.min(window.innerWidth * 0.8 / w, window.innerHeight * 0.8 / h)));
    root.style.setProperty('--z', z.toFixed(3));
  }
  window.addEventListener('resize', fitBig);

  function setBig(v) {
    root.classList.toggle('pw-card--big', v);
    if (v) fitBig(); else root.style.removeProperty('--z');
    growBtn.innerHTML = v ? '&#x2921;' : '&#x2922;';
    growBtn.setAttribute('aria-label', v ? 'Shrink' : 'Enlarge');
    growBtn.title = v ? 'Shrink' : 'Enlarge';
  }
  growBtn.addEventListener('click', () => setBig(!root.classList.contains('pw-card--big')));

  // The very first card a visitor opens points out the enlarge + close buttons.
  const HINT_KEY = 'pw-card-hint-seen';
  let hintEl = null, hintTimer = 0;
  function clearHint() {
    clearTimeout(hintTimer);
    root.classList.remove('pw-card--hinting');
    if (hintEl) { hintEl.remove(); hintEl = null; }
  }
  function maybeHint() {
    let seen = false;
    try { seen = localStorage.getItem(HINT_KEY) === '1'; localStorage.setItem(HINT_KEY, '1'); } catch (_) {}
    if (seen) return;
    hintEl = document.createElement('div');
    hintEl.className = 'pw-card__hint';
    hintEl.innerHTML = '<span>Enlarge</span><span>Close</span>';
    root.appendChild(hintEl);
    root.classList.add('pw-card--hinting');
    hintTimer = setTimeout(clearHint, 5000);
  }
  growBtn.addEventListener('click', clearHint);

  // opts.big opens straight into the enlarged view (used by the guided tour).
  function show(data, opts = {}) {
    render(data || {});
    setBig(!!opts.big);
    if (opts.big) fitBig();
    body.scrollTop = 0;
    open = true;
    root.setAttribute('aria-hidden', 'false');
    root.classList.add('pw-open');
    // restart the spring-in animation
    root.classList.remove('pw-pop');
    void root.offsetWidth;
    root.classList.add('pw-pop');
    maybeHint();
  }

  function hide() {
    if (!open) return;
    open = false;
    // Remove BOTH classes: pw-pop's `animation-fill-mode: both` otherwise pins the
    // card at opacity:1 forever, so dropping only pw-open would leave it on screen.
    root.classList.remove('pw-open', 'pw-pop');
    clearHint();
    setBig(false);
    root.setAttribute('aria-hidden', 'true');
  }

  function isOpen() { return open; }

  // Place the card near a screen point (the landmark's projected position). Sits
  // on whichever side of the building has more room, vertically centered on the
  // point, clamped to the viewport. visible=false (point behind the camera) tucks
  // it away without closing.
  function setAnchor(x, y, visible) {
    if (!open || root.classList.contains('pw-card--big')) return;
    if (!visible) { root.style.visibility = 'hidden'; return; }
    root.style.visibility = '';
    const w = root.offsetWidth || 240, h = root.offsetHeight || 160;
    const m = 14, vw = window.innerWidth, vh = window.innerHeight;
    let left = x < vw / 2 ? x + 34 : x - w - 34;   // opposite side of the building
    let top = y - h / 2;
    root.style.left = Math.max(m, Math.min(left, vw - w - m)) + 'px';
    root.style.top = Math.max(m, Math.min(top, vh - h - m)) + 'px';
  }

  closeBtn.addEventListener('click', hide);

  // Esc closes. Capture so it wins even while a link is focused.
  document.addEventListener('keydown', (e) => {
    if (open && (e.key === 'Escape' || e.key === 'Esc')) { e.preventDefault(); hide(); }
  });

  // Click (or tap) anywhere outside the card dismisses it, so you don't have to
  // hunt for the × button. The card opens via the E key, so there's no opening
  // click that could immediately re-close it.
  window.addEventListener('pointerdown', (e) => {
    if (open && !root.contains(e.target)) hide();
  });

  return { show, hide, isOpen, setAnchor, el: root };
}
