// Two real feline heroes, shown with the same generated art used in play.
import Phaser from 'phaser';
import { SCENES } from '../utils/constants.js';
import { CHARACTERS } from '../data/characters.js';
import SaveManager from '../systems/SaveManager.js';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() { super(SCENES.CHARACTER_SELECT); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.selectedIndex = 0;
    this.isLaunching = false;
    this.inputReadyAt = Date.now() + 400;
    const background = this.add.image(w / 2, h / 2, 'bg_garden');
    background.setScale(Math.max(w / background.width, h / background.height));
    this.add.rectangle(0, 0, w, h, 0x141D20, 0.65).setOrigin(0);
    const font = 'Georgia, serif';
    this.add.text(w / 2, h * 0.09, 'CHOOSE YOUR COMPANION', {
      fontFamily: font, fontSize: `${Math.min(30, w / 25)}px`, color: '#FFF4D9',
      stroke: '#2C2728', strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.15, 'Two little cats. One way home.', {
      fontFamily: 'monospace', fontSize: '13px', color: '#C8D9CE',
    }).setOrigin(0.5);

    const cardW = Math.min(300, w * 0.4), cardH = Math.min(420, h * 0.59);
    const cardY = h * 0.49, gap = Math.min(32, w * 0.04);
    this.cards = CHARACTERS.map((character, index) => {
      const x = w / 2 + (index === 0 ? -1 : 1) * (cardW + gap) / 2;
      const card = this.add.container(x, cardY);
      const panel = this.add.rectangle(0, 0, cardW, cardH, 0x202B2C, 0.94)
        .setStrokeStyle(2, 0x566966).setInteractive({ useHandCursor: true });
      panel.on('pointerdown', () => { this.selectedIndex = index; this.updateSelection(); });
      const accent = index === 0 ? '#A2E6CF' : '#F8CD8B';
      const name = this.add.text(0, -cardH / 2 + 24, character.name, {
        fontFamily: font, fontSize: '28px', color: '#FFF6DF',
      }).setOrigin(0.5);
      const className = this.add.text(0, -cardH / 2 + 53, character.className.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '11px', color: accent,
      }).setOrigin(0.5);
      const portraitSize = Math.min(142, cardH * 0.34);
      const portrait = this.add.image(0, -cardH * 0.13, `portrait_${character.id}`)
        .setDisplaySize(portraitSize, portraitSize);
      const progress = SaveManager.getCharacter(character.id);
      const desc = this.add.text(0, cardH * 0.12, character.desc, {
        fontFamily: 'monospace', fontSize: `${Math.max(9, Math.min(12, cardW / 24))}px`,
        color: '#DAE2D9', align: 'center', lineSpacing: 6,
      }).setOrigin(0.5);
      const stats = this.add.text(0, cardH * 0.28,
        `HP ${character.stats.hp}   ATK ${character.stats.atk}\nSPD ${character.stats.spd}   Lv.${progress?.level || 1}`, {
          fontFamily: 'monospace', fontSize: '13px', color: accent, align: 'center', lineSpacing: 10,
        }).setOrigin(0.5);
      const tag = this.add.text(0, cardH / 2 - 22, index === 0 ? 'SPEED / WIND CLAWS' : 'POWER / CLOSE COMBAT', {
        fontFamily: 'monospace', fontSize: '10px', color: '#AABCB1',
      }).setOrigin(0.5);
      card.add([panel, name, className, portrait, desc, stats, tag]);
      return { card, panel, portrait };
    });

    const buttonY = h * 0.86;
    const button = this.add.rectangle(w / 2, buttonY, 240, 45, 0xB88849)
      .setStrokeStyle(2, 0xF7D99A).setInteractive({ useHandCursor: true });
    this.startLabel = this.add.text(w / 2, buttonY, '', {
      fontFamily: 'monospace', fontSize: '17px', fontStyle: 'bold', color: '#FFF6DF',
    }).setOrigin(0.5);
    button.on('pointerdown', () => this.launchGame());
    button.on('pointerover', () => button.setFillStyle(0xCA9B58));
    button.on('pointerout', () => button.setFillStyle(0xB88849));
    this.add.text(w / 2, h * 0.94, 'ARROWS select  /  ENTER start  /  CTRL attack  /  ALT jump', {
      fontFamily: 'monospace', fontSize: `${Math.min(12, w / 58)}px`, color: '#DDD9CA',
    }).setOrigin(0.5);
    this.input.keyboard.on('keydown-LEFT', () => { this.selectedIndex = 0; this.updateSelection(); });
    this.input.keyboard.on('keydown-RIGHT', () => { this.selectedIndex = 1; this.updateSelection(); });
    this.input.keyboard.on('keydown-SPACE', () => this.launchGame());
    this.input.keyboard.on('keydown-ENTER', () => this.launchGame());
    const resize = () => { if (!this.isLaunching) this.scene.restart(); };
    this.scale.on('resize', resize);
    this.events.once('shutdown', () => this.scale.off('resize', resize));
    this.updateSelection();
    this.cameras.main.fadeIn(300);
  }

  updateSelection() {
    this.cards.forEach(({ panel, portrait }, index) => {
      panel.setStrokeStyle(index === this.selectedIndex ? 3 : 1, index === this.selectedIndex ? 0xEED19B : 0x566966);
      panel.setFillStyle(index === this.selectedIndex ? 0x31413C : 0x202B2C, 0.94);
      portrait.setAlpha(index === this.selectedIndex ? 1 : 0.75);
    });
    this.startLabel.setText(`PLAY AS ${CHARACTERS[this.selectedIndex].name.toUpperCase()}`);
  }

  launchGame() {
    if (this.isLaunching || Date.now() < this.inputReadyAt) return;
    this.isLaunching = true;
    this.cameras.main.fadeOut(350);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENES.STORY, {
      characterData: CHARACTERS[this.selectedIndex], freshRun: true,
    }));
  }
}
