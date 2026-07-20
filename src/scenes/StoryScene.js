// src/scenes/StoryScene.js
// Intro story sequence shown between character select and the game.
// Displays STORY.intro one line at a time; SPACE/click advances,
// ESC skips everything, then starts GameScene at the starting map.

import Phaser from 'phaser';
import { SCENES, UI } from '../utils/constants.js';
import { STORY } from '../data/story.js';
import { START_MAP } from '../data/maps.js';

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super(SCENES.STORY);
  }

  init(data) {
    this.characterData = data && data.characterData ? data.characterData : null;
    this.freshRun = !!(data && data.freshRun);
    this.lineIndex = 0;
    this.isFinishing = false;
    this.fadeTween = null;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // === Background: dark vertical gradient ===
    this.bg = this.add.graphics();

    // === Subtle procedural paw print behind the text ===
    this.paw = this.add.graphics();

    // === Story text (centered, wrapped) ===
    this.storyText = this.add.text(w / 2, h / 2, '', {
      fontSize: '24px',
      fontFamily: UI.FONT_FAMILY,
      color: UI.FONT_COLOR,
      align: 'center',
      lineSpacing: 10,
      wordWrap: { width: Math.min(700, w - 80) },
    }).setOrigin(0.5).setAlpha(0);

    // === Controls hint ===
    this.hintText = this.add.text(w / 2, h - 50, 'SPACE / click — next      ESC — skip', {
      fontSize: '14px',
      fontFamily: UI.FONT_FAMILY,
      color: '#7F8C8D',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.hintText,
      alpha: 0.4,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.layout(w, h);
    // Swallow auto-repeat leaking in from character select
    this.nextAdvanceAt = Date.now() + 400;
    this.showLine(0);

    // === Input handlers (stored so they can be removed on shutdown) ===
    this.onAdvanceKey = () => this.advance();
    this.onSkipKey = () => this.skipAll();
    this.onPointerDown = () => this.advance();
    this.onResize = (gameSize) => this.layout(gameSize.width, gameSize.height);

    this.input.keyboard.on('keydown-SPACE', this.onAdvanceKey);
    this.input.keyboard.on('keydown-ESC', this.onSkipKey);
    this.input.on('pointerdown', this.onPointerDown);
    this.scale.on('resize', this.onResize);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  // Responsive positioning — also called on window resize.
  layout(w, h) {
    this.drawBackground(w, h);
    this.drawPawPrint(w, h);
    this.storyText.setPosition(w / 2, h / 2);
    this.storyText.setWordWrapWidth(Math.min(700, w - 80));
    this.hintText.setPosition(w / 2, h - 50);
  }

  drawBackground(w, h) {
    this.bg.clear();
    this.bg.fillGradientStyle(0x0A0A14, 0x0A0A14, 0x241536, 0x241536, 1);
    this.bg.fillRect(0, 0, w, h);
  }

  drawPawPrint(w, h) {
    this.paw.clear();
    const cx = w / 2;
    const cy = h / 2;
    this.paw.fillStyle(0xFFFFFF, 0.05);
    // Main pad
    this.paw.fillEllipse(cx, cy + 70, 150, 120);
    // Three toe pads
    this.paw.fillCircle(cx - 90, cy - 45, 42);
    this.paw.fillCircle(cx, cy - 80, 45);
    this.paw.fillCircle(cx + 90, cy - 45, 42);
  }

  showLine(index) {
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }
    const playerName =
      this.characterData && this.characterData.name ? this.characterData.name : 'little one';
    this.storyText.setText(STORY.intro[index].replace(/\{player\}/g, playerName));
    this.storyText.setAlpha(0);
    this.fadeTween = this.tweens.add({
      targets: this.storyText,
      alpha: 1,
      duration: 500,
      ease: 'Sine.easeOut',
    });
  }

  advance() {
    if (this.isFinishing) return;
    // Debounce: key auto-repeat must not blast through the whole intro
    const now = Date.now();
    if (now < (this.nextAdvanceAt || 0)) return;
    this.nextAdvanceAt = now + 300;

    this.lineIndex += 1;
    if (this.lineIndex >= STORY.intro.length) {
      this.finish();
    } else {
      this.showLine(this.lineIndex);
    }
  }

  skipAll() {
    this.finish();
  }

  finish() {
    if (this.isFinishing) return;
    this.isFinishing = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME, {
        mapKey: START_MAP,
        characterData: this.characterData,
        freshRun: this.freshRun,
      });
    });
  }

  cleanup() {
    if (this.input && this.input.keyboard) {
      this.input.keyboard.off('keydown-SPACE', this.onAdvanceKey);
      this.input.keyboard.off('keydown-ESC', this.onSkipKey);
    }
    if (this.input) {
      this.input.off('pointerdown', this.onPointerDown);
    }
    this.scale.off('resize', this.onResize);
  }
}
