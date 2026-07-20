// src/entities/Player.js
// Player character class

import Phaser from 'phaser';
import { PLAYER, DEPTH, DAMAGE_TEXT, ROPE } from '../utils/constants.js';
import SaveManager from '../systems/SaveManager.js';
import { ITEMS } from '../data/items.js';

// Stat growth per level (MapleStory-style persistent progression)
const LEVEL_GROWTH = { hp: 12, mp: 6, atk: 2 };

// Slow natural MP regeneration
const MP_REGEN_AMOUNT = 2;
const MP_REGEN_INTERVAL_MS = 2000;

export default class Player {
  constructor(scene, x, y, characterData) {
    this.scene = scene;
    this.characterData = characterData || null;

    // Create player sprite with character-specific appearance
    this.createTexture();
    this.sprite = scene.physics.add.sprite(x, y, this.textureKey);
    this.sprite.setDepth(DEPTH.PLAYER);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.body.setSize(PLAYER.WIDTH - 8, PLAYER.HEIGHT);

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
  }

  createTexture() {
    // Use character-specific texture key
    const texKey = this.characterData ? `player_${this.characterData.id}` : 'player';
    this.textureKey = texKey;

    if (this.scene.textures.exists(texKey)) return;

    const color = this.characterData ? this.characterData.color : PLAYER.COLOR;
    const charId = this.characterData ? this.characterData.id : 'default';

    const graphics = this.scene.add.graphics();
    const W = PLAYER.WIDTH;
    const H = PLAYER.HEIGHT;

    // Bomi - the shelter kitten (pointy ears, whiskers, bell collar)
    if (charId === 'bomi') {
      const stripe = 0xB2BABB;

      // Upright tail (left side - faces right by default)
      graphics.fillStyle(stripe, 1);
      graphics.fillTriangle(4, H - 20, 0, H - 40, 10, H - 14);

      // Body
      graphics.fillStyle(color, 1);
      graphics.fillRect(6, 22, W - 12, H - 28);

      // Head
      graphics.fillRect(7, 6, W - 14, 20);

      // Pointy ears with pink inner
      graphics.fillTriangle(9, 8, 12, -2, 19, 6);
      graphics.fillTriangle(W - 9, 8, W - 12, -2, W - 19, 6);
      graphics.fillStyle(0xF5B7B1, 1);
      graphics.fillTriangle(11, 5, 12.5, 0, 16, 4);
      graphics.fillTriangle(W - 11, 5, W - 12.5, 0, W - 16, 4);

      // Tabby head stripes
      graphics.fillStyle(stripe, 1);
      graphics.fillRect(16, 6, 3, 5);
      graphics.fillRect(22, 6, 3, 5);

      // Green cat eyes
      graphics.fillStyle(0xFFFFFF, 1);
      graphics.fillRect(13, 12, 7, 7);
      graphics.fillRect(24, 12, 7, 7);
      graphics.fillStyle(0x1E8449, 1);
      graphics.fillRect(16, 14, 3, 4);
      graphics.fillRect(27, 14, 3, 4);

      // Pink nose + whiskers
      graphics.fillStyle(0xE75480, 1);
      graphics.fillTriangle(19, 20, 25, 20, 22, 24);
      graphics.lineStyle(1, 0x839192, 1);
      graphics.lineBetween(2, 19, 13, 21);
      graphics.lineBetween(2, 24, 13, 23);
      graphics.lineBetween(W - 2, 19, W - 13, 21);
      graphics.lineBetween(W - 2, 24, W - 13, 23);

      // Bell collar
      graphics.fillStyle(0xE75480, 1);
      graphics.fillRect(8, 28, W - 16, 5);
      graphics.fillStyle(0xF1C40F, 1);
      graphics.fillCircle(W / 2, 36, 3);

      // Front paws
      graphics.fillStyle(stripe, 1);
      graphics.fillRect(10, H - 8, 8, 8);
      graphics.fillRect(W - 18, H - 8, 8, 8);

      graphics.generateTexture(texKey, W, H);
      graphics.destroy();
      return;
    }

    // Coat variants: brave = brown pup, swift = cream pup
    const earColor = charId === 'boso_brave' ? 0x8B5A2B : 0xC9B08A;
    const collarColor = charId === 'boso_brave' ? 0xE74C3C : 0x3498DB;

    // Tail (left side - dog faces right by default)
    graphics.fillStyle(earColor, 1);
    graphics.fillTriangle(6, H - 22, 0, H - 34, 10, H - 14);

    // Body (upright pup)
    graphics.fillStyle(color, 1);
    graphics.fillRect(6, 20, W - 12, H - 26);

    // Head
    graphics.fillStyle(color, 1);
    graphics.fillRect(8, 4, W - 16, 22);

    // Floppy ears
    graphics.fillStyle(earColor, 1);
    graphics.fillTriangle(8, 4, 2, 18, 14, 12);
    graphics.fillTriangle(W - 8, 4, W - 2, 18, W - 14, 12);

    // Eyes
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillRect(16, 10, 7, 7);
    graphics.fillRect(26, 10, 7, 7);
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(19, 12, 4, 4);
    graphics.fillRect(29, 12, 4, 4);

    // Snout + nose
    graphics.fillStyle(0xF5E6D3, 1);
    graphics.fillRect(17, 18, 14, 8);
    graphics.fillStyle(0x2C1810, 1);
    graphics.fillRect(21, 18, 6, 4);

    // Collar with gold tag
    graphics.fillStyle(collarColor, 1);
    graphics.fillRect(8, 26, W - 16, 5);
    graphics.fillStyle(0xF1C40F, 1);
    graphics.fillCircle(W / 2 + 4, 34, 3);

    // Front paws
    graphics.fillStyle(earColor, 1);
    graphics.fillRect(10, H - 8, 8, 8);
    graphics.fillRect(W - 18, H - 8, 8, 8);

    graphics.generateTexture(texKey, W, H);
    graphics.destroy();
  }

  update(cursors, keys) {
    if (!this.sprite.active) return;
    // Dead: no input or attacks during the death delay
    if (this.hp <= 0) return;

    this.handleMovement(cursors, keys);
    this.handleAttack(keys);

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

    // Left/right movement
    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-this.moveSpeed);
      this.facingRight = false;
      this.sprite.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(this.moveSpeed);
      this.facingRight = true;
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

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
      if (this.sprite.y + PLAYER.HEIGHT / 2 >= groundTop - 5) {
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
    // Attack with CTRL key
    if (keys.ctrl.isDown && this.canAttack && !this.isAttacking) {
      this.performAttack();
    }
  }

  performAttack() {
    this.isAttacking = true;
    this.canAttack = false;

    // Create attack hitbox
    const offsetX = this.facingRight ? PLAYER.ATTACK_RANGE : -PLAYER.ATTACK_RANGE;
    const attackX = this.sprite.x + offsetX;
    const attackY = this.sprite.y;

    this.attackHitbox = this.scene.add.zone(attackX, attackY, PLAYER.ATTACK_WIDTH, PLAYER.ATTACK_HEIGHT);
    this.scene.physics.add.existing(this.attackHitbox, true);
    this.attackHitbox.setDepth(DEPTH.EFFECTS);

    // Attack effect (prototype: semi-transparent rectangle)
    const effectGraphics = this.scene.add.graphics();
    effectGraphics.fillStyle(0xFFFFFF, 0.5);
    effectGraphics.fillRect(
      attackX - PLAYER.ATTACK_WIDTH / 2,
      attackY - PLAYER.ATTACK_HEIGHT / 2,
      PLAYER.ATTACK_WIDTH,
      PLAYER.ATTACK_HEIGHT
    );
    effectGraphics.setDepth(DEPTH.EFFECTS);

    // Remove hitbox & effect after duration
    this.scene.time.delayedCall(PLAYER.ATTACK_DURATION, () => {
      if (this.attackHitbox) {
        this.attackHitbox.destroy();
        this.attackHitbox = null;
      }
      effectGraphics.destroy();
      this.isAttacking = false;
    });

    // Attack cooldown
    this.scene.time.delayedCall(PLAYER.ATTACK_COOLDOWN, () => {
      this.canAttack = true;
    });
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