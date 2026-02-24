// src/data/map_shadow.js
// Shadow Realm - Final map, the darkest domain

const MAP_SHADOW = {
  name: 'Shadow Realm',
  width: 3200,
  height: 800,
  spawnX: 80,
  spawnY: 680,
  bgColors: {
    top: [0x0A0008, 0x140010],
    bottom: [0x140010, 0x1E0520],
    mountain: 0x0D000A,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Layer 1 (low platforms, y: 580~620) ===
    { x: 80, y: 610, w: 220, h: 16, isGround: false },
    { x: 450, y: 600, w: 200, h: 16, isGround: false },
    { x: 800, y: 580, w: 240, h: 16, isGround: false },
    { x: 1180, y: 610, w: 200, h: 16, isGround: false },
    { x: 1540, y: 590, w: 220, h: 16, isGround: false },
    { x: 1900, y: 600, w: 200, h: 16, isGround: false },
    { x: 2260, y: 580, w: 240, h: 16, isGround: false },
    { x: 2620, y: 610, w: 200, h: 16, isGround: false },
    { x: 2950, y: 590, w: 180, h: 16, isGround: false },

    // === Layer 2 (mid platforms, y: 420~480) ===
    { x: 200, y: 460, w: 240, h: 16, isGround: false },
    { x: 600, y: 440, w: 200, h: 16, isGround: false },
    { x: 980, y: 470, w: 220, h: 16, isGround: false },
    { x: 1360, y: 430, w: 200, h: 16, isGround: false },
    { x: 1720, y: 450, w: 240, h: 16, isGround: false },
    { x: 2100, y: 420, w: 200, h: 16, isGround: false },
    { x: 2480, y: 460, w: 220, h: 16, isGround: false },
    { x: 2850, y: 440, w: 200, h: 16, isGround: false },

    // === Layer 3 (high platforms, y: 280~340) ===
    { x: 350, y: 320, w: 220, h: 16, isGround: false },
    { x: 750, y: 300, w: 200, h: 16, isGround: false },
    { x: 1150, y: 280, w: 240, h: 16, isGround: false },
    { x: 1550, y: 310, w: 200, h: 16, isGround: false },
    { x: 1950, y: 290, w: 220, h: 16, isGround: false },
    { x: 2350, y: 320, w: 200, h: 16, isGround: false },
    { x: 2700, y: 300, w: 240, h: 16, isGround: false },
  ],
  portals: [
    { x: 50, y: 690, label: '← Ancient Ruins', targetMap: 'ruins', spawnX: 3100, spawnY: 680 },
  ],
  ropes: [
    // Ground to Layer 1
    { x: 190, topY: 610, bottomY: 700 },
    { x: 550, topY: 600, bottomY: 700 },
    { x: 920, topY: 580, bottomY: 700 },
    { x: 1280, topY: 610, bottomY: 700 },
    { x: 1650, topY: 590, bottomY: 700 },
    { x: 2000, topY: 600, bottomY: 700 },
    { x: 2380, topY: 580, bottomY: 700 },
    { x: 2720, topY: 610, bottomY: 700 },
    { x: 3040, topY: 590, bottomY: 700 },

    // Layer 1 to Layer 2
    { x: 320, topY: 460, bottomY: 600 },
    { x: 700, topY: 440, bottomY: 580 },
    { x: 1090, topY: 470, bottomY: 610 },
    { x: 1460, topY: 430, bottomY: 590 },
    { x: 1840, topY: 450, bottomY: 600 },
    { x: 2200, topY: 420, bottomY: 580 },
    { x: 2590, topY: 460, bottomY: 610 },
    { x: 2950, topY: 440, bottomY: 590 },

    // Layer 2 to Layer 3
    { x: 460, topY: 320, bottomY: 440 },
    { x: 850, topY: 300, bottomY: 470 },
    { x: 1260, topY: 280, bottomY: 430 },
    { x: 1650, topY: 310, bottomY: 450 },
    { x: 2060, topY: 290, bottomY: 420 },
    { x: 2450, topY: 320, bottomY: 460 },
    { x: 2820, topY: 300, bottomY: 440 },
  ],
  npcs: [],
  monsters: [
    // Ground monsters (7)
    { x: 250, y: 700, hp: 200 },
    { x: 600, y: 700, hp: 200 },
    { x: 1000, y: 700, hp: 200 },
    { x: 1400, y: 700, hp: 200 },
    { x: 1800, y: 700, hp: 200 },
    { x: 2200, y: 700, hp: 200 },
    { x: 2700, y: 700, hp: 200 },

    // Layer 1 monsters (7)
    { x: 500, y: 560, hp: 230 },
    { x: 860, y: 540, hp: 230 },
    { x: 1230, y: 570, hp: 230 },
    { x: 1590, y: 550, hp: 230 },
    { x: 1950, y: 560, hp: 230 },
    { x: 2310, y: 540, hp: 230 },
    { x: 2670, y: 570, hp: 230 },

    // Layer 2 monsters (6)
    { x: 310, y: 420, hp: 260 },
    { x: 700, y: 400, hp: 260 },
    { x: 1090, y: 430, hp: 260 },
    { x: 1770, y: 410, hp: 260 },
    { x: 2150, y: 380, hp: 260 },
    { x: 2530, y: 420, hp: 260 },

    // Layer 3 monsters (5) - strongest
    { x: 450, y: 280, hp: 300 },
    { x: 850, y: 260, hp: 300 },
    { x: 1250, y: 240, hp: 300 },
    { x: 2000, y: 250, hp: 300 },
    { x: 2750, y: 260, hp: 300 },
  ],
};

export default MAP_SHADOW;
