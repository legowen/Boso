// src/ui/HUD.js
// Bottom-center HUD (HP, MP display) - responsive to screen resize

import { UI, DEPTH } from '../utils/constants.js';

const HUD_WIDTH = 340;
const HUD_HEIGHT = 60;
const HUD_PADDING = 12;
const BAR_WIDTH = 200;
const HP_BAR_HEIGHT = 16;
const MP_BAR_HEIGHT = 12;
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
    this.createMapName();

    // Position on create
    this.repositionHUD();

    // Listen for resize events
    this.scene.scale.on('resize', () => this.repositionHUD());
  }

  repositionHUD() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // Center horizontally, anchor to bottom
    const hudX = (w - HUD_WIDTH) / 2;
    const hudY = h - HUD_HEIGHT - BOTTOM_MARGIN;

    this.container.setPosition(hudX, hudY);

    // Map name: top-right corner of screen
    if (this.mapNameText) {
      this.mapNameText.setPosition(w - hudX - 10, -hudY + 16);
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
  }

  setMapName(name, mapKey) {
    if (mapKey === 'ruins') {
      this.mapNameText.setText('5-1 Ancient Ruins');
    } else if (mapKey === 'shadow') {
      this.mapNameText.setText('5-2 Shadow Realm');
    } else {
      this.mapNameText.setText(name);
    }
  }
}