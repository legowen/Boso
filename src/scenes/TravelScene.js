// src/scenes/TravelScene.js
// Cage travel scene (MapleStory ship-voyage homage). The player rides
// inside a pet travel cage while the world scrolls past. Free movement
// inside the cage, a countdown in the HUD, and - on the long routes -
// randomized ambushes: Vroom (telegraphed dash-across) and Rumble
// (shockwave tanker that can be fought).
//
// Timing uses accumulated frame delta (not wall clock), so a suspended
// tab does not skip the ride.

import Phaser from 'phaser';
import { PLAYER, DEPTH, UI, SCENES } from '../utils/constants.js';
import Player from '../entities/Player.js';
import HUD from '../ui/HUD.js';
import { MAPS_DATA } from '../data/maps.js';
import { TRAVEL_ROUTES, AMBUSH_TYPES } from '../data/travel.js';
import AudioManager from '../systems/AudioManager.js';

// World layout: the cage hangs in the middle of a larger scroll world.
const WORLD_W = 2400;
const WORLD_H = 1400;
const CAGE = { x: 700, y: 500, w: 1000, h: 640 };

// Swift Paw's bark works during the ride too
const BARK = { mpCost: 4, speed: 420, maxDist: 360, cooldownMs: 350 };

export default class TravelScene extends Phaser.Scene {
  constructor() {
    super(SCENES.TRAVEL);
  }

  init(data) {
    this.routeKey = data && data.routeKey ? data.routeKey : 'shelter_to_buddy';
    this.route = TRAVEL_ROUTES[this.routeKey] || TRAVEL_ROUTES.shelter_to_buddy;
    this.characterData = data && data.characterData ? data.characterData : null;
    this.savedPlayerHp = data && data.playerHp !== undefined ? data.playerHp : null;
    this.savedPlayerMp = data && data.playerMp !== undefined ? data.playerMp : null;
  }

  create() {
    const route = this.route;
    this.elapsedMs = 0;
    this.arrived = false;
    this.playerDead = false;
    this.vrooms = [];
    this.rumbles = [];
    this.waves = [];
    this.barks = [];
    this.barkReadyAt = 0;

    // Player entity expects mapData/ropes/groundPlatform on the scene
    const floorData = { x: CAGE.x, y: CAGE.y + CAGE.h - 60, w: CAGE.w, h: 60, isGround: true };
    const perchLeft = { x: CAGE.x + 120, y: CAGE.y + CAGE.h - 220, w: 200, h: 14 };
    const perchRight = { x: CAGE.x + CAGE.w - 320, y: CAGE.y + CAGE.h - 220, w: 200, h: 14 };
    this.mapData = {
      width: WORLD_W,
      height: WORLD_H,
      platforms: [floorData, perchLeft, perchRight],
      ropes: [],
      region: MAPS_DATA[route.from] ? MAPS_DATA[route.from].region : 'shelter',
    };
    this.ropes = [];

    this.physics.world.setBounds(CAGE.x, CAGE.y, CAGE.w, CAGE.h);

    this.createBackground();
    this.createCageFrame();
    this.createPlatforms();
    this.createAmbushTextures();

    // Player (carries HP/MP from the departure map)
    this.player = new Player(this, CAGE.x + 150, CAGE.y + CAGE.h - 130, this.characterData);
    if (this.savedPlayerHp !== null) this.player.hp = this.savedPlayerHp;
    if (this.savedPlayerMp !== null) this.player.mp = this.savedPlayerMp;
    this.platforms.forEach((platform) => {
      this.physics.add.collider(this.player.sprite, platform);
    });
    this.groundPlatform = this.platforms[0];

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // Controls (movement, attack, potions, bark)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = {
      ctrl: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL),
      alt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ALT),
      x: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      one: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      two: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
    };
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.ALT,
      Phaser.Input.Keyboard.KeyCodes.CTRL,
    ]);

    // HUD + countdown
    this.hud = new HUD(this);
    this.hud.setMapName(route.name);
    this.createCountdown();

    // Roll the ambush schedule for this ride (randomized inside windows)
    this.ambushQueue = [];
    if (route.ambush && Array.isArray(route.ambush.spawns)) {
      route.ambush.spawns.forEach((spawn) => {
        this.ambushQueue.push({
          type: spawn.type,
          atMs: Phaser.Math.Between(spawn.atSec[0] * 1000, spawn.atSec[1] * 1000),
          done: false,
        });
      });
      this.ambushQueue.sort((a, b) => a.atMs - b.atMs);
    }

    // Death → back to the departure map (full-heal respawn)
    this.events.once('player-died', () => this.handlePlayerDeath());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('player-died');
      this.scale.off('resize', this.resizeHandler);
    });

    // Keep the screen-fixed backdrop covering the viewport
    this.resizeHandler = () => this.layoutBackground();
    this.scale.on('resize', this.resizeHandler);

    AudioManager.play(this, route.bgm);
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ===== Visuals =====

  createBackground() {
    // Sky gradient
    if (!this.textures.exists('travel_sky')) {
      const g = this.add.graphics();
      g.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xF7DC6F, 0xF7DC6F, 1);
      g.fillRect(0, 0, 64, 256);
      g.generateTexture('travel_sky', 64, 256);
      g.destroy();
    }

    // Passing scenery silhouettes (houses + trees)
    if (!this.textures.exists('travel_mid')) {
      const g = this.add.graphics();
      g.fillStyle(0x1F618D, 0.55);
      g.fillRect(30, 90, 90, 110);
      g.fillTriangle(20, 90, 75, 40, 130, 90);
      g.fillRect(210, 120, 70, 80);
      g.fillTriangle(200, 120, 245, 80, 290, 120);
      g.fillStyle(0x196F3D, 0.55);
      g.fillRect(160, 150, 14, 50);
      g.fillTriangle(140, 155, 167, 95, 194, 155);
      g.fillRect(360, 140, 14, 60);
      g.fillTriangle(340, 150, 367, 80, 394, 150);
      g.fillStyle(0x1F618D, 0.55);
      g.fillRect(430, 110, 60, 90);
      g.generateTexture('travel_mid', 512, 200);
      g.destroy();
    }

    // Road rushing by underneath
    if (!this.textures.exists('travel_near')) {
      const g = this.add.graphics();
      g.fillStyle(0x424949, 1);
      g.fillRect(0, 0, 512, 120);
      g.fillStyle(0xF4D03F, 0.9);
      for (let x = 0; x < 512; x += 128) {
        g.fillRect(x, 52, 64, 10);
      }
      g.fillStyle(0x717D7E, 1);
      g.fillRect(0, 0, 512, 8);
      g.generateTexture('travel_near', 512, 120);
      g.destroy();
    }

    // Screen-fixed layers so any viewport size stays covered
    this.bgSky = this.add.tileSprite(0, 0, 10, 10, 'travel_sky')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.BACKGROUND);
    this.bgMid = this.add.tileSprite(0, 0, 10, 10, 'travel_mid')
      .setOrigin(0, 1).setScrollFactor(0).setDepth(DEPTH.BACKGROUND + 1);
    this.bgNear = this.add.tileSprite(0, 0, 10, 10, 'travel_near')
      .setOrigin(0, 1).setScrollFactor(0).setDepth(DEPTH.BACKGROUND + 2);
    this.layoutBackground();
  }

  layoutBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.bgSky.setPosition(0, 0).setSize(w, h);
    this.bgMid.setPosition(0, h - 90).setSize(w, 200);
    this.bgNear.setPosition(0, h).setSize(w, 120);
  }

  createCageFrame() {
    const g = this.add.graphics().setDepth(DEPTH.PLATFORMS - 1);

    // Cage shell behind the play area
    g.fillStyle(0x9E6B2F, 0.35);
    g.fillRoundedRect(CAGE.x - 30, CAGE.y - 40, CAGE.w + 60, CAGE.h + 50, 26);
    g.lineStyle(10, 0x6E4A1F, 1);
    g.strokeRoundedRect(CAGE.x - 30, CAGE.y - 40, CAGE.w + 60, CAGE.h + 50, 26);

    // Carry handle on top
    g.lineStyle(12, 0x6E4A1F, 1);
    g.beginPath();
    g.arc(CAGE.x + CAGE.w / 2, CAGE.y - 40, 70, Math.PI, 0, false);
    g.strokePath();

    // Bars in front of the play area (translucent, above entities)
    const bars = this.add.graphics().setDepth(DEPTH.EFFECTS + 5);
    bars.lineStyle(6, 0xD5B895, 0.28);
    for (let x = CAGE.x + 40; x < CAGE.x + CAGE.w; x += 90) {
      bars.lineBetween(x, CAGE.y - 30, x, CAGE.y + CAGE.h);
    }
  }

  createPlatforms() {
    this.platforms = [];
    this.mapData.platforms.forEach((platData) => {
      const key = `plat_${platData.w}_${platData.h}`;
      if (!this.textures.exists(key)) {
        const graphics = this.add.graphics();
        if (platData.isGround) {
          graphics.fillStyle(0x8B6914, 1);
          graphics.fillRect(0, 0, platData.w, platData.h);
          graphics.fillStyle(0xC4A265, 1);
          graphics.fillRect(0, 0, platData.w, 4);
        } else {
          graphics.fillStyle(0x6E4A1F, 1);
          graphics.fillRect(0, 0, platData.w, platData.h);
          graphics.fillStyle(0xC4A265, 1);
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
      if (!platData.isGround) {
        platform.body.checkCollision.down = false;
        platform.body.checkCollision.left = false;
        platform.body.checkCollision.right = false;
      }
      this.platforms.push(platform);
    });
  }

  createAmbushTextures() {
    // Vroom - a car blur streaking past
    if (!this.textures.exists('ambush_vroom')) {
      const c = AMBUSH_TYPES.vroom;
      const g = this.add.graphics();
      // Speed lines trailing behind
      g.fillStyle(0xFFFFFF, 0.5);
      g.fillRect(0, 10, 26, 3);
      g.fillRect(4, 22, 22, 3);
      g.fillRect(0, 32, 18, 3);
      // Car body
      g.fillStyle(c.color, 1);
      g.fillRoundedRect(24, 8, 66, 22, 8);
      g.fillStyle(0xF1948A, 1);
      g.fillRoundedRect(42, 0, 30, 14, 6);
      g.fillStyle(0xD6EAF8, 1);
      g.fillRect(46, 3, 10, 9);
      // Wheels
      g.fillStyle(0x17202A, 1);
      g.fillCircle(40, 32, 7);
      g.fillCircle(76, 32, 7);
      g.generateTexture('ambush_vroom', c.width, c.height);
      g.destroy();
    }

    // Rumble - a growling engine block
    if (!this.textures.exists('ambush_rumble')) {
      const c = AMBUSH_TYPES.rumble;
      const g = this.add.graphics();
      // Engine body
      g.fillStyle(c.color, 1);
      g.fillRoundedRect(4, 12, 68, 46, 8);
      // Cylinder ridges
      g.fillStyle(0x4E2600, 1);
      g.fillRect(10, 4, 12, 12);
      g.fillRect(28, 2, 12, 14);
      g.fillRect(46, 4, 12, 12);
      // Bolts
      g.fillStyle(0xB3B6B7, 1);
      g.fillCircle(12, 52, 3);
      g.fillCircle(64, 52, 3);
      g.fillCircle(12, 20, 3);
      g.fillCircle(64, 20, 3);
      // Angry glowing eyes
      g.fillStyle(0xF39C12, 1);
      g.fillRect(20, 26, 12, 8);
      g.fillRect(42, 26, 12, 8);
      g.fillStyle(0x7B241C, 1);
      g.fillRect(24, 28, 5, 4);
      g.fillRect(46, 28, 5, 4);
      // Grumbling grill mouth
      g.fillStyle(0x1B2631, 1);
      g.fillRect(22, 42, 32, 8);
      g.fillStyle(0x7B241C, 1);
      g.fillRect(24, 44, 4, 4);
      g.fillRect(32, 44, 4, 4);
      g.fillRect(40, 44, 4, 4);
      g.fillRect(48, 44, 4, 4);
      g.generateTexture('ambush_rumble', c.width, c.height);
      g.destroy();
    }
  }

  createCountdown() {
    this.countdownText = this.add.text(this.scale.width / 2, 18, '', {
      fontSize: '18px',
      fontFamily: 'Arial Black, Arial',
      color: '#FDFEFE',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH.UI + 6);
  }

  // ===== Main loop =====

  update(time, delta) {
    if (this.arrived) return;

    // Background always scrolls - the ride goes on
    this.bgMid.tilePositionX += delta * 0.12;
    this.bgNear.tilePositionX += delta * 0.4;

    if (this.playerDead) return;

    this.elapsedMs += delta;
    const route = this.route;

    this.player.update(this.cursors, this.keys);
    this.handleHotkeys();
    this.updateAmbushQueue();
    this.updateVrooms(delta);
    this.updateRumbles(delta);
    this.updateBarks();
    this.hud.update(this.player);

    const remaining = Math.max(0, Math.ceil((route.durationSec * 1000 - this.elapsedMs) / 1000));
    this.countdownText.setText(`${route.name}  -  arriving in ${remaining}s`);
    this.countdownText.setPosition(this.scale.width / 2, 18);

    if (this.elapsedMs >= route.durationSec * 1000) {
      this.arrive();
    }
  }

  handleHotkeys() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
      this.player.useItem('cookie');
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
      this.player.useItem('milk');
    }

    // Bark (Swift Paw)
    if (
      this.characterData &&
      this.characterData.id === 'boso_swift' &&
      this.keys.x.isDown &&
      this.player.hp > 0
    ) {
      const now = Date.now();
      if (now > this.barkReadyAt && this.player.mp >= BARK.mpCost) {
        this.player.mp -= BARK.mpCost;
        this.barkReadyAt = now + BARK.cooldownMs;
        const dir = this.player.facingRight ? 1 : -1;
        const bark = this.physics.add.sprite(
          this.player.sprite.x + dir * 26,
          this.player.sprite.y - 4,
          'proj_bark'
        );
        bark.setDepth(DEPTH.EFFECTS);
        bark.body.setAllowGravity(false);
        bark.setCollideWorldBounds(false);
        bark.setFlipX(dir < 0);
        bark.setVelocityX(dir * BARK.speed);
        bark.startX = bark.x;
        this.barks.push(bark);
      }
    }
  }

  // ===== Ambushes =====

  updateAmbushQueue() {
    this.ambushQueue.forEach((entry) => {
      if (entry.done || this.elapsedMs < entry.atMs) return;
      entry.done = true;
      if (entry.type === 'vroom') this.spawnVroom();
      else if (entry.type === 'rumble') this.spawnRumble();
    });
  }

  showAmbushWarning(text, color) {
    const warn = this.add.text(this.scale.width / 2, this.scale.height * 0.22, text, {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      color: color,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI + 7);
    this.tweens.add({
      targets: warn,
      alpha: 0,
      delay: 1400,
      duration: 500,
      onComplete: () => warn.destroy(),
    });
  }

  // Vroom: telegraphed streak across the cage at the player's height
  spawnVroom() {
    const cfg = AMBUSH_TYPES.vroom;
    const fromLeft = Math.random() < 0.5;
    const laneY = Phaser.Math.Clamp(
      this.player.sprite.y,
      CAGE.y + 80,
      CAGE.y + CAGE.h - 80
    );

    this.showAmbushWarning('VROOM INCOMING!', '#E74C3C');

    // Edge telegraph arrow at the lane height
    const edgeX = fromLeft ? CAGE.x - 60 : CAGE.x + CAGE.w + 60;
    const arrow = this.add.text(edgeX, laneY, fromLeft ? '»»' : '««', {
      fontSize: '34px',
      fontFamily: 'Arial Black, Arial',
      color: '#E74C3C',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(DEPTH.EFFECTS);
    this.tweens.add({
      targets: arrow,
      alpha: 0.2,
      duration: 140,
      yoyo: true,
      repeat: Math.floor(cfg.telegraphMs / 280),
    });

    this.time.delayedCall(cfg.telegraphMs, () => {
      arrow.destroy();
      if (this.arrived || this.playerDead) return;

      const sprite = this.physics.add.sprite(edgeX, laneY, 'ambush_vroom');
      sprite.setDepth(DEPTH.MONSTERS);
      sprite.body.setAllowGravity(false);
      sprite.setFlipX(!fromLeft);
      sprite.setVelocityX(fromLeft ? cfg.speed : -cfg.speed);
      this.vrooms.push({ sprite, hitPlayer: false });
      this.cameras.main.shake(150, 0.006);
    });
  }

  updateVrooms() {
    if (this.vrooms.length === 0) return;
    const cfg = AMBUSH_TYPES.vroom;
    const player = this.player;

    this.vrooms = this.vrooms.filter((vroom) => {
      const s = vroom.sprite;
      if (!s.active) return false;

      if (s.x < CAGE.x - 160 || s.x > CAGE.x + CAGE.w + 160) {
        s.destroy();
        return false;
      }

      if (!vroom.hitPlayer && player.hp > 0) {
        const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
          s.getBounds(),
          player.sprite.getBounds()
        );
        if (overlap) {
          vroom.hitPlayer = true;
          const dir = s.body.velocity.x >= 0 ? 1 : -1;
          player.takeDamage(cfg.damage, dir);
        }
      }
      return true;
    });
  }

  // Rumble: shockwave tanker that slowly closes in; can be fought
  spawnRumble() {
    const cfg = AMBUSH_TYPES.rumble;
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? CAGE.x + 60 : CAGE.x + CAGE.w - 60;

    this.showAmbushWarning('SOMETHING RUMBLES BELOW...', '#F39C12');

    const sprite = this.physics.add.sprite(x, CAGE.y + CAGE.h - 100, 'ambush_rumble');
    sprite.setDepth(DEPTH.MONSTERS);
    sprite.setCollideWorldBounds(true);
    this.platforms.forEach((platform) => {
      this.physics.add.collider(sprite, platform);
    });

    this.rumbles.push({
      sprite,
      hp: cfg.hp,
      maxHp: cfg.hp,
      isHit: false,
      contactCooldown: false,
      nextWaveAt: this.elapsedMs + 1200,
      hpBar: this.add.graphics().setDepth(DEPTH.UI - 4),
    });

    // Arrival tremor
    this.cameras.main.shake(220, 0.008);
    this.tweens.add({
      targets: sprite,
      scaleY: { from: 0.6, to: 1 },
      duration: 250,
      ease: 'Back.easeOut',
    });
  }

  updateRumbles(delta) {
    if (this.rumbles.length === 0 && this.waves.length === 0) return;
    const cfg = AMBUSH_TYPES.rumble;
    const player = this.player;

    this.rumbles = this.rumbles.filter((rumble) => {
      const s = rumble.sprite;
      if (!s.active) {
        rumble.hpBar.destroy();
        return false;
      }
      // Dying (death tween playing): keep the sprite but skip all logic
      if (rumble.hp <= 0) return true;

      // Slow, inevitable advance
      if (player.hp > 0) {
        const dir = player.sprite.x < s.x ? -1 : 1;
        s.setVelocityX(cfg.speed * dir);
        s.setFlipX(dir < 0);
        // Constant grumbling shiver
        s.setAngle(Math.sin(Date.now() / 60) * 2);
      } else {
        s.setVelocityX(0);
      }

      // Shockwave pulse
      if (this.elapsedMs > rumble.nextWaveAt) {
        rumble.nextWaveAt = this.elapsedMs + cfg.waveIntervalMs;
        const gfx = this.add.graphics().setDepth(DEPTH.EFFECTS);
        this.waves.push({ x: s.x, y: s.y, radius: 30, hitPlayer: false, gfx });
        this.cameras.main.shake(120, 0.005);
      }

      // HP bar
      const barW = 46;
      rumble.hpBar.clear();
      rumble.hpBar.fillStyle(0x333333, 0.8);
      rumble.hpBar.fillRect(s.x - barW / 2, s.y - 48, barW, 5);
      rumble.hpBar.fillStyle(0xE74C3C, 1);
      rumble.hpBar.fillRect(s.x - barW / 2, s.y - 48, barW * (rumble.hp / rumble.maxHp), 5);

      // Player melee
      if (player.attackHitbox && !rumble.isHit && player.hp > 0) {
        const hitbox = player.attackHitbox;
        const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
          new Phaser.Geom.Rectangle(
            hitbox.x - PLAYER.ATTACK_WIDTH / 2,
            hitbox.y - PLAYER.ATTACK_HEIGHT / 2,
            PLAYER.ATTACK_WIDTH,
            PLAYER.ATTACK_HEIGHT
          ),
          s.getBounds()
        );
        if (overlap) {
          rumble.isHit = true;
          const damage = player.attackPower + Phaser.Math.Between(-3, 3);
          this.damageRumble(rumble, damage);
          this.time.delayedCall(PLAYER.ATTACK_DURATION + 50, () => {
            rumble.isHit = false;
          });
        }
      }

      // Contact damage
      if (!rumble.contactCooldown && player.hp > 0 && s.active) {
        const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
          player.sprite.getBounds(),
          s.getBounds()
        );
        if (overlap) {
          rumble.contactCooldown = true;
          const dir = player.sprite.x < s.x ? -1 : 1;
          player.takeDamage(cfg.touchDamage, dir);
          this.time.delayedCall(1000, () => {
            rumble.contactCooldown = false;
          });
        }
      }

      return true;
    });

    // Expanding shockwave rings
    const dt = (delta || 16) / 1000;
    this.waves = this.waves.filter((wave) => {
      wave.radius += cfg.waveSpeed * dt;
      if (wave.radius >= cfg.waveMaxRadius) {
        wave.gfx.destroy();
        return false;
      }
      const fade = 1 - wave.radius / cfg.waveMaxRadius;
      wave.gfx.clear();
      wave.gfx.lineStyle(5, 0xF39C12, 0.3 + fade * 0.5);
      wave.gfx.strokeEllipse(wave.x, wave.y, wave.radius * 2, wave.radius * 1.5);

      if (!wave.hitPlayer && player.hp > 0) {
        const dist = Phaser.Math.Distance.Between(
          wave.x, wave.y, player.sprite.x, player.sprite.y
        );
        if (Math.abs(dist - wave.radius) < 26) {
          wave.hitPlayer = true;
          const dir = player.sprite.x < wave.x ? -1 : 1;
          player.takeDamage(cfg.waveDamage, dir);
        }
      }
      return true;
    });
  }

  damageRumble(rumble, damage) {
    rumble.hp -= damage;
    this.showDamageNumber(rumble.sprite.x, rumble.sprite.y - 20, damage);

    rumble.sprite.setTintFill(0xFFFFFF);
    this.time.delayedCall(80, () => {
      if (rumble.sprite.active) rumble.sprite.clearTint();
    });

    if (rumble.hp <= 0) {
      const cfg = AMBUSH_TYPES.rumble;
      // Rewards go straight to the player (no pickups mid-ride)
      if (this.player.hp > 0) {
        if (cfg.exp) this.player.gainExp(cfg.exp);
        if (cfg.drops) {
          const treats = Phaser.Math.Between(cfg.drops.treatsMin, cfg.drops.treatsMax);
          this.player.gainTreats(treats);
          this.showDamageNumber(rumble.sprite.x, rumble.sprite.y - 44, `+${treats} Treats`, '#F1C40F');
        }
      }
      rumble.hpBar.clear();
      this.tweens.add({
        targets: rumble.sprite,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        angle: 40,
        duration: 350,
        onComplete: () => rumble.sprite.destroy(),
      });
    }
  }

  updateBarks() {
    if (this.barks.length === 0) return;

    this.barks = this.barks.filter((bark) => {
      if (!bark.active) return false;
      if (Math.abs(bark.x - bark.startX) > BARK.maxDist) {
        bark.destroy();
        return false;
      }

      for (const rumble of this.rumbles) {
        if (!rumble.sprite.active || rumble.hp <= 0) continue;
        const overlap = Phaser.Geom.Intersects.RectangleToRectangle(
          bark.getBounds(),
          rumble.sprite.getBounds()
        );
        if (overlap) {
          const damage =
            Math.max(5, Math.round(this.player.attackPower * 0.8)) + Phaser.Math.Between(-2, 2);
          this.damageRumble(rumble, damage);
          bark.destroy();
          return false;
        }
      }
      return true;
    });
  }

  // Floating combat text (same look as GameScene damage numbers)
  showDamageNumber(x, y, amount, color) {
    const text = this.add.text(x, y - 20, `${amount}`, {
      fontSize: '18px',
      fontFamily: UI.FONT_FAMILY,
      color: color || '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(DEPTH.EFFECTS);
    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  // ===== Ride endings =====

  arrive() {
    if (this.arrived) return;
    this.arrived = true;
    const route = this.route;
    const target = MAPS_DATA[route.to];

    this.countdownText.setText(`${route.name}  -  arrived!`);

    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME, {
        mapKey: route.to,
        spawnX: target.spawnX,
        spawnY: target.spawnY,
        characterData: this.characterData,
        playerHp: Math.max(1, this.player.hp),
        playerMp: this.player.mp,
      });
    });
  }

  handlePlayerDeath() {
    if (this.arrived || this.playerDead) return;
    this.playerDead = true;

    const route = this.route;
    const from = MAPS_DATA[route.from];
    const w = this.scale.width;
    const h = this.scale.height;

    const pipeline = this.cameras.main.postFX.addColorMatrix();
    pipeline.grayscale(1);

    const overlay = this.add.graphics().setDepth(DEPTH.UI + 10).setScrollFactor(0);
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, w, h);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 0.5, duration: 1000 });

    this.time.delayedCall(500, () => {
      this.add.text(w / 2, h / 2 - 30, 'You Died', {
        fontSize: '36px',
        fontFamily: UI.FONT_FAMILY,
        color: '#E74C3C',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(DEPTH.UI + 11).setScrollFactor(0);

      const restartText = this.add.text(
        w / 2,
        h / 2 + 30,
        `Press SPACE to wake up back at ${from.name}`,
        {
          fontSize: '16px',
          fontFamily: UI.FONT_FAMILY,
          color: '#95A5A6',
        }
      ).setOrigin(0.5).setDepth(DEPTH.UI + 11).setScrollFactor(0);
      this.tweens.add({
        targets: restartText,
        alpha: 0.3,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });

      // Back to the departure map, full-heal respawn (no HP/MP passed)
      this.input.keyboard.once('keydown-SPACE', () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SCENES.GAME, {
            mapKey: route.from,
            spawnX: from.spawnX,
            spawnY: from.spawnY,
            characterData: this.characterData,
          });
        });
      });
    });
  }
}
