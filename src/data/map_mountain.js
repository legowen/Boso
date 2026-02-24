// src/data/map_mountain.js
// Mountain Peak - High altitude combat zone with 5 layers

const MAP_MOUNTAIN = {
  name: 'Mountain Peak',
  width: 3200,
  height: 800,
  spawnX: 80,
  spawnY: 680,
  bgColors: {
    top: [0x1A2A3A, 0x2C3E50],
    bottom: [0x2C3E50, 0x4A6580],
    mountain: 0x1E3040,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Layer 1 (y: 640~660) ===
    { x: 100, y: 655, w: 200, h: 16, isGround: false },
    { x: 480, y: 645, w: 180, h: 16, isGround: false },
    { x: 850, y: 660, w: 220, h: 16, isGround: false },
    { x: 1250, y: 640, w: 200, h: 16, isGround: false },
    { x: 1620, y: 650, w: 240, h: 16, isGround: false },
    { x: 2000, y: 645, w: 180, h: 16, isGround: false },
    { x: 2380, y: 655, w: 200, h: 16, isGround: false },
    { x: 2750, y: 640, w: 220, h: 16, isGround: false },

    // === Layer 2 (y: 530~560) ===
    { x: 180, y: 545, w: 220, h: 16, isGround: false },
    { x: 580, y: 535, w: 200, h: 16, isGround: false },
    { x: 960, y: 550, w: 180, h: 16, isGround: false },
    { x: 1350, y: 530, w: 240, h: 16, isGround: false },
    { x: 1750, y: 540, w: 200, h: 16, isGround: false },
    { x: 2150, y: 555, w: 220, h: 16, isGround: false },
    { x: 2550, y: 535, w: 200, h: 16, isGround: false },

    // === Layer 3 (y: 420~450) ===
    { x: 120, y: 440, w: 200, h: 16, isGround: false },
    { x: 500, y: 425, w: 240, h: 16, isGround: false },
    { x: 900, y: 435, w: 200, h: 16, isGround: false },
    { x: 1300, y: 420, w: 220, h: 16, isGround: false },
    { x: 1700, y: 445, w: 200, h: 16, isGround: false },
    { x: 2100, y: 430, w: 240, h: 16, isGround: false },
    { x: 2500, y: 420, w: 200, h: 16, isGround: false },

    // === Layer 4 (y: 310~340) ===
    { x: 250, y: 330, w: 220, h: 16, isGround: false },
    { x: 650, y: 315, w: 200, h: 16, isGround: false },
    { x: 1050, y: 325, w: 240, h: 16, isGround: false },
    { x: 1450, y: 310, w: 200, h: 16, isGround: false },
    { x: 1850, y: 335, w: 220, h: 16, isGround: false },
    { x: 2300, y: 320, w: 200, h: 16, isGround: false },
    { x: 2700, y: 310, w: 220, h: 16, isGround: false },

    // === Layer 5 (y: 200~230) ===
    { x: 400, y: 215, w: 200, h: 16, isGround: false },
    { x: 850, y: 205, w: 220, h: 16, isGround: false },
    { x: 1300, y: 200, w: 200, h: 16, isGround: false },
    { x: 1750, y: 210, w: 240, h: 16, isGround: false },
    { x: 2200, y: 220, w: 200, h: 16, isGround: false },
    { x: 2600, y: 205, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 50, y: 690, label: '← Dark Cave', targetMap: 'cave', spawnX: 3100, spawnY: 680 },
    { x: 3150, y: 690, label: '→ Ancient Ruins', targetMap: 'ruins', spawnX: 80, spawnY: 680 },
  ],
  ropes: [
    // Ground to Layer 1
    { x: 200, topY: 655, bottomY: 700 },
    { x: 570, topY: 645, bottomY: 700 },
    { x: 960, topY: 660, bottomY: 700 },
    { x: 1350, topY: 640, bottomY: 700 },
    { x: 1740, topY: 650, bottomY: 700 },
    { x: 2090, topY: 645, bottomY: 700 },
    { x: 2480, topY: 655, bottomY: 700 },
    { x: 2860, topY: 640, bottomY: 700 },

    // Layer 1 to Layer 2
    { x: 290, topY: 545, bottomY: 645 },
    { x: 680, topY: 535, bottomY: 660 },
    { x: 1050, topY: 550, bottomY: 640 },
    { x: 1470, topY: 530, bottomY: 650 },
    { x: 1850, topY: 540, bottomY: 645 },
    { x: 2260, topY: 555, bottomY: 655 },
    { x: 2650, topY: 535, bottomY: 640 },

    // Layer 2 to Layer 3
    { x: 220, topY: 440, bottomY: 535 },
    { x: 620, topY: 425, bottomY: 550 },
    { x: 1000, topY: 435, bottomY: 530 },
    { x: 1420, topY: 420, bottomY: 540 },
    { x: 1800, topY: 445, bottomY: 555 },
    { x: 2220, topY: 430, bottomY: 535 },
    { x: 2600, topY: 420, bottomY: 535 },

    // Layer 3 to Layer 4
    { x: 360, topY: 330, bottomY: 425 },
    { x: 750, topY: 315, bottomY: 435 },
    { x: 1170, topY: 325, bottomY: 420 },
    { x: 1550, topY: 310, bottomY: 445 },
    { x: 1960, topY: 335, bottomY: 430 },
    { x: 2400, topY: 320, bottomY: 420 },
    { x: 2810, topY: 310, bottomY: 425 },

    // Layer 4 to Layer 5
    { x: 500, topY: 215, bottomY: 315 },
    { x: 950, topY: 205, bottomY: 325 },
    { x: 1400, topY: 200, bottomY: 310 },
    { x: 1860, topY: 210, bottomY: 335 },
    { x: 2300, topY: 220, bottomY: 320 },
    { x: 2710, topY: 205, bottomY: 310 },
  ],
  npcs: [],
  monsters: [
    // Ground monsters (4)
    { x: 350, y: 700, hp: 120 },
    { x: 1000, y: 700, hp: 120 },
    { x: 1700, y: 700, hp: 120 },
    { x: 2400, y: 700, hp: 120 },

    // Layer 1 monsters (4)
    { x: 530, y: 605, hp: 140 },
    { x: 1300, y: 600, hp: 140 },
    { x: 1670, y: 610, hp: 140 },
    { x: 2430, y: 615, hp: 140 },

    // Layer 2 monsters (4)
    { x: 640, y: 495, hp: 160 },
    { x: 1010, y: 510, hp: 160 },
    { x: 1800, y: 500, hp: 160 },
    { x: 2600, y: 495, hp: 160 },

    // Layer 3 monsters (3)
    { x: 560, y: 385, hp: 180 },
    { x: 1350, y: 380, hp: 180 },
    { x: 2150, y: 390, hp: 180 },

    // Layer 4 monsters (3)
    { x: 750, y: 275, hp: 200 },
    { x: 1500, y: 270, hp: 200 },
    { x: 2350, y: 280, hp: 200 },

    // Layer 5 monsters (2) - strongest
    { x: 950, y: 165, hp: 230 },
    { x: 2250, y: 180, hp: 230 },
  ],
};

export default MAP_MOUNTAIN;
