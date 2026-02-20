// src/entities/Player.js
// Player character class

import Phaser from 'phaser';
import { PLAYER, DEPTH, DAMAGE_TEXT } from '../utils/constants.js';

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    // Create player sprite (prototype: rectangle)
    this.createTexture();
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setDepth(DEPTH.PLAYER);
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setBounce(0);
    this.sprite.body.setSize(PLAYER.WIDTH - 8, PLAYER.HEIGHT);

    // Stats
    this.hp = PLAYER.MAX_HP;
    this.maxHp = PLAYER.MAX_HP;
    this.mp = PLAYER.MAX_MP;
    this.maxMp = PLAYER.MAX_MP;
    this.attackPower = PLAYER.BASE_ATTACK;

    // State
    this.isAttacking = false;
    this.canAttack = true;
    this.facingRight = true;
    this.isDroppingThrough = false;

    // Attack hitbox
    this.attackHitbox = null;
  }

  createTexture() {
    if (this.scene.textures.exists('player')) return;

    const graphics = this.scene.add.graphics();

    // Body
    graphics.fillStyle(PLAYER.COLOR, 1);
    graphics.fillRect(4, 8, PLAYER.WIDTH - 8, PLAYER.HEIGHT - 8);

    // Eyes (indicates facing direction)
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillRect(22, 16, 8, 8);
    graphics.fillRect(32, 16, 8, 8);

    // Pupils
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(26, 18, 4, 4);
    graphics.fillRect(36, 18, 4, 4);

    graphics.generateTexture('player', PLAYER.WIDTH, PLAYER.HEIGHT);
    graphics.destroy();
  }

  update(cursors, keys) {
    if (!this.sprite.active) return;

    this.handleMovement(cursors, keys);
    this.handleAttack(keys);
  }

  handleMovement(cursors, keys) {
    const onGround = this.sprite.body.blocked.down || this.sprite.body.touching.down;

    // Left/right movement
    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-PLAYER.SPEED);
      this.facingRight = false;
      this.sprite.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(PLAYER.SPEED);
      this.facingRight = true;
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    // Jump (ALT key)
    if (keys.alt.isDown && onGround && !this.isDroppingThrough) {
      this.sprite.setVelocityY(PLAYER.JUMP_VELOCITY);
    }

    // Drop through platform (DOWN arrow)
    if (cursors.down.isDown && onGround && !this.isDroppingThrough) {
      this.dropThrough();
    }
  }

  dropThrough() {
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
