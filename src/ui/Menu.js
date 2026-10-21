// src/ui/Menu.js
// Small keyboard + pointer menu toolkit shared by the title and save-slot
// scenes. MenuButton draws one entry; MenuNav moves focus between entries
// with the arrow keys and activates with ENTER / SPACE (ESC = back).
// Button text is passed in already translated; scenes that offer a language
// switch rebuild themselves on `language-changed`.

import { pixelFont } from '../i18n/fonts.js';

const PALETTE = {
  fill: 0x202B2C,
  fillFocus: 0x31413C,
  stroke: 0x566966,
  strokeFocus: 0xEED19B,
  text: '#FFF6DF',
  subText: '#C8D9CE',
};

export class MenuButton {
  // lines: [primary, secondary?]; onSelect fires on click/tap or activation.
  constructor(scene, { x, y, width, height, lines, onSelect, enabled = true, palette = {}, fontSize = 18, subFontSize = 12, align = 'center' }) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.enabled = enabled;
    this.focused = false;
    this.colors = { ...PALETTE, ...palette };

    this.bg = scene.add.rectangle(x, y, width, height, this.colors.fill).setStrokeStyle(2, this.colors.stroke);
    const left = align === 'left';
    const textX = left ? x - width / 2 + 16 : x;
    const origin = left ? 0 : 0.5;
    const hasSub = lines.length > 1 && lines[1];
    const wrap = { width: width - 32 };
    this.title = scene.add.text(textX, hasSub ? y - height * 0.17 : y, lines[0], {
      ...pixelFont(fontSize), color: this.colors.text, wordWrap: wrap,
    }).setOrigin(origin, 0.5);
    this.sub = hasSub
      ? scene.add.text(textX, y + height * 0.2, lines[1], {
        ...pixelFont(subFontSize), color: this.colors.subText, wordWrap: wrap, align: left ? 'left' : 'center',
      }).setOrigin(origin, 0.5)
      : null;
    this.parts = [this.bg, this.title, this.sub].filter(Boolean);

    if (enabled) {
      this.bg.setInteractive({ useHandCursor: true });
      this.bg.on('pointerover', () => { if (this.onHover) this.onHover(this); });
      this.bg.on('pointerdown', () => this.activate());
    } else {
      this.parts.forEach((part) => part.setAlpha(0.45));
    }
    this.setFocused(false);
  }

  setFocused(focused) {
    this.focused = focused;
    this.bg.setFillStyle(focused ? this.colors.fillFocus : this.colors.fill);
    this.bg.setStrokeStyle(focused ? 3 : 2, focused ? this.colors.strokeFocus : this.colors.stroke);
  }

  activate() {
    if (this.enabled && this.onSelect) this.onSelect(this);
  }

  setDepth(depth) {
    this.parts.forEach((part) => part.setDepth(depth));
    return this;
  }

  destroy() {
    this.parts.forEach((part) => part.destroy());
    this.parts = [];
  }
}

export class MenuNav {
  // Activation is ignored briefly after the scene opens so a key held down
  // in the previous scene (auto-repeat) cannot trigger an entry.
  constructor(scene, { onBack = null, readyDelayMs = 300 } = {}) {
    this.scene = scene;
    this.onBack = onBack;
    this.readyAt = Date.now() + readyDelayMs;
    this.buttons = [];
    this.index = -1;

    const keyboard = scene.input.keyboard;
    this.handlers = {
      'keydown-UP': () => this.move(-1),
      'keydown-LEFT': () => this.move(-1),
      'keydown-DOWN': () => this.move(1),
      'keydown-RIGHT': () => this.move(1),
      'keydown-ENTER': () => this.activateFocused(),
      'keydown-SPACE': () => this.activateFocused(),
      'keydown-ESC': () => { if (this.onBack && Date.now() >= this.readyAt) this.onBack(); },
    };
    Object.entries(this.handlers).forEach(([event, handler]) => keyboard.on(event, handler));
    scene.events.once('shutdown', () => this.destroy());
  }

  // Replace the focusable set (the confirm dialog swaps it in and out).
  setButtons(buttons, startIndex = 0) {
    this.buttons.forEach((button) => button.onHover = null);
    this.buttons = buttons;
    buttons.forEach((button) => { button.onHover = (hovered) => this.focus(buttons.indexOf(hovered)); });
    this.index = -1;
    const enabledStart = buttons[startIndex] && buttons[startIndex].enabled
      ? startIndex
      : buttons.findIndex((button) => button.enabled);
    this.focus(enabledStart);
  }

  focus(index) {
    if (index < 0 || index >= this.buttons.length || !this.buttons[index].enabled) return;
    this.buttons.forEach((button, i) => button.setFocused(i === index));
    this.index = index;
  }

  move(step) {
    const count = this.buttons.length;
    if (count === 0) return;
    let next = this.index;
    for (let tries = 0; tries < count; tries += 1) {
      next = (next + step + count) % count;
      if (this.buttons[next].enabled) {
        this.focus(next);
        return;
      }
    }
  }

  activateFocused() {
    if (Date.now() < this.readyAt) return;
    const button = this.buttons[this.index];
    if (button) button.activate();
  }

  destroy() {
    const keyboard = this.scene.input && this.scene.input.keyboard;
    if (keyboard) Object.entries(this.handlers).forEach(([event, handler]) => keyboard.off(event, handler));
    this.handlers = {};
  }
}
