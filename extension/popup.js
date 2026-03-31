'use strict';

// ── JS fallback implementation (mirrors Go generator logic) ──────────────────

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS   = '0123456789';
const SYMBOLS   = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIGUOUS = new Set(['0', 'O', 'l', '1', 'I']);

function buildCharsets(opts) {
  const sets = [];
  if (opts.uppercase) sets.push([...UPPERCASE].filter(c => !opts.excludeAmbiguous || !AMBIGUOUS.has(c)).join(''));
  if (opts.lowercase) sets.push([...LOWERCASE].filter(c => !opts.excludeAmbiguous || !AMBIGUOUS.has(c)).join(''));
  if (opts.numbers)   sets.push([...NUMBERS  ].filter(c => !opts.excludeAmbiguous || !AMBIGUOUS.has(c)).join(''));
  if (opts.symbols)   sets.push([...SYMBOLS  ].filter(c => !opts.excludeAmbiguous || !AMBIGUOUS.has(c)).join(''));
  return sets.filter(s => s.length > 0);
}

function jsGenerate(length, opts) {
  const charsets = buildCharsets(opts);
  if (charsets.length === 0) charsets.push(LOWERCASE);
  const full = charsets.join('');

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  const result = Array.from(arr, n => full[n % full.length]);

  // Guarantee one character from each active charset
  charsets.forEach((cs, i) => {
    if (i >= length) return;
    const charIdx = new Uint32Array(1);
    const posIdx  = new Uint32Array(1);
    crypto.getRandomValues(charIdx);
    crypto.getRandomValues(posIdx);
    result[posIdx[0] % length] = cs[charIdx[0] % cs.length];
  });

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = new Uint32Array(1);
    crypto.getRandomValues(j);
    const k = j[0] % (i + 1);
    [result[i], result[k]] = [result[k], result[i]];
  }

  return result.join('');
}

function jsScore(password) {
  if (!password) return 0;
  let score = 0;
  if (/[A-Z]/.test(password))      score++;
  if (/[a-z]/.test(password))      score++;
  if (/[0-9]/.test(password))      score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12)       score++;
  if (password.length >= 20)       score++;
  if (score <= 1) return 1;
  if (score <= 3) return 2;
  if (score <= 4) return 3;
  return 4;
}

// ── WASM loader (upgrades generate/score if main.wasm is present) ────────────

let generate = jsGenerate;
let score     = jsScore;

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
    generate = (len, opts) => window.wasmGeneratePassword(len, opts);
    score    = (pwd)       => window.wasmScoreStrength(pwd);
  } catch {
    // WASM unavailable — JS implementation already active
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_CLASS = ['', 'weak', 'fair', 'strong', 'very-strong'];

function getOptions() {
  return {
    uppercase:        document.getElementById('uppercase').checked,
    lowercase:        document.getElementById('lowercase').checked,
    numbers:          document.getElementById('numbers').checked,
    symbols:          document.getElementById('symbols').checked,
    excludeAmbiguous: document.getElementById('excludeAmbiguous').checked,
  };
}

function render(password) {
  document.getElementById('password').value = password;
  const s     = score(password);
  const bar   = document.getElementById('strength-bar');
  const label = document.getElementById('strength-label');
  bar.className   = 'strength-bar ' + (STRENGTH_CLASS[s] ?? '');
  label.textContent = STRENGTH_LABEL[s] ?? '';
}

function regenerate() {
  const length = parseInt(document.getElementById('length').value, 10);
  render(generate(length, getOptions()));
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadWasm();

  const slider     = document.getElementById('length');
  const lengthDisp = document.getElementById('length-value');

  slider.addEventListener('input', () => {
    lengthDisp.textContent = slider.value;
    regenerate();
  });

  // Prevent all charset toggles from being unchecked simultaneously
  document.querySelectorAll('.charset-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      const anyChecked = [...document.querySelectorAll('.charset-toggle')].some(c => c.checked);
      if (!anyChecked) {
        cb.checked = true;
        return;
      }
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
