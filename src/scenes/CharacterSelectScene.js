// src/scenes/CharacterSelectScene.js
// Character selection screen - MapleStory style with platform

import Phaser from 'phaser';
import { SCENES } from '../utils/constants.js';

// Character definitions
const CHARACTERS = [
  {
    id: 'bomi',
    name: 'Bomi',
    className: 'Warrior',
    color: 0xF39C12,
    desc: 'Melee fighter with high HP.\nSlow but powerful strikes.',
    stats: { hp: 150, mp: 30, atk: 20, spd: 140 },
  },
  {
    id: 'seoli',
    name: 'Seoli',
    className: 'Mage',
    color: 0x9B59B6,
    desc: 'Ranged magic attacker.\nFast but lower damage.',
    stats: { hp: 80, mp: 100, atk: 10, spd: 220, jumpPower: -550 },
  },
];

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.CHARACTER_SELECT);
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.selectedIndex = 0;

    // === Background - warm forest tone ===
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2C1810, 0x2C1810, 0x1A2A10, 0x1A2A10, 1);
    bg.fillRect(0, 0, w, h);

    // Background trees
    this.drawTrees(w, h);

    // === Wooden sign board (title) ===
    this.drawSignBoard(w, h);

    // === Platform / Bridge ===
    const platY = h * 0.62;
    const platX = w * 0.15;
    const platW = w * 0.7;

    // Bridge supports
    const bridge = this.add.graphics();
    // Stone pillars
    bridge.fillStyle(0x5D4E37, 1);
    bridge.fillRect(platX - 10, platY, 20, h - platY);
    bridge.fillRect(platX + platW - 10, platY, 20, h - platY);

    // Wooden bridge deck
    bridge.fillStyle(0x8B6914, 1);
    bridge.fillRect(platX, platY - 6, platW, 18);

    // Bridge planks
    bridge.fillStyle(0x7A5C10, 1);
    for (let px = platX; px < platX + platW; px += 30) {
      bridge.fillRect(px, platY - 6, 28, 18);
      bridge.lineStyle(1, 0x6B4D08, 0.5);
      bridge.lineBetween(px, platY - 6, px, platY + 12);
    }

    // Bridge top railing
    bridge.fillStyle(0x6B4D08, 1);
    bridge.fillRect(platX, platY - 10, platW, 4);

    // Rope railing
    bridge.lineStyle(2, 0xC4A265, 0.6);
    bridge.lineBetween(platX, platY - 30, platX + platW, platY - 30);

    // Railing posts
    for (let px = platX; px <= platX + platW; px += 60) {
      bridge.fillStyle(0x8B6914, 1);
      bridge.fillRect(px - 3, platY - 34, 6, 28);
    }

    // === Characters on platform ===
    this.charSprites = [];
    const charSpacing = platW / (CHARACTERS.length + 1);

    CHARACTERS.forEach((charData, index) => {
      const cx = platX + charSpacing * (index + 1);
      const cy = platY - 42;

      const container = this.add.container(cx, cy);

      // Character body
      const charGfx = this.add.graphics();
      const bodyW = 36;
      const bodyH = 48;

      // Shadow on ground
      charGfx.fillStyle(0x000000, 0.2);
      charGfx.fillEllipse(0, bodyH / 2 + 4, bodyW + 4, 10);

      // Body
      charGfx.fillStyle(charData.color, 1);
      charGfx.fillRoundedRect(-bodyW / 2 + 2, -bodyH / 2 + 6, bodyW - 4, bodyH - 6, 4);

      // Eyes
      charGfx.fillStyle(0xFFFFFF, 1);
      charGfx.fillRect(-6, -bodyH / 2 + 18, 8, 8);
      charGfx.fillRect(4, -bodyH / 2 + 18, 8, 8);
      charGfx.fillStyle(0x000000, 1);
      charGfx.fillRect(-3, -bodyH / 2 + 20, 4, 4);
      charGfx.fillRect(7, -bodyH / 2 + 20, 4, 4);

      // Class-specific accessories
      if (charData.id === 'bomi') {
        // Warrior helmet
        charGfx.fillStyle(0xBDC3C7, 1);
        charGfx.fillRect(-bodyW / 2 + 1, -bodyH / 2 - 2, bodyW - 2, 12);
        charGfx.fillStyle(0x95A5A6, 1);
        charGfx.fillRect(-4, -bodyH / 2 - 10, 8, 12);
        // Sword on back
        charGfx.fillStyle(0xBDC3C7, 0.6);
        charGfx.fillRect(bodyW / 2 - 2, -bodyH / 2 - 10, 4, 40);
        charGfx.fillStyle(0xF1C40F, 0.6);
        charGfx.fillRect(bodyW / 2 - 5, -bodyH / 2 + 26, 10, 6);
      } else if (charData.id === 'seoli') {
        // Witch hat
        charGfx.fillStyle(0x6C3483, 1);
        charGfx.fillTriangle(0, -bodyH / 2 - 28, -18, -bodyH / 2 + 4, 18, -bodyH / 2 + 4);
        charGfx.fillStyle(0x8E44AD, 1);
        charGfx.fillRect(-20, -bodyH / 2 + 2, 40, 6);
        // Star on hat tip
        charGfx.fillStyle(0xF1C40F, 1);
        charGfx.fillCircle(0, -bodyH / 2 - 26, 4);
        // Staff
        charGfx.fillStyle(0x7D3C98, 0.8);
        charGfx.fillRect(-bodyW / 2 - 6, -bodyH / 2 - 8, 4, 50);
        charGfx.fillStyle(0xE8DAEF, 1);
        charGfx.fillCircle(-bodyW / 2 - 4, -bodyH / 2 - 12, 6);
      }

      container.add(charGfx);

      // Name tag above character
      const nameTag = this.add.text(0, -bodyH / 2 - 36, charData.name, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(nameTag);

      // Selection arrow (animated, above name)
      const arrow = this.add.text(0, -bodyH / 2 - 54, '▼', {
        fontSize: '16px',
        color: '#F39C12',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setVisible(false);
      container.add(arrow);

      this.tweens.add({
        targets: arrow,
        y: arrow.y + 6,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });

      // Make clickable
      const hitZone = this.add.zone(0, 0, bodyW + 20, bodyH + 20).setInteractive();
      container.add(hitZone);

      hitZone.on('pointerdown', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      this.charSprites.push({ container, arrow, charData, charGfx, nameTag });
    });

    // === Info Panel (right side wooden board) ===
    this.infoPanel = this.add.container(w * 0.82, h * 0.35);

    // Wooden board background
    const boardGfx = this.add.graphics();
    const boardW = 200;
    const boardH = 260;
    // Board body
    boardGfx.fillStyle(0x6B4D08, 1);
    boardGfx.fillRoundedRect(-boardW / 2 - 4, -boardH / 2 - 4, boardW + 8, boardH + 8, 6);
    boardGfx.fillStyle(0x8B6914, 1);
    boardGfx.fillRoundedRect(-boardW / 2, -boardH / 2, boardW, boardH, 4);
    // Nails
    boardGfx.fillStyle(0x555555, 1);
    boardGfx.fillCircle(-boardW / 2 + 12, -boardH / 2 + 12, 3);
    boardGfx.fillCircle(boardW / 2 - 12, -boardH / 2 + 12, 3);
    this.infoPanel.add(boardGfx);

    // Character name on board
    this.infoName = this.add.text(0, -boardH / 2 + 24, '', {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.infoPanel.add(this.infoName);

    // Class name
    this.infoClass = this.add.text(0, -boardH / 2 + 50, '', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#F39C12',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.infoPanel.add(this.infoClass);

    // Description
    this.infoDesc = this.add.text(0, -boardH / 2 + 78, '', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#DDD',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);
    this.infoPanel.add(this.infoDesc);

    // Stats bars
    this.statBars = [];
    const statsConfig = [
      { label: 'HP', max: 150, color: 0xE74C3C },
      { label: 'MP', max: 100, color: 0x3498DB },
      { label: 'ATK', max: 25, color: 0xF39C12 },
      { label: 'SPD', max: 260, color: 0x2ECC71 },
    ];
    const statKeys = ['hp', 'mp', 'atk', 'spd'];

    statsConfig.forEach((stat, i) => {
      const sy = -boardH / 2 + 115 + i * 28;
      const barMaxW = 120;

      // Label
      const label = this.add.text(-boardW / 2 + 16, sy, stat.label, {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#AAA',
        fontStyle: 'bold',
      });
      this.infoPanel.add(label);

      // Bar background
      const barBg = this.add.graphics();
      barBg.fillStyle(0x3A2A0A, 1);
      barBg.fillRoundedRect(-boardW / 2 + 52, sy + 2, barMaxW, 10, 3);
      this.infoPanel.add(barBg);

      // Bar fill
      const barFill = this.add.graphics();
      this.infoPanel.add(barFill);

      // Value text
      const valueText = this.add.text(-boardW / 2 + 52 + barMaxW + 8, sy, '', {
        fontSize: '10px',
        fontFamily: 'Arial',
        color: '#FFF',
      });
      this.infoPanel.add(valueText);

      this.statBars.push({
        fill: barFill,
        valueText: valueText,
        barX: -boardW / 2 + 52,
        barY: sy + 2,
        barMaxW: barMaxW,
        maxStat: stat.max,
        color: stat.color,
        key: statKeys[i],
      });
    });

    // === Wooden sign buttons ===
    const btnY = h * 0.85;
    this.drawWoodenButton(w / 2, btnY, 'START GAME', () => this.launchGame());

    // === Keyboard controls ===
    this.input.keyboard.on('keydown-LEFT', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard.on('keydown-RIGHT', () => {
      this.selectedIndex = Math.min(CHARACTERS.length - 1, this.selectedIndex + 1);
      this.updateSelection();
    });
    this.input.keyboard.on('keydown-SPACE', () => this.launchGame());
    this.input.keyboard.on('keydown-ENTER', () => this.launchGame());

    // Hint text
    this.add.text(w / 2, h * 0.94, '← → Select  |  SPACE Start', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#666644',
    }).setOrigin(0.5);

    // Initial selection
    this.updateSelection();

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  drawTrees(w, h) {
    const trees = this.add.graphics();

    // Far background trees (darker)
    for (let i = 0; i < 10; i++) {
      const tx = i * (w / 8) + Phaser.Math.Between(-30, 30);
      const th = Phaser.Math.Between(150, 280);
      const tw = Phaser.Math.Between(60, 100);

      // Trunk
      trees.fillStyle(0x2A1A08, 0.5);
      trees.fillRect(tx + tw / 2 - 8, h * 0.62, 16, h);

      // Leaves
      trees.fillStyle(0x1A3A0A, 0.4);
      trees.fillTriangle(tx + tw / 2, h * 0.62 - th, tx, h * 0.62 + 20, tx + tw, h * 0.62 + 20);
      trees.fillTriangle(tx + tw / 2, h * 0.62 - th + 40, tx - 10, h * 0.62 + 40, tx + tw + 10, h * 0.62 + 40);
    }

    // Ground below bridge
    const ground = this.add.graphics();
    ground.fillStyle(0x1A1208, 1);
    ground.fillRect(0, h * 0.76, w, h * 0.24);
    ground.fillStyle(0x2A3A10, 0.8);
    ground.fillRect(0, h * 0.76, w, 4);

    // Grass patches
    ground.fillStyle(0x2A4A10, 0.4);
    for (let gx = 0; gx < w; gx += 40) {
      const gh = Phaser.Math.Between(6, 14);
      ground.fillTriangle(gx, h * 0.76, gx + 8, h * 0.76 - gh, gx + 16, h * 0.76);
    }
  }

  drawSignBoard(w, h) {
    const signX = w / 2;
    const signY = h * 0.1;

    const sign = this.add.graphics();

    // Wooden sign
    const sW = 320;
    const sH = 50;
    sign.fillStyle(0x6B4D08, 1);
    sign.fillRoundedRect(signX - sW / 2 - 4, signY - 4, sW + 8, sH + 8, 4);
    sign.fillStyle(0x8B6914, 1);
    sign.fillRoundedRect(signX - sW / 2, signY, sW, sH, 2);

    // Sign post
    sign.fillStyle(0x5D4E37, 1);
    sign.fillRect(signX - 4, signY + sH, 8, 30);

    // Title text
    this.add.text(signX, signY + sH / 2, 'SELECT CHARACTER', {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial',
      color: '#FFF8DC',
      stroke: '#3A2A0A',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  drawWoodenButton(x, y, text, callback) {
    const btnW = 180;
    const btnH = 40;

    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(0x6B4D08, 1);
    btnGfx.fillRoundedRect(x - btnW / 2 - 3, y - 3, btnW + 6, btnH + 6, 6);
    btnGfx.fillStyle(0x8B6914, 1);
    btnGfx.fillRoundedRect(x - btnW / 2, y, btnW, btnH, 4);
    btnGfx.fillStyle(0x9B7924, 0.3);
    btnGfx.fillRoundedRect(x - btnW / 2 + 4, y + 2, btnW - 8, btnH / 2 - 2, 3);

    this.add.text(x, y + btnH / 2, text, {
      fontSize: '16px',
      fontFamily: 'Arial Black, Arial',
      color: '#FFF8DC',
      stroke: '#3A2A0A',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y + btnH / 2, btnW, btnH).setInteractive();
    zone.on('pointerdown', callback);
    zone.on('pointerover', () => {
      btnGfx.clear();
      btnGfx.fillStyle(0x5D4008, 1);
      btnGfx.fillRoundedRect(x - btnW / 2 - 3, y - 3, btnW + 6, btnH + 6, 6);
      btnGfx.fillStyle(0x7A5A10, 1);
      btnGfx.fillRoundedRect(x - btnW / 2, y, btnW, btnH, 4);
    });
    zone.on('pointerout', () => {
      btnGfx.clear();
      btnGfx.fillStyle(0x6B4D08, 1);
      btnGfx.fillRoundedRect(x - btnW / 2 - 3, y - 3, btnW + 6, btnH + 6, 6);
      btnGfx.fillStyle(0x8B6914, 1);
      btnGfx.fillRoundedRect(x - btnW / 2, y, btnW, btnH, 4);
      btnGfx.fillStyle(0x9B7924, 0.3);
      btnGfx.fillRoundedRect(x - btnW / 2 + 4, y + 2, btnW - 8, btnH / 2 - 2, 3);
    });
  }

  updateSelection() {
    const charData = CHARACTERS[this.selectedIndex];

    // Update arrows
    this.charSprites.forEach((cs, i) => {
      cs.arrow.setVisible(i === this.selectedIndex);
      if (i === this.selectedIndex) {
        this.tweens.add({
          targets: cs.container,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 200,
          ease: 'Back.easeOut',
        });
      } else {
        this.tweens.add({
          targets: cs.container,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 200,
        });
      }
    });

    // Update info panel
    this.infoName.setText(charData.name);
    this.infoClass.setText(charData.className);
    this.infoDesc.setText(charData.desc);

    // Update stat bars
    this.statBars.forEach((bar) => {
      const value = charData.stats[bar.key];
      const ratio = value / bar.maxStat;

      bar.fill.clear();
      bar.fill.fillStyle(bar.color, 0.9);
      bar.fill.fillRoundedRect(bar.barX, bar.barY, bar.barMaxW * ratio, 10, 3);
      bar.valueText.setText(value);
    });
  }

  launchGame() {
    const selectedChar = CHARACTERS[this.selectedIndex];

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME, {
        mapKey: 'haven',
        characterData: selectedChar,
      });
    });
  }
}