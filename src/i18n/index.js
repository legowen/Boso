// src/i18n/index.js
// Language state + t(key, params). Pure JS (no Phaser/DOM at import time) so
// the Node validator and tests can use it.
//
// Fallback chain: current language -> English -> the key itself.
// The chosen language lives in the global `boso.settings.lang` (never per
// save slot). On a first launch with nothing stored, a Korean browser gets
// Korean and everything else English.

import SaveManager from '../systems/SaveManager.js';
import en from './en.js';
import ko from './ko.js';

export const LANGS = ['en', 'ko'];
export const DEFAULT_LANG = 'en';
export const LANGUAGE_CHANGED = 'language-changed';

const LOCALES = { en, ko };

function detectLang() {
  const stored = SaveManager.getSettings().lang;
  if (LANGS.includes(stored)) return stored;
  const browser = typeof navigator !== 'undefined' && typeof navigator.language === 'string'
    ? navigator.language.toLowerCase()
    : '';
  return browser.startsWith('ko') ? 'ko' : DEFAULT_LANG;
}

let currentLang = detectLang();

// --- tiny event emitter (global `language-changed`) ---
const listeners = new Set();

export const i18nEvents = {
  on(event, handler) {
    if (event === LANGUAGE_CHANGED) listeners.add(handler);
    return () => listeners.delete(handler);
  },
  off(event, handler) {
    if (event === LANGUAGE_CHANGED) listeners.delete(handler);
  },
};

// Subscribe to language changes; returns an unsubscribe function.
export function onLanguageChanged(handler) {
  return i18nEvents.on(LANGUAGE_CHANGED, handler);
}

const warned = new Set();
function warnMissing(lang, key) {
  // Dev-only: stripped to a no-op in production builds and in Node (no import.meta.env).
  if (!import.meta.env?.DEV) return;
  const id = `${lang}:${key}`;
  if (warned.has(id)) return;
  warned.add(id);
  console.warn(`[i18n] missing '${lang}' translation for '${key}'`);
}

function interpolate(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (
    params[name] === undefined || params[name] === null ? match : String(params[name])
  ));
}

// Translate into an explicit language (used by the language selector, which
// shows each language in its own tongue).
export function translate(lang, key, params) {
  const own = LOCALES[lang] && LOCALES[lang][key];
  if (typeof own === 'string') return interpolate(own, params);
  warnMissing(lang, key);
  const fallback = en[key];
  if (typeof fallback === 'string') return interpolate(fallback, params);
  warnMissing('en', key);
  return key;
}

export function t(key, params) {
  return translate(currentLang, key, params);
}

export function hasKey(key) {
  return typeof en[key] === 'string';
}

export function getLang() {
  return currentLang;
}

function applyDocumentLang() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = currentLang;
  document.title = t('app.title');
}

// Switch language, persist it, and notify every subscriber. No page reload.
export function setLang(lang) {
  if (!LANGS.includes(lang) || lang === currentLang) return false;
  currentLang = lang;
  SaveManager.updateSettings({ lang });
  applyDocumentLang();
  [...listeners].forEach((handler) => handler(lang));
  return true;
}

// Boot: mirror the language onto <html lang> and the tab title.
export function initLanguage() {
  applyDocumentLang();
}
