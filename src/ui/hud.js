// HUD — the persistent in-world heads-up display.
//
// Pieces, all injected into #ui:
//   • a Home button (top-left): back to the landing/welcome screen
//   • a controls chip (bottom-left): "WASD move · drag look · E interact"
//   • a contextual prompt pill (bottom-center): "Press E — BNY"
//
//   import { createHUD } from './ui/hud.js';
//   const hud = createHUD();
//   hud.setControlsVisible(true);        // show/hide the controls chip + Home button
//   hud.setPrompt('Press E — BNY');      // show the prompt pill
//   hud.setPrompt(null);                 // hide it
//   hud.onHome(() => { ... });           // Home button clicked
//
// Styles injected via ./styles.js (no bundler).
import { injectStyles, uiRoot } from './styles.js';

export function createHUD() {
  injectStyles();

  const root = document.createElement('div');
  root.className = 'pw-root pw-hud';

  // --- Home button (top-left), hidden until enabled ---
  const home = document.createElement('button');
  home.type = 'button';
  home.className = 'pw-hud__home';
  home.setAttribute('aria-label', 'Back to home');
  home.innerHTML = '<span aria-hidden="true">←</span> Home';

  // --- Day/dusk toggle chip (bottom-right), hidden until enabled ---
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'pw-hud__toggle';
  toggle.textContent = '🌇 Dusk';

  // --- Contextual prompt pill (bottom-center) ---
  const prompt = document.createElement('div');
  prompt.className = 'pw-hud__prompt';
  prompt.setAttribute('role', 'status');
  prompt.setAttribute('aria-live', 'polite');

  const promptKey = document.createElement('span');
  promptKey.className = 'pw-kbd-e';
  promptKey.textContent = 'E';

  const promptText = document.createElement('span');
  promptText.className = 'pw-hud__prompt-text';

  prompt.append(promptKey, promptText);

  root.append(home, prompt, toggle);
  uiRoot().appendChild(root);

  /**
   * Show a contextual prompt, or hide it when passed null/empty.
   * Accepts the full string main.js builds (e.g. "Press E — BNY"); the leading
   * "Press E" is stripped because the pill already shows an "E" key glyph, so it
   * reads "E  BNY" / "E  Press E — …" cleanly without duplication.
   */
  function setPrompt(text) {
    if (!text) {
      prompt.classList.remove('pw-show');
      promptText.textContent = '';
      return;
    }
    // Structured form: { title, keys: [[key, label], ...] } -> title + spaced keycap groups.
    if (typeof text === 'object') {
      prompt.classList.add('pw-hud__prompt--rich');
      promptKey.style.display = 'none';
      const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      promptText.innerHTML =
        (text.title ? `<span class="pw-hud__prompt-title">${esc(text.title)}</span>` : '') +
        (text.keys || []).map(([k, label]) =>
          `<span class="pw-hud__prompt-item"><kbd>${esc(k)}</kbd>${esc(label)}</span>`).join('');
    } else {
      prompt.classList.remove('pw-hud__prompt--rich');
      promptKey.style.display = '';
      promptText.textContent = formatPrompt(String(text));
    }
    prompt.classList.add('pw-show');
  }

  function setControlsVisible(visible) {
    toggle.classList.toggle('pw-show', !!visible);
    home.classList.toggle('pw-show', !!visible);
  }

  // Day/dusk chip: register a click handler and update its label.
  function onDayNight(cb) { toggle.addEventListener('click', cb); }
  function setDayNightLabel(text) { toggle.textContent = text; }
  // Home button: register a click handler (back to the landing screen).
  function onHome(cb) { home.addEventListener('click', cb); }

  return { setPrompt, setControlsVisible, onDayNight, setDayNightLabel, onHome, el: root };
}

// "Press E — BNY" -> "BNY"; "Press E to open" -> "open"; otherwise pass through.
// Keeps the pill compact since the "E" key glyph is always shown beside it.
function formatPrompt(text) {
  const m = text.match(/^\s*press\s+e\s*(?:[—–-]|to)?\s*(.*)$/i);
  const label = m && m[1] ? m[1].trim() : text.trim();
  return label || text.trim();
}
