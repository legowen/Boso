// src/ui/HUD.js
// Bottom-center HUD (HP, MP display) - responsive to screen resize

import { UI, DEPTH } from '../utils/constants.js';

const HUD_WIDTH = 380;
const HUD_HEIGHT = 78;
const HUD_PADDING = 12;
const BAR_WIDTH = 200;
const HP_BAR_HEIGHT = 16;
const MP_BAR_HEIGHT = 12;
const EXP_BAR_HEIGHT = 8;
const BOTTOM_MARGIN = 20;

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(DEPTH.UI);
    this.container.setScrollFactor(0);

    this.createHUDBox();
    this.createHPBar();
    this.createMPBar();
    this.createEXPBar();
    this.createLevelText();
    this.createMapName();

    // Position on create
    this.repositionHUD();

    // Listen for resize events (scale is game-global: detach on scene shutdown
    // or restarted scenes would stack dead listeners)
    this.resizeHandler = () => this.repositionHUD();
    this.scene.scale.on('resize', this.resizeHandler);
    this.scene.events.once('shutdown', () => {
      this.scene.scale.off('resize', this.resizeHandler);
    });
  }

  repositionHUD() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // Center horizontally, anchor to bottom
    const hudX = (w - HUD_WIDTH) / 2;
    const hudY = h - HUD_HEIGHT - BOTTOM_MARGIN;

    this.container.setPosition(hudX, hudY);

    // Map name: top-right corner of screen; treats right below it
    if (this.mapNameText) {
      this.mapNameText.setPosition(w - hudX - 10, -hudY + 16);
    }
    if (this.treatsText) {
      this.treatsText.setPosition(w - hudX - 10, -hudY + 40);
    }
  }

  createHUDBox() {
    this.bg = this.scene.add.graphics();
    // Dark rounded background
    this.bg.fillStyle(0x000000, 0.75);
    this.bg.fillRoundedRect(0, 0, HUD_WIDTH, HUD_HEIGHT, 8);
    // Border
    this.bg.lineStyle(1, 0x555555, 0.6);
    this.bg.strokeRoundedRect(0, 0, HUD_WIDTH, HUD_HEIGHT, 8);
    this.container.add(this.bg);
  }

  createHPBar() {
    const labelX = HUD_PADDING;
    const barX = HUD_PADDING + 30;
    const barY = 12;

    // HP label
    this.hpLabel = this.scene.add.text(labelX, barY, 'HP', {
      fontSize: '13px',
      fontFamily: UI.FONT_FAMILY,
      color: '#E74C3C',
      fontStyle: 'bold',
    });
    this.container.add(this.hpLabel);

    // Background bar
    this.hpBg = this.scene.add.graphics();
    this.hpBg.fillStyle(UI.HP_BG_COLOR, 1);
    this.hpBg.fillRoundedRect(barX, barY, BAR_WIDTH, HP_BAR_HEIGHT, 4);
    this.container.add(this.hpBg);

    // HP bar (filled)
    this.hpBar = this.scene.add.graphics();
    this.container.add(this.hpBar);

    // HP value text
    this.hpText = this.scene.add.text(barX + BAR_WIDTH + 8, barY + 1, '', {
      fontSize: '12px',
      fontFamily: UI.FONT_FAMILY,
      color: UI.FONT_COLOR,
    });
    this.container.add(this.hpText);

    // Store positions for update
    this.hpBarX = barX;
    this.hpBarY = barY;
  }

  createMPBar() {
    const labelX = HUD_PADDING;
    const barX = HUD_PADDING + 30;
    const barY = 34;

    // MP label
    this.mpLabel = this.scene.add.text(labelX, barY, 'MP', {
      fontSize: '13px',
      fontFamily: UI.FONT_FAMILY,
      color: '#3498DB',
      fontStyle: 'bold',
    });
    this.container.add(this.mpLabel);

    // Background bar
    this.mpBg = this.scene.add.graphics();
    this.mpBg.fillStyle(UI.MP_BG_COLOR, 1);
    this.mpBg.fillRoundedRect(barX, barY, BAR_WIDTH, MP_BAR_HEIGHT, 4);
    this.container.add(this.mpBg);

    // MP bar (filled)
    this.mpBar = this.scene.add.graphics();
    this.container.add(this.mpBar);

    // MP value text
    this.mpText = this.scene.add.text(barX + BAR_WIDTH + 8, barY, '', {
      fontSize: '11px',
      fontFamily: UI.FONT_FAMILY,
      color: UI.FONT_COLOR,
    });
    this.container.add(this.mpText);

    // Store positions for update
    this.mpBarX = barX;
    this.mpBarY = barY;
  }

  createEXPBar() {
    const labelX = HUD_PADDING;
    const barX = HUD_PADDING + 30;
    const barY = 56;

    this.expLabel = this.scene.add.text(labelX, barY - 2, 'EXP', {
      fontSize: '10px',
      fontFamily: UI.FONT_FAMILY,
      color: '#F1C40F',
      fontStyle: 'bold',
    });
    this.container.add(this.expLabel);

    this.expBg = this.scene.add.graphics();
    this.expBg.fillStyle(UI.EXP_BG_COLOR, 1);
    this.expBg.fillRoundedRect(barX, barY, BAR_WIDTH, EXP_BAR_HEIGHT, 3);
    this.container.add(this.expBg);

    this.expBar = this.scene.add.graphics();
    this.container.add(this.expBar);

    this.expText = this.scene.add.text(barX + BAR_WIDTH + 8, barY - 2, '', {
      fontSize: '10px',
      fontFamily: UI.FONT_FAMILY,
      color: UI.FONT_COLOR,
    });
    this.container.add(this.expText);

    this.expBarX = barX;
    this.expBarY = barY;
  }

  createLevelText() {
    this.levelText = this.scene.add.text(HUD_WIDTH - HUD_PADDING, 8, '', {
      fontSize: '14px',
      fontFamily: 'Arial Black, Arial',
      color: '#F1C40F',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);
    this.container.add(this.levelText);
  }

  createMapName() {
    this.mapNameText = this.scene.add.text(0, 0, '', {
      fontSize: '16px',
      fontFamily: UI.FONT_FAMILY,
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0);
    this.container.add(this.mapNameText);

    // Treats (currency) under the map name
    this.treatsText = this.scene.add.text(0, 0, '', {
      fontSize: '13px',
      fontFamily: UI.FONT_FAMILY,
      color: '#F1C40F',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);
    this.container.add(this.treatsText);
  }

  update(player) {
    if (!player) return;

    // HP bar update
    const hpRatio = player.hp / player.maxHp;
    this.hpBar.clear();
    this.hpBar.fillStyle(UI.HP_COLOR, 1);
    this.hpBar.fillRoundedRect(
      this.hpBarX,
      this.hpBarY,
      BAR_WIDTH * hpRatio,
      HP_BAR_HEIGHT,
      4
    );
    this.hpText.setText(`${player.hp}/${player.maxHp}`);

    // MP bar update
    const mpRatio = player.mp / player.maxMp;
    this.mpBar.clear();
    this.mpBar.fillStyle(UI.MP_COLOR, 1);
    this.mpBar.fillRoundedRect(
      this.mpBarX,
      this.mpBarY,
      BAR_WIDTH * mpRatio,
      MP_BAR_HEIGHT,
      4
    );
    this.mpText.setText(`${player.mp}/${player.maxMp}`);

    // EXP bar + level (only when the leveling system is present)
    if (typeof player.level === 'number' && this.expBar) {
      const need = player.expToNext();
      const expRatio = Math.min(1, player.exp / need);
      const fillWidth = BAR_WIDTH * expRatio;
      this.expBar.clear();
      if (fillWidth >= 8) {
        this.expBar.fillStyle(UI.EXP_COLOR, 1);
        this.expBar.fillRoundedRect(this.expBarX, this.expBarY, fillWidth, 8, 3);
      }
      this.expText.setText(`${player.exp}/${need}`);
      this.levelText.setText(`Lv.${player.level}`);
    }

    // Treats counter
    if (this.treatsText && typeof player.treats === 'number') {
      this.treatsText.setText(`Treats: ${player.treats}`);
    }
  }

  setMapName(name) {
    this.mapNameText.setText(name);
  }
}