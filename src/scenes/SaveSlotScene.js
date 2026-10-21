// src/scenes/SaveSlotScene.js
// Slot list shared by CONTINUE and NEW GAME.
//   continue: filled slots load; empty / corrupted slots are visible but disabled.
//   new:      empty slot starts immediately; a filled (or corrupted) slot asks
//             "Overwrite this save?" first, with No focused by default.
// Back / ESC returns to the title. Nothing is written until the new run
// actually starts (StoryScene), so declining or backing out never touches a slot.

import Phaser from 'phaser';
import { SCENES } from '../utils/constants.js';
import { MAPS_DATA } from '../data/maps.js';
import { getCharacter } from '../data/characters.js';
import SaveManager, { SLOT_COUNT } from '../systems/SaveManager.js';
import { MenuButton, MenuNav } from '../ui/Menu.js';
import { formatPlayTime, formatSavedAt } from '../utils/format.js';
import { pixelFont } from '../i18n/fonts.js';
import { t } from '../i18n/index.js';

const DIALOG_DEPTH = 100;

export default class SaveSlotScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SAVE_SLOTS);
  }

  init(data) {
    this.mode = data && data.mode === 'new' ? 'new' : 'continue';
    this.isStarting = false;
    this.dialog = null;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const compact = h < 500;
    const isNew = this.mode === 'new';

    if (this.textures.exists('bg_garden')) {
      const background = this.add.image(w / 2, h / 2, 'bg_garden');
      background.setScale(Math.max(w / background.width, h / background.height));
    }
    this.add.rectangle(0, 0, w, h, 0x141D20, 0.78).setOrigin(0);

    const titleY = compact ? 26 : h * 0.1;
    this.add.text(w / 2, titleY, isNew ? t('title.newGame') : t('title.continue'), {
      ...pixelFont(compact ? 24 : Math.min(32, w / 14)),
      color: '#FFF4D9',
      stroke: '#2C2728',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(w / 2, titleY + (compact ? 24 : 34), isNew ? t('slots.chooseNew') : t('slots.chooseContinue'), {
      ...pixelFont(13),
      color: '#C8D9CE',
    }).setOrigin(0.5);

    // Rows share the space between the heading and the Back button.
    const rowW = Math.min(560, w - 32);
    const gap = compact ? 8 : 12;
    const backH = compact ? 34 : 42;
    const top = titleY + (compact ? 44 : 62);
    const bottomMargin = compact ? 10 : 24;
    const available = h - top - backH - gap * 3 - bottomMargin;
    const rowH = Phaser.Math.Clamp(Math.floor((available - gap * (SLOT_COUNT - 1)) / SLOT_COUNT), 46, 78);

    this.slots = SaveManager.listSlots();
    this.rows = this.slots.map((entry, index) => {
      const description = this.describe(entry, isNew);
      return new MenuButton(this, {
        x: w / 2,
        y: top + rowH / 2 + index * (rowH + gap),
        width: rowW,
        height: rowH,
        lines: description.lines,
        enabled: description.enabled,
        fontSize: compact ? 14 : 17,
        subFontSize: compact ? 11 : 12,
        align: 'left',
        onSelect: () => this.chooseSlot(entry),
      });
    });

    const backY = top + SLOT_COUNT * rowH + (SLOT_COUNT - 1) * gap + gap + backH / 2;
    this.backButton = new MenuButton(this, {
      x: w / 2,
      y: backY,
      width: 160,
      height: backH,
      lines: [t('common.back')],
      fontSize: 15,
      onSelect: () => this.back(),
    });

    this.nav = new MenuNav(this, { onBack: () => this.back() });
    this.focusRows();

    const resize = () => { if (!this.isStarting) this.scene.restart({ mode: this.mode }); };
    this.scale.on('resize', resize);
    this.events.once('shutdown', () => this.scale.off('resize', resize));
    this.cameras.main.fadeIn(250);
  }

  // Row text + whether it can be chosen in the current mode.
  describe(entry, isNew) {
    const slot = entry.slot;
    if (entry.status === 'ok') {
      const { data } = entry;
      const progress = data.characters[data.characterId];
      const level = progress && typeof progress.level === 'number' ? progress.level : 1;
      return {
        enabled: true,
        lines: [
          t('slots.okTitle', { slot, name: t(getCharacter(data.characterId).nameKey), level }),
          t('slots.okDetail', {
            map: t(MAPS_DATA[data.mapId].nameKey),
            time: formatPlayTime(data.playTimeSec),
            saved: formatSavedAt(data.updatedAt),
          }),
        ],
      };
    }
    if (entry.status === 'corrupted') {
      return {
        enabled: isNew,
        lines: [
          t('slots.corruptedTitle', { slot }),
          isNew ? t('slots.corruptedNew') : t('slots.corruptedContinue'),
        ],
      };
    }
    return {
      enabled: isNew,
      lines: [t('slots.emptyTitle', { slot }), isNew ? t('slots.emptyNew') : t('slots.emptyContinue')],
    };
  }

  focusRows() {
    const firstEnabled = this.rows.findIndex((row) => row.enabled);
    if (firstEnabled >= 0) {
      this.nav.setButtons([...this.rows, this.backButton], firstEnabled);
    } else {
      this.nav.setButtons([this.backButton], 0);
    }
  }

  chooseSlot(listed) {
    if (this.isStarting || this.dialog) return;
    // Re-read: another tab may have changed the slot since the list was drawn.
    const entry = SaveManager.listSlots()[listed.slot - 1];
    if (this.mode === 'continue') {
      this.continueSlot(entry.slot);
    } else if (entry.status === 'empty') {
      this.startNewGame(entry.slot);
    } else {
      this.openConfirm(entry);
    }
  }

  continueSlot(slot) {
    const resume = SaveManager.continueSlot(slot);
    if (!resume) {
      // The slot changed or became unreadable since the list was drawn.
      this.scene.restart({ mode: this.mode });
      return;
    }
    this.go(SCENES.GAME, {
      mapKey: resume.mapId,
      spawnId: resume.spawnId,
      characterData: { id: resume.characterId },
      playerHp: resume.hp,
      freshRun: true,
    });
  }

  startNewGame(slot) {
    this.go(SCENES.CHARACTER_SELECT, { slot });
  }

  back() {
    if (this.dialog) {
      this.closeConfirm();
      return;
    }
    this.go(SCENES.MENU);
  }

  // === Overwrite confirmation (default focus: No) ===

  openConfirm(entry) {
    const w = this.scale.width;
    const h = this.scale.height;
    const compact = h < 500;
    const panelW = Math.min(380, w - 32);
    const panelH = compact ? 150 : 176;
    const objects = [];

    // Full-screen blocker so rows underneath cannot be clicked.
    const blocker = this.add.rectangle(0, 0, w, h, 0x000000, 0.65).setOrigin(0).setDepth(DIALOG_DEPTH)
      .setInteractive();
    objects.push(blocker);
    objects.push(this.add.rectangle(w / 2, h / 2, panelW, panelH, 0x1A2224, 0.98)
      .setStrokeStyle(2, 0xEED19B).setDepth(DIALOG_DEPTH));
    objects.push(this.add.text(w / 2, h / 2 - panelH / 2 + (compact ? 24 : 32), t('slots.overwrite'), {
      ...pixelFont(22), color: '#FFF4D9',
    }).setOrigin(0.5).setDepth(DIALOG_DEPTH));
    const summary = entry.status === 'ok'
      ? t('slots.summaryOk', {
        slot: entry.slot,
        map: t(MAPS_DATA[entry.data.mapId].nameKey),
        time: formatPlayTime(entry.data.playTimeSec),
      })
      : t('slots.corruptedTitle', { slot: entry.slot });
    objects.push(this.add.text(w / 2, h / 2 - panelH / 2 + (compact ? 52 : 68), summary, {
      ...pixelFont(13), color: '#C8D9CE', wordWrap: { width: panelW - 24 }, align: 'center',
    }).setOrigin(0.5).setDepth(DIALOG_DEPTH));

    const btnY = h / 2 + panelH / 2 - (compact ? 30 : 36);
    const yes = new MenuButton(this, {
      x: w / 2 - 66, y: btnY, width: 112, height: 38, lines: [t('common.yes')], fontSize: 15,
      onSelect: () => { this.closeConfirm(); this.startNewGame(entry.slot); },
    }).setDepth(DIALOG_DEPTH + 1);
    const no = new MenuButton(this, {
      x: w / 2 + 66, y: btnY, width: 112, height: 38, lines: [t('common.no')], fontSize: 15,
      onSelect: () => this.closeConfirm(),
    }).setDepth(DIALOG_DEPTH + 1);

    this.dialog = { objects, buttons: [yes, no] };
    this.nav.setButtons([yes, no], 1);
  }

  closeConfirm() {
    if (!this.dialog) return;
    this.dialog.objects.forEach((object) => object.destroy());
    this.dialog.buttons.forEach((button) => button.destroy());
    this.dialog = null;
    this.focusRows();
  }

  go(sceneKey, data) {
    if (this.isStarting) return;
    this.isStarting = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey, data));
  }
}
