'use strict';

const STRINGS = {
  en: {
    title:             'Password Generator',
    tabRandom:         'Random',
    tabMnemonic:       'Mnemonic',
    copy:              'Copy',
    copied:            'Copied!',
    generate:          '\u21BB Generate',
    lengthLabel:       'Length',
    wordsLabel:        'Words',
    separatorLabel:    'Separator',
    uppercase:         'Uppercase (A\u2013Z)',
    lowercase:         'Lowercase (a\u2013z)',
    numbers:           'Numbers (0\u20139)',
    symbols:           'Symbols (!@#$\u2026)',
    excludeAmbiguous:  'Exclude ambiguous chars',
    strengthWeak:      'Weak',
    strengthFair:      'Fair',
    strengthStrong:    'Strong',
    strengthVeryStrong:'Very Strong',
    badgeChecking:     'checking\u2026',
    badgeVerified:     '\u25CF Verified',
    badgeWarning:      '\u26A0 Warning',
    integrityTitle:    'Cryptographic Integrity Check',
    integrityBody:     '1. Verifies crypto.getRandomValues is the browser\'s native function \u2014 not monkey-patched by an extension or malicious script.\n\n2. Chi-square uniformity test on 2560 random bytes (256 buckets, expected 10 each).\n   Threshold: \u03C7\u00B2 < 350 (df=255, p < 0.0001).\n\nA real RNG will almost never fail this. A tampered or predictable one almost certainly will.',
    mnemonicTitle:     'Mnemonic Passwords',
    mnemonicBody:      'A sequence of random words \u2014 easier to remember than a random character string.\n\nExample:  storm-brave-forge-eagle-vault\n\nWord pool: 300 words \u2248 8.2 bits each\n3 words \u2248 25 bits  \u00B7  5 words \u2248 41 bits\n6 words \u2248 49 bits  \u00B7  8 words \u2248 66 bits',
  },
  ru: {
    title:             '\u0413\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440 \u043F\u0430\u0440\u043E\u043B\u0435\u0439',
    tabRandom:         '\u0421\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0439',
    tabMnemonic:       '\u041C\u043D\u0435\u043C\u043E\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439',
    copy:              '\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C',
    copied:            '\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E!',
    generate:          '\u21BB \u0421\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C',
    lengthLabel:       '\u0414\u043B\u0438\u043D\u0430',
    wordsLabel:        '\u0421\u043B\u043E\u0432\u0430',
    separatorLabel:    '\u0420\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u0435\u043B\u044C',
    uppercase:         '\u0417\u0430\u0433\u043B\u0430\u0432\u043D\u044B\u0435 (A\u2013Z)',
    lowercase:         '\u0421\u0442\u0440\u043E\u0447\u043D\u044B\u0435 (a\u2013z)',
    numbers:           '\u0426\u0438\u0444\u0440\u044B (0\u20139)',
    symbols:           '\u0421\u0438\u043C\u0432\u043E\u043B\u044B (!@#$\u2026)',
    excludeAmbiguous:  '\u0418\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043D\u0435\u043E\u0434\u043D\u043E\u0437\u043D\u0430\u0447\u043D\u044B\u0435',
    strengthWeak:      '\u0421\u043B\u0430\u0431\u044B\u0439',
    strengthFair:      '\u0421\u0440\u0435\u0434\u043D\u0438\u0439',
    strengthStrong:    '\u0421\u0438\u043B\u044C\u043D\u044B\u0439',
    strengthVeryStrong:'\u041E\u0447\u0435\u043D\u044C \u0441\u0438\u043B\u044C\u043D\u044B\u0439',
    badgeChecking:     '\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430\u2026',
    badgeVerified:     '\u25CF \u041F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E',
    badgeWarning:      '\u26A0 \u0412\u043D\u0438\u043C\u0430\u043D\u0438\u0435',
    integrityTitle:    '\u041A\u0440\u0438\u043F\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430',
    integrityBody:     '1. \u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u0442, \u0447\u0442\u043E crypto.getRandomValues \u2014 \u043D\u0430\u0442\u0438\u0432\u043D\u0430\u044F \u0444\u0443\u043D\u043A\u0446\u0438\u044F \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430, \u0430 \u043D\u0435 \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0447\u0435\u043D\u0430 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435\u043C \u0438\u043B\u0438 \u0432\u0440\u0435\u0434\u043E\u043D\u043E\u0441\u043D\u044B\u043C \u0441\u043A\u0440\u0438\u043F\u0442\u043E\u043C.\n\n2. \u0422\u0435\u0441\u0442 \u0445\u0438-\u043A\u0432\u0430\u0434\u0440\u0430\u0442 \u043D\u0430 2560 \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0445 \u0431\u0430\u0439\u0442\u0430\u0445 (256 \u043A\u043E\u0440\u0437\u0438\u043D, \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F 10 \u0432 \u043A\u0430\u0436\u0434\u043E\u0439).\n   \u041F\u043E\u0440\u043E\u0433: \u03C7\u00B2 < 350 (df=255, p < 0.0001).\n\n\u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u0413\u0421\u0427 \u043F\u043E\u0447\u0442\u0438 \u043D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u043F\u0440\u043E\u0432\u0430\u043B\u0438\u0442 \u044D\u0442\u043E\u0442 \u0442\u0435\u0441\u0442. \u041F\u043E\u0434\u043C\u0435\u043D\u0451\u043D\u043D\u044B\u0439 \u0438\u043B\u0438 \u043F\u0440\u0435\u0434\u0441\u043A\u0430\u0437\u0443\u0435\u043C\u044B\u0439 \u2014 \u043F\u043E\u0447\u0442\u0438 \u043D\u0430\u0432\u0435\u0440\u043D\u044F\u043A\u0430 \u043F\u0440\u043E\u0432\u0430\u043B\u0438\u0442.',
    mnemonicTitle:     '\u041C\u043D\u0435\u043C\u043E\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043F\u0430\u0440\u043E\u043B\u0438',
    mnemonicBody:      '\u041F\u043E\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0445 \u0441\u043B\u043E\u0432 \u2014 \u043F\u0440\u043E\u0449\u0435 \u0437\u0430\u043F\u043E\u043C\u043D\u0438\u0442\u044C, \u0447\u0435\u043C \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u0443\u044E \u0441\u0442\u0440\u043E\u043A\u0443 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432.\n\n\u041F\u0440\u0438\u043C\u0435\u0440:  storm-brave-forge-eagle-vault\n\n\u0421\u043B\u043E\u0432\u0430\u0440\u044C: 300 \u0441\u043B\u043E\u0432 \u2248 8.2 \u0431\u0438\u0442\u0430/\u0441\u043B\u043E\u0432\u043E\n3 \u0441\u043B\u043E\u0432\u0430 \u2248 25 \u0431\u0438\u0442  \u00B7  5 \u0441\u043B\u043E\u0432 \u2248 41 \u0431\u0438\u0442\n6 \u0441\u043B\u043E\u0432 \u2248 49 \u0431\u0438\u0442  \u00B7  8 \u0441\u043B\u043E\u0432 \u2248 66 \u0431\u0438\u0442',
  },
};

let lang = localStorage.getItem('pgLang') || 'en';

function t(key) {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function setLang(newLang) {
  if (!STRINGS[newLang]) return;
  lang = newLang;
  localStorage.setItem('pgLang', lang);
}
