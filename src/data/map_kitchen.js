// src/data/map_kitchen.js
// Kitchen - counters and cupboards, bouncing balls everywhere

const MAP_KITCHEN = {
  name: 'Kitchen',
  width: 3200,
  height: 800,
  spawnX: 120,
  spawnY: 680,
  bgm: 'bgm_home',
  bgColors: {
    top: [0x1F4E5F, 0x2E7D8C],
    bottom: [0x2E7D8C, 0x4CA1AF],
    mountain: 0x1A3E4C,
  },
  platforms: [
    // === Ground (tiled floor) ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Column 1 (kitchen counter) ===
    { x: 180, y: 625, w: 240, h: 16, isGround: false },
    { x: 260, y: 475, w: 220, h: 16, isGround: false },
    { x: 350, y: 335, w: 200, h: 16, isGround: false },

    // === Column 2 (stove & hood) ===
    { x: 730, y: 615, w: 220, h: 16, isGround: false },
    { x: 810, y: 470, w: 220, h: 16, isGround: false },
    { x: 900, y: 330, w: 200, h: 16, isGround: false },

    // === Column 3 (kitchen island) ===
    { x: 1280, y: 620, w: 240, h: 16, isGround: false },
    { x: 1360, y: 465, w: 220, h: 16, isGround: false },
    { x: 1450, y: 325, w: 200, h: 16, isGround: false },

    // === Column 4 (sink & cupboards) ===
    { x: 1830, y: 610, w: 220, h: 16, isGround: false },
    { x: 1910, y: 460, w: 220, h: 16, isGround: false },
    { x: 2000, y: 320, w: 200, h: 16, isGround: false },

    // === Column 5 (fridge top & shelves) ===
    { x: 2380, y: 620, w: 240, h: 16, isGround: false },
    { x: 2460, y: 470, w: 220, h: 16, isGround: false },
    { x: 2550, y: 330, w: 200, h: 16, isGround: false },

    // === Pantry ledge (right end) ===
    { x: 2880, y: 615, w: 200, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '← Living Room', targetMap: 'livingroom', spawnX: 3040, spawnY: 680 },
    { x: 3140, y: 690, label: '→ Hallway', targetMap: 'hallway', spawnX: 120, spawnY: 1280 },
  ],
  ropes: [
    // Ground to layer 1
    { x: 330, topY: 625, bottomY: 700 },
    { x: 830, topY: 615, bottomY: 700 },
    { x: 1390, topY: 620, bottomY: 700 },
    { x: 1930, topY: 610, bottomY: 700 },
    { x: 2480, topY: 620, bottomY: 700 },
    { x: 2960, topY: 615, bottomY: 700 },

    // Layer 1 to layer 2
    { x: 360, topY: 475, bottomY: 615 },
    { x: 890, topY: 470, bottomY: 605 },
    { x: 1460, topY: 465, bottomY: 610 },
    { x: 1990, topY: 460, bottomY: 600 },
    { x: 2550, topY: 470, bottomY: 610 },

    // Layer 2 to layer 3
    { x: 450, topY: 335, bottomY: 465 },
    { x: 980, topY: 330, bottomY: 460 },
    { x: 1540, topY: 325, bottomY: 455 },
    { x: 2090, topY: 320, bottomY: 450 },
    { x: 2640, topY: 330, bottomY: 460 },
  ],
  npcs: [],
  monsters: [
    // Bubbles
    { x: 400, y: 700, type: 'bangul' },
    { x: 2900, y: 700, type: 'bangul' },
    { x: 840, y: 575, type: 'bangul' },
    { x: 1940, y: 570, type: 'bangul' },

    // Bouncing balls rule the kitchen
    { x: 700, y: 700, type: 'gong' },
    { x: 1300, y: 700, type: 'gong' },
    { x: 2000, y: 700, type: 'gong' },
    { x: 2600, y: 700, type: 'gong' },
    { x: 300, y: 585, type: 'gong' },
    { x: 1390, y: 580, type: 'gong' },

    // First laser dots
    { x: 1100, y: 500, type: 'laser' },
    { x: 2300, y: 450, type: 'laser' },
  ],
};

export default MAP_KITCHEN;
