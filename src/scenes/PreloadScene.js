// src/scenes/PreloadScene.js
// Loads bundled cat animations and world art with a progress bar.
// Texture overrides retain procedural fallbacks; absent BGM stays silent.

import Phaser from 'phaser';
import { SCENES, UI } from '../utils/constants.js';
import { OPTIONAL_TEXTURES, textureOverridePath } from '../data/assets.js';
import { BGM_KEYS, bgmFilePaths } from '../data/audio.js';
import { CHARACTERS, CAT_FRAME_SIZE, CAT_ANIMATIONS } from '../data/characters.js';
import { EXTRA_TEXTURES, WORLD_TEXTURES } from '../data/worldArt.js';
import { pixelFont } from '../i18n/fonts.js';
import { t } from '../i18n/index.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;
    const barW = Math.min(320, w * 0.6);
    const barH = 16;

    this.add.text(w / 2, h / 2 - 30, t('load.loading'), {
      ...pixelFont(20),
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

    // BGM and legacy texture overrides can be absent. Cat/world art is bundled.
    this.load.on('loaderror', () => {});

    // Texture overrides: a PNG that loads here pre-fills the texture key,
    // so the `textures.exists(key)` guards in entity code skip procedural
    // generation. This is the image-swap mechanism.
    [...OPTIONAL_TEXTURES, ...EXTRA_TEXTURES].forEach((key) => {
      this.load.image(key, textureOverridePath(key));
    });

    CHARACTERS.forEach(({ id }) => {
      this.load.spritesheet(`cat_${id}`, `assets/images/cats/${id}.png`, {
        frameWidth: CAT_FRAME_SIZE, frameHeight: CAT_FRAME_SIZE,
      });
      this.load.image(`portrait_${id}`, `assets/images/cats/${id}-portrait.png`);
    });
    WORLD_TEXTURES.forEach((key) => this.load.image(key, `assets/images/world/${key}.png`));

    // BGM tracks (mp3/ogg candidates per key)
    BGM_KEYS.forEach((key) => {
      this.load.audio(key, bgmFilePaths(key));
    });
  }

  create() {
    CHARACTERS.forEach(({ id }) => {
      Object.entries(CAT_ANIMATIONS).forEach(([state, definition]) => {
        const key = `${id}_${state}`;
        if (!this.anims.exists(key)) this.anims.create({
          key, frames: this.anims.generateFrameNumbers(`cat_${id}`, { frames: definition.frames }),
          frameRate: definition.frameRate, repeat: definition.repeat,
        });
      });
    });
    this.scene.start(SCENES.MENU);
  }
}
