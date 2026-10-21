// src/entities/PatternBoss.js
// Shared base for the data-driven bosses (Hug Guardian, Dr. Embrace, Vacuum
// King). The boss data (BOSS_TYPES[id].phases) says WHAT it can do; this class
// runs the loop:
//   BossBrain       picks the next pattern (weights, cooldowns, phase)
//   PatternExecutor draws the telegraph and applies the hit (one run per use)
//
// Everything here is timed on `this.clock`, a frame-delta clock, so a paused
// game (menu open, hidden tab) never skips a telegraph or a cooldown.
// Subclasses provide textures, patrol/hover movement and facing.
//
// Update order matters for floating bosses with a pull pattern: GameScene
// calls update() AFTER Player.update so the pull stacks on input velocity.

import Phaser from 'phaser';
import { applyBossArt, bossCombatBounds } from '../systems/EntityArt.js';
import { PLAYER, DEPTH } from '../utils/constants.js';
import { PHASE_TRANSITION } from '../data/bossPatterns.js';
import { selectPhase, pickPattern, readyAtFor, speedMultFor } from '../systems/BossBrain.js';
import { createRun } from '../systems/PatternExecutor.js';
import { pixelFont } from '../i18n/fonts.js';
import { t } from '../i18n/index.js';

// Tint layers in priority order: a layer further left wins
const TINT_PRIORITY = ['guard', 'roar'];
const ENRAGE_TINT = 0xFFB0B0;

export default class PatternBoss {
  constructor(scene, x, y, options) {
    this.scene = scene;
    this.id = options.id;
    this.cfg = options.cfg;
    this.textureKey = options.textureKey;
    this.armTextureKey = options.armTextureKey || null;
    this.floating = !!options.floating;
    this.nameKey = this.cfg.nameKey;
    this.hp = this.cfg.hp;
    this.maxHp = this.cfg.hp;
    this.defeated = false;
    this.isHit = false;
    this.contactCooldown = false;
    this.startX = x;
    this.baseY = y;
    this.direction = 1;

    // Phases and the pattern loop
    this.phases = this.cfg.phases;
    this.phaseIndex = 0;
    this.speedMult = speedMultFor(this.phases[0]);
    this.clock = 0;
    this.cooldowns = {};
    this.history = [];
    this.runs = [];
    this.nextPickAt = options.openingDelayMs || 2500;
    this.rng = Math.random;
    this.transition = null;

    // Combat state owned by the running patterns
    this.invulnerable = new Set();
    this.tints = {};
    this.flashing = false;
    this.scaleTween = null;
    this.touchDamageOverride = null;
    this.contactSuppressed = false;
    this.hoverOverrideY = null;
    this.minions = [];
    this.projectiles = [];
    this.fx = new Set();
    this.lastBlockedAt = -Infinity;

    this.createTextures();

    this.sprite = scene.physics.add.sprite(x, y, this.textureKey);
    this.sprite.setDepth(DEPTH.BOSS);
    this.sprite.setCollideWorldBounds(true);
    if (this.floating) this.sprite.body.setAllowGravity(false);
    this.art = applyBossArt(this.sprite, this.cfg, options.bodyWidth, options.bodyHeight);
  }

  // Subclasses generate their textures here (guarded by textures.exists so
  // PNG overrides win).
  createTextures() {}

  get phase() {
    return this.phases[this.phaseIndex];
  }

  groundSurface() {
    const ground = this.scene.mapData.platforms.find((p) => p.isGround);
    return ground ? ground.y : this.scene.mapData.height - 60;
  }

  // Facing is the subclass's art convention: direction 1 = toward +x
  facing() {
    return this.direction;
  }

  faceTowards(x) {
    this.direction = x >= this.sprite.x ? 1 : -1;
    this.applyFacing();
  }

  applyFacing() {}

  // Walking / drifting while no pattern holds the boss in place
  patrol() {}

  // Vertical steering for floating bosses; runs every frame, even mid-pattern
  updateHover() {}

  update(time, delta) {
    if (this.defeated || !this.sprite.active) return;

    const dt = Math.min(Math.max(delta || 0, 0), 100);
    this.clock += dt;
    const player = this.scene.player;

    this.updateProjectiles(dt);
    this.handleTakingDamage();
    // The killing blow may have landed just now - stop acting immediately
    if (this.defeated) return;
    this.handleContactDamage(player);

    if (player.hp <= 0) {
      this.cancelRuns();
      this.sprite.setVelocityX(0);
      this.updateHover();
      return;
    }

    if (this.transition) {
      this.updateTransition(dt);
      return;
    }

    this.updateRuns(dt);
    this.updateMovement();
    this.maybeStartPattern();
  }

  // ===== Pattern loop =====

  maybeStartPattern() {
    if (this.clock < this.nextPickAt) return;
    const pattern = pickPattern(this.phase, this.cooldowns, this.history, this.clock, this.rng, {
      active: this.runs.map((run) => run.pattern),
      minionsAlive: this.aliveMinions().length,
    });
    if (pattern) this.startPattern(pattern);
  }

  startPattern(pattern) {
    const run = createRun(this, pattern);
    if (!run) return null;
    this.runs.push(run);
    this.history.push(pattern);
    if (this.history.length > 8) this.history.shift();
    this.cooldowns[pattern.id] = readyAtFor(pattern, this.phase, this.clock);
    // Exclusive patterns block the next pick until they end; overlapping ones
    // only wait out the gap
    this.nextPickAt = pattern.overlap ? this.clock + this.phase.gapMs : Infinity;
    run.begin();
    return run;
  }

  // Dev / debug: start a pattern of the current phase by id, ignoring cooldowns
  startPatternById(id) {
    const pattern = this.phase.patterns.find((p) => p.id === id);
    return pattern ? this.startPattern(pattern) : null;
  }

  updateRuns(dt) {
    let ended = false;
    for (const run of [...this.runs]) {
      run.update(dt);
      if (!run.done) continue;
      run.cleanup();
      this.runs.splice(this.runs.indexOf(run), 1);
      ended = true;
      const resumeAt = this.clock + this.phase.gapMs;
      this.nextPickAt = Number.isFinite(this.nextPickAt) ? Math.max(this.nextPickAt, resumeAt) : resumeAt;
    }
    if (ended && this.runs.length === 0) this.restoreScale();
  }

  cancelRuns() {
    if (this.runs.length === 0) return;
    this.runs.forEach((run) => run.cleanup());
    this.runs = [];
    this.touchDamageOverride = null;
    this.contactSuppressed = false;
    this.hoverOverrideY = null;
    this.invulnerable.delete('guard');
    this.restoreScale();
  }

  // The wind-up / impact squash tweens all go through here so a new one
  // replaces the old one and restoreScale() can undo them without touching
  // unrelated tweens (respawn fade-in, death animation)
  tweenScale(config) {
    if (this.scaleTween) this.scaleTween.stop();
    this.scaleTween = this.scene.tweens.add({ targets: this.sprite, ...config });
    return this.scaleTween;
  }

  restoreScale() {
    if (this.scaleTween) {
      this.scaleTween.stop();
      this.scaleTween = null;
    }
    if (this.sprite.active) this.sprite.setScale(this.art.scale);
  }

  updateMovement() {
    this.updateHover();
    if (this.runs.some((run) => run.controlsMovement)) return;
    if (this.runs.length > 0 && !this.movesWhileAttacking) {
      this.sprite.setVelocityX(0);
      return;
    }
    this.patrol();
  }

  // ===== Phases =====

  checkPhase() {
    const index = selectPhase(this.hp / this.maxHp, this.phases);
    if (index > this.phaseIndex) this.startTransition(index);
  }

  // ~1s invulnerable roar: shake, flash and a banner so the change reads
  startTransition(index) {
    this.cancelRuns();
    this.phaseIndex = index;
    this.speedMult = speedMultFor(this.phase);
    this.transition = { elapsedMs: 0 };
    this.invulnerable.add('roar');
    this.sprite.setVelocity(0, 0);

    this.scene.cameras.main.shake(PHASE_TRANSITION.roarMs, PHASE_TRANSITION.shakeIntensity);
    if (this.phase.roarKey) this.scene.showBossWarning(this.phase.roarKey);
    this.tweenScale({
      scaleX: this.art.scale * 1.15,
      scaleY: this.art.scale * 1.15,
      duration: PHASE_TRANSITION.roarMs / 4,
      yoyo: true,
      repeat: 1,
    });
  }

  updateTransition(dt) {
    this.transition.elapsedMs += dt;
    // Alternate white / normal so the roar reads even on a still boss
    const flash = Math.floor(this.transition.elapsedMs / 100) % 2 === 0;
    this.setTintLayer('roar', flash ? 0xFFFFFF : null);
    this.sprite.setVelocityX(0);

    if (this.transition.elapsedMs < PHASE_TRANSITION.roarMs) return;
    this.transition = null;
    this.invulnerable.delete('roar');
    this.setTintLayer('roar', null);
    this.restoreScale();
    this.nextPickAt = this.clock + this.phase.gapMs;
  }

  // ===== Tint layers (guard / roar / the running patterns / enrage) =====

  setTintLayer(name, color) {
    if (color === null || color === undefined) delete this.tints[name];
    else this.tints[name] = color;
    this.refreshTint();
  }

  refreshTint() {
    if (this.flashing || !this.sprite.active || this.defeated) return;
    let color = null;
    for (const name of TINT_PRIORITY) {
      if (this.tints[name] !== undefined) { color = this.tints[name]; break; }
    }
    if (color === null) {
      const runKey = Object.keys(this.tints).find((name) => name.startsWith('run:'));
      if (runKey) color = this.tints[runKey];
    }
    if (color === null && this.phase.enrage) color = ENRAGE_TINT;
    if (color === null) this.sprite.clearTint();
    else this.sprite.setTint(color);
  }

  // ===== Damage =====

  isInvulnerable() {
    return this.invulnerable.size > 0;
  }

  // Player attack collision (same idiom as regular monsters)
  handleTakingDamage() {
    const player = this.scene.player;
    // A dead player's lingering hitbox must not land the killing blow
    if (!player.canHit(this)) return;

    const hitbox = player.attackHitbox;
    const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
      hitbox.getBounds(),
      bossCombatBounds(this)
    );
    if (!overlap) return;

    this.isHit = true;
    player.registerHit(this);
    const damage = player.attackDamage + Phaser.Math.Between(-3, 3);
    this.applyDamage(damage);

    this.scene.time.delayedCall(PLAYER.ATTACK_DURATION + 50, () => {
      this.isHit = false;
    });
  }

  // Damage from any player source (melee overlap, bark projectile)
  applyDamage(amount) {
    if (this.defeated || !this.sprite.active) return;

    // Guard stance / phase roar: the hit lands but does nothing
    if (this.isInvulnerable()) {
      if (this.clock - this.lastBlockedAt > 250) {
        this.lastBlockedAt = this.clock;
        this.floatText(t('float.guard'), '#AED6F1');
      }
      return;
    }

    this.hp -= amount;
    this.scene.showDamageNumber(
      this.sprite.x + Phaser.Math.Between(-20, 20),
      this.sprite.y - 40,
      amount,
      false
    );

    // Hit flash, then back to whatever tint the boss was wearing
    this.flashing = true;
    this.sprite.setTintFill(0xFFFFFF);
    this.scene.time.delayedCall(80, () => {
      this.flashing = false;
      this.refreshTint();
    });

    if (this.hp <= 0) this.die();
    else this.checkPhase();
  }

  touchDamage() {
    return this.touchDamageOverride !== null ? this.touchDamageOverride : this.cfg.touchDamage;
  }

  handleContactDamage(player) {
    if (this.defeated || this.contactCooldown || this.contactSuppressed || player.hp <= 0) return;
    const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
      player.getHurtBounds(),
      bossCombatBounds(this)
    );
    if (!overlap) return;

    this.contactCooldown = true;
    const dir = player.sprite.x < this.sprite.x ? -1 : 1;
    player.takeDamage(this.touchDamage(), dir);
    this.scene.time.delayedCall(1000, () => {
      this.contactCooldown = false;
    });
  }

  // Damage + optional status ({ status: 'stun' | 'slow', ms }) from a pattern
  hurtPlayer(amount, dir, onHit) {
    const player = this.scene.player;
    if (player.hp <= 0) return false;
    player.takeDamage(amount, dir);
    if (onHit && player.hp > 0) player.applyStatus(onHit.status, onHit.ms);
    return true;
  }

  // ===== Projectiles (owned by the boss so they outlive the pattern run) =====

  // entry: { sprite, damage, onHit, ttlMs, spinDegPerSec, pierce }
  addProjectile(entry) {
    this.projectiles.push({ hit: false, spinDegPerSec: 0, ...entry });
  }

  updateProjectiles(dt) {
    if (this.projectiles.length === 0) return;
    const player = this.scene.player;
    const mapW = this.scene.mapData.width;
    const mapH = this.scene.mapData.height;

    this.projectiles = this.projectiles.filter((shot) => {
      const sprite = shot.sprite;
      if (!sprite.active) return false;
      shot.ttlMs -= dt;
      if (shot.spinDegPerSec) sprite.angle += (shot.spinDegPerSec * dt) / 1000;

      const outside = sprite.x < -80 || sprite.x > mapW + 80 || sprite.y < -80 || sprite.y > mapH + 80;
      if (outside || shot.ttlMs <= 0) {
        this.destroyFx(sprite);
        return false;
      }

      if (!shot.hit && player.hp > 0) {
        const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
          sprite.getBounds(),
          player.getHurtBounds()
        );
        if (overlap) {
          shot.hit = true;
          const dir = sprite.body.velocity.x >= 0 ? 1 : -1;
          this.hurtPlayer(shot.damage, dir, shot.onHit);
          if (!shot.pierce) {
            this.destroyFx(sprite);
            return false;
          }
        }
      }
      return true;
    });
  }

  // ===== Minions =====

  aliveMinions() {
    this.minions = this.minions.filter((m) => !m.isDead && !m.isDying && m.sprite.active);
    return this.minions;
  }

  // ===== Visual helpers =====

  // Display objects made by patterns are tracked so any exit path can clear them
  track(object) {
    this.fx.add(object);
    return object;
  }

  destroyFx(object) {
    if (!object) return;
    this.fx.delete(object);
    if (object.scene) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }
  }

  // Small pattern name above the boss (the wind-up callout)
  showLabel(nameKey) {
    const top = bossCombatBounds(this).y;
    const label = this.track(this.scene.add.text(this.sprite.x, top - 18, t(nameKey), {
      ...pixelFont(14),
      color: '#FFE3A3',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.EFFECTS + 2));
    this.scene.tweens.add({
      targets: label,
      y: label.y - 22,
      alpha: 0,
      delay: 500,
      duration: 800,
      onComplete: () => this.destroyFx(label),
    });
    return label;
  }

  // Screen-fixed callout for the big attacks; the caller destroys it
  showBanner(nameKey) {
    return this.track(this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height * 0.25,
      t(nameKey),
      {
        ...pixelFont(26),
        color: '#FF7EB9',
        stroke: '#000000',
        strokeThickness: 5,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI + 7));
  }

  floatText(text, color) {
    const label = this.track(this.scene.add.text(this.sprite.x, this.sprite.y - 70, text, {
      ...pixelFont(14),
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(DEPTH.EFFECTS + 2));
    this.scene.tweens.add({
      targets: label,
      y: label.y - 26,
      alpha: 0,
      duration: 700,
      onComplete: () => this.destroyFx(label),
    });
  }

  // Shift wall-clock timers after the pause menu closes. Nothing here runs on
  // wall-clock time (the pattern clock is frame-delta driven), so nothing to do.
  shiftTimers() {}

  die() {
    if (this.defeated) return;
    this.defeated = true;

    this.cleanupEffects(true);
    this.sprite.clearTint();
    this.sprite.setVelocity(0, 0);
    this.sprite.body.enable = false;

    this.playDeathEffect();

    // Register the defeat immediately - if the player leaves the map during
    // the death tween (or the scene shuts down), the kill must still count
    this.scene.onBossDefeated(this.id);
  }

  // Subclass hook: shake + tween out
  playDeathEffect() {
    this.scene.cameras.main.shake(400, 0.01);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: this.art.scale * 0.1,
      scaleY: this.art.scale * 0.1,
      angle: 25,
      duration: 900,
      onComplete: () => {
        if (this.sprite.active) {
          this.sprite.setActive(false);
          this.sprite.setVisible(false);
        }
      },
    });
  }

  cleanupEffects(removeMinions = false) {
    this.cancelRuns();
    this.transition = null;
    this.invulnerable.clear();
    this.projectiles.forEach((shot) => this.destroyFx(shot.sprite));
    this.projectiles = [];
    [...this.fx].forEach((object) => this.destroyFx(object));
    if (removeMinions) this.scene.removeMinions(this);
    this.minions = [];
  }

  destroy() {
    this.cleanupEffects(false);
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }
}
