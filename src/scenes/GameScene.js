// src/scenes/GameScene.js
// Main game scene - supports multiple maps via portal transitions
// MapleStory-style: large maps, platforms, portals, ropes, combat

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
  ROPE,
} from '../utils/constants.js';
import Player from '../entities/Player.js';
import HUD from '../ui/HUD.js';
import MAP_HAVEN from '../data/map_haven.js';
import MAP_OUTSKIRTS from '../data/map_outskirts.js';

// Map registry - add new maps here
const MAPS = {
  haven: MAP_HAVEN,
  outskirts: MAP_OUTSKIRTS,
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
    this.currentMapKey = 'haven';
    this.spawnX = null;
    this.spawnY = null;
  }

  init(data) {
    if (data && data.mapKey) {
      this.currentMapKey = data.mapKey;
    }
    if (data && data.spawnX !== undefined) {
      this.spawnX = data.spawnX;
    }
    if (data && data.spawnY !== undefined) {
      this.spawnY = data.spawnY;
    }
    if (data && data.characterData) {
      this.characterData = data.characterData;
    }
  }

  create() {
    this.mapData = MAPS[this.currentMapKey] || MAP_HAVEN;
    this.isTransitioning = false;

    this.initBackground();
    this.initPlatforms();
    this.initRopes();
    this.initPlayer();
    this.initMonsters();
    this.initPortals();
    this.initNPCs();
    this.initCamera();
    this.initControls();
    this.initHUD();
    this.initMinimap();
    this.initInteractionHint();

    // Event listeners
    this.events.on('player-died', () => this.handlePlayerDeath());

    // Fade in when entering map
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  update() {
    if (this.player && !this.isTransitioning && !this.isPaused) {
      this.player.update(this.cursors, this.keys);
      this.hud.update(this.player);
      this.updateMonsters();
      this.updateMinimap();
      this.checkInteractions();
    }
  }

  // ===== Custom methods (alphabetical order) =====

  changeMap(targetMapKey, spawnX, spawnY) {
    if (this.isTransitioning) return;
    if (!MAPS[targetMapKey]) {
      console.log(`Map "${targetMapKey}" not found yet!`);
      return;
    }

    this.isTransitioning = true;

    // Fade out then restart scene with new map data
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({
        mapKey: targetMapKey,
        spawnX: spawnX,
        spawnY: spawnY,
        characterData: this.characterData,
      });
    });
  }

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

        // Enter portal with UP arrow
        if (this.cursors.up.isDown && zone.portalData) {
          this.changeMap(zone.portalData.targetMap, zone.portalData.spawnX, zone.portalData.spawnY);
        }
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
    this.isTransitioning = true;

    // Grayscale effect on the entire camera
    const pipeline = this.cameras.main.postFX.addColorMatrix();
    pipeline.grayscale(1);

    // Dark overlay
    const centerX = this.cameras.main.scrollX + GAME_WIDTH / 2;
    const centerY = this.cameras.main.scrollY + GAME_HEIGHT / 2;

    const overlay = this.add.graphics().setDepth(DEPTH.UI + 10);
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(
      this.cameras.main.scrollX,
      this.cameras.main.scrollY,
      GAME_WIDTH,
      GAME_HEIGHT
    );

    // Fade in dark overlay
    this.tweens.add({
      targets: overlay,
      alpha: 0.5,
      duration: 1000,
    });

    // Death text (delayed for dramatic effect)
    this.time.delayedCall(500, () => {
      this.add.text(centerX, centerY - 30, 'You Died', {
        fontSize: '36px',
        fontFamily: UI.FONT_FAMILY,
        color: '#E74C3C',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(DEPTH.UI + 11);

      const restartText = this.add.text(centerX, centerY + 30, 'Press Space to return to village', {
        fontSize: '16px',
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

      // Space to respawn at Haven Village
      this.input.keyboard.once('keydown-SPACE', () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.restart({
            mapKey: 'haven',
            spawnX: MAP_HAVEN.spawnX,
            spawnY: MAP_HAVEN.spawnY,
            characterData: this.characterData,
          });
        });
      });
    });
  }

  initBackground() {
    // Set world bounds to map size
    this.physics.world.setBounds(0, 0, this.mapData.width, this.mapData.height);

    const colors = this.mapData.bgColors;

    // Sky background (gradient)
    const bg = this.add.graphics().setDepth(DEPTH.BACKGROUND);

    // Upper gradient
    bg.fillGradientStyle(colors.top[0], colors.top[0], colors.top[1], colors.top[1], 1);
    bg.fillRect(0, 0, this.mapData.width, this.mapData.height / 2);

    // Lower gradient
    bg.fillGradientStyle(colors.bottom[0], colors.bottom[0], colors.bottom[1], colors.bottom[1], 1);
    bg.fillRect(0, this.mapData.height / 2, this.mapData.width, this.mapData.height / 2);

    // Distant mountain silhouettes (parallax feel)
    const mountains = this.add.graphics().setDepth(DEPTH.BACKGROUND + 1);
    mountains.fillStyle(colors.mountain, 0.6);
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

    // ESC key for pause menu
    this.isPaused = false;
    this.pauseMenu = null;
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.isTransitioning) return;
      if (this.isPaused) {
        this.closePauseMenu();
      } else {
        this.openPauseMenu();
      }
    });
  }

  openPauseMenu() {
    this.isPaused = true;
    this.physics.pause();

    const cam = this.cameras.main;
    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2;

    this.pauseMenu = this.add.container(cx, cy).setDepth(DEPTH.UI + 20);

    // Dark overlay (full screen)
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(-cam.width / 2, -cam.height / 2, cam.width, cam.height);
    this.pauseMenu.add(overlay);

    // Menu box
    const boxW = 260;
    const boxH = 240;
    const box = this.add.graphics();
    box.fillStyle(0x1A1A2E, 0.95);
    box.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
    box.lineStyle(2, 0xF39C12, 0.8);
    box.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
    this.pauseMenu.add(box);

    // Title
    const title = this.add.text(0, -boxH / 2 + 28, 'PAUSED', {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial',
      color: '#F39C12',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.pauseMenu.add(title);

    // Divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x555555, 0.6);
    divider.lineBetween(-boxW / 2 + 20, -boxH / 2 + 52, boxW / 2 - 20, -boxH / 2 + 52);
    this.pauseMenu.add(divider);

    // Menu buttons
    const buttons = [
      { text: 'Continue', action: () => this.closePauseMenu() },
      { text: 'Character Select', action: () => this.goToCharacterSelect() },
      { text: 'Main Menu', action: () => this.goToMainMenu() },
    ];

    buttons.forEach((btn, i) => {
      const btnY = -boxH / 2 + 80 + i * 52;
      const btnW = 200;
      const btnH = 40;

      // Button background
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x2C3E50, 1);
      btnBg.fillRoundedRect(-btnW / 2, btnY, btnW, btnH, 6);
      this.pauseMenu.add(btnBg);

      // Button text
      const btnText = this.add.text(0, btnY + btnH / 2, btn.text, {
        fontSize: '15px',
        fontFamily: 'Arial',
        color: '#ECF0F1',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.pauseMenu.add(btnText);

      // Interactive zone
      const zone = this.add.zone(0, btnY + btnH / 2, btnW, btnH).setInteractive();
      this.pauseMenu.add(zone);

      zone.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0xF39C12, 1);
        btnBg.fillRoundedRect(-btnW / 2, btnY, btnW, btnH, 6);
        btnText.setColor('#000000');
      });
      zone.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x2C3E50, 1);
        btnBg.fillRoundedRect(-btnW / 2, btnY, btnW, btnH, 6);
        btnText.setColor('#ECF0F1');
      });
      zone.on('pointerdown', btn.action);
    });
  }

  closePauseMenu() {
    this.isPaused = false;
    this.physics.resume();
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }
  }

  goToCharacterSelect() {
    this.closePauseMenu();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.CHARACTER_SELECT);
    });
  }

  goToMainMenu() {
    this.closePauseMenu();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.MENU);
    });
  }

  initHUD() {
    this.hud = new HUD(this);
    this.hud.setMapName(this.mapData.name);
  }

  initMinimap() {
    // Minimap settings
    this.minimap = {};
    this.minimap.width = 180;
    this.minimap.height = 100;
    this.minimap.x = 10;
    this.minimap.y = 10;
    this.minimap.scaleX = this.minimap.width / this.mapData.width;
    this.minimap.scaleY = this.minimap.height / this.mapData.height;

    // Container (fixed to camera)
    this.minimap.container = this.add.container(this.minimap.x, this.minimap.y);
    this.minimap.container.setDepth(DEPTH.UI + 5);
    this.minimap.container.setScrollFactor(0);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(0, 0, this.minimap.width, this.minimap.height, 6);
    bg.lineStyle(1, 0x555555, 0.8);
    bg.strokeRoundedRect(0, 0, this.minimap.width, this.minimap.height, 6);
    this.minimap.container.add(bg);

    // Map name label
    const mapLabel = this.add.text(this.minimap.width / 2, -2, this.mapData.name, {
      fontSize: '10px',
      fontFamily: UI.FONT_FAMILY,
      color: '#AAAAAA',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1);
    this.minimap.container.add(mapLabel);

    // Draw platforms
    const platGraphics = this.add.graphics();
    this.mapData.platforms.forEach((p) => {
      if (p.isGround) {
        platGraphics.fillStyle(0x2ECC71, 0.8);
      } else {
        platGraphics.fillStyle(0x85929E, 0.7);
      }
      platGraphics.fillRect(
        p.x * this.minimap.scaleX,
        p.y * this.minimap.scaleY,
        Math.max(p.w * this.minimap.scaleX, 2),
        Math.max(2, 2)
      );
    });
    this.minimap.container.add(platGraphics);

    // Draw ropes
    const ropeGraphics = this.add.graphics();
    ropeGraphics.lineStyle(1, 0xC4A265, 0.5);
    this.mapData.ropes.forEach((r) => {
      ropeGraphics.lineBetween(
        r.x * this.minimap.scaleX,
        r.topY * this.minimap.scaleY,
        r.x * this.minimap.scaleX,
        r.bottomY * this.minimap.scaleY
      );
    });
    this.minimap.container.add(ropeGraphics);

    // Draw portals
    const portalGraphics = this.add.graphics();
    portalGraphics.fillStyle(0x8E44AD, 0.9);
    this.mapData.portals.forEach((p) => {
      portalGraphics.fillRect(
        p.x * this.minimap.scaleX - 2,
        p.y * this.minimap.scaleY - 3,
        4, 6
      );
    });
    this.minimap.container.add(portalGraphics);

    // Monster dots (will update positions)
    this.minimap.monsterGraphics = this.add.graphics();
    this.minimap.container.add(this.minimap.monsterGraphics);

    // Player dot (will update position)
    this.minimap.playerDot = this.add.graphics();
    this.minimap.container.add(this.minimap.playerDot);

    // Camera view rectangle
    this.minimap.cameraRect = this.add.graphics();
    this.minimap.container.add(this.minimap.cameraRect);
  }

  updateMinimap() {
    if (!this.minimap) return;

    const sx = this.minimap.scaleX;
    const sy = this.minimap.scaleY;

    // Update player dot (yellow)
    this.minimap.playerDot.clear();
    this.minimap.playerDot.fillStyle(0xF39C12, 1);
    this.minimap.playerDot.fillCircle(
      this.player.sprite.x * sx,
      this.player.sprite.y * sy,
      3
    );

    // Update monster dots (red)
    this.minimap.monsterGraphics.clear();
    this.minimap.monsterGraphics.fillStyle(0xE74C3C, 0.8);
    this.monsters.forEach((m) => {
      if (m.sprite.active) {
        this.minimap.monsterGraphics.fillCircle(
          m.sprite.x * sx,
          m.sprite.y * sy,
          2
        );
      }
    });

    // Update camera view rectangle (white outline, clamped to minimap bounds)
    this.minimap.cameraRect.clear();
    this.minimap.cameraRect.lineStyle(1, 0xFFFFFF, 0.4);
    const cam = this.cameras.main;
    const rx = Math.max(0, cam.scrollX * sx);
    const ry = Math.max(0, cam.scrollY * sy);
    const rw = Math.min(cam.width * sx, this.minimap.width - rx);
    const rh = Math.min(cam.height * sy, this.minimap.height - ry);
    this.minimap.cameraRect.strokeRect(rx, ry, rw, rh);
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

    if (this.mapData.npcs.length === 0) return;

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

  initRopes() {
    this.ropes = [];

    this.mapData.ropes.forEach((ropeData) => {
      const ropeHeight = ropeData.bottomY - ropeData.topY;
      const ropeCenterY = ropeData.topY + ropeHeight / 2;

      // Draw rope visual
      const graphics = this.add.graphics().setDepth(DEPTH.ROPES);

      // Main rope line
      graphics.lineStyle(ROPE.WIDTH, ROPE.COLOR, 0.9);
      graphics.lineBetween(ropeData.x, ropeData.topY, ropeData.x, ropeData.bottomY);

      // Highlight line (thinner, brighter, offset left)
      graphics.lineStyle(2, ROPE.HIGHLIGHT_COLOR, 0.6);
      graphics.lineBetween(ropeData.x - 2, ropeData.topY, ropeData.x - 2, ropeData.bottomY);

      // Knot marks every 40px
      const knotSpacing = 40;
      graphics.lineStyle(ROPE.WIDTH + 2, ROPE.COLOR, 1);
      for (let y = ropeData.topY + knotSpacing; y < ropeData.bottomY; y += knotSpacing) {
        graphics.lineBetween(ropeData.x - 5, y, ropeData.x + 5, y);
      }

      // Top anchor point
      graphics.fillStyle(0x8B7355, 1);
      graphics.fillCircle(ropeData.x, ropeData.topY, 6);

      // Store rope data for player interaction
      this.ropes.push({
        x: ropeData.x,
        topY: ropeData.topY,
        bottomY: ropeData.bottomY,
        graphics: graphics,
      });
    });
  }

  initPlayer() {
    const sx = this.spawnX !== null ? this.spawnX : this.mapData.spawnX;
    const sy = this.spawnY !== null ? this.spawnY : this.mapData.spawnY;
    this.player = new Player(this, sx, sy, this.characterData);

    // Player-platform collision
    this.platforms.forEach((platform) => {
      this.physics.add.collider(this.player.sprite, platform);
    });

    // Store ground platform reference (first platform, isGround: true)
    this.groundPlatform = this.platforms[0];

    // Reset spawn data
    this.spawnX = null;
    this.spawnY = null;
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

      // Store portal transition data on the sprite
      sprite.portalData = portalData;

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