// src/i18n/text.js
// Phaser text that re-translates itself when the language changes.

import { t, onLanguageChanged } from './index.js';

// build: a locale key, or a function returning the current string.
// The Text rebuilds on every `language-changed` and unsubscribes when it is
// destroyed (scene shutdown destroys all children).
export function addLocalizedText(scene, x, y, build, style) {
  const resolve = typeof build === 'function' ? build : () => t(build);
  const text = scene.add.text(x, y, resolve(), style);
  const off = onLanguageChanged(() => {
    if (text.active) text.setText(resolve());
  });
  text.once('destroy', off);
  return text;
}
