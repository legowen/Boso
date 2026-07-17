// src/data/items.js
// Pure data - consumable item definitions (no Phaser imports).
// Hotkeys 1/2 use them instantly; counts persist per character.

export const ITEMS = {
  cookie: {
    name: 'Crunchy Cookie',
    heal: 40,
    hotkey: '1',
    texture: 'drop_cookie',
  },
  milk: {
    name: 'Warm Milk',
    mana: 30,
    hotkey: '2',
    texture: 'drop_milk',
  },
};

export const ITEM_KEYS = Object.keys(ITEMS);
