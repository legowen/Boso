// src/data/audio.js
// Pure data — BGM registry (no Phaser imports).
// Music is OPTIONAL: drop matching files into public/assets/bgm/ and they
// play automatically. Missing files fail silently (graceful fallback).
// `url: null` means "no custom path" - the default drop-in lookup
// (assets/bgm/<key>.mp3 / .ogg) is used; set a string to override it.

export const BGM = {
  bgm_title: { loop: true, volume: 0.5 },
  bgm_home: { loop: true, volume: 0.45 },
  bgm_toybox: { loop: true, volume: 0.45 },
  bgm_boss: { loop: true, volume: 0.55 },
  bgm_hidden: { loop: true, volume: 0.55 },
  // New-region keys (placeholder registrations, no files shipped yet)
  bgm_shelter: { loop: true, volume: 0.45, url: null },
  bgm_buddy: { loop: true, volume: 0.45, url: null },
  bgm_travel: { loop: true, volume: 0.5, url: null },
};

export const BGM_KEYS = Object.keys(BGM);

// File lookup paths tried by PreloadScene, in order. A non-null `url`
// in the registry entry overrides the default candidates.
export function bgmFilePaths(key) {
  const entry = BGM[key];
  if (entry && typeof entry.url === 'string' && entry.url.length > 0) {
    return [entry.url];
  }
  return [`assets/bgm/${key}.mp3`, `assets/bgm/${key}.ogg`];
}
