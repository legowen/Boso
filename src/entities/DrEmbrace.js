// src/entities/DrEmbrace.js
// Tutorial boss (Shelter Isle) - the clinic's kindly doctor whose
// check-ups always end in an inescapable hug. All pattern logic is the
// shared HugBossBase set (arm sweep / slam / field hug), scaled down via
// BOSS_TYPES.drEmbrace; this subclass only provides the doctor textures.

import HugBossBase from './HugBossBase.js';
import { BOSS_TYPES } from '../data/monsters.js';

export default class DrEmbrace extends HugBossBase {
  constructor(scene, x, y) {
    super(scene, x, y, {
      id: 'drEmbrace',
      cfg: BOSS_TYPES.drEmbrace,
      textureKey: 'boss_dr_embrace',
      armTextureKey: 'proj_arm_dr',
      warnText: 'CHECK-UP HUG INCOMING!',
    });
  }

  createTextures() {
    const cfg = BOSS_TYPES.drEmbrace;
    if (!this.scene.textures.exists('boss_dr_embrace')) {
      const W = cfg.width;
      const H = cfg.height;
      const g = this.scene.add.graphics();

      // Open welcoming arms (white coat sleeves)
      g.fillStyle(0xECF0F1, 1);
      g.fillRoundedRect(0, 44, 22, 62, 9);
      g.fillRoundedRect(W - 22, 44, 22, 62, 9);
      // Blue exam gloves
      g.fillStyle(0x5DADE2, 1);
      g.fillCircle(11, 104, 9);
      g.fillCircle(W - 11, 104, 9);

      // White coat body
      g.fillStyle(cfg.color, 1);
      g.fillRoundedRect(18, 40, W - 36, H - 44, 10);
      // Coat lapels
      g.lineStyle(2, 0xBDC3C7, 1);
      g.lineBetween(W / 2 - 8, 42, W / 2 - 14, 78);
      g.lineBetween(W / 2 + 8, 42, W / 2 + 14, 78);
      // Scrubs under the coat
      g.fillStyle(0x48C9B0, 1);
      g.fillRect(W / 2 - 8, 44, 16, 30);

      // Stethoscope
      g.lineStyle(3, 0x34495E, 1);
      g.beginPath();
      g.arc(W / 2, 58, 16, 0.3, Math.PI - 0.3);
      g.strokePath();
      g.fillStyle(0x34495E, 1);
      g.fillCircle(W / 2 - 14, 66, 5);

      // Head
      g.fillStyle(0xF5CBA7, 1);
      g.fillCircle(W / 2, 24, 17);
      // Head mirror
      g.fillStyle(0xD5DBDB, 1);
      g.fillCircle(W / 2, 8, 7);
      g.fillStyle(0xF4F6F7, 1);
      g.fillCircle(W / 2, 8, 4);
      // Band
      g.lineStyle(2, 0x7F8C8D, 1);
      g.lineBetween(W / 2 - 15, 14, W / 2 + 15, 14);

      // Closed happy eyes (^ ^)
      g.lineStyle(2, 0x1B2631, 1);
      g.beginPath();
      g.arc(W / 2 - 7, 24, 4, Math.PI + 0.3, -0.3);
      g.strokePath();
      g.beginPath();
      g.arc(W / 2 + 7, 24, 4, Math.PI + 0.3, -0.3);
      g.strokePath();
      // Warm smile
      g.lineStyle(2, 0x1B2631, 1);
      g.beginPath();
      g.arc(W / 2, 28, 6, 0.3, Math.PI - 0.3);
      g.strokePath();

      // Heart badge on the coat
      g.fillStyle(0xE74C3C, 1);
      g.fillCircle(W / 2 - 16, 86, 4);
      g.fillCircle(W / 2 - 10, 86, 4);
      g.fillTriangle(W / 2 - 20, 88, W / 2 - 6, 88, W / 2 - 13, 97);

      g.generateTexture('boss_dr_embrace', W, H);
      g.destroy();
    }

    if (!this.scene.textures.exists('proj_arm_dr')) {
      const g = this.scene.add.graphics();
      // White coat sleeve reaching for a check-up hug
      g.fillStyle(0xECF0F1, 1);
      g.fillRoundedRect(0, 10, 84, 22, 10);
      // Cuff
      g.fillStyle(0xBDC3C7, 1);
      g.fillRect(78, 8, 6, 26);
      // Blue glove
      g.fillStyle(0x5DADE2, 1);
      g.fillCircle(94, 21, 14);
      g.fillStyle(0x85C1E9, 1);
      g.fillCircle(94, 21, 7);
      // Fingers
      g.fillStyle(0x5DADE2, 1);
      g.fillCircle(88, 9, 4);
      g.fillCircle(97, 6, 4);
      g.fillCircle(104, 11, 4);
      g.generateTexture('proj_arm_dr', 110, 44);
      g.destroy();
    }
  }
}
