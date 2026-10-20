// src/main.js
// Boso "Look at me!" entry point

import Phaser from 'phaser';
import gameConfig from './config.js';
import PreloadScene from './scenes/PreloadScene.js';
import TitleScene from './scenes/TitleScene.js';
import SaveSlotScene from './scenes/SaveSlotScene.js';
import SaveManager from './systems/SaveManager.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import StoryScene from './scenes/StoryScene.js';
import GameScene from './scenes/GameScene.js';
import TravelScene from './scenes/TravelScene.js';

// Register scenes (first scene in array is launched first)
const config = {
  ...gameConfig,
  scene: [PreloadScene, TitleScene, SaveSlotScene, CharacterSelectScene, StoryScene, GameScene, TravelScene]
};

// Convert the pre-slot single save into slot 1 (no-op once done)
SaveManager.migrateLegacy();

// Create game instance
const game = new Phaser.Game(config);

// Dev only: window.bosoDev.resetBossTimers() makes every defeated boss due to
// respawn (same as F9 in a map). Stripped from production builds.
if (import.meta.env.DEV) {
  window.bosoDev = {
    resetBossTimers: () => SaveManager.resetBossTimers(),
  };
}

export default game;
