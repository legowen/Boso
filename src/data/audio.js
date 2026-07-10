// src/data/audio.js
// Pure data — BGM registry (no Phaser imports).
// Music is OPTIONAL: drop matching files into public/assets/bgm/ and they
// play automatically. Missing files fail silently (graceful fallback).

export const BGM = {
  bgm_title: { loop: true, volume: 0.5 },
  bgm_home: { loop: true, volume: 0.45 },
  bgm_toybox: { loop: true, volume: 0.45 },
  bgm_boss: { loop: true, volume: 0.55 },
  bgm_hidden: { loop: true, volume: 0.55 },
};

export const BGM_KEYS = Object.keys(BGM);

// File lookup paths tried by PreloadScene, in order.
export function bgmFilePaths(key) {
  return [`assets/bgm/${key}.mp3`, `assets/bgm/${key}.ogg`];
}
