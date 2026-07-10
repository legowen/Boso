// src/entities/HugGuardian.js
// Field boss (Zakum homage) - a giant toy golem built to hug.
// Patterns: arm sweep across the whole map, ground slam, and the
// field-wide hug with a single telegraphed safe zone.

import Phaser from 'phaser';
import { BOSS_TYPES } from '../data/monsters.js';
import { PLAYER, DEPTH, UI } from '../utils/constants.js';

export default class HugGuardian {
  constructor(scene, x, y) {
    this.scene = scene;
    this.id = 'hugGuardian';
    this.cfg = BOSS_TYPES.hugGuardian;
    this.name = this.cfg.name;
    this.hp = this.cfg.hp;
    this.maxHp = this.cfg.hp;
    this.defeated = false;
    this.isHit = false;
    this.contactCooldown = false;
    this.busy = false;
    this.lastPattern = null;
    this.startX = x;
    this.direction = 1;
    this.arms = [];
    this.telegraphs = [];

    this.createTextures();

    this.sprite = scene.physics.add.sprite(x, y, 'boss_hug_guardian');
    this.sprite.setDepth(DEPTH.BOSS);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(this.cfg.width - 24, this.cfg.height - 8);

    this.nextAttackAt = Date.now() + Phaser.Math.Between(2000, 3500);
  }

  createTextures() {
    if (!this.scene.textures.exists('boss_hug_guardian')) {
      const W = this.cfg.width;
      const H = this.cfg.height;
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
      g.fillStyle(this.cfg.color, 1);
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

  groundSurface() {
    const ground = this.scene.mapData.platforms.find((p) => p.isGround);
    return ground ? ground.y : this.scene.mapData.height - 60;
  }

  update() {
    if (this.defeated || !this.sprite.active) return;

    const now = Date.now();
    const player = this.scene.player;

    this.updateArms();
    this.handleTakingDamage();
    this.handleContactDamage(player);

    if (player.hp <= 0) {
      this.sprite.setVelocityX(0);
      return;
    }

    if (!this.busy) {
      // Slow patrol, always ready for a hug
      if (this.sprite.x <= this.startX - this.cfg.patrolRange) {
        this.direction = 1;
      } else if (this.sprite.x >= this.startX + this.cfg.patrolRange) {
        this.direction = -1;
      }
      this.sprite.setVelocityX(this.cfg.walkSpeed * this.direction);
      this.sprite.setFlipX(this.direction < 0);

      if (now > this.nextAttackAt) {
        this.startPattern();
      }
    }
  }

  startPattern() {
    const roll = Math.random();
    let pattern;
    if (roll < 0.4) pattern = 'armSweep';
    else if (roll < 0.7) pattern = 'slam';
    else pattern = 'fieldHug';

    // Never wipe twice in a row
    if (pattern === 'fieldHug' && this.lastPattern === 'fieldHug') {
      pattern = 'armSweep';
    }
    this.lastPattern = pattern;

    this.busy = true;
    this.sprite.setVelocityX(0);

    if (pattern === 'armSweep') this.armSweep();
    else if (pattern === 'slam') this.slam();
    else this.fieldHug();
  }

  endPattern(extraDelayMs) {
    this.scene.time.delayedCall(extraDelayMs || 0, () => {
      if (this.defeated) return;
      this.busy = false;
      this.nextAttackAt =
        Date.now() + Phaser.Math.Between(this.cfg.attackIntervalMin, this.cfg.attackIntervalMax);
    });
  }

  // === Pattern: plush arm sweeps across the entire map ===
  armSweep() {
    const cfg = this.cfg.armSweep;
    const surface = this.groundSurface();
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? 40 : this.scene.mapData.width - 40;

    const arm = this.scene.physics.add.sprite(startX, surface - 40, 'proj_arm');
    arm.setDepth(DEPTH.EFFECTS);
    arm.body.setAllowGravity(false);
    arm.setFlipX(!fromLeft);
    arm.setVelocityX(fromLeft ? cfg.speed : -cfg.speed);
    arm.hitPlayer = false;
    arm.dying = false;
    this.arms.push(arm);

    // Wind-up flourish on the boss
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.08,
      duration: 200,
      yoyo: true,
    });

    this.endPattern(600);
  }

  updateArms() {
    const cfg = this.cfg.armSweep;
    const mapW = this.scene.mapData.width;
    const player = this.scene.player;

    this.arms = this.arms.filter((arm) => {
      if (!arm.active || arm.dying) return false;

      // Past the far edge - retire the arm
      if (arm.x < -70 || arm.x > mapW + 70) {
        arm.dying = true;
        arm.destroy();
        return false;
      }

      // Single hit per sweep
      if (!arm.hitPlayer && player.hp > 0) {
        const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
          arm.getBounds(),
          player.sprite.getBounds()
        );
        if (overlap) {
          arm.hitPlayer = true;
          const dir = arm.body.velocity.x >= 0 ? 1 : -1;
          player.takeDamage(cfg.damage, dir);
        }
      }
      return true;
    });
  }

  // === Pattern: telegraphed ground slam under the player ===
  slam() {
    const cfg = this.cfg.slam;
    const surface = this.groundSurface();
    const targetX = this.scene.player.sprite.x;

    const tele = this.scene.add.graphics().setDepth(DEPTH.EFFECTS);
    tele.fillStyle(0xE74C3C, 0.3);
    tele.fillEllipse(targetX, surface, cfg.radius * 2, 30);
    this.telegraphs.push(tele);

    this.scene.tweens.add({
      targets: tele,
      alpha: 0.25,
      duration: 180,
      yoyo: true,
      repeat: -1,
    });

    this.scene.time.delayedCall(cfg.telegraphMs, () => {
      this.removeTelegraph(tele);
      if (this.defeated || !this.sprite.active) return;

      // Impact: squash the boss, shake the room
      this.scene.tweens.add({
        targets: this.sprite,
        scaleY: 0.8,
        scaleX: 1.15,
        duration: 110,
        yoyo: true,
      });
      this.scene.cameras.main.shake(220, 0.012);

      // Expanding shockwave ring (drawn at local origin so scaling grows in place)
      const ring = this.scene.add.graphics({ x: targetX, y: surface }).setDepth(DEPTH.EFFECTS);
      ring.lineStyle(4, 0xE74C3C, 0.9);
      ring.strokeEllipse(0, 0, 60, 18);
      this.scene.tweens.add({
        targets: ring,
        scaleX: cfg.radius / 30,
        scaleY: cfg.radius / 30,
        alpha: 0,
        duration: 350,
        onComplete: () => ring.destroy(),
      });

      const p = this.scene.player;
      const grounded = p.sprite.y > surface - 120;
      if (p.hp > 0 && grounded && Math.abs(p.sprite.x - targetX) < cfg.radius) {
        p.takeDamage(cfg.damage, p.sprite.x < targetX ? -1 : 1);
      }

      this.endPattern(0);
    });
  }

  // === Pattern: field-wide hug, one safe zone (Zakum-style wipe) ===
  fieldHug() {
    const cfg = this.cfg.fieldHug;
    const surface = this.groundSurface();
    const mapW = this.scene.mapData.width;
    const safeX = Phaser.Math.Between(200, mapW - 200);

    // Safe zone marker
    const safe = this.scene.add.graphics().setDepth(DEPTH.EFFECTS);
    safe.fillStyle(0x2ECC71, 0.3);
    safe.fillEllipse(safeX, surface, cfg.safeRadius * 2, 40);
    safe.lineStyle(3, 0x2ECC71, 0.9);
    safe.strokeEllipse(safeX, surface, cfg.safeRadius * 2, 40);
    this.telegraphs.push(safe);

    this.scene.tweens.add({
      targets: safe,
      alpha: 0.35,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });

    // Screen-fixed warning
    const warn = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height * 0.25,
      'HUG INCOMING!',
      {
        fontSize: '26px',
        fontFamily: 'Arial Black, Arial',
        color: '#FF7EB9',
        stroke: '#000000',
        strokeThickness: 5,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI + 7);
    this.telegraphs.push(warn);

    // Wind-up glow
    this.sprite.setTint(0xFFB6C1);

    this.scene.time.delayedCall(cfg.telegraphMs, () => {
      this.removeTelegraph(safe);
      this.removeTelegraph(warn);
      if (this.defeated || !this.sprite.active) return;

      this.sprite.clearTint();

      // Full-field pink flash
      const flash = this.scene.add.graphics().setDepth(DEPTH.UI + 5).setScrollFactor(0);
      flash.fillStyle(0xFF7EB9, 0.55);
      flash.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 500,
        onComplete: () => flash.destroy(),
      });
      this.scene.cameras.main.shake(320, 0.02);

      const p = this.scene.player;
      if (p.hp > 0 && Math.abs(p.sprite.x - safeX) > cfg.safeRadius) {
        const dir = p.sprite.x < this.sprite.x ? -1 : 1;
        p.takeDamage(cfg.damage, dir);
      }

      this.endPattern(0);
    });
  }

  removeTelegraph(obj) {
    const i = this.telegraphs.indexOf(obj);
    if (i !== -1) this.telegraphs.splice(i, 1);
    if (obj && obj.destroy) obj.destroy();
  }

  // Player attack collision (same idiom as regular monsters)
  handleTakingDamage() {
    const player = this.scene.player;
    if (!player.attackHitbox || this.isHit) return;

    const hitbox = player.attackHitbox;
    const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(
        hitbox.x - PLAYER.ATTACK_WIDTH / 2,
        hitbox.y - PLAYER.ATTACK_HEIGHT / 2,
        PLAYER.ATTACK_WIDTH,
        PLAYER.ATTACK_HEIGHT
      ),
      this.sprite.getBounds()
    );
    if (!overlap) return;

    this.isHit = true;
    const damage = player.attackPower + Phaser.Math.Between(-3, 3);
    this.hp -= damage;

    this.scene.showDamageNumber(
      this.sprite.x + Phaser.Math.Between(-20, 20),
      this.sprite.y - 40,
      damage,
      false
    );

    // Hit flash
    this.sprite.setTintFill(0xFFFFFF);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active && !this.defeated) this.sprite.clearTint();
    });

    this.scene.time.delayedCall(PLAYER.ATTACK_DURATION + 50, () => {
      this.isHit = false;
    });

    if (this.hp <= 0) this.die();
  }

  handleContactDamage(player) {
    if (this.contactCooldown || player.hp <= 0) return;
    const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
      player.sprite.getBounds(),
      this.sprite.getBounds()
    );
    if (!overlap) return;

    this.contactCooldown = true;
    const dir = player.sprite.x < this.sprite.x ? -1 : 1;
    player.takeDamage(this.cfg.touchDamage, dir);
    this.scene.time.delayedCall(1000, () => {
      this.contactCooldown = false;
    });
  }

  die() {
    if (this.defeated) return;
    this.defeated = true;

    this.cleanupEffects();
    this.sprite.clearTint();
    this.sprite.setVelocity(0, 0);
    this.sprite.body.enable = false;

    this.scene.cameras.main.shake(400, 0.01);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      angle: 25,
      duration: 900,
      onComplete: () => {
        if (this.sprite.active) {
          this.sprite.setActive(false);
          this.sprite.setVisible(false);
        }
      },
    });

    // Register the defeat immediately - if the player leaves the map during
    // the death tween, the kill must still count (flag persists via save)
    this.scene.onBossDefeated(this.id);
  }

  cleanupEffects() {
    this.arms.forEach((arm) => {
      if (arm.active && !arm.dying) {
        arm.dying = true;
        arm.destroy();
      }
    });
    this.arms = [];

    this.telegraphs.forEach((t) => {
      if (t && t.destroy) t.destroy();
    });
    this.telegraphs = [];
  }

  destroy() {
    this.cleanupEffects();
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }
}
