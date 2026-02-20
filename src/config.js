// src/config.js
// Phaser game configuration

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from './utils/constants.js';

const gameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1A1A2E',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

export default gameConfig;
