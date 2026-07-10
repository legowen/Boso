// src/systems/AudioManager.js
// Graceful-fallback background music manager. BGM files are optional:
// if a track was not loaded, play() silently does nothing. Nothing in
// this module may ever throw into game code.

import { BGM } from '../data/audio.js';

// Module-level state — one BGM track at a time, shared across scenes
// (Phaser's sound manager is game-global, so music survives scene changes).
const state = {
  currentKey: null,
  currentSound: null,
};

export default class AudioManager {
  // Start a BGM track. No-op when key is falsy or that key is already
  // playing. Stops any other current track first.
  static play(scene, key) {
    if (!key || state.currentKey === key) return;

    AudioManager.stop();

    try {
      // Missing audio file (404 during preload) — stay silent.
      if (!scene.cache.audio.exists(key)) return;

      const config = BGM[key] || { loop: true, volume: 0.5 };
      const sound = scene.sound.add(key, {
        loop: config.loop !== false,
        volume: typeof config.volume === 'number' ? config.volume : 0.5,
      });

      state.currentKey = key;
      state.currentSound = sound;

      if (scene.sound.locked) {
        // Browser audio context is locked until the first user gesture.
        scene.sound.once('unlocked', () => {
          try {
            // Only start if this track is still the current one.
            if (state.currentSound === sound) sound.play();
          } catch (e) {
            // Ignore — audio must never break the game.
          }
        });
      } else {
        sound.play();
      }
    } catch (e) {
      // Ignore — audio must never break the game.
      state.currentKey = null;
      state.currentSound = null;
    }
  }

  // Stop and dispose the current track, clearing module state.
  static stop() {
    try {
      if (state.currentSound) {
        state.currentSound.stop();
        state.currentSound.destroy();
      }
    } catch (e) {
      // Ignore — the sound may already have been destroyed with its scene.
    }
    state.currentKey = null;
    state.currentSound = null;
  }
}
