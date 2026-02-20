// src/ui/HUD.js
// Bottom HUD (HP, MP display)

import { UI, GAME_WIDTH, GAME_HEIGHT, DEPTH } from '../utils/constants.js';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(DEPTH.UI);
    this.container.setScrollFactor(0); // Not affected by camera movement

    this.createBackground();
    this.createHPBar();
    this.createMPBar();
    this.createMapName();
  }

  createBackground() {
    const bgY = GAME_HEIGHT - UI.HUD_HEIGHT;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, bgY, GAME_WIDTH, UI.HUD_HEIGHT);
    bg.lineStyle(1, 0x555555, 0.8);
    bg.lineBetween(0, bgY, GAME_WIDTH, bgY);
    this.container.add(bg);
  }

  createHPBar() {
    const barX = 80;
    const barY = GAME_HEIGHT - UI.HUD_HEIGHT + 16;

    // HP label
    this.hpLabel = this.scene.add.text(barX - 30, barY, 'HP', {
      fontSize: '13px',
      fontFamily: UI.FONT_FAMILY,
      color: '#E74C3C',
      fontStyle: 'bold',
    });
    this.container.add(this.hpLabel);

    // Background bar
    this.hpBg = this.scene.add.graphics();
    this.hpBg.fillStyle(UI.HP_BG_COLOR, 1);
    this.hpBg.fillRect(barX, barY, UI.HP_BAR_WIDTH, UI.HP_BAR_HEIGHT);
    this.container.add(this.hpBg);

    // HP bar
    this.hpBar = this.scene.add.graphics();
    this.container.add(this.hpBar);

    // HP value text
    this.hpText = this.scene.add.text(barX + UI.HP_BAR_WIDTH + 8, barY, '', {
      fontSize: '12px',
      fontFamily: UI.FONT_FAMILY,
      color: UI.FONT_COLOR,
    });
    this.container.add(this.hpText);
  }

  createMPBar() {
    const barX = 80;
    const barY = GAME_HEIGHT - UI.HUD_HEIGHT + 38;

    // MP label
    this.mpLabel = this.scene.add.text(barX - 30, barY, 'MP', {
      fontSize: '13px',
      fontFamily: UI.FONT_FAMILY,
      color: '#3498DB',
      fontStyle: 'bold',
    });
    this.container.add(this.mpLabel);

    // Background bar
    this.mpBg = this.scene.add.graphics();
    this.mpBg.fillStyle(UI.MP_BG_COLOR, 1);
    this.mpBg.fillRect(barX, barY, UI.MP_BAR_WIDTH, UI.MP_BAR_HEIGHT);
    this.container.add(this.mpBg);

    // MP bar
    this.mpBar = this.scene.add.graphics();
    this.container.add(this.mpBar);

    // MP value text
    this.mpText = this.scene.add.text(barX + UI.MP_BAR_WIDTH + 8, barY, '', {
      fontSize: '11px',
      fontFamily: UI.FONT_FAMILY,
      color: UI.FONT_COLOR,
    });
    this.container.add(this.mpText);
  }

  createMapName() {
    this.mapNameText = this.scene.add.text(GAME_WIDTH - 20, 16, '', {
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
    const barX = 80;

    this.hpBar.clear();
    this.hpBar.fillStyle(UI.HP_COLOR, 1);
    this.hpBar.fillRect(
      barX,
      GAME_HEIGHT - UI.HUD_HEIGHT + 16,
      UI.HP_BAR_WIDTH * hpRatio,
      UI.HP_BAR_HEIGHT
    );
    this.hpText.setText(`${player.hp}/${player.maxHp}`);

    // MP bar update
    const mpRatio = player.mp / player.maxMp;
    this.mpBar.clear();
    this.mpBar.fillStyle(UI.MP_COLOR, 1);
    this.mpBar.fillRect(
      barX,
      GAME_HEIGHT - UI.HUD_HEIGHT + 38,
      UI.MP_BAR_WIDTH * mpRatio,
      UI.MP_BAR_HEIGHT
    );
    this.mpText.setText(`${player.mp}/${player.maxMp}`);
  }

  setMapName(name) {
    this.mapNameText.setText(name);
  }
}
