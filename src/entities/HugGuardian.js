// src/entities/HugGuardian.js
// Field boss (Zakum homage) - a giant toy golem built to hug.
// All pattern logic lives in HugBossBase (shared with Dr. Embrace);
// this subclass only provides the plush-golem textures.

import HugBossBase from './HugBossBase.js';
import { BOSS_TYPES } from '../data/monsters.js';

export default class HugGuardian extends HugBossBase {
  constructor(scene, x, y) {
    super(scene, x, y, {
      id: 'hugGuardian',
      cfg: BOSS_TYPES.hugGuardian,
      textureKey: 'boss_hug_guardian',
      armTextureKey: 'proj_arm',
      warnText: 'HUG INCOMING!',
    });
  }

  createTextures() {
    const cfg = BOSS_TYPES.hugGuardian;
    if (!this.scene.textures.exists('boss_hug_guardian')) {
      const W = cfg.width;
      const H = cfg.height;
      const g = this.scene.add.graphics();

      // Open hugging arms
      g.fillStyle(0x9A7434, 1);
      g.fillRoundedRect(0, 46, 34, 90, 12);
      g.fillRoundedRect(W - 34, 46, 34, 90, 12);
      // Paw pads
      g.fillStyle(0xD9C08A, 1);
      g.fillCircle(17, 132, 12);
      g.fillCircle(W - 17, 132, 12);

      // Patchwork plush body
      g.fillStyle(cfg.color, 1);
      g.fillRoundedRect(26, 20, W - 52, H - 26, 18);
      g.fillStyle(0x8A6520, 0.65);
      g.fillRect(40, 90, 26, 22);
      g.fillRect(W - 70, 110, 30, 20);

      // Stitch seams
      g.lineStyle(2, 0x6E4F14, 0.8);
      g.lineBetween(W / 2, 20, W / 2, 48);
      g.lineBetween(34, 70, 60, 70);

      // Stitched heart on the chest
      g.fillStyle(0xE74C3C, 1);
      g.fillCircle(W / 2 - 8, 96, 10);
      g.fillCircle(W / 2 + 8, 96, 10);
      g.fillTriangle(W / 2 - 17, 101, W / 2 + 17, 101, W / 2, 122);

      // Button eyes
      g.fillStyle(0x2C1810, 1);
      g.fillCircle(W / 2 - 20, 52, 9);
      g.fillCircle(W / 2 + 20, 52, 9);
      g.fillStyle(0xFFFFFF, 0.9);
      g.fillCircle(W / 2 - 23, 49, 3);
      g.fillCircle(W / 2 + 17, 49, 3);

      // Gentle smile
      g.lineStyle(3, 0x2C1810, 1);
      g.beginPath();
      g.arc(W / 2, 62, 12, 0.2, Math.PI - 0.2);
      g.strokePath();

      g.generateTexture('boss_hug_guardian', W, H);
      g.destroy();
    }

    if (!this.scene.textures.exists('proj_arm')) {
      const g = this.scene.add.graphics();
      // Plush arm reaching for a hug
      g.fillStyle(0x9A7434, 1);
      g.fillRoundedRect(0, 12, 96, 26, 12);
      // Paw
      g.fillStyle(0xB08840, 1);
      g.fillCircle(100, 25, 18);
      g.fillStyle(0xD9C08A, 1);
      g.fillCircle(100, 25, 10);
      // Toe beans
      g.fillCircle(92, 12, 4);
      g.fillCircle(102, 9, 4);
      g.fillCircle(111, 14, 4);
      g.generateTexture('proj_arm', 120, 50);
      g.destroy();
    }
  }
}
