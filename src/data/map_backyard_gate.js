// src/data/map_backyard_gate.js
// Backyard Gate - Biggie's territory. The big dog who has always lived
// here challenges every newcomer. Befriending him opens the shortcut
// back to High Table Village (and unlocks the ride home).

const MAP_BACKYARD_GATE = {
  name: 'Backyard Gate',
  region: 'buddy',
  width: 2200,
  height: 800,
  spawnX: 160,
  spawnY: 680,
  bgm: 'bgm_boss',
  bgColors: {
    top: [0x1C2833, 0x283747],
    bottom: [0x283747, 0x1E8449],
    mountain: 0x145A32,
  },
  platforms: [
    // === Ground (backyard lawn) ===
    { x: 0, y: 740, w: 2200, h: 60, isGround: true },

    // === Flower bed walls (dodge perches) ===
    { x: 250, y: 600, w: 220, h: 16, isGround: false },
    { x: 1750, y: 600, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '← Bookshelf Window', targetMap: 'bookshelf_cliffs', spawnX: 1280, spawnY: 400 },
    {
      x: 2100,
      y: 690,
      label: '★ Table Shortcut',
      targetMap: 'high_table',
      spawnX: 1100,
      spawnY: 380,
      hidden: true,
      requiresFlag: 'biggieDefeated',
    },
  ],
  ropes: [
    { x: 340, topY: 600, bottomY: 700 },
    { x: 1840, topY: 600, bottomY: 700 },
  ],
  npcs: [],
  monsters: [
    { x: 500, y: 700, type: 'sockslinker' },
    { x: 700, y: 560, type: 'gong' },
  ],
  boss: { id: 'biggie', x: 1300, y: 640 },
  guides: [
    { x: 250, y: 500, text: 'Biggie just wants to know\nif you can keep up. Show him!' },
  ],
};

export default MAP_BACKYARD_GATE;
