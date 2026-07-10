// src/scenes/TitleScene.js
// Game intro / title screen

import Phaser from 'phaser';
import { SCENES } from '../utils/constants.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Title BGM (silent if no file was dropped into public/assets/bgm)
    AudioManager.play(this, 'bgm_title');

    // === Background image - cover entire screen (fallback gradient if missing) ===
    if (this.textures.exists('title_bg')) {
      this.bg = this.add.image(w / 2, h / 2, 'title_bg');
      this.coverBackground(w, h);

      // Resize listener for responsive background (detached on shutdown -
      // scale is game-global and would keep dead references otherwise)
      const resizeHandler = (gameSize) => {
        const nw = gameSize.width;
        const nh = gameSize.height;
        this.bg.setPosition(nw / 2, nh / 2);
        this.coverBackground(nw, nh);
      };
      this.scale.on('resize', resizeHandler);
      this.events.once('shutdown', () => {
        this.scale.off('resize', resizeHandler);
      });
    } else {
      const fallback = this.add.graphics();
      fallback.fillGradientStyle(0x1A1A2E, 0x1A1A2E, 0x3D2B1A, 0x3D2B1A, 1);
      fallback.fillRect(0, 0, w * 2, h * 2);
    }

    // Dark overlay for text readability
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.4);
    overlay.fillRect(0, 0, w * 2, h * 2);

    // === Title text ===
    // "BOSO" main title with glow effect
    const titleShadow = this.add.text(w / 2 + 3, h * 0.28 + 3, 'BOSO', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Arial',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0.4);

    const title = this.add.text(w / 2, h * 0.28, 'BOSO', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Arial',
      color: '#F39C12',
      stroke: '#E67E22',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Title float animation
    this.tweens.add({
      targets: [title, titleShadow],
      y: '-=8',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    this.add.text(w / 2, h * 0.38, '"Look at me!"', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#F7DC6F',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.43, "A little dog's big adventure", {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#95A5A6',
    }).setOrigin(0.5);

    // Demo-clear badge (persisted via SaveManager)
    if (SaveManager.getFlag('demoCleared')) {
      const badge = this.add.text(w / 2, h * 0.49, '* DEMO CLEARED *', {
        fontSize: '14px',
        fontFamily: 'Arial Black, Arial',
        color: '#F1C40F',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: badge,
        alpha: 0.5,
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
    }

    // === Press Start Button ===
    const btnW = 220;
    const btnH = 50;
    const btnX = w / 2 - btnW / 2;
    const btnY = h * 0.58;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xF39C12, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
    btnBg.lineStyle(2, 0xE67E22, 1);
    btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 10);

    const btnText = this.add.text(w / 2, btnY + btnH / 2, 'PRESS START', {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Button pulse animation
    this.tweens.add({
      targets: [btnBg, btnText],
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Make button interactive
    const btnZone = this.add.zone(w / 2, btnY + btnH / 2, btnW, btnH).setInteractive();
    btnZone.on('pointerdown', () => this.startGame());
    btnZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xE67E22, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
      btnBg.lineStyle(2, 0xD35400, 1);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 10);
    });
    btnZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xF39C12, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
      btnBg.lineStyle(2, 0xE67E22, 1);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 10);
    });

    // Space key to start
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());

    // "Press SPACE" hint
    this.add.text(w / 2, h * 0.72, 'or press SPACE', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#666666',
    }).setOrigin(0.5);

    // Version text
    this.add.text(w / 2, h * 0.92, 'v0.4.0 - Look at me!', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#444444',
    }).setOrigin(0.5);
  }

  coverBackground(screenW, screenH) {
    // Get actual image dimensions
    const tex = this.textures.get('title_bg');
    const imgW = tex.source[0].width;
    const imgH = tex.source[0].height;
    const imgRatio = imgW / imgH;
    const screenRatio = screenW / screenH;

    if (screenRatio > imgRatio) {
      // Screen is wider than image - fit to width
      this.bg.setDisplaySize(screenW, screenW / imgRatio);
    } else {
      // Screen is taller than image - fit to height
      this.bg.setDisplaySize(screenH * imgRatio, screenH);
    }
  }

  startGame() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.CHARACTER_SELECT);
    });
  }
}