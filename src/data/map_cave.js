// src/data/map_cave.js
// Dark Cave - Underground labyrinth with 5 layers

const MAP_CAVE = {
  name: 'Dark Cave',
  width: 3200,
  height: 800,
  spawnX: 80,
  spawnY: 680,
  bgColors: {
    top: [0x0A0A14, 0x12121E],
    bottom: [0x12121E, 0x1A1A28],
    mountain: 0x0E0E1A,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Layer 1 (y: 640~660) ===
    { x: 120, y: 660, w: 180, h: 16, isGround: false },
    { x: 500, y: 650, w: 200, h: 16, isGround: false },
    { x: 880, y: 640, w: 220, h: 16, isGround: false },
    { x: 1300, y: 655, w: 180, h: 16, isGround: false },
    { x: 1680, y: 645, w: 200, h: 16, isGround: false },
    { x: 2050, y: 660, w: 220, h: 16, isGround: false },
    { x: 2420, y: 640, w: 200, h: 16, isGround: false },
    { x: 2800, y: 650, w: 180, h: 16, isGround: false },

    // === Layer 2 (y: 530~560) ===
    { x: 200, y: 550, w: 200, h: 16, isGround: false },
    { x: 600, y: 540, w: 240, h: 16, isGround: false },
    { x: 1000, y: 530, w: 200, h: 16, isGround: false },
    { x: 1400, y: 550, w: 220, h: 16, isGround: false },
    { x: 1800, y: 535, w: 200, h: 16, isGround: false },
    { x: 2200, y: 545, w: 240, h: 16, isGround: false },
    { x: 2600, y: 530, w: 200, h: 16, isGround: false },

    // === Layer 3 (y: 420~450) ===
    { x: 150, y: 440, w: 220, h: 16, isGround: false },
    { x: 550, y: 430, w: 200, h: 16, isGround: false },
    { x: 950, y: 420, w: 240, h: 16, isGround: false },
    { x: 1350, y: 440, w: 200, h: 16, isGround: false },
    { x: 1750, y: 425, w: 220, h: 16, isGround: false },
    { x: 2150, y: 435, w: 200, h: 16, isGround: false },
    { x: 2550, y: 420, w: 240, h: 16, isGround: false },

    // === Layer 4 (y: 310~340) ===
    { x: 300, y: 330, w: 200, h: 16, isGround: false },
    { x: 700, y: 320, w: 220, h: 16, isGround: false },
    { x: 1100, y: 310, w: 200, h: 16, isGround: false },
    { x: 1500, y: 330, w: 240, h: 16, isGround: false },
    { x: 1900, y: 315, w: 200, h: 16, isGround: false },
    { x: 2350, y: 325, w: 220, h: 16, isGround: false },
    { x: 2750, y: 310, w: 200, h: 16, isGround: false },

    // === Layer 5 (y: 200~230) ===
    { x: 450, y: 220, w: 220, h: 16, isGround: false },
    { x: 900, y: 210, w: 200, h: 16, isGround: false },
    { x: 1350, y: 200, w: 240, h: 16, isGround: false },
    { x: 1800, y: 215, w: 200, h: 16, isGround: false },
    { x: 2250, y: 205, w: 220, h: 16, isGround: false },
    { x: 2650, y: 220, w: 200, h: 16, isGround: false },
  ],
  portals: [
    { x: 50, y: 690, label: '← Deep Forest', targetMap: 'forest', spawnX: 3100, spawnY: 680 },
    { x: 3150, y: 690, label: '→ Mountain Peak', targetMap: 'mountain', spawnX: 80, spawnY: 680 },
  ],
  ropes: [
    // Ground to Layer 1
    { x: 210, topY: 660, bottomY: 700 },
    { x: 600, topY: 650, bottomY: 700 },
    { x: 990, topY: 640, bottomY: 700 },
    { x: 1390, topY: 655, bottomY: 700 },
    { x: 1780, topY: 645, bottomY: 700 },
    { x: 2160, topY: 660, bottomY: 700 },
    { x: 2520, topY: 640, bottomY: 700 },
    { x: 2890, topY: 650, bottomY: 700 },

    // Layer 1 to Layer 2
    { x: 300, topY: 550, bottomY: 650 },
    { x: 720, topY: 540, bottomY: 640 },
    { x: 1100, topY: 530, bottomY: 655 },
    { x: 1500, topY: 550, bottomY: 645 },
    { x: 1900, topY: 535, bottomY: 660 },
    { x: 2320, topY: 545, bottomY: 640 },
    { x: 2700, topY: 530, bottomY: 650 },

    // Layer 2 to Layer 3
    { x: 260, topY: 440, bottomY: 540 },
    { x: 660, topY: 430, bottomY: 530 },
    { x: 1060, topY: 420, bottomY: 550 },
    { x: 1460, topY: 440, bottomY: 535 },
    { x: 1860, topY: 425, bottomY: 545 },
    { x: 2260, topY: 435, bottomY: 530 },
    { x: 2660, topY: 420, bottomY: 545 },

    // Layer 3 to Layer 4
    { x: 400, topY: 330, bottomY: 430 },
    { x: 800, topY: 320, bottomY: 420 },
    { x: 1200, topY: 310, bottomY: 440 },
    { x: 1600, topY: 330, bottomY: 425 },
    { x: 2000, topY: 315, bottomY: 435 },
    { x: 2450, topY: 325, bottomY: 420 },
    { x: 2850, topY: 310, bottomY: 430 },

    // Layer 4 to Layer 5
    { x: 550, topY: 220, bottomY: 320 },
    { x: 1000, topY: 210, bottomY: 310 },
    { x: 1450, topY: 200, bottomY: 330 },
    { x: 1900, topY: 215, bottomY: 315 },
    { x: 2350, topY: 205, bottomY: 325 },
    { x: 2750, topY: 220, bottomY: 310 },
  ],
  npcs: [],
  monsters: [
    // Ground monsters (4) - 1 elite
    { x: 400, y: 700, hp: 90 },
    { x: 1000, y: 700, hp: 180, type: 'elite' },
    { x: 1600, y: 700, hp: 90 },
    { x: 2300, y: 700, hp: 90 },

    // Layer 1 monsters (4) - 1 elite
    { x: 550, y: 610, hp: 100 },
    { x: 1350, y: 615, hp: 100 },
    { x: 1730, y: 605, hp: 200, type: 'elite' },
    { x: 2470, y: 600, hp: 100 },

    // Layer 2 monsters (3) - 1 elite
    { x: 700, y: 500, hp: 120 },
    { x: 1450, y: 510, hp: 120 },
    { x: 2250, y: 505, hp: 240, type: 'elite' },

    // Layer 3 monsters (3) - 1 elite
    { x: 600, y: 390, hp: 140 },
    { x: 1400, y: 400, hp: 280, type: 'elite' },
    { x: 2200, y: 395, hp: 140 },

    // Layer 4 monsters (2) - 1 elite
    { x: 800, y: 280, hp: 160 },
    { x: 1950, y: 275, hp: 320, type: 'elite' },

    // Layer 5 monsters (2) - strongest
    { x: 1000, y: 170, hp: 180 },
    { x: 2300, y: 165, hp: 180 },
  ],
};

export default MAP_CAVE;
