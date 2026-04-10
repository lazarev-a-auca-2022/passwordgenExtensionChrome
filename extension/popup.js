'use strict';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS   = '0123456789';
const SYMBOLS   = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIGUOUS = new Set(['0', 'O', 'l', '1', 'I']);
const STRENGTH_CLASS = ['', 'weak', 'fair', 'strong', 'very-strong'];

let mode                = 'random';
let lastIntegrityResult = null;
let lastStrengthScore   = 0;

// ── Integrity check ───────────────────────────────────────────────────────────

function checkCryptoIntegrity() {
  try {
    const src = Function.prototype.toString.call(crypto.getRandomValues);
    if (!src.includes('[native code]')) {
      return { ok: false, reason: 'crypto.getRandomValues has been overridden' };
    }
  } catch {
    return { ok: false, reason: 'RNG inspection failed' };
  }

  // Chi-square uniformity test: 2560 samples, 256 buckets, expected=10 each.
  // df=255, threshold p<0.0001 ≈ 350.
  const n = 2560;
  const sample = new Uint8Array(n);
  crypto.getRandomValues(sample);
  const freq = new Array(256).fill(0);
  for (const b of sample) freq[b]++;
  const expected = n / 256;
  const chi2 = freq.reduce((sum, f) => sum + (f - expected) ** 2 / expected, 0);

  return chi2 < 350
    ? { ok: true,  chi2: chi2.toFixed(1) }
    : { ok: false, reason: `RNG failed uniformity test (\u03C7\u00B2=${chi2.toFixed(0)})` };
}

function renderIntegrityBadge(result) {
  lastIntegrityResult = result;
  const badge = document.getElementById('integrity-badge');
  if (result.ok) {
    badge.textContent = t('badgeVerified');
    badge.className   = 'badge ok';
    badge.title       = `\u03C7\u00B2 = ${result.chi2}`;
  } else {
    badge.textContent = t('badgeWarning');
    badge.className   = 'badge warn';
    badge.title       = result.reason;
  }
}

// ── JS fallback: random password ──────────────────────────────────────────────

function buildCharsets(opts) {
  const filt = s => opts.excludeAmbiguous ? [...s].filter(c => !AMBIGUOUS.has(c)).join('') : s;
  return [
    opts.uppercase ? filt(UPPERCASE) : '',
    opts.lowercase ? filt(LOWERCASE) : '',
    opts.numbers   ? filt(NUMBERS)   : '',
    opts.symbols   ? filt(SYMBOLS)   : '',
  ].filter(s => s.length > 0);
}

function jsGenerate(length, opts) {
  const charsets = buildCharsets(opts);
  if (charsets.length === 0) charsets.push(LOWERCASE);
  const full = charsets.join('');

  const rnd = new Uint32Array(length);
  crypto.getRandomValues(rnd);
  const result = Array.from(rnd, n => full[n % full.length]);

  // Guarantee one character from each active charset
  charsets.forEach((cs, i) => {
    if (i >= length) return;
    const r = new Uint32Array(2);
    crypto.getRandomValues(r);
    result[r[0] % length] = cs[r[1] % cs.length];
  });

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const r = new Uint32Array(1);
    crypto.getRandomValues(r);
    const j = r[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

function jsScore(password) {
  if (!password) return 0;
  let s = 0;
  if (/[A-Z]/.test(password))        s++;
  if (/[a-z]/.test(password))        s++;
  if (/[0-9]/.test(password))        s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  if (password.length >= 12)         s++;
  if (password.length >= 20)         s++;
  if (s <= 1) return 1;
  if (s <= 3) return 2;
  if (s <= 4) return 3;
  return 4;
}

// ── JS fallback: mnemonic password ────────────────────────────────────────────

function jsGenerateMnemonic(wordCount, separator) {
  const rnd = new Uint32Array(wordCount);
  crypto.getRandomValues(rnd);
  return Array.from(rnd, n => WORDLIST[n % WORDLIST.length]).join(separator);
}

function scoreMnemonic(wordCount) {
  const bits = wordCount * Math.log2(WORDLIST.length);
  if (bits < 35) return 1;
  if (bits < 45) return 2;
  if (bits < 60) return 3;
  return 4;
}

// ── WASM loader ───────────────────────────────────────────────────────────────

let generate         = jsGenerate;
let score            = jsScore;
let generateMnemonic = jsGenerateMnemonic;

async function loadWasm() {
  try {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'wasm_exec.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    const go     = new Go();
    const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
    go.run(result.instance);
    generate         = (len, opts)  => window.wasmGeneratePassword(len, opts);
    score            = pwd          => window.wasmScoreStrength(pwd);
    generateMnemonic = (count, sep) => window.wasmGenerateMnemonic(count, sep, WORDLIST);
  } catch {
    // WASM unavailable — JS implementations remain active
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function getRandomOpts() {
  return {
    uppercase:        document.getElementById('uppercase').checked,
    lowercase:        document.getElementById('lowercase').checked,
    numbers:          document.getElementById('numbers').checked,
    symbols:          document.getElementById('symbols').checked,
    excludeAmbiguous: document.getElementById('excludeAmbiguous').checked,
  };
}

function getSeparator() {
  return document.querySelector('input[name="separator"]:checked')?.value ?? '-';
}

function getStrengthLabel(s) {
  return [t('strengthWeak'), t('strengthFair'), t('strengthStrong'), t('strengthVeryStrong')][s - 1] ?? '';
}

function render(password, strengthScore) {
  lastStrengthScore = strengthScore;
  document.getElementById('password').value             = password;
  document.getElementById('strength-bar').className     = 'strength-bar ' + (STRENGTH_CLASS[strengthScore] ?? '');
  document.getElementById('strength-label').textContent = getStrengthLabel(strengthScore);
}

function regenerate() {
  if (mode === 'random') {
    const length   = parseInt(document.getElementById('length').value, 10);
    const password = generate(length, getRandomOpts());
    render(password, score(password));
  } else {
    const count    = parseInt(document.getElementById('word-count').value, 10);
    const password = generateMnemonic(count, getSeparator());
    render(password, scoreMnemonic(count));
  }
}

function rerenderDynamic() {
  applyLang();
  if (lastIntegrityResult) renderIntegrityBadge(lastIntegrityResult);
  else document.getElementById('integrity-badge').textContent = t('badgeChecking');
  document.getElementById('strength-label').textContent = getStrengthLabel(lastStrengthScore);
  document.getElementById('copy-btn').textContent = t('copy');
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadWasm();

  applyLang();
  document.getElementById('integrity-badge').textContent = t('badgeChecking');
  renderIntegrityBadge(checkCryptoIntegrity());

  // Language switcher
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      rerenderDynamic();
    });
  });

  // Tooltip toggles
  document.querySelectorAll('.info-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const wrap    = btn.closest('.info-wrap');
      const wasOpen = wrap.classList.contains('open');
      document.querySelectorAll('.info-wrap.open').forEach(w => w.classList.remove('open'));
      if (!wasOpen) wrap.classList.add('open');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.info-wrap.open').forEach(w => w.classList.remove('open'));
  });

  // Mode tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.mode;
      document.querySelectorAll('.tab').forEach(other => other.classList.toggle('active', other === tab));
      document.getElementById('random-controls').classList.toggle('hidden', mode !== 'random');
      document.getElementById('mnemonic-controls').classList.toggle('hidden', mode !== 'mnemonic');
      regenerate();
    });
  });

  // Length slider
  const slider = document.getElementById('length');
  slider.addEventListener('input', () => {
    document.getElementById('length-value').textContent = slider.value;
    regenerate();
  });

  // Word count slider
  const wordSlider = document.getElementById('word-count');
  wordSlider.addEventListener('input', () => {
    document.getElementById('word-count-value').textContent = wordSlider.value;
    regenerate();
  });

  // Separator radios
  document.querySelectorAll('input[name="separator"]').forEach(r => {
    r.addEventListener('change', regenerate);
  });

  // Charset toggles — prevent all from being unchecked simultaneously
  document.querySelectorAll('.charset-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      const anyChecked = [...document.querySelectorAll('.charset-toggle')].some(c => c.checked);
      if (!anyChecked) { cb.checked = true; return; }
      regenerate();
    });
  });

  document.getElementById('excludeAmbiguous').addEventListener('change', regenerate);
  document.getElementById('generate-btn').addEventListener('click', regenerate);

  document.getElementById('copy-btn').addEventListener('click', async () => {
    const pwd = document.getElementById('password').value;
    if (!pwd) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(pwd);
      } else {
        // Fallback for plain HTTP environments
        const ta = document.createElement('textarea');
        ta.value = pwd;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
      }
    } catch { /* silently ignore copy failures */ }
    const btn = document.getElementById('copy-btn');
    btn.textContent = t('copied');
    setTimeout(() => { btn.textContent = t('copy'); }, 1500);
  });

  regenerate();
});
