// src/data/map_forest2.js
// Emerald Forest - Bright woodland hunting ground (same difficulty as Deep Forest)

const MAP_FOREST2 = {
  name: 'Emerald Forest',
  width: 3200,
  height: 800,
  spawnX: 80,
  spawnY: 680,
  bgColors: {
    top: [0x1A4A1A, 0x2D6B2D],
    bottom: [0x2D6B2D, 0x3D8B3D],
    mountain: 0x1E5E1E,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Layer 1 (low platforms, y: 580~620) ===
    { x: 120, y: 610, w: 200, h: 16, isGround: false },
    { x: 470, y: 590, w: 220, h: 16, isGround: false },
    { x: 830, y: 600, w: 180, h: 16, isGround: false },
    { x: 1180, y: 620, w: 200, h: 16, isGround: false },
    { x: 1530, y: 590, w: 240, h: 16, isGround: false },
    { x: 1880, y: 610, w: 200, h: 16, isGround: false },
    { x: 2230, y: 600, w: 180, h: 16, isGround: false },
    { x: 2580, y: 580, w: 220, h: 16, isGround: false },
    { x: 2900, y: 610, w: 200, h: 16, isGround: false },

    // === Layer 2 (mid platforms, y: 420~480) ===
    { x: 250, y: 460, w: 220, h: 16, isGround: false },
    { x: 620, y: 440, w: 200, h: 16, isGround: false },
    { x: 1000, y: 470, w: 240, h: 16, isGround: false },
    { x: 1380, y: 430, w: 200, h: 16, isGround: false },
    { x: 1750, y: 450, w: 220, h: 16, isGround: false },
    { x: 2100, y: 420, w: 200, h: 16, isGround: false },
    { x: 2450, y: 460, w: 240, h: 16, isGround: false },
    { x: 2800, y: 440, w: 200, h: 16, isGround: false },

    // === Layer 3 (high platforms, y: 280~340) ===
    { x: 400, y: 320, w: 200, h: 16, isGround: false },
    { x: 800, y: 300, w: 220, h: 16, isGround: false },
    { x: 1200, y: 280, w: 200, h: 16, isGround: false },
    { x: 1600, y: 310, w: 240, h: 16, isGround: false },
    { x: 2000, y: 290, w: 200, h: 16, isGround: false },
    { x: 2400, y: 320, w: 220, h: 16, isGround: false },
    { x: 2750, y: 300, w: 200, h: 16, isGround: false },
  ],
  portals: [
    { x: 50, y: 690, label: '← Mountain Peak', targetMap: 'mountain', spawnX: 3100, spawnY: 680 },
    { x: 3150, y: 690, label: '→ Golden Plains', targetMap: 'plains', spawnX: 80, spawnY: 680 },
  ],
  ropes: [
    // Ground to Layer 1
    { x: 220, topY: 610, bottomY: 700 },
    { x: 580, topY: 590, bottomY: 700 },
    { x: 920, topY: 600, bottomY: 700 },
    { x: 1280, topY: 620, bottomY: 700 },
    { x: 1650, topY: 590, bottomY: 700 },
    { x: 1980, topY: 610, bottomY: 700 },
    { x: 2320, topY: 600, bottomY: 700 },
    { x: 2690, topY: 580, bottomY: 700 },
    { x: 3000, topY: 610, bottomY: 700 },

    // Layer 1 to Layer 2
    { x: 360, topY: 460, bottomY: 590 },
    { x: 730, topY: 440, bottomY: 600 },
    { x: 1120, topY: 470, bottomY: 620 },
    { x: 1480, topY: 430, bottomY: 590 },
    { x: 1860, topY: 450, bottomY: 610 },
    { x: 2200, topY: 420, bottomY: 600 },
    { x: 2570, topY: 460, bottomY: 580 },
    { x: 2900, topY: 440, bottomY: 610 },

    // Layer 2 to Layer 3
    { x: 470, topY: 320, bottomY: 460 },
    { x: 910, topY: 300, bottomY: 440 },
    { x: 1300, topY: 280, bottomY: 430 },
    { x: 1720, topY: 310, bottomY: 450 },
    { x: 2100, topY: 290, bottomY: 420 },
    { x: 2510, topY: 320, bottomY: 460 },
    { x: 2850, topY: 300, bottomY: 440 },
  ],
  npcs: [],
  monsters: [
    // Ground monsters (5) - 1 elite
    { x: 350, y: 700, hp: 70 },
    { x: 800, y: 700, hp: 70 },
    { x: 1300, y: 700, hp: 140, type: 'elite' },
    { x: 1800, y: 700, hp: 70 },
    { x: 2400, y: 700, hp: 70 },

    // Layer 1 monsters (6) - 2 elite
    { x: 500, y: 550, hp: 85 },
    { x: 900, y: 560, hp: 170, type: 'elite' },
    { x: 1250, y: 580, hp: 85 },
    { x: 1600, y: 550, hp: 85 },
    { x: 2000, y: 570, hp: 170, type: 'elite' },
    { x: 2650, y: 540, hp: 85 },

    // Layer 2 monsters (5) - 1 elite
    { x: 350, y: 420, hp: 100 },
    { x: 700, y: 400, hp: 100 },
    { x: 1100, y: 430, hp: 200, type: 'elite' },
    { x: 1800, y: 410, hp: 100 },
    { x: 2500, y: 420, hp: 100 },

    // Layer 3 monsters (4) - 1 elite
    { x: 500, y: 280, hp: 120 },
    { x: 900, y: 260, hp: 120 },
    { x: 1700, y: 270, hp: 240, type: 'elite' },
    { x: 2450, y: 280, hp: 120 },
  ],
};

export default MAP_FOREST2;
