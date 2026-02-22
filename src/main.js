// src/main.js
// Boso RPG entry point

import Phaser from 'phaser';
import gameConfig from './config.js';
import TitleScene from './scenes/TitleScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import GameScene from './scenes/GameScene.js';

// Register scenes (first scene in array is launched first)
const config = {
  ...gameConfig,
  scene: [TitleScene, CharacterSelectScene, GameScene]
};

// Create game instance
const game = new Phaser.Game(config);

export default game;