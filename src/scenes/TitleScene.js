// src/scenes/TitleScene.js
// Game intro / title screen

import Phaser from 'phaser';
import { SCENES } from '../utils/constants.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';
import { usesTouchControls } from '../ui/TouchControls.js';
import { MenuButton, MenuNav } from '../ui/Menu.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    this.isStarting = false;
    const w = this.scale.width;
    const h = this.scale.height;
    const compact = h < 500;

    // Title BGM (silent if no file was dropped into public/assets/bgm)
    AudioManager.play(this, 'bgm_title');

    // === Background image - cover entire screen (fallback gradient if missing) ===
    if (this.textures.exists('bg_garden')) {
      this.bg = this.add.image(w / 2, h / 2, 'bg_garden');
      this.coverBackground(w, h);

      // Resize listener for responsive background (detached on shutdown -
      // scale is game-global and would keep dead references otherwise)
      const resizeHandler = () => { if (!this.isStarting) this.scene.restart(); };
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
    const titleShadow = this.add.text(w / 2 + 3, h * (compact ? 0.17 : 0.28) + 3, 'BOSO', {
      fontSize: compact ? '48px' : '72px',
      fontFamily: 'Arial Black, Arial',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0.4);

    const title = this.add.text(w / 2, h * (compact ? 0.17 : 0.28), 'BOSO', {
      fontSize: compact ? '48px' : '72px',
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
    this.add.text(w / 2, h * (compact ? 0.29 : 0.38), '"Look at me!"', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#F7DC6F',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * (compact ? 0.36 : 0.43), "Two little cats. One big adventure.", {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#95A5A6',
    }).setOrigin(0.5);

    this.add.image(w / 2 - 56, h * (compact ? 0.48 : 0.52), 'portrait_seoli').setDisplaySize(compact ? 60 : 88, compact ? 60 : 88);
    this.add.image(w / 2 + 56, h * (compact ? 0.48 : 0.52), 'portrait_bomi').setDisplaySize(compact ? 60 : 88, compact ? 60 : 88);

    // === Menu: START when no slot holds a save, otherwise CONTINUE / NEW GAME ===
    const hasSave = SaveManager.hasAnySave();
    const entries = hasSave
      ? [
        { label: 'CONTINUE', onSelect: () => this.go(SCENES.SAVE_SLOTS, { mode: 'continue' }) },
        { label: 'NEW GAME', onSelect: () => this.go(SCENES.SAVE_SLOTS, { mode: 'new' }) },
      ]
      : [{ label: 'START', onSelect: () => this.go(SCENES.CHARACTER_SELECT, { slot: 1 }) }];

    const btnW = compact ? 200 : 220;
    const btnH = compact ? 38 : 50;
    const btnGap = compact ? 8 : 12;
    const btnTop = h * (compact ? 0.62 : 0.60);
    const orange = { fill: 0xF39C12, fillFocus: 0xE67E22, stroke: 0xE67E22, strokeFocus: 0xFFFFFF, text: '#FFFFFF' };
    const buttons = entries.map((entry, index) => new MenuButton(this, {
      x: w / 2,
      y: btnTop + btnH / 2 + index * (btnH + btnGap),
      width: btnW,
      height: btnH,
      lines: [entry.label],
      fontSize: compact ? 17 : 22,
      palette: orange,
      onSelect: entry.onSelect,
    }));
    this.nav = new MenuNav(this);
    this.nav.setButtons(buttons, 0);

    const menuBottom = btnTop + entries.length * btnH + (entries.length - 1) * btnGap;
    const hintY = menuBottom + (compact ? 14 : 22);
    const hint = usesTouchControls()
      ? 'Tap an option'
      : (entries.length > 1 ? 'UP / DOWN to choose, ENTER to select' : 'Press ENTER or SPACE');
    this.add.text(w / 2, hintY, hint, {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#D0D0D0',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Demo-clear badge (any readable slot that cleared the demo)
    if (SaveManager.anySlotHasFlag('demoCleared')) {
      const badge = this.add.text(w / 2, compact ? 14 : hintY + 26, '* DEMO CLEARED *', {
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

    // Version text
    this.add.text(w / 2, Math.max(h * 0.92, hintY + 18), 'Seoli & Bomi - Pixel Adventure', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#444444',
    }).setOrigin(0.5);

    // Storage blocked (private mode, site data disabled): the game still
    // runs, but nothing survives closing the tab.
    if (!SaveManager.isStorageAvailable()) {
      this.add.text(w / 2, h - 8, "Progress can't be saved in this browser", {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#E8B04A',
      }).setOrigin(0.5, 1);
    }
  }

  coverBackground(screenW, screenH) {
    // Get actual image dimensions
    const tex = this.textures.get('bg_garden');
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

  // Fade out, then open another scene (guards against click + key stacking).
  go(sceneKey, data) {
    if (this.isStarting) return;
    this.isStarting = true;

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, data);
    });
  }
}
