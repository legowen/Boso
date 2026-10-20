// Canonical playable characters. Boso is the game title, not a character.
export const CHARACTERS = [
  {
    id: 'seoli', name: 'Seoli', className: 'Wind Whisker', color: 0xEAE7DF,
    desc: 'Quick paws, emerald eyes.\nSwift wind claws and a ranged gust.',
    stats: { hp: 100, mp: 80, atk: 14, spd: 250, jumpPower: -540 },
    combat: { reach: 105, width: 72, height: 46, cooldown: 290, duration: 210, effect: 'fx_wind', knockback: 160 },
  },
  {
    id: 'bomi', name: 'Bomi', className: 'Mighty Paw', color: 0x25232E,
    desc: 'A brave heart in a black coat.\nHigh health, powerful close-range paws.',
    stats: { hp: 160, mp: 40, atk: 24, spd: 190, jumpPower: -480 },
    combat: { reach: 34, width: 48, height: 44, cooldown: 410, duration: 230, effect: 'fx_paw', knockback: 250 },
  },
];

export function getCharacter(id) {
  if (id === 'boso_swift') id = 'seoli';
  if (id === 'boso_brave') id = 'bomi';
  return CHARACTERS.find((character) => character.id === id) || CHARACTERS[0];
}

// Stat gain per level-up (applied by Player on top of the base stats).
export const LEVEL_GROWTH = { hp: 12, mp: 6, atk: 2 };

// Max HP of a character at a given level (save slots store a full-health
// starting value without needing a Player instance).
export function maxHpFor(id, level = 1) {
  return getCharacter(id).stats.hp + (Math.max(1, level) - 1) * LEVEL_GROWTH.hp;
}

export const COMBO_MULTIPLIERS = [1, 1.15, 1.5];
export const COMBO_RESET_MS = 850;
export const CAT_FRAME_SIZE = 96;
export const CAT_DISPLAY_SCALE = 1.125;
export const CAT_FOOT_Y = 88;
// Keep the existing physics/rope/attack reference point while enlarging the art.
export const CAT_FEET_OFFSET = 30;
export const CAT_ANIMATIONS = {
  idle: { frames: [0, 0, 0, 1], frameRate: 3, repeat: -1 },
  run: { frames: [2, 3, 4, 5], frameRate: 11, repeat: -1 },
  jump: { frames: [6], frameRate: 1, repeat: 0 },
  fall: { frames: [7], frameRate: 1, repeat: 0 },
  crouch: { frames: [8], frameRate: 1, repeat: 0 },
  attack1: { frames: [9], frameRate: 1, repeat: 0 },
  attack2: { frames: [10], frameRate: 1, repeat: 0 },
  attack3: { frames: [11], frameRate: 1, repeat: 0 },
  climb: { frames: [12, 13], frameRate: 6, repeat: -1 },
  hurt: { frames: [14], frameRate: 1, repeat: 0 },
};
