// src/systems/PatternExecutor.js
// Phaser side of the boss patterns: ONE run class per pattern `type`.
// A run is created when the brain picks a pattern and then lives through
//
//   telegraph  wind-up: red area / lines fade in, boss tints, name callout
//   (impact)   the hit lands (hitbox check, projectiles spawn, minions appear)
//   active     only for patterns with a duration (pull, dashSweep, guard)
//   recover    short pause, then `done`
//
// Runs never use wall-clock timers: PatternBoss feeds them frame deltas.
// Every display object a run makes is tracked on the boss so any exit path
// (phase change, death, scene shutdown) can clear it.

import Phaser from 'phaser';
import { bossCombatBounds } from './EntityArt.js';
import { planBurstSpots, summonCap } from './BossBrain.js';
import { DEPTH } from '../utils/constants.js';
import { TELEGRAPH_STYLE } from '../data/bossPatterns.js';

const { Rectangle } = Phaser.Geom;

// A floating boss drops to the floor lane in the second half of the wind-up,
// so a player standing right under it still has time to step away
const LOWER_AT = 0.5;
const overlaps = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);

// ===== Telegraph drawing =====

// Translucent fill that fades in as the wind-up progresses; the last quarter
// blinks ("it lands now")
function telegraphAlpha(progress) {
  const { minFillAlpha, maxFillAlpha } = TELEGRAPH_STYLE;
  const base = minFillAlpha + (maxFillAlpha - minFillAlpha) * progress;
  const blink = progress > 0.75 && Math.floor(progress * 24) % 2 === 0 ? 0.6 : 1;
  return base * blink;
}

function drawRect(g, rect, progress, color = TELEGRAPH_STYLE.color) {
  g.fillStyle(color, telegraphAlpha(progress));
  g.fillRect(rect.x, rect.y, rect.width, rect.height);
  g.lineStyle(2, color, 0.9);
  g.strokeRect(rect.x, rect.y, rect.width, rect.height);
}

function drawFloorEllipse(g, cx, y, width, progress, color = TELEGRAPH_STYLE.color) {
  g.fillStyle(color, telegraphAlpha(progress));
  g.fillEllipse(cx, y, width, 34);
  g.lineStyle(2, color, 0.9);
  g.strokeEllipse(cx, y, width, 34);
}

// ===== Base run =====

class PatternRun {
  constructor(boss, pattern) {
    this.boss = boss;
    this.scene = boss.scene;
    this.pattern = pattern;
    this.params = pattern.params || {};
    this.tintKey = `run:${pattern.id}`;
    this.stage = 'telegraph';
    this.stageMs = 0;
    this.recoverMs = 0;
    this.done = false;
    this.controlsMovement = false;
    this.owned = [];
  }

  get player() {
    return this.scene.player;
  }

  get mapWidth() {
    return this.scene.mapData.width;
  }

  begin() {
    this.boss.showLabel(this.pattern.nameKey);
    this.onTelegraphStart();
  }

  update(dt) {
    this.stageMs += dt;
    if (this.stage === 'telegraph') {
      const progress = Math.min(1, this.stageMs / Math.max(1, this.pattern.telegraphMs));
      this.onTelegraph(progress);
      if (progress >= 1) {
        this.clearTelegraph();
        this.stage = 'recover';
        this.stageMs = 0;
        this.recoverMs = 0;
        this.onImpact();
      }
    } else if (this.stage === 'active') {
      this.onActive(dt);
    } else if (this.stageMs >= this.recoverMs) {
      this.done = true;
    }
  }

  // Called from onImpact for patterns that keep going (pull, dash, guard)
  startActive() {
    this.stage = 'active';
    this.stageMs = 0;
  }

  finish(recoverMs = 0) {
    this.stage = 'recover';
    this.stageMs = 0;
    this.recoverMs = recoverMs;
  }

  // Idempotent: runs after a normal end AND when a phase change / death cancels the run
  cleanup() {
    this.done = true;
    this.onCleanup();
    this.boss.setTintLayer(this.tintKey, null);
    this.owned.forEach((object) => this.boss.destroyFx(object));
    this.owned = [];
  }

  graphics(depth = DEPTH.EFFECTS) {
    const g = this.boss.track(this.scene.add.graphics().setDepth(depth));
    this.owned.push(g);
    return g;
  }

  banner() {
    const text = this.boss.showBanner(this.pattern.nameKey);
    this.owned.push(text);
    return text;
  }

  // Throwaway effect (impact ring, flash): tracked until its tween ends
  effect(object, tweenConfig) {
    this.boss.track(object);
    this.scene.tweens.add({
      targets: object,
      ...tweenConfig,
      onComplete: () => this.boss.destroyFx(object),
    });
    return object;
  }

  awayFrom(x) {
    return this.player.sprite.x < x ? -1 : 1;
  }

  clearTelegraph() {
    if (this.g) this.g.clear();
  }

  // Hooks
  onTelegraphStart() {}
  onTelegraph() {}
  onImpact() {}
  onActive() {}
  onCleanup() {}
}

// ===== meleeSwipe: hitbox in front of the boss (step back or jump) =====

class MeleeSwipeRun extends PatternRun {
  onTelegraphStart() {
    const boss = this.boss;
    boss.faceTowards(this.player.sprite.x);
    this.dir = boss.facing();

    const { range, height } = this.params;
    const bounds = bossCombatBounds(boss);
    const x = this.dir > 0 ? bounds.right - 10 : bounds.x + 10 - range;
    this.zone = new Rectangle(x, boss.groundSurface() - height, range, height);
    this.g = this.graphics();

    boss.setTintLayer(this.tintKey, 0xFFD1DC);
    boss.tweenScale({
      scaleX: boss.art.scale * 1.1,
      duration: this.pattern.telegraphMs * 0.85,
      ease: 'Sine.easeInOut',
    });
  }

  onTelegraph(progress) {
    this.g.clear();
    drawRect(this.g, this.zone, progress);
  }

  onImpact() {
    const boss = this.boss;
    const { damage, onHit } = this.params;
    boss.tweenScale({ scaleX: boss.art.scale, duration: 120 });

    // The swinging arm
    const armKey = boss.armTextureKey;
    if (armKey && this.scene.textures.exists(armKey)) {
      const arm = this.scene.add.image(this.dir > 0 ? this.zone.x : this.zone.right, this.zone.y + this.zone.height / 2 + 6, armKey)
        .setOrigin(this.dir > 0 ? 0 : 1, 0.5)
        .setDepth(DEPTH.EFFECTS)
        .setFlipX(this.dir < 0);
      arm.setDisplaySize(this.zone.width, 50);
      const fullScaleX = arm.scaleX;
      arm.scaleX = fullScaleX * 0.3;
      this.effect(arm, { scaleX: fullScaleX, alpha: 0, duration: 260, ease: 'Quad.easeOut' });
    }
    this.scene.cameras.main.shake(140, 0.007);

    const player = this.player;
    if (player.hp > 0 && overlaps(player.getHurtBounds(), this.zone)) {
      boss.hurtPlayer(damage, this.dir, onHit);
    }
    this.finish(250);
  }
}

// ===== areaSlam: red ground zone(s) fade in at the player / random spots =====

class AreaSlamRun extends PatternRun {
  onTelegraphStart() {
    const boss = this.boss;
    const { width, hitHeight, count = 1, target = 'player', minGapPx = 90, spreadPx = 450 } = this.params;
    const surface = boss.groundSurface();
    const playerX = this.player.sprite.x;

    // Positions are locked now: the player reacts by moving out
    let centers = [playerX];
    if (count > 1 || target === 'random') {
      centers = planBurstSpots({
        playerX,
        count,
        width,
        minGapPx,
        minX: 80,
        maxX: this.mapWidth - 80,
        spreadPx,
        rng: boss.rng,
      });
    }
    this.surface = surface;
    this.zones = centers.map((cx) => new Rectangle(cx - width / 2, surface - hitHeight, width, hitHeight));
    this.g = this.graphics();

    boss.setTintLayer(this.tintKey, 0xFFC0A0);
    boss.tweenScale({
      scaleY: boss.art.scale * 1.06,
      duration: this.pattern.telegraphMs * 0.85,
      ease: 'Sine.easeInOut',
    });
  }

  onTelegraph(progress) {
    const g = this.g;
    g.clear();
    this.zones.forEach((zone) => {
      // Faint column shows how high the hit reaches, the floor ellipse is the zone
      g.fillStyle(TELEGRAPH_STYLE.color, telegraphAlpha(progress) * 0.5);
      g.fillRect(zone.x, zone.y, zone.width, zone.height);
      drawFloorEllipse(g, zone.x + zone.width / 2, this.surface, zone.width, progress);
    });
  }

  onImpact() {
    const boss = this.boss;
    const { damage, onHit } = this.params;

    boss.tweenScale({
      scaleY: boss.art.scale * 0.85,
      scaleX: boss.art.scale * 1.1,
      duration: 110,
      yoyo: true,
    });
    this.scene.cameras.main.shake(220, 0.012);

    const player = this.player;
    let struck = null;
    this.zones.forEach((zone) => {
      const cx = zone.x + zone.width / 2;
      // Expanding shockwave ring (drawn at local origin so scaling grows in place)
      const ring = this.scene.add.graphics({ x: cx, y: this.surface }).setDepth(DEPTH.EFFECTS);
      ring.lineStyle(4, TELEGRAPH_STYLE.color, 0.9);
      ring.strokeEllipse(0, 0, 60, 18);
      this.effect(ring, { scaleX: zone.width / 60, scaleY: zone.width / 60, alpha: 0, duration: 350 });

      if (!struck && player.hp > 0 && overlaps(player.getHurtBounds(), zone)) struck = cx;
    });
    if (struck !== null) boss.hurtPlayer(damage, this.awayFrom(struck), onHit);
    this.finish(300);
  }
}

// ===== projectile: 1-N straight or spread shots =====

class ProjectileRun extends PatternRun {
  onTelegraphStart() {
    const boss = this.boss;
    const { origin = 'boss', count = 1, spreadDeg = 0, laneHeight = 60 } = this.params;
    const player = this.player;
    this.g = this.graphics();

    if (origin === 'edge') {
      // A horizontal sweep from one map edge along the floor (jump over it)
      const fromLeft = boss.rng() < 0.5;
      const surface = boss.groundSurface();
      this.lane = new Rectangle(0, surface - laneHeight, this.mapWidth, laneHeight);
      this.shots = [{
        x: fromLeft ? 40 : this.mapWidth - 40,
        y: surface - laneHeight / 2,
        angle: fromLeft ? 0 : Math.PI,
      }];
    } else {
      // The angles are locked at the start of the wind-up (move off the line
      // to dodge); the lines start wherever the boss drifts to
      const origin = this.origin();
      const base = Phaser.Math.Angle.Between(origin.x, origin.y, player.sprite.x, player.sprite.y);
      const step = Phaser.Math.DegToRad(spreadDeg);
      this.lane = null;
      this.shots = [];
      for (let i = 0; i < count; i += 1) {
        this.shots.push({ x: origin.x, y: origin.y, angle: base + (i - (count - 1) / 2) * step });
      }
    }

    boss.setTintLayer(this.tintKey, 0xFFD8A8);
    boss.tweenScale({
      scaleX: boss.art.scale * 1.08,
      scaleY: boss.art.scale * 0.94,
      duration: this.pattern.telegraphMs * 0.85,
      ease: 'Sine.easeInOut',
    });
  }

  // Where shots leave the boss
  origin() {
    return { x: this.boss.sprite.x, y: this.boss.sprite.y + 20 };
  }

  onTelegraph(progress) {
    const g = this.g;
    g.clear();
    if (this.lane) {
      drawRect(g, this.lane, progress);
      return;
    }
    // The boss may drift during the wind-up: the lines (and the shots that
    // follow them) start from where it is now
    const origin = this.origin();
    this.shots.forEach((shot) => { shot.x = origin.x; shot.y = origin.y; });
    g.lineStyle(3, TELEGRAPH_STYLE.color, 0.2 + 0.6 * progress);
    this.shots.forEach((shot) => {
      g.lineBetween(shot.x, shot.y, shot.x + Math.cos(shot.angle) * 520, shot.y + Math.sin(shot.angle) * 520);
    });
  }

  onImpact() {
    const boss = this.boss;
    const { speed, damage, onHit, texture, lifespanMs = 20000 } = this.params;
    const edge = this.params.origin === 'edge';
    boss.tweenScale({ scaleX: boss.art.scale, scaleY: boss.art.scale, duration: 120 });

    this.shots.forEach((shot) => {
      const sprite = this.scene.physics.add.sprite(shot.x, shot.y, texture);
      sprite.setDepth(DEPTH.EFFECTS);
      sprite.body.setAllowGravity(false);
      const v = speed * boss.speedMult;
      sprite.setVelocity(Math.cos(shot.angle) * v, Math.sin(shot.angle) * v);
      if (edge) sprite.setFlipX(Math.cos(shot.angle) < 0);
      boss.track(sprite);
      boss.addProjectile({
        sprite,
        damage,
        onHit,
        ttlMs: lifespanMs,
        pierce: edge, // the arm sweeps through; it only hits once
        spinDegPerSec: edge ? 0 : 300,
      });
    });
    this.finish(200);
  }
}

// ===== dashSweep: the boss charges across the floor (jump over it) =====

class DashSweepRun extends PatternRun {
  onTelegraphStart() {
    const boss = this.boss;
    const { lowProfile = 1 } = this.params;
    const player = this.player;
    const surface = boss.groundSurface();
    const margin = 90;

    this.controlsMovement = true;
    this.dir = Math.sign(player.sprite.x - boss.sprite.x) || (boss.sprite.x < this.mapWidth / 2 ? 1 : -1);
    this.endX = this.dir > 0 ? this.mapWidth - margin : margin;
    this.hit = false;
    boss.faceTowards(this.endX);

    // A flattened body is low enough to jump over; it keeps its full width
    const height = boss.cfg.height * lowProfile;
    this.lane = new Rectangle(
      Math.min(boss.sprite.x, this.endX),
      surface - height,
      Math.abs(this.endX - boss.sprite.x),
      height
    );
    this.laneY = surface - height / 2;
    this.g = this.graphics();

    boss.setTintLayer(this.tintKey, 0xFF9C9C);
    boss.tweenScale({
      scaleX: boss.art.scale * 1.1,
      scaleY: boss.art.scale * lowProfile,
      duration: this.pattern.telegraphMs * 0.7,
      ease: 'Sine.easeInOut',
    });
  }

  onTelegraph(progress) {
    const boss = this.boss;
    boss.sprite.setVelocityX(0);
    if (boss.floating && progress >= LOWER_AT) boss.hoverOverrideY = this.laneY;
    this.g.clear();
    drawRect(this.g, this.lane, progress);
  }

  onImpact() {
    // The dash replaces the generic touch damage so it cannot double-hit
    this.boss.contactSuppressed = true;
    this.startActive();
  }

  onActive() {
    const boss = this.boss;
    const { speed, damage, onHit } = this.params;
    const sprite = boss.sprite;
    sprite.setVelocityX(this.dir * speed * boss.speedMult);

    const player = this.player;
    if (!this.hit && player.hp > 0 && overlaps(player.getHurtBounds(), bossCombatBounds(boss))) {
      this.hit = true;
      boss.hurtPlayer(damage, this.dir, onHit);
    }

    const arrived = this.dir > 0 ? sprite.x >= this.endX : sprite.x <= this.endX;
    const blocked = sprite.body.blocked.left || sprite.body.blocked.right;
    // Safety net: a boss that somehow cannot get across must not charge forever
    const tooLong = this.stageMs > (this.mapWidth / (speed * boss.speedMult)) * 1000 + 1500;
    if (arrived || blocked || tooLong) {
      sprite.setVelocityX(0);
      this.onCleanup();
      boss.tweenScale({ scaleX: boss.art.scale, scaleY: boss.art.scale, duration: 250 });
      boss.faceTowards(player.sprite.x);
      this.finish(300);
    }
  }

  onCleanup() {
    this.boss.contactSuppressed = false;
    this.boss.hoverOverrideY = null;
  }
}

// ===== fieldWide: hits everyone on the ground (airborne or safe zone) =====

class FieldWideRun extends PatternRun {
  onTelegraphStart() {
    const boss = this.boss;
    const { safeRadius } = this.params;
    const surface = boss.groundSurface();
    this.surface = surface;

    // The safe zone spawns within sprint range of the player: tense, but
    // always reachable inside the telegraph window
    this.safeX = null;
    if (safeRadius) {
      this.safeX = Phaser.Math.Clamp(
        this.player.sprite.x + Phaser.Math.Between(-350, 350),
        200,
        this.mapWidth - 200
      );
    }
    this.floor = new Rectangle(0, surface - 26, this.mapWidth, 26);
    this.g = this.graphics();
    this.banner();

    boss.setTintLayer(this.tintKey, 0xFFB6C1);
  }

  onTelegraph(progress) {
    const g = this.g;
    g.clear();
    drawRect(g, this.floor, progress);
    if (this.safeX !== null) {
      const { safeRadius } = this.params;
      const pulse = 0.3 + 0.1 * Math.sin(this.stageMs / 80);
      g.fillStyle(TELEGRAPH_STYLE.safeColor, pulse);
      g.fillEllipse(this.safeX, this.surface, safeRadius * 2, 40);
      g.lineStyle(3, TELEGRAPH_STYLE.safeColor, 0.9);
      g.strokeEllipse(this.safeX, this.surface, safeRadius * 2, 40);
    }
  }

  onImpact() {
    const boss = this.boss;
    const { damage, onHit, safeRadius, airborne } = this.params;

    // Full-field pink flash
    const flash = this.scene.add.graphics().setDepth(DEPTH.UI + 5).setScrollFactor(0);
    flash.fillStyle(0xFF7EB9, 0.55);
    flash.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    this.effect(flash, { alpha: 0, duration: 500 });
    this.scene.cameras.main.shake(320, 0.02);

    const p = this.player;
    if (p.hp > 0) {
      const body = p.sprite.body;
      const grounded = !p.isClimbing && (body.blocked.down || body.touching.down);
      const inSafeZone = this.safeX !== null && Math.abs(p.sprite.x - this.safeX) <= safeRadius;
      const dodged = inSafeZone || (airborne && !grounded);
      if (!dodged) boss.hurtPlayer(damage, p.sprite.x < boss.sprite.x ? -1 : 1, onHit);
    }
    this.finish(300);
  }
}

// ===== pull: sustained pull toward the boss (walk against it) =====

class PullRun extends PatternRun {
  onTelegraphStart() {
    const boss = this.boss;
    const { lowerBody, hold } = this.params;
    // `hold`: the boss stops drifting while it inhales, so the distance the
    // player keeps by walking against the pull is the distance that counts
    this.controlsMovement = !!hold;
    this.streakAt = 0;
    this.g = this.graphics();
    if (this.params.banner) this.banner();

    // The heavy version drops to floor level: standing under it is the danger
    this.laneY = lowerBody && boss.floating ? boss.groundSurface() - boss.cfg.height / 2 : null;
    boss.setTintLayer(this.tintKey, 0x9BD9FF);
  }

  onTelegraph(progress) {
    // Rings closing in on the nozzle: it is about to inhale
    const boss = this.boss;
    if (this.laneY !== null && progress >= LOWER_AT) boss.hoverOverrideY = this.laneY;
    if (this.controlsMovement) boss.sprite.setVelocityX(0);
    this.g.clear();
    this.g.lineStyle(3, 0x9BD9FF, 0.3 + 0.5 * progress);
    this.g.strokeCircle(boss.sprite.x, boss.sprite.y, 260 - 190 * progress);
    this.g.strokeCircle(boss.sprite.x, boss.sprite.y, 130 - 60 * progress);
  }

  onImpact() {
    const { touchDamage } = this.params;
    if (touchDamage !== undefined) this.boss.touchDamageOverride = touchDamage;
    this.startActive();
  }

  onActive(dt) {
    const boss = this.boss;
    const { durationMs, pull } = this.params;
    const player = this.player;
    if (this.controlsMovement) boss.sprite.setVelocityX(0);

    // Runs after Player.update, so this offsets the input velocity: running
    // away crawls, standing still gets dragged
    if (player.hp > 0 && !player.isKnockedBack && !player.isClimbing) {
      const dir = Math.sign(boss.sprite.x - player.sprite.x);
      if (dir !== 0) player.sprite.setVelocityX(player.sprite.body.velocity.x + pull * dir);
    }

    // Air streaks rushing into the nozzle
    this.streakAt -= dt;
    if (this.streakAt <= 0) {
      this.streakAt = 130;
      this.spawnStreak();
    }

    if (this.stageMs >= durationMs) {
      this.onCleanup();
      this.finish(300);
    }
  }

  spawnStreak() {
    const boss = this.boss;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(180, 320);
    const sx = boss.sprite.x + Math.cos(angle) * dist;
    const sy = boss.sprite.y + Math.sin(angle) * dist * 0.6;
    const streak = this.scene.add.rectangle(sx, sy, 14, 3, 0xFFFFFF, 0.7).setDepth(DEPTH.EFFECTS);
    streak.setRotation(Phaser.Math.Angle.Between(sx, sy, boss.sprite.x, boss.sprite.y));
    this.effect(streak, { x: boss.sprite.x, y: boss.sprite.y, alpha: 0, duration: 300 });
  }

  onCleanup() {
    this.boss.touchDamageOverride = null;
    if (this.params.lowerBody) this.boss.hoverOverrideY = null;
  }
}

// ===== summon: spawns existing monster types near the boss (capped) =====

class SummonRun extends PatternRun {
  onTelegraphStart() {
    const boss = this.boss;
    const { monster, count } = this.params;
    this.cap = summonCap(this.pattern);
    const free = this.cap - boss.aliveMinions().length;
    const n = Math.min(count, free);
    if (n <= 0) {
      this.done = true;
      return;
    }

    const surface = boss.groundSurface();
    const firstSide = boss.rng() < 0.5 ? -1 : 1;
    this.spots = [];
    for (let i = 0; i < n; i += 1) {
      const side = i % 2 === 0 ? firstSide : -firstSide;
      const offset = 110 + 55 * Math.floor(i / 2);
      const x = Phaser.Math.Clamp(boss.sprite.x + side * offset, 70, this.mapWidth - 70);
      this.spots.push({ x, groundY: surface - 40, airY: boss.sprite.y - 70 });
    }
    this.monster = monster;
    this.g = this.graphics();
    boss.setTintLayer(this.tintKey, 0xD7BDE2);
    boss.tweenScale({
      scaleY: boss.art.scale * 1.08,
      duration: this.pattern.telegraphMs * 0.85,
      ease: 'Sine.easeInOut',
    });
  }

  onTelegraph(progress) {
    if (!this.spots) return;
    // Shrinking rings mark where the helpers will appear (not a damage zone,
    // so purple instead of red)
    this.g.clear();
    this.g.lineStyle(3, 0xA569BD, 0.4 + 0.5 * progress);
    this.spots.forEach((spot) => {
      this.g.strokeCircle(spot.x, spot.groundY, 46 - 24 * progress);
    });
  }

  onImpact() {
    if (!this.spots) return;
    const boss = this.boss;
    const free = this.cap - boss.aliveMinions().length;
    this.spots.slice(0, Math.max(0, free)).forEach((spot) => {
      const minion = this.scene.spawnMinion(this.monster, spot.x, spot, boss);
      if (minion) boss.minions.push(minion);
      const puff = this.scene.add.circle(spot.x, spot.groundY, 14, 0xD7BDE2, 0.7).setDepth(DEPTH.EFFECTS);
      this.effect(puff, { scale: 3, alpha: 0, duration: 400 });
    });
    boss.tweenScale({ scaleY: boss.art.scale, duration: 150 });
    this.finish(300);
  }
}

// ===== guard: no damage for a while (wait it out) =====

class GuardRun extends PatternRun {
  onTelegraphStart() {
    const boss = this.boss;
    this.g = this.graphics();
    boss.setTintLayer(this.tintKey, 0xB8D4EA);
    boss.tweenScale({
      scaleX: boss.art.scale * 1.08,
      scaleY: boss.art.scale * 0.92,
      duration: this.pattern.telegraphMs * 0.85,
      ease: 'Sine.easeInOut',
    });
  }

  onTelegraph(progress) {
    this.drawShield(progress * 0.6, 0.3 + 0.5 * progress);
  }

  onImpact() {
    const boss = this.boss;
    boss.invulnerable.add('guard');
    boss.setTintLayer('guard', 0x7FB3D5);
    boss.tweenScale({ scaleX: boss.art.scale, scaleY: boss.art.scale, duration: 150 });
    this.startActive();
  }

  onActive() {
    const { durationMs } = this.params;
    const pulse = 0.75 + 0.25 * Math.sin(this.stageMs / 120);
    this.drawShield(1, pulse);
    if (this.stageMs >= durationMs) {
      this.onCleanup();
      this.finish(200);
    }
  }

  // Shield icon above the boss head: a rounded badge that follows the boss
  drawShield(scale, alpha) {
    const boss = this.boss;
    const g = this.g;
    const x = boss.sprite.x;
    const y = bossCombatBounds(boss).y - 56;
    const w = 22 * scale;
    const h = 26 * scale;
    g.clear();
    g.fillStyle(0x5DADE2, 0.85 * alpha);
    g.fillRect(x - w, y - h, w * 2, h * 1.3);
    g.fillTriangle(x - w, y + h * 0.3, x + w, y + h * 0.3, x, y + h * 1.1);
    g.lineStyle(3, 0xFFFFFF, alpha);
    g.strokeRect(x - w, y - h, w * 2, h * 1.3);
    g.lineBetween(x, y - h, x, y + h * 0.9);
  }

  onCleanup() {
    this.boss.invulnerable.delete('guard');
    this.boss.setTintLayer('guard', null);
    if (this.g) this.g.clear();
  }
}

const RUNS = {
  meleeSwipe: MeleeSwipeRun,
  areaSlam: AreaSlamRun,
  projectile: ProjectileRun,
  dashSweep: DashSweepRun,
  fieldWide: FieldWideRun,
  pull: PullRun,
  summon: SummonRun,
  guard: GuardRun,
};

export function createRun(boss, pattern) {
  const Run = RUNS[pattern.type];
  return Run ? new Run(boss, pattern) : null;
}
