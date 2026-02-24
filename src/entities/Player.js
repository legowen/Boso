// src/entities/Player.js
// Player character class

import Phaser from 'phaser';
import { PLAYER, DEPTH, DAMAGE_TEXT, ROPE } from '../utils/constants.js';

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

    // Stats (apply character data if available)
    const stats = this.characterData ? this.characterData.stats : null;
    this.hp = stats ? stats.hp : PLAYER.MAX_HP;
    this.maxHp = stats ? stats.hp : PLAYER.MAX_HP;
    this.mp = stats ? stats.mp : PLAYER.MAX_MP;
    this.maxMp = stats ? stats.mp : PLAYER.MAX_MP;
    this.attackPower = stats ? stats.atk : PLAYER.BASE_ATTACK;
    this.moveSpeed = stats ? stats.spd : PLAYER.SPEED;

    // State
    this.isAttacking = false;
    this.canAttack = true;
    this.facingRight = true;
    this.isDroppingThrough = false;
    this.isClimbing = false;
    this.currentRope = null;

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

    // Body
    graphics.fillStyle(color, 1);
    graphics.fillRect(4, 8, PLAYER.WIDTH - 8, PLAYER.HEIGHT - 8);

    // Eyes
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillRect(22, 16, 8, 8);
    graphics.fillRect(32, 16, 8, 8);

    // Pupils
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(26, 18, 4, 4);
    graphics.fillRect(36, 18, 4, 4);

    // Class-specific accessories
    if (charId === 'bomi') {
      // Warrior helmet
      graphics.fillStyle(0xBDC3C7, 1);
      graphics.fillRect(3, 2, PLAYER.WIDTH - 6, 10);
      graphics.fillStyle(0x95A5A6, 1);
      graphics.fillRect(16, 0, 8, 8);
    } else if (charId === 'seoli') {
      // Witch hat
      graphics.fillStyle(0x6C3483, 1);
      graphics.fillTriangle(PLAYER.WIDTH / 2, 0, 6, 12, PLAYER.WIDTH - 6, 12);
      graphics.fillStyle(0xF1C40F, 1);
      graphics.fillCircle(PLAYER.WIDTH / 2, 2, 3);
    }

    graphics.generateTexture(texKey, PLAYER.WIDTH, PLAYER.HEIGHT);
    graphics.destroy();
  }

  update(cursors, keys) {
    if (!this.sprite.active) return;

    this.handleMovement(cursors, keys);
    this.handleAttack(keys);
  }

  handleMovement(cursors, keys) {
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
      this.sprite.setVelocityY(PLAYER.JUMP_VELOCITY);
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
      this.sprite.setVelocityY(PLAYER.JUMP_VELOCITY * 0.7);
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

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);

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