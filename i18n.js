/* i18n.js — Chargeur unique FR/EN pour toutes les pages */
var I18N = {};
var currentLang = 'en';

function detectLang() {
  var s = localStorage.getItem('pixora_lang');
  if (s && (s === 'fr' || s === 'en')) return s;
  var n = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  if (n.indexOf('fr') !== -1) return 'fr';
  return 'en';
}

function t(key) {
  var parts = key.split('.');
  var v = I18N;
  for (var i = 0; i < parts.length; i++) {
    if (v && typeof v === 'object') v = v[parts[i]];
    else return key;
  }
  return v || key;
}

async function loadLang(lang) {
  currentLang = lang;
  try {
    var r = await fetch('/lang/' + lang + '.json');
    I18N = await r.json();
  } catch (e) {
    console.warn('i18n load failed:', e);
    I18N = {};
  }
  applyTranslations();
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  var md = document.querySelector('meta[name="description"]');
  if (md) md.content = t('meta.description');
  var sel = document.getElementById('lang-select');
  if (sel) sel.value = lang;
  localStorage.setItem('pixora_lang', lang);
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var k = el.getAttribute('data-i18n'), v = t(k);
    if (v !== k) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    var k = el.getAttribute('data-i18n-placeholder'), v = t(k);
    if (v !== k) el.placeholder = v;
  });
  document.querySelectorAll('[data-i18n-alt]').forEach(function(el) {
    var k = el.getAttribute('data-i18n-alt'), v = t(k);
    if (v !== k) el.alt = v;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(function(el) {
    var k = el.getAttribute('data-i18n'), a = el.getAttribute('data-i18n-attr'), v = t(k);
    if (v !== k) el.setAttribute(a, v);
  });
  document.querySelectorAll('[data-i18n-niche]').forEach(function(el) {
    var base = el.getAttribute('data-i18n-niche'), l = currentLang || 'en';
    el.href = '/niche/' + l + '/' + base;
  });
}

function changeLang(l) { loadLang(l); }

/* Auto-init si pas déjà fait par la page */
if (!window.__i18n_initialized) {
  window.__i18n_initialized = true;
  document.addEventListener('DOMContentLoaded', function() {
    loadLang(detectLang());
  });
}
