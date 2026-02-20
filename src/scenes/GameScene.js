// src/scenes/GameScene.js
// Main game scene - Phase 1 prototype
// MapleStory-style: large map, platforms, portals, basic combat

import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER,
  PLATFORM,
  PORTAL,
  NPC,
  MONSTER,
  CAMERA,
  DEPTH,
  DAMAGE_TEXT,
  UI,
  SCENES,
} from '../utils/constants.js';
import Player from '../entities/Player.js';
import HUD from '../ui/HUD.js';

// ===== Map data (to be separated into JSON later) =====
const MAP_DATA = {
  name: 'Haven Village',
  width: 3200,
  height: 800,
  // 바닥 + 플랫폼들
  platforms: [
    // Main ground
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },
    // Floating platforms (pass-through)
    { x: 300, y: 580, w: 200, h: 16, isGround: false },
    { x: 600, y: 480, w: 250, h: 16, isGround: false },
    { x: 950, y: 560, w: 180, h: 16, isGround: false },
    { x: 1200, y: 440, w: 220, h: 16, isGround: false },
    { x: 1500, y: 520, w: 160, h: 16, isGround: false },
    { x: 1750, y: 600, w: 280, h: 16, isGround: false },
    { x: 2100, y: 480, w: 200, h: 16, isGround: false },
    { x: 2400, y: 380, w: 240, h: 16, isGround: false },
    { x: 2700, y: 540, w: 200, h: 16, isGround: false },
    { x: 2900, y: 420, w: 180, h: 16, isGround: false },
  ],
  // Portals (prototype: visual only, no transition yet)
  portals: [
    { x: 3100, y: 690, label: '→ Field 1' },
  ],
  // NPCs (prototype: visual only)
  npcs: [
    { x: 500, y: 700, name: 'Village Elder' },
  ],
  // Monsters (prototype: basic combat test)
  monsters: [
    { x: 1000, y: 700, hp: 40 },
    { x: 1600, y: 700, hp: 40 },
    { x: 2200, y: 700, hp: 60 },
    { x: 2800, y: 700, hp: 60 },
  ],
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  create() {
    this.mapData = MAP_DATA;

    this.initBackground();
    this.initPlatforms();
    this.initPlayer();
    this.initMonsters();
    this.initPortals();
    this.initNPCs();
    this.initCamera();
    this.initControls();
    this.initHUD();
    this.initInteractionHint();

    // Event listeners
    this.events.on('player-died', () => this.handlePlayerDeath());
  }

  update() {
    if (this.player) {
      this.player.update(this.cursors, this.keys);
      this.hud.update(this.player);
      this.updateMonsters();
      this.checkInteractions();
    }
  }

  // ===== Custom methods (alphabetical order) =====

  checkInteractions() {
    // Portal interaction check
    let nearPortal = false;
    this.portalZones.forEach((zone) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        zone.x,
        zone.y
      );
      if (distance < PORTAL.ACTIVATE_DISTANCE) {
        nearPortal = true;
        this.interactionHint.setText('↑ Enter Portal');
        this.interactionHint.setPosition(zone.x, zone.y - 80);
        this.interactionHint.setVisible(true);
      }
    });

    // NPC interaction check
    let nearNPC = false;
    this.npcSprites.forEach((npcObj) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        npcObj.sprite.x,
        npcObj.sprite.y
      );
      if (distance < NPC.INTERACT_DISTANCE) {
        nearNPC = true;
        this.interactionHint.setText('Space Talk');
        this.interactionHint.setPosition(npcObj.sprite.x, npcObj.sprite.y - 70);
        this.interactionHint.setVisible(true);
      }
    });

    if (!nearPortal && !nearNPC) {
      this.interactionHint.setVisible(false);
    }
  }

  createMonsterTexture() {
    if (this.textures.exists('monster')) return;

    const graphics = this.add.graphics();
    // Body (red)
    graphics.fillStyle(MONSTER.COLOR, 1);
    graphics.fillRect(2, 8, MONSTER.WIDTH - 4, MONSTER.HEIGHT - 8);

    // Eyes (angry expression)
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillRect(8, 14, 8, 6);
    graphics.fillRect(20, 14, 8, 6);

    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(10, 16, 4, 4);
    graphics.fillRect(24, 16, 4, 4);

    // Horns
    graphics.fillStyle(0xC0392B, 1);
    graphics.fillTriangle(10, 8, 6, 0, 14, 8);
    graphics.fillTriangle(26, 8, 22, 0, 30, 8);

    graphics.generateTexture('monster', MONSTER.WIDTH, MONSTER.HEIGHT);
    graphics.destroy();
  }

  handlePlayerDeath() {
    const centerX = this.cameras.main.scrollX + GAME_WIDTH / 2;
    const centerY = this.cameras.main.scrollY + GAME_HEIGHT / 2;

    const overlay = this.add.graphics().setDepth(DEPTH.UI + 10);
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(
      this.cameras.main.scrollX,
      this.cameras.main.scrollY,
      GAME_WIDTH,
      GAME_HEIGHT
    );

    this.add.text(centerX, centerY - 30, 'You Died', {
      fontSize: '36px',
      fontFamily: UI.FONT_FAMILY,
      color: '#E74C3C',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.UI + 11);

    const restartText = this.add.text(centerX, centerY + 30, 'Press R to Restart', {
      fontSize: '18px',
      fontFamily: UI.FONT_FAMILY,
      color: '#95A5A6',
    }).setOrigin(0.5).setDepth(DEPTH.UI + 11);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-R', () => {
      this.scene.restart();
    });
  }

  initBackground() {
    // Set world bounds to map size
    this.physics.world.setBounds(0, 0, this.mapData.width, this.mapData.height);

    // Sky background (gradient)
    const bg = this.add.graphics().setDepth(DEPTH.BACKGROUND);

    // Upper: dark blue
    bg.fillGradientStyle(0x0D1B2A, 0x0D1B2A, 0x1B2838, 0x1B2838, 1);
    bg.fillRect(0, 0, this.mapData.width, this.mapData.height / 2);

    // Lower: slightly brighter blue
    bg.fillGradientStyle(0x1B2838, 0x1B2838, 0x2C3E50, 0x2C3E50, 1);
    bg.fillRect(0, this.mapData.height / 2, this.mapData.width, this.mapData.height / 2);

    // Distant mountain silhouettes (parallax feel)
    const mountains = this.add.graphics().setDepth(DEPTH.BACKGROUND + 1);
    mountains.fillStyle(0x1A2530, 0.6);
    for (let i = 0; i < 8; i++) {
      const mx = i * 450 + 100;
      const mw = Phaser.Math.Between(200, 400);
      const mh = Phaser.Math.Between(150, 300);
      mountains.fillTriangle(
        mx, this.mapData.height - 60,
        mx + mw / 2, this.mapData.height - 60 - mh,
        mx + mw, this.mapData.height - 60
      );
    }
  }

  initCamera() {
    this.cameras.main.setBounds(0, 0, this.mapData.width, this.mapData.height);
    this.cameras.main.startFollow(this.player.sprite, true, CAMERA.LERP, CAMERA.LERP);
    this.cameras.main.setDeadzone(CAMERA.DEADZONE_WIDTH, CAMERA.DEADZONE_HEIGHT);
  }

  initControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = {
      ctrl: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL),
      alt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ALT),
      x: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      c: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      i: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
    };

    // Prevent browser default behavior for ALT and CTRL
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.ALT,
      Phaser.Input.Keyboard.KeyCodes.CTRL,
    ]);
  }

  initHUD() {
    this.hud = new HUD(this);
    this.hud.setMapName(this.mapData.name);
  }

  initInteractionHint() {
    this.interactionHint = this.add.text(0, 0, '', {
      fontSize: '14px',
      fontFamily: UI.FONT_FAMILY,
      color: '#FFFFFF',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(DEPTH.UI - 1).setVisible(false);
  }

  initMonsters() {
    this.createMonsterTexture();
    this.monsters = [];

    this.mapData.monsters.forEach((monsterData) => {
      const sprite = this.physics.add.sprite(monsterData.x, monsterData.y, 'monster');
      sprite.setDepth(DEPTH.MONSTERS);
      sprite.body.setSize(MONSTER.WIDTH - 8, MONSTER.HEIGHT);
      sprite.setBounce(0);
      sprite.setCollideWorldBounds(true);

      const monsterObj = {
        sprite: sprite,
        hp: monsterData.hp,
        maxHp: monsterData.hp,
        speed: 40,
        direction: 1,
        patrolRange: 100,
        startX: monsterData.x,
        isHit: false,
      };

      this.monsters.push(monsterObj);

      // Monster-ground collision
      this.platforms.forEach((platform) => {
        this.physics.add.collider(sprite, platform);
      });

      // HP bar (above monster)
      monsterObj.hpBarBg = this.add.graphics().setDepth(DEPTH.UI - 5);
      monsterObj.hpBar = this.add.graphics().setDepth(DEPTH.UI - 4);
    });
  }

  initNPCs() {
    this.npcSprites = [];

    if (!this.textures.exists('npc')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(NPC.COLOR, 1);
      graphics.fillRect(2, 4, NPC.WIDTH - 4, NPC.HEIGHT - 4);

      // Hat
      graphics.fillStyle(0x2ECC71, 1);
      graphics.fillRect(0, 0, NPC.WIDTH, 10);

      // Eyes
      graphics.fillStyle(0xFFFFFF, 1);
      graphics.fillRect(8, 14, 7, 7);
      graphics.fillRect(21, 14, 7, 7);
      graphics.fillStyle(0x000000, 1);
      graphics.fillRect(11, 16, 3, 3);
      graphics.fillRect(24, 16, 3, 3);

      graphics.generateTexture('npc', NPC.WIDTH, NPC.HEIGHT);
      graphics.destroy();
    }

    this.mapData.npcs.forEach((npcData) => {
      const sprite = this.physics.add.staticSprite(npcData.x, npcData.y, 'npc');
      sprite.setDepth(DEPTH.NPCS);

      // NPC name tag
      const nameTag = this.add.text(npcData.x, npcData.y - 40, npcData.name, {
        fontSize: '12px',
        fontFamily: UI.FONT_FAMILY,
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(DEPTH.NPCS);

      this.npcSprites.push({ sprite, nameTag, data: npcData });
    });
  }

  initPlayer() {
    // Spawn player on the left side of the map
    this.player = new Player(this, 150, 680);

    // Player-platform collision
    this.platforms.forEach((platform) => {
      this.physics.add.collider(this.player.sprite, platform);
    });
  }

  initPlatforms() {
    this.platforms = [];

    this.mapData.platforms.forEach((platData) => {
      // Generate texture
      const key = `plat_${platData.w}_${platData.h}`;
      if (!this.textures.exists(key)) {
        const graphics = this.add.graphics();
        if (platData.isGround) {
          // Ground: dark color
          graphics.fillStyle(0x34495E, 1);
          graphics.fillRect(0, 0, platData.w, platData.h);
          // Grass-like top line
          graphics.fillStyle(0x2ECC71, 1);
          graphics.fillRect(0, 0, platData.w, 4);
        } else {
          // Platform: wood color
          graphics.fillStyle(PLATFORM.COLOR, 1);
          graphics.fillRect(0, 0, platData.w, platData.h);
          // Top highlight line
          graphics.fillStyle(0x85929E, 1);
          graphics.fillRect(0, 0, platData.w, 3);
        }
        graphics.generateTexture(key, platData.w, platData.h);
        graphics.destroy();
      }

      const platform = this.physics.add.staticImage(
        platData.x + platData.w / 2,
        platData.y + platData.h / 2,
        key
      );
      platform.setDepth(DEPTH.PLATFORMS);

      this.platforms.push(platform);
    });
  }

  initPortals() {
    this.portalZones = [];

    if (!this.textures.exists('portal')) {
      const graphics = this.add.graphics();
      // Portal body
      graphics.fillStyle(PORTAL.COLOR, 0.7);
      graphics.fillEllipse(PORTAL.WIDTH / 2, PORTAL.HEIGHT / 2, PORTAL.WIDTH, PORTAL.HEIGHT);
      // Inner glow
      graphics.fillStyle(PORTAL.GLOW_COLOR, 0.5);
      graphics.fillEllipse(PORTAL.WIDTH / 2, PORTAL.HEIGHT / 2, PORTAL.WIDTH - 16, PORTAL.HEIGHT - 16);
      graphics.generateTexture('portal', PORTAL.WIDTH, PORTAL.HEIGHT);
      graphics.destroy();
    }

    this.mapData.portals.forEach((portalData) => {
      const sprite = this.add.sprite(portalData.x, portalData.y, 'portal');
      sprite.setDepth(DEPTH.PORTALS);

      // Portal pulse animation
      this.tweens.add({
        targets: sprite,
        scaleX: 1.05,
        scaleY: 0.95,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Portal label
      this.add.text(portalData.x, portalData.y - 50, portalData.label, {
        fontSize: '12px',
        fontFamily: UI.FONT_FAMILY,
        color: '#BB8FCE',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(DEPTH.PORTALS);

      this.portalZones.push(sprite);
    });
  }

  showDamageNumber(x, y, amount, isCritical) {
    const color = isCritical ? DAMAGE_TEXT.CRITICAL_COLOR : DAMAGE_TEXT.COLOR;
    const size = isCritical ? '24px' : DAMAGE_TEXT.FONT_SIZE;

    const text = this.add.text(x, y - 20, `${amount}`, {
      fontSize: size,
      fontFamily: UI.FONT_FAMILY,
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(DEPTH.EFFECTS);

    this.tweens.add({
      targets: text,
      y: text.y - DAMAGE_TEXT.FLOAT_DISTANCE,
      alpha: 0,
      duration: DAMAGE_TEXT.DURATION,
      onComplete: () => text.destroy(),
    });
  }

  updateMonsters() {
    this.monsters.forEach((monsterObj) => {
      if (!monsterObj.sprite.active) return;

      // Simple left-right patrol AI
      monsterObj.sprite.setVelocityX(monsterObj.speed * monsterObj.direction);
      if (Math.abs(monsterObj.sprite.x - monsterObj.startX) > monsterObj.patrolRange) {
        monsterObj.direction *= -1;
        monsterObj.sprite.setFlipX(monsterObj.direction < 0);
      }

      // Update monster HP bar
      const barWidth = 36;
      const barHeight = 4;
      const barX = monsterObj.sprite.x - barWidth / 2;
      const barY = monsterObj.sprite.y - MONSTER.HEIGHT / 2 - 10;

      monsterObj.hpBarBg.clear();
      monsterObj.hpBarBg.fillStyle(0x333333, 0.8);
      monsterObj.hpBarBg.fillRect(barX, barY, barWidth, barHeight);

      monsterObj.hpBar.clear();
      const hpRatio = monsterObj.hp / monsterObj.maxHp;
      monsterObj.hpBar.fillStyle(0xE74C3C, 1);
      monsterObj.hpBar.fillRect(barX, barY, barWidth * hpRatio, barHeight);

      // Check collision with player attack hitbox
      if (this.player.attackHitbox && !monsterObj.isHit) {
        const hitbox = this.player.attackHitbox;
        const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
          new Phaser.Geom.Rectangle(
            hitbox.x - PLAYER.ATTACK_WIDTH / 2,
            hitbox.y - PLAYER.ATTACK_HEIGHT / 2,
            PLAYER.ATTACK_WIDTH,
            PLAYER.ATTACK_HEIGHT
          ),
          monsterObj.sprite.getBounds()
        );

        if (overlap) {
          monsterObj.isHit = true;
          const damage = this.player.attackPower + Phaser.Math.Between(-3, 3);
          monsterObj.hp -= damage;

          // Show damage number
          this.showDamageNumber(
            monsterObj.sprite.x + Phaser.Math.Between(-10, 10),
            monsterObj.sprite.y,
            damage,
            false
          );

          // Knockback
          const knockDir = this.player.facingRight ? 1 : -1;
          monsterObj.sprite.setVelocityX(150 * knockDir);

          // Hit cooldown
          this.time.delayedCall(PLAYER.ATTACK_DURATION + 50, () => {
            monsterObj.isHit = false;
          });

          // Check monster death
          if (monsterObj.hp <= 0) {
            this.killMonster(monsterObj);
          }
        }
      }

      // Monster-player contact damage (simple check)
      if (monsterObj.sprite.active) {
        const playerBounds = this.player.sprite.getBounds();
        const monsterBounds = monsterObj.sprite.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, monsterBounds)) {
          if (!monsterObj.hasContactDamage) {
            monsterObj.hasContactDamage = true;
            this.player.takeDamage(10);
            this.time.delayedCall(1000, () => {
              monsterObj.hasContactDamage = false;
            });
          }
        }
      }
    });
  }

  killMonster(monsterObj) {
    // Death animation
    this.tweens.add({
      targets: monsterObj.sprite,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      onComplete: () => {
        monsterObj.sprite.destroy();
        monsterObj.hpBar.destroy();
        monsterObj.hpBarBg.destroy();
      },
    });
  }
}
