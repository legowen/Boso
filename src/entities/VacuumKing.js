// src/entities/VacuumKing.js
// Special hidden boss - the primal fear of every pet: the vacuum.
// Cycles between SUCTION (drags the player in) and firing dust balls.
// IMPORTANT: update() must run AFTER Player.update each frame so the
// suction pull stacks on top of the player's input velocity.

import Phaser from 'phaser';
import { BOSS_TYPES } from '../data/monsters.js';
import { PLAYER, DEPTH } from '../utils/constants.js';

export default class VacuumKing {
  constructor(scene, x, y) {
    this.scene = scene;
    this.id = 'vacuumKing';
    this.cfg = BOSS_TYPES.vacuumKing;
    this.name = this.cfg.name;
    this.hp = this.cfg.hp;
    this.maxHp = this.cfg.hp;
    this.defeated = false;
    this.isHit = false;
    this.contactCooldown = false;
    this.startX = x;
    this.baseY = y;
    this.direction = 1;
    this.dusts = [];
    this.streaks = [];

    // Grace period before the first suction
    this.state = 'idle';
    this.phaseEndAt = Date.now() + 1800;
    this.nextDustAt = Date.now() + 900;
    this.nextStreakAt = 0;

    this.createTextures();

    this.sprite = scene.physics.add.sprite(x, y, 'boss_vacuum_king');
    this.sprite.setDepth(DEPTH.BOSS);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setSize(this.cfg.width - 20, this.cfg.height - 10);
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

  update() {
    if (this.defeated || !this.sprite.active) return;

    const now = Date.now();
    const player = this.scene.player;

    this.updateDusts();
    this.handleTakingDamage();
    // The killing blow may have landed just now - stop acting immediately
    if (this.defeated) return;
    this.handleContactDamage(player);

    // Hover drift + gentle bob (velocity steering, knockback-safe)
    if (this.sprite.x <= this.startX - this.cfg.patrolRange) {
      this.direction = 1;
    } else if (this.sprite.x >= this.startX + this.cfg.patrolRange) {
      this.direction = -1;
    }
    this.sprite.setVelocityX(this.cfg.hoverSpeed * this.direction);
    this.sprite.setFlipX(this.direction > 0);
    const bobY = this.baseY + Math.sin(now / 700) * 24;
    this.sprite.setVelocityY((bobY - this.sprite.y) * 3);

    if (player.hp <= 0) {
      this.sprite.clearTint();
      return;
    }

    // Phase cycle: suction ON <-> OFF
    if (now > this.phaseEndAt) {
      if (this.state === 'suck') {
        this.state = 'idle';
        this.phaseEndAt = now + this.cfg.suction.offMs;
        this.nextDustAt = now + 400;
        this.sprite.clearTint();
      } else {
        this.state = 'suck';
        this.phaseEndAt = now + this.cfg.suction.onMs;
        this.sprite.setTint(0x9BD9FF);
      }
    }

    if (this.state === 'suck') {
      // Pull the player toward the vacuum. Runs after Player.update, so this
      // offsets the input velocity: running away crawls, standing gets dragged.
      if (!player.isKnockedBack && !player.isClimbing) {
        const p = player.sprite;
        const dir = Math.sign(this.sprite.x - p.x);
        if (dir !== 0) {
          p.setVelocityX(p.body.velocity.x + this.cfg.suction.pull * dir);
        }
      }
      // Air streak visuals rushing into the nozzle
      if (now > this.nextStreakAt) {
        this.spawnStreak();
        this.nextStreakAt = now + 130;
      }
    } else {
      // Dust barrage while the motor cools down
      if (now > this.nextDustAt) {
        this.fireDust(player);
        if (Math.random() < 0.4) {
          this.scene.time.delayedCall(180, () => {
            if (!this.defeated && this.sprite.active && player.hp > 0) {
              this.fireDust(player);
            }
          });
        }
        this.nextDustAt = now + this.cfg.dust.intervalMs;
      }
    }
  }

  spawnStreak() {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(180, 320);
    const sx = this.sprite.x + Math.cos(angle) * dist;
    const sy = this.sprite.y + Math.sin(angle) * dist * 0.6;

    const streak = this.scene.add.rectangle(sx, sy, 14, 3, 0xFFFFFF, 0.7);
    streak.setDepth(DEPTH.EFFECTS);
    streak.setRotation(Phaser.Math.Angle.Between(sx, sy, this.sprite.x, this.sprite.y));
    this.streaks.push(streak);

    this.scene.tweens.add({
      targets: streak,
      x: this.sprite.x,
      y: this.sprite.y,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        const i = this.streaks.indexOf(streak);
        if (i !== -1) this.streaks.splice(i, 1);
        streak.destroy();
      },
    });
  }

  fireDust(player) {
    const cfg = this.cfg.dust;
    const dust = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y + 20, 'proj_dust');
    dust.setDepth(DEPTH.EFFECTS);
    dust.body.setAllowGravity(false);
    dust.hitPlayer = false;
    dust.dying = false;
    this.dusts.push(dust);

    this.scene.physics.moveTo(dust, player.sprite.x, player.sprite.y, cfg.speed);

    // Slow tumble
    this.scene.tweens.add({
      targets: dust,
      angle: 360,
      duration: 1200,
      repeat: -1,
    });

    // Lifespan (dying flag guards double-destroy)
    this.scene.time.delayedCall(cfg.lifespanMs, () => {
      this.destroyDust(dust);
    });
  }

  destroyDust(dust) {
    if (!dust.active || dust.dying) return;
    dust.dying = true;
    // Kill the infinite tumble tween - tweens don't stop on target destroy
    this.scene.tweens.killTweensOf(dust);
    dust.destroy();
  }

  updateDusts() {
    const cfg = this.cfg.dust;
    const player = this.scene.player;
    const mapW = this.scene.mapData.width;
    const mapH = this.scene.mapData.height;

    this.dusts = this.dusts.filter((dust) => {
      if (!dust.active || dust.dying) return false;

      // Out of bounds
      if (dust.x < -40 || dust.x > mapW + 40 || dust.y < -40 || dust.y > mapH + 40) {
        this.destroyDust(dust);
        return false;
      }

      if (!dust.hitPlayer && player.hp > 0) {
        const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
          dust.getBounds(),
          player.sprite.getBounds()
        );
        if (overlap) {
          dust.hitPlayer = true;
          const dir = player.sprite.x < dust.x ? -1 : 1;
          player.takeDamage(cfg.damage, dir);
          this.destroyDust(dust);
          return false;
        }
      }
      return true;
    });
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
    this.hp -= damage;

    this.scene.showDamageNumber(
      this.sprite.x + Phaser.Math.Between(-20, 20),
      this.sprite.y - 40,
      damage,
      false
    );

    // Hit flash (preserve suction tint afterwards)
    this.sprite.setTintFill(0xFFFFFF);
    this.scene.time.delayedCall(80, () => {
      if (!this.sprite.active || this.defeated) return;
      if (this.state === 'suck') this.sprite.setTint(0x9BD9FF);
      else this.sprite.clearTint();
    });

    this.scene.time.delayedCall(PLAYER.ATTACK_DURATION + 50, () => {
      this.isHit = false;
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

    this.scene.cameras.main.shake(500, 0.012);
    // Sputter, drop, and pop
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y + 120,
      angle: 35,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 1100,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.sprite.active) {
          this.sprite.setActive(false);
          this.sprite.setVisible(false);
        }
      },
    });

    // Register the defeat immediately - if the scene shuts down during the
    // death tween, the kill (and the ending trigger) must still count
    this.scene.onBossDefeated(this.id);
  }

  // Shift wall-clock cycle timers after the pause menu closes
  shiftTimers(ms) {
    this.phaseEndAt += ms;
    this.nextDustAt += ms;
    this.nextStreakAt += ms;
  }

  cleanupEffects() {
    this.dusts.forEach((dust) => {
      this.destroyDust(dust);
    });
    this.dusts = [];

    this.streaks.forEach((s) => {
      if (s && s.destroy) s.destroy();
    });
    this.streaks = [];
  }

  destroy() {
    this.cleanupEffects();
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }
}
