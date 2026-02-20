// src/main.js
// Boso RPG entry point

import Phaser from 'phaser';
import gameConfig from './config.js';
import GameScene from './scenes/GameScene.js';

// Register scenes
const config = {
  ...gameConfig,
  scene: [GameScene]
};

// Create game instance
const game = new Phaser.Game(config);

export default game;
