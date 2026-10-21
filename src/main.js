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
import { loadFonts } from './i18n/fonts.js';
import { initLanguage } from './i18n/index.js';

// Register scenes (first scene in array is launched first)
const config = {
  ...gameConfig,
  scene: [PreloadScene, TitleScene, SaveSlotScene, CharacterSelectScene, StoryScene, GameScene, TravelScene]
};

// Convert the pre-slot single save into slot 1 (no-op once done)
SaveManager.migrateLegacy();

// Mirror the chosen language onto <html lang> / the tab title, then wait for
// the pixel fonts so the first scene never flashes a fallback font.
initLanguage();
const game = loadFonts().then(() => new Phaser.Game(config));

// Dev only. Stripped from production builds.
//   window.bosoDev.resetBossTimers()  makes every defeated boss due to respawn
//                                     (same as F9 in a map)
//   window.bosoDev.game               promise of the Phaser.Game, for browser
//                                     scripts (e.g. game.scene.getScene('GameScene').boss)
//   window.bosoDev.SaveManager        the app's own SaveManager instance
if (import.meta.env.DEV) {
  window.bosoDev = {
    resetBossTimers: () => SaveManager.resetBossTimers(),
    game,
    SaveManager,
  };
}

export default game;
