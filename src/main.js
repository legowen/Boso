// src/main.js
// Boso "Look at me!" entry point

import Phaser from 'phaser';
import gameConfig from './config.js';
import PreloadScene from './scenes/PreloadScene.js';
import TitleScene from './scenes/TitleScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import StoryScene from './scenes/StoryScene.js';
import GameScene from './scenes/GameScene.js';
import TravelScene from './scenes/TravelScene.js';

// Register scenes (first scene in array is launched first)
const config = {
  ...gameConfig,
  scene: [PreloadScene, TitleScene, CharacterSelectScene, StoryScene, GameScene, TravelScene]
};

// Create game instance
const game = new Phaser.Game(config);

export default game;
