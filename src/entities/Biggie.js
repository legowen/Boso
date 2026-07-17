// src/entities/Biggie.js
// Buddy House boss - the big dog who has always lived there.
// Territorial patterns: bark shockwave (expanding knockback ring),
// pounce (parabolic leap onto the player's position, telegraphed), and
// zoomies (full-field high-speed passes, Zakum-style field pressure).
// "Defeating" Biggie is a befriending: hearts, a tail wag, and he trots
// off - no death animation.

import Phaser from 'phaser';
import { BOSS_TYPES } from '../data/monsters.js';
import { STORY } from '../data/story.js';
import { PLAYER, DEPTH } from '../utils/constants.js';

export default class Biggie {
  constructor(scene, x, y) {
    this.scene = scene;
    this.id = 'biggie';
    this.cfg = BOSS_TYPES.biggie;
    this.name = this.cfg.name;
    this.hp = this.cfg.hp;
    this.maxHp = this.cfg.hp;
    this.defeated = false;
    this.isHit = false;
    this.contactCooldown = false;
    this.busy = false;
    this.state = 'patrol'; // patrol | pouncing | zoomies
    this.lastPattern = null;
    this.startX = x;
    this.direction = 1;
    this.waves = [];
    this.telegraphs = [];
    this.pounceStartedAt = 0;
    this.pounceTargetX = 0;
    this.zoomiesPassesLeft = 0;

    this.createTextures();

    this.sprite = scene.physics.add.sprite(x, y, 'boss_biggie');
    this.sprite.setDepth(DEPTH.BOSS);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(this.cfg.width - 30, this.cfg.height - 10);

    this.nextAttackAt = Date.now() + Phaser.Math.Between(2500, 4000);
  }

  createTextures() {
    if (!this.scene.textures.exists('boss_biggie')) {
      const W = this.cfg.width;
      const H = this.cfg.height;
      const g = this.scene.add.graphics();

      // Hind body
      g.fillStyle(this.cfg.color, 1);
      g.fillRoundedRect(10, 46, W - 60, H - 54, 22);
      // Tail up and proud
      g.fillStyle(0x7B4413, 1);
      g.fillTriangle(14, 52, 0, 22, 26, 44);

      // Chest patch
      g.fillStyle(0xD9B98A, 1);
      g.fillEllipse(W - 52, 86, 34, 44);

      // Big head
      g.fillStyle(this.cfg.color, 1);
      g.fillRoundedRect(W - 74, 8, 64, 58, 16);
      // Floppy ears
      g.fillStyle(0x6E3D0F, 1);
      g.fillRoundedRect(W - 80, 4, 18, 40, 8);
      g.fillRoundedRect(W - 22, 4, 18, 40, 8);

      // Snout
      g.fillStyle(0xD9B98A, 1);
      g.fillRoundedRect(W - 52, 36, 34, 24, 8);
      g.fillStyle(0x2C1810, 1);
      g.fillRoundedRect(W - 40, 34, 12, 8, 3);
      // Panting tongue
      g.fillStyle(0xE75480, 1);
      g.fillRoundedRect(W - 40, 56, 10, 12, 4);

      // Serious brows + eyes
      g.fillStyle(0x2C1810, 1);
      g.fillRect(W - 64, 18, 12, 3);
      g.fillRect(W - 34, 18, 12, 3);
      g.fillCircle(W - 58, 27, 5);
      g.fillCircle(W - 28, 27, 5);
      g.fillStyle(0xFFFFFF, 0.9);
      g.fillCircle(W - 60, 25, 2);
      g.fillCircle(W - 30, 25, 2);

      // Collar with a bone tag
      g.fillStyle(0xC0392B, 1);
      g.fillRect(W - 74, 62, 64, 8);
      g.fillStyle(0xF1C40F, 1);
      g.fillCircle(W - 42, 74, 5);

      // Sturdy legs
      g.fillStyle(0x7B4413, 1);
      g.fillRect(22, H - 14, 18, 14);
      g.fillRect(52, H - 14, 18, 14);
      g.fillRect(W - 66, H - 14, 18, 14);
      g.fillRect(W - 36, H - 14, 18, 14);

      g.generateTexture('boss_biggie', W, H);
      g.destroy();
    }
  }

  groundSurface() {
    const ground = this.scene.mapData.platforms.find((p) => p.isGround);
    return ground ? ground.y : this.scene.mapData.height - 60;
  }

  update(time, delta) {
    if (this.defeated || !this.sprite.active) return;

    const now = Date.now();
    const player = this.scene.player;

    this.updateWaves(delta);
    this.handleTakingDamage();
    // The killing blow may have landed just now - stop acting immediately
    if (this.defeated) return;
    this.handleContactDamage(player);

    if (this.state === 'pouncing') {
      this.updatePounce(now, player);
      return;
    }
    if (this.state === 'zoomies') {
      this.updateZoomies(player);
      return;
    }

    if (player.hp <= 0) {
      this.sprite.setVelocityX(0);
      return;
    }

    if (!this.busy) {
      // Territorial patrol
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
    if (this.defeated) return;
    const roll = Math.random();
    let pattern;
    if (roll < 0.4) pattern = 'barkWave';
    else if (roll < 0.7) pattern = 'pounce';
    else pattern = 'zoomies';

    // Never zoomies twice in a row - the field pass is the wipe pattern
    if (pattern === 'zoomies' && this.lastPattern === 'zoomies') {
      pattern = 'barkWave';
    }
    this.lastPattern = pattern;

    this.busy = true;
    this.sprite.setVelocityX(0);

    if (pattern === 'barkWave') this.barkWave();
    else if (pattern === 'pounce') this.pounce();
    else this.zoomies();
  }

  endPattern(extraDelayMs) {
    this.scene.time.delayedCall(extraDelayMs || 0, () => {
      if (this.defeated) return;
      this.busy = false;
      this.state = 'patrol';
      this.nextAttackAt =
        Date.now() + Phaser.Math.Between(this.cfg.attackIntervalMin, this.cfg.attackIntervalMax);
    });
  }

  // === Pattern: bark shockwave - expanding ring with knockback ===
  barkWave() {
    const cfg = this.cfg.barkWave;

    // Rear-up telegraph with a floating WOOF
    this.sprite.setTint(0xFFD1A3);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 1.12,
      scaleX: 0.94,
      duration: cfg.telegraphMs * 0.5,
      yoyo: true,
    });
    const woof = this.scene.add.text(this.sprite.x, this.sprite.y - this.cfg.height / 2 - 24, 'WOOF!', {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      color: '#F5B041',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.EFFECTS);
    this.telegraphs.push(woof);

    this.scene.time.delayedCall(cfg.telegraphMs, () => {
      this.removeTelegraph(woof);
      if (this.defeated || !this.sprite.active) return;

      this.sprite.clearTint();
      this.scene.cameras.main.shake(200, 0.01);

      const gfx = this.scene.add.graphics().setDepth(DEPTH.EFFECTS);
      this.waves.push({
        x: this.sprite.x,
        y: this.sprite.y,
        radius: 40,
        hitPlayer: false,
        gfx,
      });

      this.endPattern(400);
    });
  }

  updateWaves(delta) {
    if (this.waves.length === 0) return;
    const cfg = this.cfg.barkWave;
    const player = this.scene.player;
    const dt = (delta || 16) / 1000;

    this.waves = this.waves.filter((wave) => {
      wave.radius += cfg.speed * dt;
      if (wave.radius >= cfg.maxRadius) {
        wave.gfx.destroy();
        return false;
      }

      // Redraw the expanding ring
      const fade = 1 - wave.radius / cfg.maxRadius;
      wave.gfx.clear();
      wave.gfx.lineStyle(6, 0xF5B041, 0.35 + fade * 0.55);
      wave.gfx.strokeEllipse(wave.x, wave.y, wave.radius * 2, wave.radius * 1.4);
      wave.gfx.lineStyle(2, 0xFDEBD0, 0.3 + fade * 0.4);
      wave.gfx.strokeEllipse(wave.x, wave.y, wave.radius * 2 - 10, wave.radius * 1.4 - 8);

      // The wave edge hits once as it crosses the player
      if (!wave.hitPlayer && player.hp > 0) {
        const dist = Phaser.Math.Distance.Between(
          wave.x, wave.y, player.sprite.x, player.sprite.y
        );
        if (Math.abs(dist - wave.radius) < 30) {
          wave.hitPlayer = true;
          const dir = player.sprite.x < wave.x ? -1 : 1;
          player.takeDamage(cfg.damage, dir);
        }
      }
      return true;
    });
  }

  // === Pattern: pounce - telegraphed parabolic leap onto the player ===
  pounce() {
    const cfg = this.cfg.pounce;
    const surface = this.groundSurface();
    const targetX = Phaser.Math.Clamp(
      this.scene.player.sprite.x,
      120,
      this.scene.mapData.width - 120
    );
    this.pounceTargetX = targetX;

    // Landing zone telegraph
    const tele = this.scene.add.graphics().setDepth(DEPTH.EFFECTS);
    tele.fillStyle(0x8E44AD, 0.3);
    tele.fillEllipse(targetX, surface, cfg.radius * 2, 30);
    tele.lineStyle(3, 0x8E44AD, 0.8);
    tele.strokeEllipse(targetX, surface, cfg.radius * 2, 30);
    this.telegraphs.push(tele);
    this.scene.tweens.add({
      targets: tele,
      alpha: 0.3,
      duration: 180,
      yoyo: true,
      repeat: -1,
    });

    // Crouch telegraph
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.85,
      scaleX: 1.1,
      duration: cfg.telegraphMs * 0.6,
    });

    this.scene.time.delayedCall(cfg.telegraphMs, () => {
      this.removeTelegraph(tele);
      if (this.defeated || !this.sprite.active) return;

      // Launch: solve the parabola for jumpMs of airtime
      const t = cfg.jumpMs / 1000;
      const gravity = this.scene.physics.world.gravity.y || 900;
      this.sprite.setScale(1, 1);
      this.sprite.setVelocityX((this.pounceTargetX - this.sprite.x) / t);
      this.sprite.setVelocityY(-gravity * t * 0.5);
      this.sprite.setFlipX(this.pounceTargetX < this.sprite.x);
      this.state = 'pouncing';
      this.pounceStartedAt = Date.now();
    });
  }

  updatePounce(now, player) {
    // Wait for liftoff before checking for the landing
    if (now - this.pounceStartedAt < 150) return;

    if (this.sprite.body.blocked.down) {
      // Impact
      this.state = 'patrol';
      this.sprite.setVelocityX(0);
      this.scene.cameras.main.shake(240, 0.014);
      this.scene.tweens.add({
        targets: this.sprite,
        scaleY: 0.8,
        scaleX: 1.18,
        duration: 110,
        yoyo: true,
      });

      const cfg = this.cfg.pounce;
      const surface = this.groundSurface();
      const ring = this.scene.add.graphics({ x: this.sprite.x, y: surface }).setDepth(DEPTH.EFFECTS);
      ring.lineStyle(4, 0x8E44AD, 0.9);
      ring.strokeEllipse(0, 0, 60, 18);
      this.scene.tweens.add({
        targets: ring,
        scaleX: cfg.radius / 30,
        scaleY: cfg.radius / 30,
        alpha: 0,
        duration: 320,
        onComplete: () => ring.destroy(),
      });

      const grounded = player.sprite.y > surface - 120;
      if (
        player.hp > 0 &&
        grounded &&
        Math.abs(player.sprite.x - this.sprite.x) < cfg.radius
      ) {
        player.takeDamage(cfg.damage, player.sprite.x < this.sprite.x ? -1 : 1);
      }

      this.endPattern(200);
    } else if (now - this.pounceStartedAt > 3000) {
      // Failsafe: never stay airborne forever
      this.state = 'patrol';
      this.endPattern(0);
    }
  }

  // === Pattern: zoomies - full-field high-speed passes ===
  zoomies() {
    const cfg = this.cfg.zoomies;

    // Warning banner + rev-up shake
    const warn = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height * 0.25,
      'ZOOMIES!',
      {
        fontSize: '26px',
        fontFamily: 'Arial Black, Arial',
        color: '#F5B041',
        stroke: '#000000',
        strokeThickness: 5,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI + 7);
    this.telegraphs.push(warn);

    this.sprite.setTint(0xFFE0B2);
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + 4,
      duration: 60,
      yoyo: true,
      repeat: Math.floor(cfg.telegraphMs / 120),
    });

    this.scene.time.delayedCall(cfg.telegraphMs, () => {
      this.removeTelegraph(warn);
      if (this.defeated || !this.sprite.active) return;

      this.sprite.clearTint();
      this.state = 'zoomies';
      this.zoomiesPassesLeft = cfg.passes;
      // First pass darts toward the player
      this.direction = this.scene.player.sprite.x < this.sprite.x ? -1 : 1;
      this.sprite.setFlipX(this.direction < 0);
    });
  }

  updateZoomies(player) {
    const cfg = this.cfg.zoomies;
    const mapW = this.scene.mapData.width;

    this.sprite.setVelocityX(cfg.speed * this.direction);

    // Motion blur puffs
    if (Math.random() < 0.3) {
      const puff = this.scene.add.circle(
        this.sprite.x - this.direction * 40,
        this.sprite.y + this.cfg.height / 4,
        Phaser.Math.Between(4, 9),
        0xFDF2E9,
        0.5
      ).setDepth(DEPTH.EFFECTS - 1);
      this.scene.tweens.add({
        targets: puff,
        alpha: 0,
        scale: 1.8,
        duration: 300,
        onComplete: () => puff.destroy(),
      });
    }

    const atLeftEdge = this.sprite.x < 90 || this.sprite.body.blocked.left;
    const atRightEdge = this.sprite.x > mapW - 90 || this.sprite.body.blocked.right;
    if ((this.direction < 0 && atLeftEdge) || (this.direction > 0 && atRightEdge)) {
      this.zoomiesPassesLeft -= 1;
      if (this.zoomiesPassesLeft <= 0) {
        this.state = 'patrol';
        this.sprite.setVelocityX(0);
        this.endPattern(300);
        return;
      }
      this.direction *= -1;
      this.sprite.setFlipX(this.direction < 0);
    }
  }

  removeTelegraph(obj) {
    const i = this.telegraphs.indexOf(obj);
    if (i !== -1) this.telegraphs.splice(i, 1);
    if (obj && obj.destroy) {
      this.scene.tweens.killTweensOf(obj);
      obj.destroy();
    }
  }

  // Player attack collision (same idiom as regular monsters)
  handleTakingDamage() {
    const player = this.scene.player;
    // A dead player's lingering hitbox must not land the killing blow
    if (!player.attackHitbox || this.isHit || player.hp <= 0) return;

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
    this.applyDamage(damage);

    this.scene.time.delayedCall(PLAYER.ATTACK_DURATION + 50, () => {
      this.isHit = false;
    });
  }

  // Damage from any player source (melee overlap, bark projectile)
  applyDamage(amount) {
    if (this.defeated || !this.sprite.active) return;
    this.hp -= amount;

    this.scene.showDamageNumber(
      this.sprite.x + Phaser.Math.Between(-20, 20),
      this.sprite.y - 40,
      amount,
      false
    );

    this.sprite.setTintFill(0xFFFFFF);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active && !this.defeated) this.sprite.clearTint();
    });

    if (this.hp <= 0) this.die();
  }

  handleContactDamage(player) {
    if (this.defeated || this.contactCooldown || player.hp <= 0) return;
    const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
      player.sprite.getBounds(),
      this.sprite.getBounds()
    );
    if (!overlap) return;

    this.contactCooldown = true;
    const dir = player.sprite.x < this.sprite.x ? -1 : 1;
    // Getting clipped during zoomies hurts more than a casual bump
    const damage = this.state === 'zoomies' ? this.cfg.zoomies.damage : this.cfg.touchDamage;
    player.takeDamage(damage, dir);
    this.scene.time.delayedCall(1000, () => {
      this.contactCooldown = false;
    });
  }

  // Shift wall-clock pattern timers after the pause menu closes
  shiftTimers(ms) {
    this.nextAttackAt += ms;
    this.pounceStartedAt += ms;
  }

  // Befriending, not defeating: hearts, a tail wag, and off he trots.
  die() {
    if (this.defeated) return;
    this.defeated = true;

    this.cleanupEffects();
    this.sprite.clearTint();
    this.sprite.setVelocity(0, 0);
    this.sprite.body.enable = false;
    this.state = 'patrol';

    // Soft pink flush
    this.sprite.setTint(0xFFC9DE);

    // Burst of hearts
    for (let i = 0; i < 10; i++) {
      const heart = this.scene.add.text(
        this.sprite.x + Phaser.Math.Between(-60, 60),
        this.sprite.y + Phaser.Math.Between(-40, 30),
        '♥',
        {
          fontSize: `${Phaser.Math.Between(14, 26)}px`,
          fontFamily: 'Arial',
          color: '#FF7EB9',
          stroke: '#FFFFFF',
          strokeThickness: 2,
        }
      ).setOrigin(0.5).setDepth(DEPTH.EFFECTS);
      this.scene.tweens.add({
        targets: heart,
        y: heart.y - Phaser.Math.Between(50, 110),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1600),
        delay: i * 90,
        onComplete: () => heart.destroy(),
      });
    }

    // Befriend banner lines
    STORY.biggieFriend.forEach((line, i) => {
      const text = this.scene.add.text(
        this.scene.scale.width / 2,
        this.scene.scale.height * 0.3 + i * 34,
        line,
        {
          fontSize: i === 0 ? '22px' : '18px',
          fontFamily: 'Arial Black, Arial',
          color: '#FF7EB9',
          stroke: '#000000',
          strokeThickness: 4,
        }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI + 7).setAlpha(0);
      this.scene.tweens.add({
        targets: text,
        alpha: 1,
        delay: 300 + i * 700,
        duration: 400,
      });
      this.scene.tweens.add({
        targets: text,
        alpha: 0,
        delay: 3200,
        duration: 600,
        onComplete: () => text.destroy(),
      });
    });

    // Happy tail-wag wiggle, then he trots off home
    this.scene.tweens.add({
      targets: this.sprite,
      angle: { from: -4, to: 4 },
      duration: 130,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        if (!this.sprite.active) return;
        this.sprite.setAngle(0);
        this.scene.tweens.add({
          targets: this.sprite,
          x: this.sprite.x + 260,
          alpha: 0,
          duration: 1100,
          ease: 'Quad.easeIn',
          onComplete: () => {
            if (this.sprite.active) {
              this.sprite.setActive(false);
              this.sprite.setVisible(false);
            }
          },
        });
      },
    });

    // Register the defeat immediately - if the player leaves the map during
    // the befriend sequence, it must still count (flag persists via save)
    this.scene.onBossDefeated(this.id);
  }

  cleanupEffects() {
    this.waves.forEach((wave) => {
      if (wave.gfx && wave.gfx.destroy) wave.gfx.destroy();
    });
    this.waves = [];

    this.telegraphs.forEach((t) => {
      if (t && t.destroy) {
        this.scene.tweens.killTweensOf(t);
        t.destroy();
      }
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
