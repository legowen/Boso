// src/entities/Player.js
// Player character class

import Phaser from 'phaser';
import { PLAYER, DEPTH, DAMAGE_TEXT, ROPE } from '../utils/constants.js';
import SaveManager from '../systems/SaveManager.js';
import { ITEMS } from '../data/items.js';
import { getCharacter, LEVEL_GROWTH, COMBO_MULTIPLIERS, COMBO_RESET_MS, CAT_FRAME_SIZE, CAT_DISPLAY_SCALE, CAT_FOOT_Y, CAT_FEET_OFFSET } from '../data/characters.js';

// Slow natural MP regeneration
const MP_REGEN_AMOUNT = 2;
const MP_REGEN_INTERVAL_MS = 2000;

export default class Player {
  constructor(scene, x, y, characterData) {
    this.scene = scene;
    this.characterData = getCharacter(characterData?.id);

    // Create player sprite with character-specific appearance
    this.createTexture();
    this.sprite = scene.physics.add.sprite(x, y, this.textureKey);
    this.sprite.setDepth(DEPTH.PLAYER);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0).setScale(CAT_DISPLAY_SCALE);
    this.sprite.setOrigin(0.5, (CAT_FOOT_Y - CAT_FEET_OFFSET / CAT_DISPLAY_SCALE) / CAT_FRAME_SIZE);
    this.isCrouching = false;
    this.setCrouching(false);

    // Level, EXP, treats, items, quests (persisted per character id)
    this.charId = this.characterData ? this.characterData.id : 'default';
    const progress = SaveManager.getCharacter(this.charId)
      || { level: 1, exp: 0, treats: 0, items: {}, quests: {} };
    this.level = progress.level;
    this.exp = progress.exp;
    this.treats = progress.treats;
    this.items = progress.items;
    this.quests = progress.quests;
    this.nextMpRegenAt = Date.now() + MP_REGEN_INTERVAL_MS;

    // Stats = base character stats + per-level growth
    const stats = this.characterData ? this.characterData.stats : null;
    const growth = this.level - 1;
    this.maxHp = (stats ? stats.hp : PLAYER.MAX_HP) + growth * LEVEL_GROWTH.hp;
    this.hp = this.maxHp;
    this.maxMp = (stats ? stats.mp : PLAYER.MAX_MP) + growth * LEVEL_GROWTH.mp;
    this.mp = this.maxMp;
    this.attackPower = (stats ? stats.atk : PLAYER.BASE_ATTACK) + growth * LEVEL_GROWTH.atk;
    this.moveSpeed = stats ? stats.spd : PLAYER.SPEED;
    this.jumpPower = (stats && stats.jumpPower) ? stats.jumpPower : PLAYER.JUMP_VELOCITY;

    // State
    this.isAttacking = false;
    this.canAttack = true;
    this.facingRight = true;
    this.isDroppingThrough = false;
    this.isClimbing = false;
    this.currentRope = null;
    this.isKnockedBack = false;

    // Attack hitbox
    this.attackHitbox = null;
    this.attackEffect = null;
    this.comboStep = -1;
    this.lastAttackAt = -Infinity;
    this.hitTargets = new Set();
    this.combat = this.characterData.combat;
  }

  createTexture() {
    this.textureKey = `cat_${this.characterData.id}`;
  }

  setCrouching(crouching) {
    this.isCrouching = crouching;
    const scale = CAT_DISPLAY_SCALE;
    const width = (PLAYER.WIDTH - 8) / scale;
    const height = (crouching ? 28 : PLAYER.HEIGHT) / scale;
    this.sprite.body.setSize(width, height, false);
    this.sprite.body.setOffset((CAT_FRAME_SIZE - width) / 2, CAT_FOOT_Y - height);
  }

  getHurtBounds() {
    const body = this.sprite.body;
    return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
  }

  canHit(target) {
    return !!this.attackHitbox && this.hp > 0 && !this.hitTargets.has(target);
  }

  registerHit(target) {
    this.hitTargets.add(target);
    if (this.scene.textures.exists('fx_hit')) {
      const sprite = target.sprite || target;
      const spark = this.scene.add.image(sprite.x, sprite.y, 'fx_hit').setDepth(DEPTH.EFFECTS + 1);
      this.scene.tweens.add({ targets: spark, alpha: 0, scale: 1.4, duration: 180, onComplete: () => spark.destroy() });
    }
  }

  getAttackBounds() {
    return this.attackHitbox?.getBounds() || new Phaser.Geom.Rectangle(0, 0, 0, 0);
  }

  updateAnimation() {
    if (!this.scene.anims.exists(`${this.charId}_idle`)) return;
    const grounded = this.sprite.body.blocked.down || this.sprite.body.touching.down;
    let state = 'idle';
    if (this.isKnockedBack || this.hp <= 0) state = 'hurt';
    else if (this.isAttacking) state = `attack${this.comboStep + 1}`;
    else if (this.isClimbing) state = 'climb';
    else if (!grounded) state = this.sprite.body.velocity.y < 0 ? 'jump' : 'fall';
    else if (this.isCrouching) state = 'crouch';
    else if (Math.abs(this.sprite.body.velocity.x) > 10) state = 'run';
    this.sprite.play(`${this.charId}_${state}`, true);
    if (state === 'climb' && Math.abs(this.sprite.body.velocity.y) < 1) this.sprite.anims.pause();
    else if (this.sprite.anims.isPaused) this.sprite.anims.resume();
  }

  update(cursors, keys) {
    if (!this.sprite.active) return;
    // Dead: no input or attacks during the death delay
    if (this.hp <= 0) return;

    this.handleMovement(cursors, keys);
    this.handleAttack(keys);
    this.updateAttackEffect();
    this.updateAnimation();

    // Natural MP regeneration
    const now = Date.now();
    if (now > this.nextMpRegenAt) {
      this.mp = Math.min(this.maxMp, this.mp + MP_REGEN_AMOUNT);
      this.nextMpRegenAt = now + MP_REGEN_INTERVAL_MS;
    }
  }

  handleMovement(cursors, keys) {
    // === Knockback state ===
    if (this.isKnockedBack) return;

    // === Climbing state ===
    if (this.isClimbing) {
      this.handleClimbing(cursors, keys);
      return;
    }

    const onGround = this.sprite.body.blocked.down || this.sprite.body.touching.down;

    const crouching = cursors.down.isDown && onGround && !this.isDroppingThrough;
    if (crouching !== this.isCrouching) this.setCrouching(crouching);
    const speed = this.isAttacking ? this.moveSpeed * 0.4 : this.moveSpeed;
    // Crouching is stationary; DOWN + ALT and ropes remain available.
    if (crouching) this.sprite.setVelocityX(0);
    // Left/right movement
    if (!crouching && cursors.left.isDown) {
      this.sprite.setVelocityX(-speed);
      this.facingRight = false;
      this.sprite.setFlipX(true);
    } else if (!crouching && cursors.right.isDown) {
      this.sprite.setVelocityX(speed);
      this.facingRight = true;
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    if (this.isAttacking) this.sprite.setFlipX(this.attackDirection < 0);
    // Jump (ALT key, but not when pressing DOWN)
    if (keys.alt.isDown && !cursors.down.isDown && onGround && !this.isDroppingThrough) {
      this.sprite.setVelocityY(this.jumpPower);
    }

    // Grab rope (UP arrow when near a rope)
    if (cursors.up.isDown && !onGround) {
      this.tryGrabRope();
    }
    // Also allow grabbing from ground
    if (cursors.up.isDown && onGround) {
      this.tryGrabRope();
    }

    // Down arrow: grab rope if nearby
    if (cursors.down.isDown && onGround && !this.isDroppingThrough) {
      if (this.tryGrabRopeDown()) {
        return;
      }
    }

    // Drop through platform requires DOWN + ALT together
    if (cursors.down.isDown && keys.alt.isDown && onGround && !this.isDroppingThrough) {
      this.dropThrough();
    }
  }

  handleClimbing(cursors, keys) {
    // Climb up
    if (cursors.up.isDown) {
      this.sprite.body.checkCollision.down = false;
      this.sprite.body.checkCollision.up = false;
      this.sprite.setVelocityY(-ROPE.CLIMB_SPEED);
    }
    // Climb down
    else if (cursors.down.isDown) {
      this.sprite.body.checkCollision.down = false;
      this.sprite.body.checkCollision.up = false;
      this.sprite.setVelocityY(ROPE.CLIMB_SPEED);
    }
    // Idle on rope - re-enable collision so player stands on platform
    else {
      this.sprite.body.checkCollision.down = true;
      this.sprite.body.checkCollision.up = true;
      this.sprite.setVelocityY(0);
    }

    // Keep player snapped to rope center
    this.sprite.x = this.currentRope.x;
    this.sprite.setVelocityX(0);

    // Auto-release at top of rope - land on platform above
    if (this.currentRope && this.sprite.y <= this.currentRope.topY + PLAYER.HEIGHT / 2) {
      this.sprite.y = this.currentRope.topY - PLAYER.HEIGHT / 2 + 8;
      this.releaseRope();
      return;
    }

    // Auto-release at bottom of rope
    if (this.currentRope && this.sprite.y >= this.currentRope.bottomY - PLAYER.HEIGHT / 2) {
      this.sprite.y = this.currentRope.bottomY - PLAYER.HEIGHT / 2;
      this.releaseRope();
      return;
    }

    // Jump off rope (ALT key required)
    if (keys.alt.isDown) {
      this.releaseRope();
      if (cursors.left.isDown) {
        this.sprite.setVelocityX(-this.moveSpeed);
        this.facingRight = false;
        this.sprite.setFlipX(true);
      } else if (cursors.right.isDown) {
        this.sprite.setVelocityX(this.moveSpeed);
        this.facingRight = true;
        this.sprite.setFlipX(false);
      }
      this.sprite.setVelocityY(this.jumpPower * 0.7);
      return;
    }

  }

  tryGrabRope() {
    if (!this.scene.ropes || this.isClimbing) return;

    for (const rope of this.scene.ropes) {
      const horizontalDist = Math.abs(this.sprite.x - rope.x);
      const withinVertical = this.sprite.y >= rope.topY && this.sprite.y <= rope.bottomY;

      if (horizontalDist < ROPE.GRAB_RANGE && withinVertical) {
        this.grabRope(rope);
        break;
      }
    }
  }

  tryGrabRopeDown() {
    if (!this.scene.ropes || this.isClimbing) return false;

    for (const rope of this.scene.ropes) {
      const horizontalDist = Math.abs(this.sprite.x - rope.x);
      // Player must be near rope top (standing on the platform above the rope)
      const nearRopeTop = Math.abs(this.sprite.y - rope.topY) < PLAYER.HEIGHT;

      if (horizontalDist < ROPE.GRAB_RANGE && nearRopeTop) {
        // Place player slightly below rope top so auto-release doesn't trigger
        this.sprite.y = rope.topY + PLAYER.HEIGHT / 2 + 10;
        this.grabRope(rope);
        return true;
      }
    }
    return false;
  }

  grabRope(rope) {
    this.clearAttack();
    this.setCrouching(false);
    this.isClimbing = true;
    this.currentRope = rope;

    // Disable gravity while climbing
    this.sprite.body.setAllowGravity(false);
    this.sprite.setVelocity(0, 0);

    // Snap to rope center
    this.sprite.x = rope.x;
  }

  releaseRope() {
    this.isClimbing = false;
    this.currentRope = null;

    // Re-enable gravity
    this.sprite.body.setAllowGravity(true);

    // Re-enable platform collision
    this.sprite.body.checkCollision.down = true;
    this.sprite.body.checkCollision.up = true;
  }

  dropThrough() {
    // Don't drop through the ground
    if (this.scene.groundPlatform) {
      const groundTop = this.scene.groundPlatform.y - this.scene.groundPlatform.height / 2;
      if (this.sprite.body.bottom >= groundTop - 5) {
        return;
      }
    }

    this.isDroppingThrough = true;
    this.sprite.body.checkCollision.down = false;

    this.scene.time.delayedCall(300, () => {
      if (this.sprite.active) {
        this.sprite.body.checkCollision.down = true;
        this.isDroppingThrough = false;
      }
    });
  }

  handleAttack(keys) {
    if (keys.ctrl.isDown && this.canAttack && !this.isAttacking && !this.isClimbing && !this.isKnockedBack) {
      this.performAttack();
    }
  }

  performAttack() {
    if (this.hp <= 0 || this.isClimbing || this.isKnockedBack || !this.canAttack) return;
    const now = this.scene.time.now;
    this.comboStep = now - this.lastAttackAt < COMBO_RESET_MS ? (this.comboStep + 1) % 3 : 0;
    this.lastAttackAt = now;
    this.isAttacking = true;
    this.canAttack = false;
    this.attackDirection = this.facingRight ? 1 : -1;
    this.attackDamage = Math.round(this.attackPower * COMBO_MULTIPLIERS[this.comboStep]);
    this.hitTargets.clear();
    const cfg = this.combat;
    this.attackHitbox = this.scene.add.zone(this.sprite.x, this.sprite.y, cfg.width, cfg.height);
    this.attackEffect = this.scene.add.image(this.sprite.x, this.sprite.y, cfg.effect)
      .setDepth(DEPTH.EFFECTS).setFlipX(this.attackDirection < 0);
    this.attackEffect.setDisplaySize(cfg.width * (1 + this.comboStep * 0.13), cfg.height * (1 + this.comboStep * 0.1));
    this.updateAttackEffect();
    if (this.comboStep === 2) {
      this.showFloatingText('3 HIT!', this.charId === 'seoli' ? '#8DE5D3' : '#FFD08E');
    }
    this.scene.time.delayedCall(cfg.duration, () => this.clearAttack());
    this.scene.time.delayedCall(cfg.cooldown + (this.comboStep === 2 ? 70 : 0), () => {
      this.canAttack = true;
    });
  }

  updateAttackEffect() {
    if (!this.attackHitbox) return;
    const progress = Phaser.Math.Clamp((this.scene.time.now - this.lastAttackAt) / this.combat.duration, 0, 1);
    // Seoli's wind claw travels outwards; Bomi's heavy paw stays close.
    const reach = this.charId === 'seoli' ? 28 + progress * (this.combat.reach - 28) : this.combat.reach;
    const x = this.sprite.x + this.attackDirection * reach;
    const y = this.sprite.y + (this.isCrouching ? 14 : 0);
    this.attackHitbox.setPosition(x, y);
    this.attackEffect?.setPosition(x, y).setAlpha(1 - progress * 0.65);
  }

  clearAttack() {
    this.attackHitbox?.destroy();
    this.attackEffect?.destroy();
    this.attackHitbox = null;
    this.attackEffect = null;
    this.isAttacking = false;
  }

  // EXP needed to advance from the current level
  expToNext() {
    return 30 + this.level * 25;
  }

  persistProgress() {
    SaveManager.setCharacter(this.charId, {
      level: this.level,
      exp: this.exp,
      treats: this.treats,
      items: this.items,
      quests: this.quests,
    });
  }

  gainExp(amount) {
    if (!amount || amount <= 0) return;
    this.exp += amount;
    while (this.exp >= this.expToNext()) {
      this.exp -= this.expToNext();
      this.levelUp();
    }
    this.persistProgress();
  }

  gainTreats(amount) {
    if (!amount || amount <= 0) return;
    this.treats += amount;
    this.persistProgress();
  }

  addItem(key, count = 1) {
    if (!ITEMS[key] || count <= 0) return;
    this.items[key] = (this.items[key] || 0) + count;
    this.persistProgress();
  }

  // Use a consumable by key; returns true if consumed
  useItem(key) {
    const def = ITEMS[key];
    if (!def || !(this.items[key] > 0) || this.hp <= 0) return false;

    if (def.heal) {
      if (this.hp >= this.maxHp) return false; // don't waste it
      this.hp = Math.min(this.maxHp, this.hp + def.heal);
      this.showFloatingText(`+${def.heal} HP`, '#2ECC71');
    } else if (def.mana) {
      if (this.mp >= this.maxMp) return false;
      this.mp = Math.min(this.maxMp, this.mp + def.mana);
      this.showFloatingText(`+${def.mana} MP`, '#3498DB');
    }

    this.items[key] -= 1;
    this.persistProgress();
    return true;
  }

  levelUp() {
    this.level += 1;
    this.maxHp += LEVEL_GROWTH.hp;
    this.maxMp += LEVEL_GROWTH.mp;
    this.attackPower += LEVEL_GROWTH.atk;
    // Full heal on level up (MapleStory tradition)
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    this.showFloatingText('LEVEL UP!', '#F1C40F');

    // Golden burst effect
    const burst = this.scene.add.graphics({ x: this.sprite.x, y: this.sprite.y });
    burst.setDepth(DEPTH.EFFECTS);
    burst.lineStyle(4, 0xF1C40F, 0.9);
    burst.strokeCircle(0, 0, 20);
    this.scene.tweens.add({
      targets: burst,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 500,
      onComplete: () => burst.destroy(),
    });
  }

  takeDamage(amount, knockbackDirection) {
    // Already dead - no further damage, knockback, or repeated die() calls
    if (this.hp <= 0) return;

    this.clearAttack();
    this.setCrouching(false);
    this.hp = Math.max(0, this.hp - amount);

    // Knockback: push player away from damage source
    if (knockbackDirection) {
      // Getting hit knocks the player off a rope (gravity must come back on)
      if (this.isClimbing) {
        this.releaseRope();
      }
      this.isKnockedBack = true;
      this.sprite.setVelocityX(200 * knockbackDirection);
      this.sprite.setVelocityY(-150);
      this.scene.time.delayedCall(300, () => {
        this.isKnockedBack = false;
      });
    }

    // Hit flash effect (blinking)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.clearAttack();
    this.updateAnimation();
    this.sprite.setTint(0x555555);
    this.sprite.setVelocity(0, 0);
    this.sprite.body.enable = false;

    this.scene.time.delayedCall(1500, () => {
      this.scene.events.emit('player-died');
    });
  }

  showFloatingText(text, color) {
    const floatText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 40,
      text,
      {
        fontSize: DAMAGE_TEXT.FONT_SIZE,
        fontFamily: 'Arial',
        color: color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(DEPTH.UI);

    this.scene.tweens.add({
      targets: floatText,
      y: floatText.y - DAMAGE_TEXT.FLOAT_DISTANCE,
      alpha: 0,
      duration: DAMAGE_TEXT.DURATION,
      onComplete: () => floatText.destroy(),
    });
  }
}
