'use strict';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS   = '0123456789';
const SYMBOLS   = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIGUOUS = new Set(['0', 'O', 'l', '1', 'I']);

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_CLASS = ['', 'weak', 'fair', 'strong', 'very-strong'];

let mode = 'random';

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
  // df=255, threshold p<0.0001 ≈ 350. A tampered RNG will almost certainly exceed this.
  const n = 2560;
  const sample = new Uint8Array(n);
  crypto.getRandomValues(sample);
  const freq = new Array(256).fill(0);
  for (const b of sample) freq[b]++;
  const expected = n / 256;
  const chi2 = freq.reduce((sum, f) => sum + (f - expected) ** 2 / expected, 0);

  return chi2 < 350
    ? { ok: true,  chi2: chi2.toFixed(1) }
    : { ok: false, reason: `RNG failed uniformity test (χ²=${chi2.toFixed(0)})` };
}

function renderIntegrityBadge(result) {
  const badge = document.getElementById('integrity-badge');
  if (result.ok) {
    badge.textContent = '● Verified';
    badge.className   = 'badge ok';
    badge.title       = `χ² = ${result.chi2}  (entropy check passed)`;
  } else {
    badge.textContent = '⚠ Warning';
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
  let score = 0;
  if (/[A-Z]/.test(password))        score++;
  if (/[a-z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12)         score++;
  if (password.length >= 20)         score++;
  if (score <= 1) return 1;
  if (score <= 3) return 2;
  if (score <= 4) return 3;
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

function render(password, strengthScore) {
  document.getElementById('password').value = password;
  document.getElementById('strength-bar').className   = 'strength-bar ' + (STRENGTH_CLASS[strengthScore] ?? '');
  document.getElementById('strength-label').textContent = STRENGTH_LABEL[strengthScore] ?? '';
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

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadWasm();

  renderIntegrityBadge(checkCryptoIntegrity());

  // Mode tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.mode;
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
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
    await navigator.clipboard.writeText(pwd);
    const btn = document.getElementById('copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });

  regenerate();
});
