// src/data/map_sanctuary.js
// Sanctuary - Final peaceful village (no monsters)

const MAP_SANCTUARY = {
  name: 'Sanctuary',
  width: 3200,
  height: 800,
  spawnX: 150,
  spawnY: 680,
  bgColors: {
    top: [0x4A7AB5, 0x6B9CD5],
    bottom: [0x6B9CD5, 0x8BBDE8],
    mountain: 0x5A8AC5,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Layer 1 (low platforms, y: 600~640) - relaxed spacing ===
    { x: 300, y: 620, w: 220, h: 16, isGround: false },
    { x: 700, y: 600, w: 200, h: 16, isGround: false },
    { x: 1100, y: 620, w: 240, h: 16, isGround: false },
    { x: 1550, y: 610, w: 200, h: 16, isGround: false },
    { x: 1950, y: 600, w: 220, h: 16, isGround: false },
    { x: 2350, y: 620, w: 200, h: 16, isGround: false },
    { x: 2750, y: 610, w: 240, h: 16, isGround: false },

    // === Layer 2 (mid platforms, y: 440~480) ===
    { x: 450, y: 470, w: 200, h: 16, isGround: false },
    { x: 900, y: 460, w: 220, h: 16, isGround: false },
    { x: 1350, y: 450, w: 200, h: 16, isGround: false },
    { x: 1750, y: 470, w: 240, h: 16, isGround: false },
    { x: 2150, y: 460, w: 200, h: 16, isGround: false },
    { x: 2600, y: 450, w: 220, h: 16, isGround: false },

    // === Layer 3 (high platforms, y: 300~340) ===
    { x: 600, y: 330, w: 220, h: 16, isGround: false },
    { x: 1100, y: 320, w: 200, h: 16, isGround: false },
    { x: 1600, y: 310, w: 240, h: 16, isGround: false },
    { x: 2100, y: 330, w: 200, h: 16, isGround: false },
    { x: 2500, y: 320, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 50, y: 690, label: '← Village Outskirts II', targetMap: 'outskirts2', spawnX: 3100, spawnY: 680 },
  ],
  ropes: [
    // Ground to Layer 1
    { x: 410, topY: 620, bottomY: 700 },
    { x: 800, topY: 600, bottomY: 700 },
    { x: 1220, topY: 620, bottomY: 700 },
    { x: 1650, topY: 610, bottomY: 700 },
    { x: 2060, topY: 600, bottomY: 700 },
    { x: 2450, topY: 620, bottomY: 700 },
    { x: 2870, topY: 610, bottomY: 700 },

    // Layer 1 to Layer 2
    { x: 550, topY: 470, bottomY: 600 },
    { x: 1010, topY: 460, bottomY: 620 },
    { x: 1450, topY: 450, bottomY: 610 },
    { x: 1870, topY: 470, bottomY: 600 },
    { x: 2250, topY: 460, bottomY: 620 },
    { x: 2710, topY: 450, bottomY: 610 },

    // Layer 2 to Layer 3
    { x: 700, topY: 330, bottomY: 460 },
    { x: 1200, topY: 320, bottomY: 450 },
    { x: 1700, topY: 310, bottomY: 470 },
    { x: 2200, topY: 330, bottomY: 460 },
    { x: 2600, topY: 320, bottomY: 450 },
  ],
  npcs: [
    { x: 500, y: 714, name: 'Sage' },
  ],
  monsters: [],
};

export default MAP_SANCTUARY;
