// src/data/map_livingroom.js
// Living Room - sofas and shelves overrun by bubble experiments

const MAP_LIVINGROOM = {
  name: 'Living Room',
  region: 'house',
  width: 3200,
  height: 800,
  spawnX: 120,
  spawnY: 680,
  bgm: 'bgm_home',
  bgColors: {
    top: [0x4A3728, 0x6B5442],
    bottom: [0x6B5442, 0x8B7355],
    mountain: 0x3A2A1A,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Column 1 (sofa stack) ===
    { x: 150, y: 630, w: 240, h: 16, isGround: false },
    { x: 230, y: 480, w: 220, h: 16, isGround: false },
    { x: 320, y: 340, w: 200, h: 16, isGround: false },

    // === Column 2 (bookshelf) ===
    { x: 700, y: 610, w: 220, h: 16, isGround: false },
    { x: 780, y: 465, w: 220, h: 16, isGround: false },
    { x: 870, y: 330, w: 200, h: 16, isGround: false },

    // === Column 3 (coffee table & cabinet) ===
    { x: 1250, y: 620, w: 240, h: 16, isGround: false },
    { x: 1330, y: 470, w: 220, h: 16, isGround: false },
    { x: 1420, y: 335, w: 200, h: 16, isGround: false },

    // === Column 4 (TV stand) ===
    { x: 1800, y: 605, w: 220, h: 16, isGround: false },
    { x: 1880, y: 460, w: 220, h: 16, isGround: false },
    { x: 1970, y: 325, w: 200, h: 16, isGround: false },

    // === Column 5 (armchair & lamp) ===
    { x: 2350, y: 615, w: 240, h: 16, isGround: false },
    { x: 2430, y: 470, w: 220, h: 16, isGround: false },
    { x: 2520, y: 335, w: 200, h: 16, isGround: false },

    // === Window sill (right end) ===
    { x: 2850, y: 625, w: 200, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '← Backyard', targetMap: 'yard', spawnX: 2240, spawnY: 680 },
    { x: 3140, y: 690, label: '→ Kitchen', targetMap: 'kitchen', spawnX: 150, spawnY: 680 },
  ],
  ropes: [
    // Ground to layer 1
    { x: 300, topY: 630, bottomY: 700 },
    { x: 800, topY: 610, bottomY: 700 },
    { x: 1360, topY: 620, bottomY: 700 },
    { x: 1900, topY: 605, bottomY: 700 },
    { x: 2450, topY: 615, bottomY: 700 },
    { x: 2930, topY: 625, bottomY: 700 },

    // Layer 1 to layer 2
    { x: 330, topY: 480, bottomY: 620 },
    { x: 860, topY: 465, bottomY: 600 },
    { x: 1430, topY: 470, bottomY: 610 },
    { x: 1960, topY: 460, bottomY: 595 },
    { x: 2520, topY: 470, bottomY: 605 },

    // Layer 2 to layer 3
    { x: 420, topY: 340, bottomY: 470 },
    { x: 950, topY: 330, bottomY: 455 },
    { x: 1510, topY: 335, bottomY: 460 },
    { x: 2060, topY: 325, bottomY: 450 },
    { x: 2610, topY: 335, bottomY: 460 },
  ],
  npcs: [],
  monsters: [
    // Ground bubbles
    { x: 500, y: 700, type: 'bangul' },
    { x: 1000, y: 700, type: 'bangul' },
    { x: 1600, y: 700, type: 'bangul' },
    { x: 2200, y: 700, type: 'bangul' },

    // Bubbles resting on furniture
    { x: 270, y: 590, type: 'bangul' },
    { x: 810, y: 570, type: 'bangul' },
    { x: 1910, y: 565, type: 'bangul' },
    { x: 2470, y: 575, type: 'bangul' },

    // Bouncing balls
    { x: 800, y: 700, type: 'gong' },
    { x: 1800, y: 700, type: 'gong' },
    { x: 2600, y: 700, type: 'gong' },
  ],
};

export default MAP_LIVINGROOM;
