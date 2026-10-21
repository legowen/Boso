import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import en from '../src/i18n/en.js';
import ko from '../src/i18n/ko.js';
import { FONT_FACES, snapFont, pixelFont } from '../src/i18n/fonts.js';
import { readWoff2CodePoints } from '../scripts/fontCoverage.mjs';
import { formatPlayTime } from '../src/utils/format.js';

// i18n/index.js reads the stored language and navigator.language once at import,
// so each scenario loads its own instance via a unique query string.
let instance = 0;
const freshIndex = () => import(`../src/i18n/index.js?instance=${instance += 1}`);

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

async function withEnvironment({ browserLanguage, storage }, run) {
  const hadNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { language: browserLanguage }, configurable: true });
  if (storage) globalThis.localStorage = storage;
  try {
    await run();
  } finally {
    if (hadNavigator) Object.defineProperty(globalThis, 'navigator', hadNavigator);
    else delete globalThis.navigator;
    delete globalThis.localStorage;
  }
}

test('en and ko define exactly the same keys with the same placeholders', () => {
  assert.deepEqual(Object.keys(ko).sort(), Object.keys(en).sort());
  const placeholders = (text) => (text.match(/\{\w+\}/g) || []).sort();
  for (const key of Object.keys(en)) {
    assert.deepEqual(placeholders(ko[key]), placeholders(en[key]), key);
    assert.ok(en[key].trim() && ko[key].trim(), `${key} must not be empty`);
  }
});

test('t() interpolates {name} params and falls back current language -> en -> key', async () => {
  const { translate } = await freshIndex();
  assert.equal(translate('en', 'slots.okTitle', { slot: 2, name: 'Seoli', level: 3 }), 'SLOT 2  -  Seoli  Lv.3');
  assert.equal(translate('ko', 'slots.okTitle', { slot: 2, name: 'Seoli', level: 3 }),
    ko['slots.okTitle'].replace('{slot}', '2').replace('{name}', 'Seoli').replace('{level}', '3'));
  // a placeholder without a param is left visible instead of printing "undefined"
  assert.equal(translate('en', 'toast.treats', {}), '+{count} Treats');
  assert.equal(translate('en', 'toast.treats', { count: 0 }), '+0 Treats');
  // unknown language -> English; unknown key -> the key itself
  assert.equal(translate('xx', 'title.start'), en['title.start']);
  assert.equal(translate('ko', 'no.such.key'), 'no.such.key');
});

test('first launch: Korean browsers get ko, everything else en', async () => {
  for (const [browserLanguage, expected] of [['ko-KR', 'ko'], ['ko', 'ko'], ['KO-kr', 'ko'], ['en-US', 'en'], ['ja-JP', 'en'], ['', 'en']]) {
    await withEnvironment({ browserLanguage, storage: fakeStorage() }, async () => {
      const { getLang } = await freshIndex();
      assert.equal(getLang(), expected, browserLanguage);
    });
  }
});

test('a stored choice beats the browser language; junk is ignored', async () => {
  await withEnvironment({ browserLanguage: 'ko-KR', storage: fakeStorage({ 'boso.settings': '{"lang":"en"}' }) }, async () => {
    assert.equal((await freshIndex()).getLang(), 'en');
  });
  await withEnvironment({ browserLanguage: 'en-US', storage: fakeStorage({ 'boso.settings': '{"lang":"ko"}' }) }, async () => {
    assert.equal((await freshIndex()).getLang(), 'ko');
  });
  await withEnvironment({ browserLanguage: 'ko-KR', storage: fakeStorage({ 'boso.settings': '{"lang":"fr"}' }) }, async () => {
    assert.equal((await freshIndex()).getLang(), 'ko');
  });
});

test('setLang persists globally (boso.settings, not a save slot), notifies once, ignores no-ops', async () => {
  const storage = fakeStorage({
    'boso.settings': '{"other":true}',
    'boso.save.slot1': 'slot-one-untouched',
  });
  await withEnvironment({ browserLanguage: 'en-US', storage }, async () => {
    const { setLang, getLang, t, onLanguageChanged } = await freshIndex();
    const seen = [];
    const off = onLanguageChanged((lang) => seen.push(lang));

    assert.equal(setLang('en'), false, 'same language is a no-op');
    assert.equal(setLang('fr'), false, 'unknown language is rejected');
    assert.deepEqual(seen, []);

    assert.equal(setLang('ko'), true);
    assert.equal(getLang(), 'ko');
    assert.equal(t('title.start'), ko['title.start']);
    assert.deepEqual(seen, ['ko']);
    assert.deepEqual(JSON.parse(storage.map.get('boso.settings')), { other: true, lang: 'ko' });
    assert.equal(storage.map.get('boso.save.slot1'), 'slot-one-untouched');
    assert.deepEqual([...storage.map.keys()].sort(), ['boso.save.slot1', 'boso.settings']);

    off();
    setLang('en');
    assert.deepEqual(seen, ['ko'], 'unsubscribed handlers stay quiet');
    assert.equal(JSON.parse(storage.map.get('boso.settings')).lang, 'en');
  });
});

test('play time is worded by the locale (English by default)', async () => {
  assert.equal(formatPlayTime(3600 + 5 * 60), '1h 05m');
  assert.equal(formatPlayTime(754), '12m');
});

test('localized text rewrites itself on language change and unsubscribes when destroyed', async () => {
  const { setLang, getLang } = await import('../src/i18n/index.js');
  const { addLocalizedText } = await import('../src/i18n/text.js');
  const original = getLang();
  const created = [];
  const scene = {
    add: {
      text: (x, y, content, style) => {
        const handlers = {};
        const text = {
          x, y, style, content, active: true,
          setText(value) { this.content = value; return this; },
          once(event, handler) { handlers[event] = handler; },
          destroy() { this.active = false; handlers.destroy?.(); },
        };
        created.push(text);
        return text;
      },
    },
  };
  try {
    setLang('en');
    const fromKey = addLocalizedText(scene, 0, 0, 'title.start', {});
    const fromFunction = addLocalizedText(scene, 0, 0, () => `${en['hud.hp']}!`, {});
    assert.equal(fromKey.content, en['title.start']);
    setLang('ko');
    assert.equal(fromKey.content, ko['title.start']);
    assert.equal(fromFunction.content, `${en['hud.hp']}!`);
    fromKey.destroy();
    setLang('en');
    assert.equal(fromKey.content, ko['title.start'], 'destroyed text is no longer touched');
    assert.equal(fromFunction.content, `${en['hud.hp']}!`);
  } finally {
    setLang(original);
  }
});

test('pixelFont only emits sizes on a Galmuri design grid', () => {
  const grids = Object.fromEntries(FONT_FACES.map(({ family, grid }) => [family, grid]));
  for (let px = 8; px <= 80; px += 1) {
    const { size, family } = snapFont(px);
    assert.ok(grids[family], `${px}px -> unknown family ${family}`);
    assert.equal(size % grids[family], 0, `${px}px -> ${size}px is off the ${family} grid`);
    assert.ok(size >= 11, 'Hangul needs at least 11px');
  }
  assert.equal(snapFont(13).size, 14);
  assert.equal(snapFont(72).size, 72);
  assert.equal(snapFont(16).size, 14, 'ties round down so text stays inside its box');
  assert.match(pixelFont('13px').fontFamily, /^Galmuri14,/);
  assert.equal(pixelFont(22).fontSize, '22px');
});

test('the shipped fonts draw every character of both locales (no tofu) and carry their license', () => {
  const root = new URL('../public/assets/fonts/', import.meta.url);
  for (const face of FONT_FACES) {
    const covered = readWoff2CodePoints(new URL(face.file, root));
    for (const [lang, locale] of [['en', en], ['ko', ko]]) {
      const missing = new Set();
      for (const text of Object.values(locale)) {
        for (const ch of text) if (ch !== '\n' && !covered.has(ch.codePointAt(0))) missing.add(ch);
      }
      assert.deepEqual([...missing], [], `${face.family} lacks glyphs used by ${lang}`);
    }
  }
  const license = fs.readFileSync(new URL('Galmuri-OFL.txt', root), 'utf8');
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
});
