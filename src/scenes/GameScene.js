// src/scenes/GameScene.js
// Main game scene - supports multiple maps via portal transitions
// MapleStory-style: large maps, platforms, portals, ropes, combat

import Phaser from 'phaser';
import {
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
import { MAPS_DATA, START_MAP } from '../data/maps.js';
import { MONSTER_TYPES, BOSS_TYPES } from '../data/monsters.js';
import { WORLD_MAP_LAYOUT } from '../data/worldmap.js';
import { STORY } from '../data/story.js';
import HugGuardian from '../entities/HugGuardian.js';
import VacuumKing from '../entities/VacuumKing.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

// Map registry lives in src/data/maps.js (pure data, Node-validatable)
const MAPS = MAPS_DATA;

// Persistent map state across portal transitions
const MAP_STATE = {};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
    this.currentMapKey = START_MAP;
    this.spawnX = null;
    this.spawnY = null;
  }

  init(data) {
    // New game from character select: clear in-memory monster state
    if (data && data.freshRun) {
      Object.keys(MAP_STATE).forEach((key) => delete MAP_STATE[key]);
    }
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
    // Preserve HP/MP across map transitions
    this.savedPlayerHp = (data && data.playerHp !== undefined) ? data.playerHp : null;
    this.savedPlayerMp = (data && data.playerMp !== undefined) ? data.playerMp : null;
  }

  create() {
    this.mapData = MAPS[this.currentMapKey] || MAPS[START_MAP];
    this.isTransitioning = false;
    // Brief portal lock so a held UP key cannot ping-pong between maps
    this.portalLockUntil = Date.now() + 700;

    this.initBackground();
    this.initPlatforms();
    this.initRopes();
    this.initPlayer();
    this.initMonsters();
    this.initPortals();
    this.initNPCs();
    this.initBoss();
    this.initCamera();
    this.initControls();
    this.initHUD();
    this.initMinimap();
    this.initInteractionHint();

    // Overlay state
    this.dialogue = null;
    this.worldMap = null;

    // Overlays snapshot screen dims at open - close them on resize
    // (handler detached on shutdown; scale is game-global)
    this.overlayResizeHandler = () => {
      this.closeWorldMap();
      this.closeDialogue();
    };
    this.scale.on('resize', this.overlayResizeHandler);

    // Per-map BGM (silent graceful fallback when no audio file exists)
    AudioManager.play(this, this.mapData.bgm);

    // Event listeners (once: scene.restart would stack persistent listeners)
    this.events.once('player-died', () => this.handlePlayerDeath());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('player-died');
      this.scale.off('resize', this.overlayResizeHandler);
      // Defensive: Clock/TweenManager persist across scene.restart -
      // never carry a frozen clock into the next scene instance
      this.time.paused = false;
      this.tweens.resumeAll();
      if (this.boss) {
        this.boss.destroy();
        this.boss = null;
      }
    });

    // Fade in when entering map
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  update(time, delta) {
    if (this.player && !this.isTransitioning && !this.isPaused) {
      this.player.update(this.cursors, this.keys);
      this.updateMonsters();
      // Boss updates AFTER the player so suction can stack on input velocity
      if (this.boss) {
        this.boss.update(time, delta);
        this.updateBossHpBar();
      }
      this.hud.update(this.player);
      this.updateMinimap();
      // Dialogue advance consumes SPACE before checkInteractions can reopen
      this.updateDialogue();
      this.checkInteractions();

      // World map toggle (M)
      if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
        this.toggleWorldMap();
      }
    }
  }

  // ===== Custom methods (alphabetical order) =====

  changeMap(targetMapKey, spawnX, spawnY) {
    if (this.isTransitioning) return;
    if (!MAPS[targetMapKey]) return;

    this.isTransitioning = true;

    // Save current map monster state before leaving
    this.saveMapState();

    // Fade out then restart scene with new map data
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({
        mapKey: targetMapKey,
        spawnX: spawnX,
        spawnY: spawnY,
        characterData: this.characterData,
        playerHp: this.player.hp,
        playerMp: this.player.mp,
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

        // Enter portal with UP arrow (locked briefly after entering a map)
        if (this.cursors.up.isDown && zone.portalData && Date.now() > this.portalLockUntil) {
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
        this.interactionHint.setText('[SPACE] Talk');
        this.interactionHint.setPosition(npcObj.sprite.x, npcObj.sprite.y - 70);
        this.interactionHint.setVisible(true);

        // Start a conversation (SPACE) - updateDialogue consumed the key
        // this frame if a dialogue was already open; never open one hidden
        // behind the world map overlay
        if (
          !this.dialogue &&
          !this.worldMap &&
          npcObj.data.dialogue &&
          Phaser.Input.Keyboard.JustDown(this.keys.space)
        ) {
          this.openDialogue(npcObj);
        }
      }
    });

    if (!nearPortal && !nearNPC) {
      this.interactionHint.setVisible(false);
    }
  }

  // ===== NPC dialogue =====

  openDialogue(npcObj) {
    const w = this.scale.width;
    const h = this.scale.height;
    const boxW = Math.min(560, w - 60);
    const boxH = 96;

    const container = this.add.container(w / 2, h - 205).setDepth(DEPTH.UI + 8).setScrollFactor(0);

    const bg = this.add.graphics();
    bg.fillStyle(0x1A1A2E, 0.92);
    bg.fillRoundedRect(-boxW / 2, 0, boxW, boxH, 10);
    bg.lineStyle(2, 0xF39C12, 0.8);
    bg.strokeRoundedRect(-boxW / 2, 0, boxW, boxH, 10);
    container.add(bg);

    const nameText = this.add.text(-boxW / 2 + 16, 10, npcObj.data.name, {
      fontSize: '13px',
      fontFamily: 'Arial Black, Arial',
      color: '#F1C40F',
    });
    container.add(nameText);

    const lineText = this.add.text(-boxW / 2 + 16, 34, '', {
      fontSize: '13px',
      fontFamily: UI.FONT_FAMILY,
      color: '#ECF0F1',
      wordWrap: { width: boxW - 32 },
      lineSpacing: 4,
    });
    container.add(lineText);

    const hint = this.add.text(boxW / 2 - 14, boxH - 18, 'SPACE >', {
      fontSize: '11px',
      fontFamily: UI.FONT_FAMILY,
      color: '#7F8C8D',
    }).setOrigin(1, 0.5);
    container.add(hint);

    this.dialogue = { npcObj, index: 0, container, lineText };
    this.renderDialogueLine();
  }

  renderDialogueLine() {
    if (!this.dialogue) return;
    const lines = this.dialogue.npcObj.data.dialogue;
    this.dialogue.lineText.setText(lines[this.dialogue.index]);
  }

  updateDialogue() {
    if (!this.dialogue) return;

    // Auto-close when the player walks away
    const npcSprite = this.dialogue.npcObj.sprite;
    const dist = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      npcSprite.x,
      npcSprite.y
    );
    if (dist > NPC.INTERACT_DISTANCE * 2) {
      this.closeDialogue();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.dialogue.index += 1;
      if (this.dialogue.index >= this.dialogue.npcObj.data.dialogue.length) {
        this.closeDialogue();
      } else {
        this.renderDialogueLine();
      }
    }
  }

  closeDialogue() {
    if (!this.dialogue) return;
    this.dialogue.container.destroy();
    this.dialogue = null;
  }

  // ===== World map overlay (M) =====

  toggleWorldMap() {
    if (this.worldMap) {
      this.closeWorldMap();
    } else {
      this.openWorldMap();
    }
  }

  openWorldMap() {
    const w = this.scale.width;
    const h = this.scale.height;

    const container = this.add.container(0, 0).setDepth(DEPTH.UI + 15).setScrollFactor(0);

    // Dim the game behind the map
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.65);
    dim.fillRect(0, 0, w, h);
    container.add(dim);

    // Panel frame
    const x0 = w * 0.08;
    const y0 = h * 0.12;
    const pw = w * 0.84;
    const ph = h * 0.74;
    const panel = this.add.graphics();
    panel.fillStyle(0x10101E, 0.95);
    panel.fillRoundedRect(x0 - 20, y0 - 44, pw + 40, ph + 84, 12);
    panel.lineStyle(2, 0xF39C12, 0.8);
    panel.strokeRoundedRect(x0 - 20, y0 - 44, pw + 40, ph + 84, 12);
    container.add(panel);

    container.add(
      this.add.text(w / 2, y0 - 24, 'HOUSE MAP', {
        fontSize: '20px',
        fontFamily: 'Arial Black, Arial',
        color: '#F39C12',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5)
    );

    const visible = (key) =>
      key !== 'closet' || SaveManager.getFlag('hugGuardianDefeated');
    const nodeX = (key) => x0 + WORLD_MAP_LAYOUT[key].x * pw;
    const nodeY = (key) => y0 + WORLD_MAP_LAYOUT[key].y * ph;

    // Edges (derived from portals, deduped per pair)
    const edges = this.add.graphics();
    edges.lineStyle(2, 0x5D6D7E, 0.9);
    const drawn = new Set();
    Object.entries(MAPS_DATA).forEach(([key, map]) => {
      if (!visible(key) || !WORLD_MAP_LAYOUT[key]) return;
      (map.portals || []).forEach((portal) => {
        const target = portal.targetMap;
        if (!visible(target) || !WORLD_MAP_LAYOUT[target]) return;
        if (portal.hidden && !SaveManager.getFlag(portal.requiresFlag)) return;
        const pairKey = [key, target].sort().join('|');
        if (drawn.has(pairKey)) return;
        drawn.add(pairKey);
        edges.lineBetween(nodeX(key), nodeY(key), nodeX(target), nodeY(target));
      });
    });
    container.add(edges);

    // Nodes
    Object.keys(MAPS_DATA).forEach((key) => {
      if (!visible(key) || !WORLD_MAP_LAYOUT[key]) return;
      const nx = nodeX(key);
      const ny = nodeY(key);
      const isHere = key === this.currentMapKey;

      const node = this.add.graphics();
      node.fillStyle(isHere ? 0x3E2A00 : 0x2C3E50, 1);
      node.fillRoundedRect(nx - 52, ny - 15, 104, 30, 6);
      node.lineStyle(2, isHere ? 0xF1C40F : 0x85929E, 1);
      node.strokeRoundedRect(nx - 52, ny - 15, 104, 30, 6);
      container.add(node);

      container.add(
        this.add.text(nx, ny, MAPS_DATA[key].name, {
          fontSize: '10px',
          fontFamily: UI.FONT_FAMILY,
          color: isHere ? '#F1C40F' : '#D5DBDB',
          fontStyle: isHere ? 'bold' : 'normal',
        }).setOrigin(0.5)
      );

      if (isHere) {
        const marker = this.add.text(nx, ny - 28, 'YOU', {
          fontSize: '11px',
          fontFamily: 'Arial Black, Arial',
          color: '#F1C40F',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5);
        container.add(marker);
        this.tweens.add({
          targets: marker,
          y: marker.y - 5,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      }
    });

    container.add(
      this.add.text(w / 2, y0 + ph + 22, 'M - Close', {
        fontSize: '12px',
        fontFamily: UI.FONT_FAMILY,
        color: '#7F8C8D',
      }).setOrigin(0.5)
    );

    this.worldMap = container;
  }

  closeWorldMap() {
    if (!this.worldMap) return;
    this.worldMap.destroy();
    this.worldMap = null;
  }

  createMonsterTextures() {
    // Bangul - soap bubble experiment (snail-like ground crawler)
    if (!this.textures.exists('monster_bangul')) {
      const c = MONSTER_TYPES.bangul;
      const g = this.add.graphics();
      g.fillStyle(c.color, 0.55);
      g.fillCircle(17, 15, 14);
      g.lineStyle(2, 0xD6EAF8, 0.9);
      g.strokeCircle(17, 15, 14);
      // Shine highlight
      g.fillStyle(0xFFFFFF, 0.8);
      g.fillEllipse(11, 9, 7, 4);
      // Sleepy eyes
      g.fillStyle(0x1B2631, 1);
      g.fillRect(12, 14, 3, 4);
      g.fillRect(20, 14, 3, 4);
      g.generateTexture('monster_bangul', c.width, c.height);
      g.destroy();
    }

    // Gong - bouncing rubber ball (slime-like hopper)
    if (!this.textures.exists('monster_gong')) {
      const c = MONSTER_TYPES.gong;
      const g = this.add.graphics();
      g.fillStyle(c.color, 1);
      g.fillCircle(17, 16, 15);
      // White band
      g.fillStyle(0xFDFEFE, 1);
      g.fillEllipse(17, 9, 24, 7);
      // Star button
      g.fillStyle(0xF4D03F, 1);
      g.fillCircle(17, 9, 3);
      // Angry eyes
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(9, 16, 6, 6);
      g.fillRect(19, 16, 6, 6);
      g.fillStyle(0x000000, 1);
      g.fillRect(11, 18, 3, 3);
      g.fillRect(21, 18, 3, 3);
      g.generateTexture('monster_gong', c.width, c.height);
      g.destroy();
    }

    // Laser - glowing laser-pointer dot (free flyer, dashes at player)
    if (!this.textures.exists('monster_laser')) {
      const c = MONSTER_TYPES.laser;
      const g = this.add.graphics();
      g.fillStyle(c.color, 0.25);
      g.fillCircle(13, 13, 12);
      g.fillStyle(c.color, 0.6);
      g.fillCircle(13, 13, 8);
      g.fillStyle(0xFFFFFF, 1);
      g.fillCircle(13, 13, 4);
      // Cross glint
      g.lineStyle(2, c.color, 0.8);
      g.lineBetween(13, 0, 13, 26);
      g.lineBetween(0, 13, 26, 13);
      g.generateTexture('monster_laser', c.width, c.height);
      g.destroy();
    }

    // Nabi - butterfly (sine-wave glider)
    if (!this.textures.exists('monster_nabi')) {
      const c = MONSTER_TYPES.nabi;
      const g = this.add.graphics();
      // Wings
      g.fillStyle(c.color, 0.95);
      g.fillEllipse(11, 10, 16, 14);
      g.fillEllipse(27, 10, 16, 14);
      g.fillStyle(0xE67E22, 0.9);
      g.fillEllipse(11, 22, 12, 10);
      g.fillEllipse(27, 22, 12, 10);
      // Wing spots
      g.fillStyle(0x6E2C00, 0.8);
      g.fillCircle(11, 10, 3);
      g.fillCircle(27, 10, 3);
      // Body
      g.fillStyle(0x4A235A, 1);
      g.fillRoundedRect(16, 6, 6, 22, 3);
      // Antennae
      g.lineStyle(1, 0x4A235A, 1);
      g.lineBetween(18, 6, 14, 0);
      g.lineBetween(20, 6, 24, 0);
      g.generateTexture('monster_nabi', c.width, c.height);
      g.destroy();
    }

    // Robo - wind-up robot (Gearist prototype, charges like a wild boar)
    if (!this.textures.exists('monster_robo')) {
      const c = MONSTER_TYPES.robo;
      const g = this.add.graphics();
      // Boxy body
      g.fillStyle(c.color, 1);
      g.fillRoundedRect(3, 8, 26, 24, 4);
      // Visor with orange eye
      g.fillStyle(0x2C3E50, 1);
      g.fillRect(6, 12, 20, 8);
      g.fillStyle(0xE67E22, 1);
      g.fillRect(19, 14, 5, 4);
      // Antenna
      g.lineStyle(2, 0x7F8C8D, 1);
      g.lineBetween(16, 8, 16, 2);
      g.fillStyle(0xE74C3C, 1);
      g.fillCircle(16, 2, 2);
      // Wind-up key on the back
      g.lineStyle(3, 0xF1C40F, 1);
      g.strokeCircle(5, 20, 4);
      g.lineBetween(5, 16, 5, 24);
      // Treads
      g.fillStyle(0x2C3E50, 1);
      g.fillRoundedRect(4, 32, 24, 6, 3);
      g.generateTexture('monster_robo', c.width, c.height);
      g.destroy();
    }

    // Pari - fly (erratic fast jitter)
    if (!this.textures.exists('monster_pari')) {
      const c = MONSTER_TYPES.pari;
      const g = this.add.graphics();
      // Translucent wings
      g.fillStyle(0xD5DBDB, 0.6);
      g.fillEllipse(7, 5, 12, 7);
      g.fillEllipse(17, 5, 12, 7);
      // Body
      g.fillStyle(c.color, 1);
      g.fillEllipse(12, 13, 18, 14);
      // Big red eyes
      g.fillStyle(0xC0392B, 1);
      g.fillCircle(8, 11, 4);
      g.fillCircle(16, 11, 4);
      g.fillStyle(0xFFFFFF, 0.9);
      g.fillCircle(7, 10, 2);
      g.fillCircle(15, 10, 2);
      g.generateTexture('monster_pari', c.width, c.height);
      g.destroy();
    }
  }

  handlePlayerDeath() {
    // Already transitioning (map change or ending sequence) - skip death UI
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Clear overlays - update() is gated now, so they could never be closed
    this.closeWorldMap();
    this.closeDialogue();

    // Grayscale effect on the entire camera
    const pipeline = this.cameras.main.postFX.addColorMatrix();
    pipeline.grayscale(1);

    // Screen-fixed dark overlay (RESIZE scale mode: use live screen size)
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.graphics().setDepth(DEPTH.UI + 10).setScrollFactor(0);
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, w, h);
    overlay.setAlpha(0);

    // Fade in dark overlay
    this.tweens.add({
      targets: overlay,
      alpha: 0.5,
      duration: 1000,
    });

    // Death text (delayed for dramatic effect)
    this.time.delayedCall(500, () => {
      this.add.text(w / 2, h / 2 - 30, 'You Died', {
        fontSize: '36px',
        fontFamily: UI.FONT_FAMILY,
        color: '#E74C3C',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(DEPTH.UI + 11).setScrollFactor(0);

      const restartText = this.add.text(w / 2, h / 2 + 30, 'Press Space to return to the backyard', {
        fontSize: '16px',
        fontFamily: UI.FONT_FAMILY,
        color: '#95A5A6',
      }).setOrigin(0.5).setDepth(DEPTH.UI + 11).setScrollFactor(0);

      this.tweens.add({
        targets: restartText,
        alpha: 0.3,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });

      // Space to respawn at the starting map
      this.input.keyboard.once('keydown-SPACE', () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.restart({
            mapKey: START_MAP,
            spawnX: MAPS[START_MAP].spawnX,
            spawnY: MAPS[START_MAP].spawnY,
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
      m: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
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
    this.pauseStartedAt = Date.now();
    this.physics.pause();
    // Freeze clocks and tweens too - boss telegraphs and respawn timers
    // must not resolve while the pause menu is open
    this.time.paused = true;
    this.tweens.pauseAll();

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
    this.time.paused = false;
    this.tweens.resumeAll();
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }

    // AI timers are wall-clock (Date.now) - shift them by the paused
    // duration so cooldowns don't all expire at once on resume
    const pausedMs = this.pauseStartedAt ? Date.now() - this.pauseStartedAt : 0;
    this.pauseStartedAt = null;
    if (pausedMs > 0) {
      this.portalLockUntil += pausedMs;
      this.monsters.forEach((m) => {
        m.stateUntil += pausedMs;
        m.nextJumpAt += pausedMs;
        m.dashReadyAt += pausedMs;
        m.chargeReadyAt += pausedMs;
        if (m.retargetAt) m.retargetAt += pausedMs;
        if (m.knockedUntil) m.knockedUntil += pausedMs;
        if (m.pausedUntil) m.pausedUntil += pausedMs;
        if (m.dashingUntil) m.dashingUntil += pausedMs;
        if (m.windupUntil) m.windupUntil += pausedMs;
        if (m.chargeUntil) m.chargeUntil += pausedMs;
        if (m.deathTime) m.deathTime += pausedMs;
      });
      if (this.boss && this.boss.shiftTimers) {
        this.boss.shiftTimers(pausedMs);
      }
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

    // Boss dot (orange, larger)
    if (this.boss && this.boss.sprite && this.boss.sprite.active) {
      this.minimap.monsterGraphics.fillStyle(0xE67E22, 1);
      this.minimap.monsterGraphics.fillCircle(
        this.boss.sprite.x * sx,
        this.boss.sprite.y * sy,
        3
      );
    }

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
    this.createMonsterTextures();
    this.monsters = [];

    const now = Date.now();

    this.mapData.monsters.forEach((monsterData) => {
      const type = monsterData.type || 'bangul';
      const cfg = MONSTER_TYPES[type] || MONSTER_TYPES.bangul;
      const flying =
        cfg.movement === 'flyerDash' ||
        cfg.movement === 'sineGlider' ||
        cfg.movement === 'jitter';

      const sprite = this.physics.add.sprite(monsterData.x, monsterData.y, `monster_${type}`);
      sprite.setDepth(DEPTH.MONSTERS);
      sprite.body.setSize(cfg.width - 6, cfg.height - 2);
      sprite.setBounce(0);
      sprite.setCollideWorldBounds(true);

      if (flying) {
        // Flyers ignore gravity and pass through platforms
        sprite.body.setAllowGravity(false);
      } else {
        // Ground walkers collide with platforms
        this.platforms.forEach((platform) => {
          this.physics.add.collider(sprite, platform);
        });
      }

      const monsterObj = {
        sprite: sprite,
        type: type,
        cfg: cfg,
        hp: cfg.hp,
        maxHp: cfg.hp,
        startX: monsterData.x,
        startY: monsterData.y,
        monsterHeight: cfg.height,
        direction: Math.random() < 0.5 ? -1 : 1,
        isHit: false,
        // Per-movement AI state
        moveState: 'walk',
        stateUntil: now + Phaser.Math.Between(500, 2000),
        nextJumpAt: now + Phaser.Math.Between(cfg.jumpCooldownMin || 800, cfg.jumpCooldownMax || 2000),
        wanderTarget: null,
        pausedUntil: 0,
        dashingUntil: 0,
        dashReadyAt: now + (cfg.dashCooldownMs || 0),
        retargetAt: 0,
        baseY: monsterData.y,
        onGroundLast: false,
        knockedUntil: 0,
        isDying: false,
        // Charger (robo) state
        chargeState: 'patrol',
        windupUntil: 0,
        chargeUntil: 0,
        chargeReadyAt: now + (cfg.cooldownMs || 0),
        chargeDir: 1,
      };

      this.monsters.push(monsterObj);

      // HP bar (above monster)
      monsterObj.hpBarBg = this.add.graphics().setDepth(DEPTH.UI - 5);
      monsterObj.hpBar = this.add.graphics().setDepth(DEPTH.UI - 4);
    });

    // Restore saved map state (monster HP, dead/alive status)
    this.loadMapState();
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

    // Apply saved HP/MP from map transition (not set on death → full HP respawn)
    if (this.savedPlayerHp !== null) {
      this.player.hp = this.savedPlayerHp;
    }
    if (this.savedPlayerMp !== null) {
      this.player.mp = this.savedPlayerMp;
    }

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

      // Floating platforms are one-way (MapleStory style):
      // solid from above only, so jumps and Gong hops pass through from below
      if (!platData.isGround) {
        platform.body.checkCollision.down = false;
        platform.body.checkCollision.left = false;
        platform.body.checkCollision.right = false;
      }

      this.platforms.push(platform);
    });
  }

  initPortals() {
    this.portalZones = [];
    this.createPortalTextures();

    this.mapData.portals.forEach((portalData) => {
      // Hidden portals stay closed until their save flag is set
      if (portalData.hidden && !SaveManager.getFlag(portalData.requiresFlag)) return;
      this.spawnPortal(portalData);
    });
  }

  createPortalTextures() {
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

    if (!this.textures.exists('portal_hidden')) {
      const graphics = this.add.graphics();
      // Golden secret portal
      graphics.fillStyle(0xB7950B, 0.75);
      graphics.fillEllipse(PORTAL.WIDTH / 2, PORTAL.HEIGHT / 2, PORTAL.WIDTH, PORTAL.HEIGHT);
      graphics.fillStyle(0xF9E79F, 0.6);
      graphics.fillEllipse(PORTAL.WIDTH / 2, PORTAL.HEIGHT / 2, PORTAL.WIDTH - 16, PORTAL.HEIGHT - 16);
      graphics.generateTexture('portal_hidden', PORTAL.WIDTH, PORTAL.HEIGHT);
      graphics.destroy();
    }
  }

  spawnPortal(portalData) {
    const textureKey = portalData.hidden ? 'portal_hidden' : 'portal';
    const sprite = this.add.sprite(portalData.x, portalData.y, textureKey);
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
      color: portalData.hidden ? '#F1C40F' : '#BB8FCE',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH.PORTALS);

    this.portalZones.push(sprite);
    return sprite;
  }

  // ===== Boss handling =====

  initBoss() {
    this.boss = null;
    this.bossBar = null;

    const bossData = this.mapData.boss;
    if (!bossData) return;

    // A defeated boss stays defeated (persisted via SaveManager)
    if (SaveManager.getFlag(`${bossData.id}Defeated`)) return;

    if (bossData.id === 'hugGuardian') {
      this.boss = new HugGuardian(this, bossData.x, bossData.y);
      // Hug Guardian walks on the ground
      this.platforms.forEach((platform) => {
        this.physics.add.collider(this.boss.sprite, platform);
      });
    } else if (bossData.id === 'vacuumKing') {
      this.boss = new VacuumKing(this, bossData.x, bossData.y);
    }

    if (!this.boss) return;

    this.createBossHpBar();
    this.showBossWarning(STORY.bossWarning[bossData.id]);
  }

  createBossHpBar() {
    const w = this.scale.width;
    const barWidth = Math.min(480, w - 80);

    const container = this.add.container(w / 2, 24).setDepth(DEPTH.UI + 6).setScrollFactor(0);

    const nameText = this.add.text(0, 0, this.boss.name, {
      fontSize: '15px',
      fontFamily: 'Arial Black, Arial',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);
    container.add(nameText);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-barWidth / 2, 12, barWidth, 14, 4);
    bg.lineStyle(1, 0x888888, 0.8);
    bg.strokeRoundedRect(-barWidth / 2, 12, barWidth, 14, 4);
    container.add(bg);

    const fill = this.add.graphics();
    container.add(fill);

    this.bossBar = { container, fill, barWidth };
    this.updateBossHpBar();
  }

  updateBossHpBar() {
    if (!this.bossBar || !this.boss) return;
    const ratio = Math.max(0, this.boss.hp / this.boss.maxHp);
    const bw = this.bossBar.barWidth;
    this.bossBar.fill.clear();
    this.bossBar.fill.fillStyle(0xC0392B, 1);
    this.bossBar.fill.fillRoundedRect(-bw / 2 + 2, 14, (bw - 4) * ratio, 10, 3);
  }

  showBossWarning(text) {
    if (!text) return;
    const warning = this.add.text(this.scale.width / 2, this.scale.height * 0.3, text, {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial',
      color: '#E74C3C',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setDepth(DEPTH.UI + 7).setScrollFactor(0);

    this.tweens.add({
      targets: warning,
      alpha: 0,
      delay: 2200,
      duration: 700,
      onComplete: () => warning.destroy(),
    });
  }

  onBossDefeated(bossId) {
    SaveManager.setFlag(`${bossId}Defeated`);

    // Boss EXP
    const bossCfg = BOSS_TYPES[bossId];
    if (bossCfg && bossCfg.exp && this.player.hp > 0) {
      this.player.gainExp(bossCfg.exp);
    }

    if (this.bossBar) {
      this.bossBar.container.setVisible(false);
    }
    this.boss = null;

    if (bossId === 'hugGuardian') {
      // Reveal the secret portal to the Vacuum Closet
      const hiddenPortal = this.mapData.portals.find((p) => p.hidden);
      if (hiddenPortal) {
        const sprite = this.spawnPortal(hiddenPortal);
        sprite.setAlpha(0);
        this.tweens.add({ targets: sprite, alpha: 1, duration: 900 });
        this.showBossWarning(STORY.hiddenPortalHint);
      }
    } else if (bossId === 'vacuumKing') {
      SaveManager.setFlag('demoCleared');
      this.startEndingSequence();
    }
  }

  startEndingSequence() {
    this.isTransitioning = true;
    this.closeWorldMap();
    this.closeDialogue();
    this.player.sprite.setVelocity(0, 0);
    AudioManager.stop();

    const w = this.scale.width;
    const h = this.scale.height;

    // Warm white fade
    const overlay = this.add.graphics().setDepth(DEPTH.UI + 20).setScrollFactor(0);
    overlay.fillStyle(0xFFF8E7, 1);
    overlay.fillRect(0, 0, w, h);
    overlay.setAlpha(0);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 2000,
      onComplete: () => {
        // Show the ending lines one at a time
        STORY.ending.forEach((line, i) => {
          this.time.delayedCall(600 + i * 2200, () => {
            const isLast = i === STORY.ending.length - 1;
            const lineText = this.add.text(w / 2, h * 0.3 + i * 54, line, {
              fontSize: isLast ? '20px' : '22px',
              fontFamily: isLast ? 'Arial' : 'Arial Black, Arial',
              color: isLast ? '#B9770E' : '#4A3728',
              align: 'center',
            }).setOrigin(0.5).setAlpha(0).setDepth(DEPTH.UI + 21).setScrollFactor(0);
            this.tweens.add({ targets: lineText, alpha: 1, duration: 800 });

            if (isLast) {
              this.time.delayedCall(1200, () => {
                const hint = this.add.text(w / 2, h * 0.8, 'Press SPACE to return to the title', {
                  fontSize: '14px',
                  fontFamily: UI.FONT_FAMILY,
                  color: '#7D6608',
                }).setOrigin(0.5).setDepth(DEPTH.UI + 21).setScrollFactor(0);
                this.tweens.add({
                  targets: hint,
                  alpha: 0.3,
                  duration: 600,
                  yoyo: true,
                  repeat: -1,
                });
                this.input.keyboard.once('keydown-SPACE', () => {
                  this.scene.start(SCENES.MENU);
                });
              });
            }
          });
        });
      },
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
    const now = Date.now();

    this.monsters.forEach((monsterObj) => {
      if (!monsterObj.sprite.active || monsterObj.isDying) return;

      // Movement AI per monster type
      this.updateMonsterAI(monsterObj, now);

      // Update monster HP bar
      const barWidth = 36;
      const barHeight = 4;
      const barX = monsterObj.sprite.x - barWidth / 2;
      const barY = monsterObj.sprite.y - monsterObj.monsterHeight / 2 - 10;

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

          // Knockback (AI resteers after the knock window)
          const knockDir = this.player.facingRight ? 1 : -1;
          monsterObj.sprite.setVelocityX(200 * knockDir);
          monsterObj.knockedUntil = now + 250;

          // A hit staggers a winding-up charger (and kills its rattle
          // tween, which would otherwise pin the sprite in place)
          if (monsterObj.cfg.movement === 'charger' && monsterObj.chargeState === 'windup') {
            this.tweens.killTweensOf(monsterObj.sprite);
            monsterObj.chargeState = 'patrol';
            monsterObj.chargeReadyAt = now + monsterObj.cfg.cooldownMs;
          }
          if (monsterObj.sprite.body.allowGravity) {
            monsterObj.sprite.setVelocityY(-100);
          } else {
            // Interrupt the current flight plan so the AI re-steers
            monsterObj.wanderTarget = null;
            monsterObj.dashingUntil = 0;
            monsterObj.pausedUntil = 0;
            monsterObj.retargetAt = 0;
          }

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

      // Monster-player contact damage (skip corpses and dying monsters)
      if (monsterObj.sprite.active && !monsterObj.isDying && this.player.hp > 0) {
        const playerBounds = this.player.sprite.getBounds();
        const monsterBounds = monsterObj.sprite.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, monsterBounds)) {
          if (!monsterObj.hasContactDamage) {
            monsterObj.hasContactDamage = true;
            const dir = this.player.sprite.x < monsterObj.sprite.x ? -1 : 1;
            this.player.takeDamage(monsterObj.cfg.touchDamage, dir);
            this.time.delayedCall(1000, () => {
              monsterObj.hasContactDamage = false;
            });
          }
        }
      }
    });
  }

  // Per-type movement AI dispatch
  updateMonsterAI(monsterObj, now) {
    // Let knockback velocity play out before the AI resteers
    if (now < monsterObj.knockedUntil) return;

    const { sprite, cfg } = monsterObj;
    const player = this.player.sprite;

    switch (cfg.movement) {
      // Bangul: MapleStory-snail — slow patrol, random pauses, turns at walls/ledges
      case 'snail': {
        if (monsterObj.moveState === 'pause') {
          sprite.setVelocityX(0);
          if (now > monsterObj.stateUntil) {
            monsterObj.moveState = 'walk';
            monsterObj.stateUntil = now + Phaser.Math.Between(cfg.walkMsMin, cfg.walkMsMax);
          }
          break;
        }
        if (now > monsterObj.stateUntil) {
          if (Math.random() < cfg.pauseChance) {
            monsterObj.moveState = 'pause';
            monsterObj.stateUntil = now + Phaser.Math.Between(cfg.pauseMsMin, cfg.pauseMsMax);
            sprite.setVelocityX(0);
            break;
          }
          monsterObj.stateUntil = now + Phaser.Math.Between(cfg.walkMsMin, cfg.walkMsMax);
        }
        if (sprite.body.blocked.left) {
          monsterObj.direction = 1;
        } else if (sprite.body.blocked.right) {
          monsterObj.direction = -1;
        } else if (sprite.body.blocked.down && !this.hasGroundAhead(sprite, monsterObj.direction, cfg)) {
          // Ledge ahead - turn around instead of falling
          monsterObj.direction *= -1;
        }
        sprite.setVelocityX(cfg.speed * monsterObj.direction);
        sprite.setFlipX(monsterObj.direction < 0);
        break;
      }

      // Gong: MapleStory-slime — hops around ignoring terrain, sometimes at the player
      case 'bouncer': {
        const onGround = sprite.body.blocked.down;
        if (onGround) {
          if (!monsterObj.onGroundLast) {
            // Just landed - squash
            this.tweens.add({
              targets: sprite,
              scaleX: 1.25,
              scaleY: 0.75,
              duration: 90,
              yoyo: true,
            });
          }
          sprite.setVelocityX(0);
          if (now > monsterObj.nextJumpAt) {
            let dir;
            if (Math.random() < cfg.chasePlayerChance) {
              dir = player.x < sprite.x ? -1 : 1;
            } else {
              dir = Math.random() < 0.5 ? -1 : 1;
            }
            monsterObj.direction = dir;
            sprite.setFlipX(dir < 0);
            sprite.setVelocity(
              dir * (cfg.jumpVelocityX + Phaser.Math.Between(-30, 30)),
              cfg.jumpVelocityY + Phaser.Math.Between(-40, 20)
            );
            // Stretch on takeoff
            this.tweens.add({
              targets: sprite,
              scaleX: 0.8,
              scaleY: 1.2,
              duration: 120,
              yoyo: true,
            });
            monsterObj.nextJumpAt = now + Phaser.Math.Between(cfg.jumpCooldownMin, cfg.jumpCooldownMax);
          }
        }
        monsterObj.onGroundLast = onGround;
        // Failsafe: somehow escaped the map - return to spawn
        if (sprite.y > this.mapData.height + 40) {
          sprite.setPosition(monsterObj.startX, monsterObj.startY);
          sprite.setVelocity(0, 0);
        }
        break;
      }

      // Laser: Stitch-like — free flight between waypoints, dashes at nearby player
      case 'flyerDash': {
        if (now < monsterObj.dashingUntil) break; // steering locked during dash
        const distToPlayer = Phaser.Math.Distance.Between(sprite.x, sprite.y, player.x, player.y);
        if (distToPlayer < cfg.dashRange && now > monsterObj.dashReadyAt && this.player.hp > 0) {
          this.physics.moveTo(sprite, player.x, player.y, cfg.dashSpeed);
          monsterObj.dashingUntil = now + cfg.dashDurationMs;
          monsterObj.dashReadyAt = now + cfg.dashCooldownMs;
          monsterObj.wanderTarget = null;
          sprite.setFlipX(player.x < sprite.x);
          break;
        }
        if (monsterObj.pausedUntil > now) {
          sprite.setVelocity(0, 0);
          break;
        }
        if (!monsterObj.wanderTarget) {
          monsterObj.wanderTarget = this.pickAirPoint(monsterObj);
          this.physics.moveTo(sprite, monsterObj.wanderTarget.x, monsterObj.wanderTarget.y, cfg.flySpeed);
          sprite.setFlipX(monsterObj.wanderTarget.x < sprite.x);
        } else if (
          Phaser.Math.Distance.Between(sprite.x, sprite.y, monsterObj.wanderTarget.x, monsterObj.wanderTarget.y) < 10
        ) {
          monsterObj.wanderTarget = null;
          monsterObj.pausedUntil = now + Phaser.Math.Between(cfg.pauseMsMin, cfg.pauseMsMax);
          sprite.setVelocity(0, 0);
        }
        break;
      }

      // Nabi: butterfly — horizontal patrol with sine-wave altitude
      case 'sineGlider': {
        if (sprite.x <= monsterObj.startX - cfg.patrolRange) {
          monsterObj.direction = 1;
        } else if (sprite.x >= monsterObj.startX + cfg.patrolRange) {
          monsterObj.direction = -1;
        }
        sprite.setVelocityX(cfg.flySpeed * monsterObj.direction);
        sprite.setFlipX(monsterObj.direction < 0);
        // Velocity steering toward the sine target (knockback-safe)
        const targetY = monsterObj.baseY + Math.sin((now / 1000) * cfg.sineFrequency) * cfg.sineAmplitude;
        sprite.setVelocityY((targetY - sprite.y) * 4);
        break;
      }

      // Robo: wild-boar-style charger — patrols, winds up, then charges
      // straight ahead (even off ledges)
      case 'charger': {
        if (monsterObj.chargeState === 'windup') {
          sprite.setVelocityX(0);
          if (now > monsterObj.windupUntil) {
            monsterObj.chargeState = 'charge';
            monsterObj.chargeUntil = now + cfg.chargeMs;
          }
          break;
        }

        if (monsterObj.chargeState === 'charge') {
          if (now > monsterObj.chargeUntil || sprite.body.blocked.left || sprite.body.blocked.right) {
            monsterObj.chargeState = 'patrol';
            monsterObj.chargeReadyAt = now + cfg.cooldownMs;
            sprite.setVelocityX(0);
          } else {
            // Full speed ahead - ledges included
            sprite.setVelocityX(cfg.chargeSpeed * monsterObj.chargeDir);
          }
          break;
        }

        // Patrol - and watch for a lined-up player
        const dx = player.x - sprite.x;
        const dy = Math.abs(player.y - sprite.y);
        if (
          this.player.hp > 0 &&
          now > monsterObj.chargeReadyAt &&
          Math.abs(dx) < cfg.detectRangeX &&
          dy < cfg.detectRangeY &&
          sprite.body.blocked.down
        ) {
          monsterObj.chargeState = 'windup';
          monsterObj.windupUntil = now + cfg.windupMs;
          monsterObj.chargeDir = dx < 0 ? -1 : 1;
          sprite.setFlipX(monsterObj.chargeDir < 0);
          sprite.setVelocityX(0);
          // Rattle telegraph
          this.tweens.add({
            targets: sprite,
            x: sprite.x + 3,
            duration: 50,
            yoyo: true,
            repeat: 4,
          });
          break;
        }

        if (sprite.body.blocked.left) {
          monsterObj.direction = 1;
        } else if (sprite.body.blocked.right) {
          monsterObj.direction = -1;
        } else if (sprite.body.blocked.down && !this.hasGroundAhead(sprite, monsterObj.direction, cfg)) {
          monsterObj.direction *= -1;
        }
        sprite.setVelocityX(cfg.speed * monsterObj.direction);
        sprite.setFlipX(monsterObj.direction < 0);
        break;
      }

      // Pari: fly — fast erratic jitter, biased toward the player, leashed to spawn
      case 'jitter': {
        if (now > monsterObj.retargetAt) {
          let angle;
          if (Phaser.Math.Distance.Between(sprite.x, sprite.y, monsterObj.startX, monsterObj.startY) > cfg.leashRadius) {
            // Too far from home - steer back
            angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, monsterObj.startX, monsterObj.startY);
          } else if (Math.random() < cfg.chaseBias && this.player.hp > 0) {
            angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, player.x, player.y)
              + Phaser.Math.FloatBetween(-0.5, 0.5);
          } else {
            angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          }
          const speed = Phaser.Math.Between(cfg.speedMin, cfg.speedMax);
          sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
          sprite.setFlipX(Math.cos(angle) < 0);
          monsterObj.retargetAt = now + Phaser.Math.Between(cfg.retargetMsMin, cfg.retargetMsMax);
        }
        break;
      }
    }
  }

  // Is there platform support just ahead of the sprite's feet?
  hasGroundAhead(sprite, dir, cfg) {
    const probeX = sprite.x + dir * (cfg.width / 2 + 8);
    const footY = sprite.y + cfg.height / 2 + 6;
    return this.mapData.platforms.some(
      (p) => probeX >= p.x && probeX <= p.x + p.w && footY >= p.y - 4 && footY <= p.y + 24
    );
  }

  // Random open-air waypoint near a flyer's spawn point
  pickAirPoint(monsterObj) {
    const cfg = monsterObj.cfg;
    const ground = this.mapData.platforms.find((p) => p.isGround);
    const minY = 100;
    const maxY = (ground ? ground.y : this.mapData.height - 60) - 80;
    return {
      x: Phaser.Math.Clamp(
        monsterObj.startX + Phaser.Math.Between(-cfg.wanderRadius, cfg.wanderRadius),
        80,
        this.mapData.width - 80
      ),
      y: Phaser.Math.Clamp(
        monsterObj.startY + Phaser.Math.Between(-cfg.wanderRadius, cfg.wanderRadius),
        minY,
        maxY
      ),
    };
  }

  killMonster(monsterObj) {
    // Guard against a second killing blow landing during the death tween
    if (monsterObj.isDying) return;
    monsterObj.isDying = true;
    monsterObj.isDead = true;
    monsterObj.deathTime = Date.now();

    // Hide the HP bar right away (a negative-HP bar looks broken)
    monsterObj.hpBar.clear();
    monsterObj.hpBarBg.clear();

    // Award EXP
    const expGain = monsterObj.cfg.exp || 0;
    if (expGain > 0 && this.player.hp > 0) {
      this.player.gainExp(expGain);
      const expText = this.add.text(monsterObj.sprite.x, monsterObj.sprite.y - 34, `+${expGain} EXP`, {
        fontSize: '12px',
        fontFamily: UI.FONT_FAMILY,
        color: '#F1C40F',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(DEPTH.EFFECTS);
      this.tweens.add({
        targets: expText,
        y: expText.y - 30,
        alpha: 0,
        duration: 900,
        onComplete: () => expText.destroy(),
      });
    }

    // Death animation: shrink and fade, then deactivate
    this.tweens.add({
      targets: monsterObj.sprite,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      onComplete: () => {
        monsterObj.sprite.setActive(false);
        monsterObj.sprite.setVisible(false);
        monsterObj.sprite.body.enable = false;
        monsterObj.hpBar.setVisible(false);
        monsterObj.hpBarBg.setVisible(false);
      },
    });

    // Schedule respawn
    this.time.delayedCall(MONSTER.RESPAWN_TIME, () => {
      this.respawnMonster(monsterObj);
    });
  }

  respawnMonster(monsterObj) {
    // Reset position to original spawn
    monsterObj.sprite.setPosition(monsterObj.startX, monsterObj.startY);
    monsterObj.sprite.setVelocity(0, 0);

    // Reset HP
    monsterObj.hp = monsterObj.maxHp;
    monsterObj.isDead = false;
    monsterObj.isDying = false;
    monsterObj.deathTime = null;
    monsterObj.knockedUntil = 0;

    // Reset AI state
    const now = Date.now();
    monsterObj.moveState = 'walk';
    monsterObj.stateUntil = now + Phaser.Math.Between(500, 2000);
    monsterObj.nextJumpAt = now + Phaser.Math.Between(800, 1800);
    monsterObj.wanderTarget = null;
    monsterObj.pausedUntil = 0;
    monsterObj.dashingUntil = 0;
    monsterObj.dashReadyAt = now + (monsterObj.cfg.dashCooldownMs || 0);
    monsterObj.retargetAt = 0;
    monsterObj.onGroundLast = false;
    monsterObj.chargeState = 'patrol';
    monsterObj.windupUntil = 0;
    monsterObj.chargeUntil = 0;
    monsterObj.chargeReadyAt = now + (monsterObj.cfg.cooldownMs || 0);

    // Reactivate sprite
    monsterObj.sprite.setActive(true);
    monsterObj.sprite.setVisible(true);
    monsterObj.sprite.body.enable = true;
    monsterObj.sprite.setAlpha(1);
    monsterObj.sprite.setScale(1, 1);

    // Show HP bars again
    monsterObj.hpBar.setVisible(true);
    monsterObj.hpBarBg.setVisible(true);

    // Respawn blink effect
    this.tweens.add({
      targets: monsterObj.sprite,
      alpha: { from: 0.2, to: 1 },
      duration: 150,
      yoyo: true,
      repeat: 3,
    });
  }

  saveMapState() {
    MAP_STATE[this.currentMapKey] = this.monsters.map((m) => ({
      isDead: !!m.isDead,
      hp: m.hp,
      deathTime: m.deathTime || null,
    }));
  }

  loadMapState() {
    const saved = MAP_STATE[this.currentMapKey];
    if (!saved) return;

    const now = Date.now();
    saved.forEach((state, i) => {
      if (i >= this.monsters.length) return;
      const monsterObj = this.monsters[i];

      if (state.isDead) {
        const elapsed = now - state.deathTime;
        if (elapsed < MONSTER.RESPAWN_TIME) {
          // Still dead — deactivate and schedule respawn for remaining time
          monsterObj.isDead = true;
          monsterObj.deathTime = state.deathTime;
          monsterObj.sprite.setActive(false);
          monsterObj.sprite.setVisible(false);
          monsterObj.sprite.body.enable = false;
          monsterObj.hpBar.setVisible(false);
          monsterObj.hpBarBg.setVisible(false);

          const remaining = MONSTER.RESPAWN_TIME - elapsed;
          this.time.delayedCall(remaining, () => {
            this.respawnMonster(monsterObj);
          });
        }
        // else: respawn time already passed, keep monster alive at full HP (default)
      } else {
        // Alive but with saved HP
        monsterObj.hp = state.hp;
      }
    });
  }
}