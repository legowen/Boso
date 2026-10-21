// src/entities/HugBossBase.js
// Shared "hug" boss behavior (Zakum-homage), used by the Hug Guardian (attic)
// and its scaled-down cousin Dr. Embrace (tutorial). What each boss does is
// data (BOSS_TYPES[id].phases, see data/bossPatterns.js); PatternBoss runs
// the loop. This class only adds the ground patrol and the facing.
// Subclasses provide textures via createTextures() and pass their id,
// BOSS_TYPES cfg, and texture keys to the constructor.

import Phaser from 'phaser';
import PatternBoss from './PatternBoss.js';

export default class HugBossBase extends PatternBoss {
  constructor(scene, x, y, options) {
    super(scene, x, y, {
      id: options.id,
      cfg: options.cfg,
      textureKey: options.textureKey,
      armTextureKey: options.armTextureKey,
      bodyWidth: options.cfg.width - 24,
      bodyHeight: options.cfg.height - 8,
      openingDelayMs: Phaser.Math.Between(2000, 3500),
    });
  }

  applyFacing() {
    this.sprite.setFlipX(this.direction < 0);
  }

  // Slow patrol, always ready for a hug
  patrol() {
    if (this.sprite.x <= this.startX - this.cfg.patrolRange) {
      this.direction = 1;
    } else if (this.sprite.x >= this.startX + this.cfg.patrolRange) {
      this.direction = -1;
    }
    this.sprite.setVelocityX(this.cfg.walkSpeed * this.speedMult * this.direction);
    this.applyFacing();
  }
}
