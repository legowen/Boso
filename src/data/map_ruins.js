// src/data/map_ruins.js
// Ancient Ruins - Crumbling temple with 5 layers

const MAP_RUINS = {
  name: 'Ancient Ruins',
  width: 3200,
  height: 800,
  spawnX: 80,
  spawnY: 680,
  bgColors: {
    top: [0x2A1A0A, 0x3D2B1A],
    bottom: [0x3D2B1A, 0x4E3C2A],
    mountain: 0x2E1E10,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Layer 1 (y: 640~660) ===
    { x: 80, y: 650, w: 220, h: 16, isGround: false },
    { x: 460, y: 660, w: 180, h: 16, isGround: false },
    { x: 820, y: 640, w: 200, h: 16, isGround: false },
    { x: 1200, y: 655, w: 240, h: 16, isGround: false },
    { x: 1600, y: 645, w: 200, h: 16, isGround: false },
    { x: 1980, y: 660, w: 180, h: 16, isGround: false },
    { x: 2350, y: 640, w: 220, h: 16, isGround: false },
    { x: 2720, y: 650, w: 200, h: 16, isGround: false },

    // === Layer 2 (y: 530~560) ===
    { x: 160, y: 550, w: 200, h: 16, isGround: false },
    { x: 550, y: 535, w: 220, h: 16, isGround: false },
    { x: 940, y: 545, w: 240, h: 16, isGround: false },
    { x: 1340, y: 530, w: 200, h: 16, isGround: false },
    { x: 1720, y: 550, w: 220, h: 16, isGround: false },
    { x: 2100, y: 540, w: 200, h: 16, isGround: false },
    { x: 2500, y: 530, w: 240, h: 16, isGround: false },

    // === Layer 3 (y: 420~450) ===
    { x: 100, y: 435, w: 240, h: 16, isGround: false },
    { x: 520, y: 420, w: 200, h: 16, isGround: false },
    { x: 900, y: 440, w: 220, h: 16, isGround: false },
    { x: 1280, y: 425, w: 200, h: 16, isGround: false },
    { x: 1660, y: 445, w: 240, h: 16, isGround: false },
    { x: 2050, y: 420, w: 200, h: 16, isGround: false },
    { x: 2440, y: 435, w: 220, h: 16, isGround: false },

    // === Layer 4 (y: 310~340) ===
    { x: 220, y: 325, w: 220, h: 16, isGround: false },
    { x: 620, y: 310, w: 200, h: 16, isGround: false },
    { x: 1020, y: 330, w: 240, h: 16, isGround: false },
    { x: 1420, y: 315, w: 200, h: 16, isGround: false },
    { x: 1820, y: 335, w: 220, h: 16, isGround: false },
    { x: 2250, y: 320, w: 200, h: 16, isGround: false },
    { x: 2650, y: 310, w: 240, h: 16, isGround: false },

    // === Layer 5 (y: 200~230) ===
    { x: 380, y: 220, w: 200, h: 16, isGround: false },
    { x: 800, y: 210, w: 240, h: 16, isGround: false },
    { x: 1250, y: 200, w: 200, h: 16, isGround: false },
    { x: 1700, y: 215, w: 220, h: 16, isGround: false },
    { x: 2150, y: 205, w: 200, h: 16, isGround: false },
    { x: 2580, y: 220, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 50, y: 690, label: '← Mountain Peak', targetMap: 'mountain', spawnX: 3100, spawnY: 680 },
    { x: 3150, y: 690, label: '→ Shadow Realm', targetMap: 'shadow', spawnX: 80, spawnY: 680 },
  ],
  ropes: [
    // Ground to Layer 1
    { x: 190, topY: 650, bottomY: 700 },
    { x: 550, topY: 660, bottomY: 700 },
    { x: 920, topY: 640, bottomY: 700 },
    { x: 1320, topY: 655, bottomY: 700 },
    { x: 1700, topY: 645, bottomY: 700 },
    { x: 2070, topY: 660, bottomY: 700 },
    { x: 2460, topY: 640, bottomY: 700 },
    { x: 2820, topY: 650, bottomY: 700 },

    // Layer 1 to Layer 2
    { x: 260, topY: 550, bottomY: 650 },
    { x: 660, topY: 535, bottomY: 640 },
    { x: 1060, topY: 545, bottomY: 655 },
    { x: 1440, topY: 530, bottomY: 645 },
    { x: 1830, topY: 550, bottomY: 660 },
    { x: 2200, topY: 540, bottomY: 640 },
    { x: 2620, topY: 530, bottomY: 650 },

    // Layer 2 to Layer 3
    { x: 220, topY: 435, bottomY: 535 },
    { x: 620, topY: 420, bottomY: 545 },
    { x: 1010, topY: 440, bottomY: 530 },
    { x: 1380, topY: 425, bottomY: 550 },
    { x: 1780, topY: 445, bottomY: 540 },
    { x: 2150, topY: 420, bottomY: 530 },
    { x: 2550, topY: 435, bottomY: 530 },

    // Layer 3 to Layer 4
    { x: 330, topY: 325, bottomY: 420 },
    { x: 720, topY: 310, bottomY: 440 },
    { x: 1140, topY: 330, bottomY: 425 },
    { x: 1520, topY: 315, bottomY: 445 },
    { x: 1930, topY: 335, bottomY: 420 },
    { x: 2350, topY: 320, bottomY: 435 },
    { x: 2760, topY: 310, bottomY: 420 },

    // Layer 4 to Layer 5
    { x: 480, topY: 220, bottomY: 310 },
    { x: 920, topY: 210, bottomY: 330 },
    { x: 1350, topY: 200, bottomY: 315 },
    { x: 1810, topY: 215, bottomY: 335 },
    { x: 2250, topY: 205, bottomY: 320 },
    { x: 2690, topY: 220, bottomY: 310 },
  ],
  npcs: [],
  monsters: [
    // Ground monsters (5)
    { x: 300, y: 700, hp: 150 },
    { x: 800, y: 700, hp: 150 },
    { x: 1400, y: 700, hp: 150 },
    { x: 2000, y: 700, hp: 150 },
    { x: 2600, y: 700, hp: 150 },

    // Layer 1 monsters (4)
    { x: 510, y: 610, hp: 170 },
    { x: 1250, y: 615, hp: 170 },
    { x: 1650, y: 605, hp: 170 },
    { x: 2400, y: 600, hp: 170 },

    // Layer 2 monsters (4)
    { x: 610, y: 495, hp: 190 },
    { x: 1000, y: 505, hp: 190 },
    { x: 1780, y: 510, hp: 190 },
    { x: 2550, y: 490, hp: 190 },

    // Layer 3 monsters (4)
    { x: 580, y: 380, hp: 210 },
    { x: 1330, y: 385, hp: 210 },
    { x: 1710, y: 405, hp: 210 },
    { x: 2500, y: 395, hp: 210 },

    // Layer 4 monsters (3)
    { x: 700, y: 270, hp: 240 },
    { x: 1470, y: 275, hp: 240 },
    { x: 2300, y: 280, hp: 240 },

    // Layer 5 monsters (2) - strongest
    { x: 900, y: 170, hp: 270 },
    { x: 2200, y: 165, hp: 270 },
  ],
};

export default MAP_RUINS;
