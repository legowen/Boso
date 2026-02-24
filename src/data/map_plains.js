// src/data/map_plains.js
// Golden Plains - Wide open hunting field (same difficulty as Deep Forest)

const MAP_PLAINS = {
  name: 'Golden Plains',
  width: 3200,
  height: 800,
  spawnX: 80,
  spawnY: 680,
  bgColors: {
    top: [0x4A3A1A, 0x6B5A2D],
    bottom: [0x6B5A2D, 0x8B7A3D],
    mountain: 0x5E4E1E,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Layer 1 (low platforms, y: 580~620) - wider platforms for plains ===
    { x: 100, y: 620, w: 260, h: 16, isGround: false },
    { x: 500, y: 600, w: 240, h: 16, isGround: false },
    { x: 880, y: 610, w: 220, h: 16, isGround: false },
    { x: 1250, y: 590, w: 260, h: 16, isGround: false },
    { x: 1650, y: 610, w: 240, h: 16, isGround: false },
    { x: 2020, y: 600, w: 220, h: 16, isGround: false },
    { x: 2380, y: 580, w: 260, h: 16, isGround: false },
    { x: 2750, y: 610, w: 240, h: 16, isGround: false },

    // === Layer 2 (mid platforms, y: 420~480) ===
    { x: 200, y: 460, w: 240, h: 16, isGround: false },
    { x: 600, y: 440, w: 220, h: 16, isGround: false },
    { x: 1000, y: 470, w: 260, h: 16, isGround: false },
    { x: 1400, y: 430, w: 220, h: 16, isGround: false },
    { x: 1800, y: 450, w: 240, h: 16, isGround: false },
    { x: 2200, y: 420, w: 260, h: 16, isGround: false },
    { x: 2600, y: 460, w: 220, h: 16, isGround: false },

    // === Layer 3 (high platforms, y: 280~340) ===
    { x: 350, y: 320, w: 240, h: 16, isGround: false },
    { x: 800, y: 300, w: 220, h: 16, isGround: false },
    { x: 1250, y: 280, w: 260, h: 16, isGround: false },
    { x: 1700, y: 310, w: 220, h: 16, isGround: false },
    { x: 2100, y: 290, w: 240, h: 16, isGround: false },
    { x: 2500, y: 320, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 50, y: 690, label: '← Emerald Forest', targetMap: 'forest2', spawnX: 3100, spawnY: 680 },
    { x: 3150, y: 690, label: '→ Village Outskirts II', targetMap: 'outskirts2', spawnX: 80, spawnY: 680 },
  ],
  ropes: [
    // Ground to Layer 1
    { x: 230, topY: 620, bottomY: 700 },
    { x: 620, topY: 600, bottomY: 700 },
    { x: 990, topY: 610, bottomY: 700 },
    { x: 1380, topY: 590, bottomY: 700 },
    { x: 1770, topY: 610, bottomY: 700 },
    { x: 2140, topY: 600, bottomY: 700 },
    { x: 2510, topY: 580, bottomY: 700 },
    { x: 2870, topY: 610, bottomY: 700 },

    // Layer 1 to Layer 2
    { x: 320, topY: 460, bottomY: 600 },
    { x: 720, topY: 440, bottomY: 610 },
    { x: 1130, topY: 470, bottomY: 590 },
    { x: 1510, topY: 430, bottomY: 610 },
    { x: 1920, topY: 450, bottomY: 600 },
    { x: 2330, topY: 420, bottomY: 580 },
    { x: 2710, topY: 460, bottomY: 610 },

    // Layer 2 to Layer 3
    { x: 450, topY: 320, bottomY: 440 },
    { x: 910, topY: 300, bottomY: 470 },
    { x: 1370, topY: 280, bottomY: 430 },
    { x: 1810, topY: 310, bottomY: 450 },
    { x: 2220, topY: 290, bottomY: 420 },
    { x: 2610, topY: 320, bottomY: 460 },
  ],
  npcs: [],
  monsters: [
    // Ground monsters (5)
    { x: 300, y: 700, hp: 70 },
    { x: 750, y: 700, hp: 70 },
    { x: 1200, y: 700, hp: 70 },
    { x: 1700, y: 700, hp: 70 },
    { x: 2300, y: 700, hp: 70 },

    // Layer 1 monsters (6)
    { x: 550, y: 560, hp: 85 },
    { x: 950, y: 570, hp: 85 },
    { x: 1350, y: 550, hp: 85 },
    { x: 1720, y: 570, hp: 85 },
    { x: 2100, y: 560, hp: 85 },
    { x: 2800, y: 570, hp: 85 },

    // Layer 2 monsters (5)
    { x: 300, y: 420, hp: 100 },
    { x: 700, y: 400, hp: 100 },
    { x: 1100, y: 430, hp: 100 },
    { x: 1850, y: 410, hp: 100 },
    { x: 2650, y: 420, hp: 100 },

    // Layer 3 monsters (4)
    { x: 450, y: 280, hp: 120 },
    { x: 900, y: 260, hp: 120 },
    { x: 1750, y: 270, hp: 120 },
    { x: 2550, y: 280, hp: 120 },
  ],
};

export default MAP_PLAINS;
