// src/entities/VacuumKing.js
// Special hidden boss - the primal fear of every pet: the vacuum.
// A floating PatternBoss: it hovers and bobs, and its three phases (suction,
// dust balls, floor sweep, summoned flies, bag burst, full power suction)
// are data in BOSS_TYPES.vacuumKing.phases.
// IMPORTANT: update() must run AFTER Player.update each frame so the
// suction pull stacks on top of the player's input velocity.

import Phaser from 'phaser';
import PatternBoss from './PatternBoss.js';
import { BOSS_TYPES } from '../data/monsters.js';

export default class VacuumKing extends PatternBoss {
  constructor(scene, x, y) {
    const cfg = BOSS_TYPES.vacuumKing;
    super(scene, x, y, {
      id: 'vacuumKing',
      cfg,
      textureKey: 'boss_vacuum_king',
      floating: true,
      bodyWidth: cfg.width - 20,
      bodyHeight: cfg.height - 10,
      // Grace period before the first attack
      openingDelayMs: 1800,
    });
    // The hover drift goes on while suction / dust balls run
    this.movesWhileAttacking = true;
  }

  createTextures() {
    if (!this.scene.textures.exists('boss_vacuum_king')) {
      const W = this.cfg.width;
      const H = this.cfg.height;
      const g = this.scene.add.graphics();

      // Canister body
      g.fillStyle(this.cfg.color, 1);
      g.fillRoundedRect(20, 30, W - 40, H - 60, 16);
      // Metallic bands
      g.fillStyle(0x85929E, 1);
      g.fillRect(20, 52, W - 40, 8);
      g.fillRect(20, H - 52, W - 40, 8);

      // Crown (he is the King)
      g.fillStyle(0xF1C40F, 1);
      g.fillTriangle(34, 30, 42, 6, 50, 30);
      g.fillTriangle(52, 30, 60, 2, 68, 30);
      g.fillTriangle(70, 30, 78, 6, 86, 30);

      // Single glowing red eye
      g.fillStyle(0x1B2631, 1);
      g.fillCircle(W / 2, 76, 18);
      g.fillStyle(0xFF2D2D, 1);
      g.fillCircle(W / 2, 76, 11);
      g.fillStyle(0xFFFFFF, 0.85);
      g.fillCircle(W / 2 - 4, 72, 4);

      // Hose arm curling to the left (the nozzle)
      g.lineStyle(10, 0x2C3E50, 1);
      g.beginPath();
      g.arc(28, 96, 22, Math.PI * 0.5, Math.PI * 1.5, false);
      g.strokePath();
      g.fillStyle(0x2C3E50, 1);
      g.fillRect(2, 66, 28, 16);

      // Wheels
      g.fillStyle(0x17202A, 1);
      g.fillCircle(38, H - 12, 11);
      g.fillCircle(W - 38, H - 12, 11);
      g.fillStyle(0x5D6D7E, 1);
      g.fillCircle(38, H - 12, 4);
      g.fillCircle(W - 38, H - 12, 4);

      g.generateTexture('boss_vacuum_king', W, H);
      g.destroy();
    }

    if (!this.scene.textures.exists('proj_dust')) {
      const g = this.scene.add.graphics();
      // Gray dust fluff
      g.fillStyle(0x808B96, 1);
      g.fillCircle(10, 10, 8);
      g.fillStyle(0x99A3AD, 0.9);
      g.fillCircle(6, 7, 4);
      g.fillCircle(14, 8, 4);
      g.fillCircle(9, 14, 4);
      g.fillStyle(0x566573, 0.8);
      g.fillCircle(13, 13, 3);
      g.generateTexture('proj_dust', 20, 20);
      g.destroy();
    }
  }

  // The nozzle is drawn on the left: flipped while drifting right
  applyFacing() {
    this.sprite.setFlipX(this.direction > 0);
  }

  // Hover drift; after a floor sweep it glides home faster than it drifts
  patrol() {
    const outside = Math.abs(this.sprite.x - this.startX) > this.cfg.patrolRange;
    if (this.sprite.x <= this.startX - this.cfg.patrolRange) {
      this.direction = 1;
    } else if (this.sprite.x >= this.startX + this.cfg.patrolRange) {
      this.direction = -1;
    }
    const speed = this.cfg.hoverSpeed * this.speedMult * (outside ? 3 : 1);
    this.sprite.setVelocityX(speed * this.direction);
    this.applyFacing();
  }

  // Gentle bob, or a pattern's lane (floor sweep, full power suction).
  // Velocity steering, so it stays knockback-safe.
  updateHover() {
    const lane = this.hoverOverrideY;
    const targetY = lane !== null ? lane : this.baseY + Math.sin(this.clock / 700) * 24;
    const gain = lane !== null ? 4 : 3;
    this.sprite.setVelocityY(Phaser.Math.Clamp((targetY - this.sprite.y) * gain, -500, 500));
  }

  // Sputter, drop, and pop
  playDeathEffect() {
    this.scene.cameras.main.shake(500, 0.012);
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y + 120,
      angle: 35,
      alpha: 0,
      scaleX: this.art.scale * 0.2,
      scaleY: this.art.scale * 0.2,
      duration: 1100,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.sprite.active) {
          this.sprite.setActive(false);
          this.sprite.setVisible(false);
        }
      },
    });
  }
}
