// src/scenes/PreloadScene.js
// Loads OPTIONAL assets with a progress bar: the title background,
// texture override PNGs, and BGM tracks. Every asset here may be missing —
// load errors are swallowed and the game falls back to procedural
// textures and silence.

import Phaser from 'phaser';
import { SCENES, UI } from '../utils/constants.js';
import { OPTIONAL_TEXTURES, textureOverridePath } from '../data/assets.js';
import { BGM_KEYS, bgmFilePaths } from '../data/audio.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;
    const barW = Math.min(320, w * 0.6);
    const barH = 16;

    this.add.text(w / 2, h / 2 - 30, 'Loading...', {
      fontSize: '20px',
      fontFamily: UI.FONT_FAMILY,
      color: UI.FONT_COLOR,
    }).setOrigin(0.5);

    // Progress bar frame
    const frame = this.add.graphics();
    frame.lineStyle(2, 0x7F8C8D, 1);
    frame.strokeRect(w / 2 - barW / 2, h / 2, barW, barH);

    // Progress bar fill, redrawn as loading advances
    const fill = this.add.graphics();
    this.load.on('progress', (value) => {
      fill.clear();
      fill.fillStyle(0xF39C12, 1);
      fill.fillRect(w / 2 - barW / 2 + 2, h / 2 + 2, (barW - 4) * value, barH - 4);
    });

    // All assets below are optional — missing files 404 harmlessly.
    this.load.on('loaderror', () => {});

    // Title screen background
    this.load.image('title_bg', 'assets/images/title_bg.png');

    // Texture overrides: a PNG that loads here pre-fills the texture key,
    // so the `textures.exists(key)` guards in entity code skip procedural
    // generation. This is the image-swap mechanism.
    OPTIONAL_TEXTURES.forEach((key) => {
      this.load.image(key, textureOverridePath(key));
    });

    // BGM tracks (mp3/ogg candidates per key)
    BGM_KEYS.forEach((key) => {
      this.load.audio(key, bgmFilePaths(key));
    });
  }

  create() {
    this.scene.start(SCENES.MENU);
  }
}
