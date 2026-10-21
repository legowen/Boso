// src/data/map_basement.js
// Basement Workshop - the Gearists' cluttered lab under the kitchen.
// Open-world branch: shortcut loop between the kitchen and the hallway.

const MAP_BASEMENT = {
  nameKey: 'map.basement.name',
  region: 'house',
  width: 2800,
  height: 800,
  spawnX: 140,
  spawnY: 680,
  bgm: 'bgm_toybox',
  bgColors: {
    top: [0x1A1A1A, 0x2A2620],
    bottom: [0x2A2620, 0x3E3428],
    mountain: 0x14120E,
  },
  platforms: [
    // === Ground (concrete floor) ===
    { x: 0, y: 740, w: 2800, h: 60, isGround: true },

    // === Column 1 (workbench) ===
    { x: 200, y: 625, w: 240, h: 16, isGround: false },
    { x: 280, y: 475, w: 220, h: 16, isGround: false },
    { x: 360, y: 330, w: 200, h: 16, isGround: false },

    // === Column 2 (parts shelf) ===
    { x: 750, y: 610, w: 220, h: 16, isGround: false },
    { x: 830, y: 465, w: 220, h: 16, isGround: false },
    { x: 910, y: 325, w: 200, h: 16, isGround: false },

    // === Column 3 (assembly line) ===
    { x: 1300, y: 620, w: 240, h: 16, isGround: false },
    { x: 1380, y: 470, w: 220, h: 16, isGround: false },
    { x: 1460, y: 330, w: 200, h: 16, isGround: false },

    // === Column 4 (crate stack) ===
    { x: 1850, y: 605, w: 220, h: 16, isGround: false },
    { x: 1930, y: 460, w: 220, h: 16, isGround: false },
    { x: 2010, y: 320, w: 200, h: 16, isGround: false },

    // === Boiler ledge (right end) ===
    { x: 2350, y: 615, w: 240, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, labelKey: 'portal.basement.kitchen', targetMap: 'kitchen', spawnX: 1700, spawnY: 680 },
    { x: 2740, y: 690, labelKey: 'portal.basement.hallway', targetMap: 'hallway', spawnX: 340, spawnY: 1280 },
  ],
  ropes: [
    // Ground to layer 1
    { x: 350, topY: 625, bottomY: 700 },
    { x: 850, topY: 610, bottomY: 700 },
    { x: 1400, topY: 620, bottomY: 700 },
    { x: 1950, topY: 605, bottomY: 700 },
    { x: 2450, topY: 615, bottomY: 700 },

    // Layer 1 to layer 2
    { x: 380, topY: 475, bottomY: 615 },
    { x: 900, topY: 465, bottomY: 600 },
    { x: 1450, topY: 470, bottomY: 610 },
    { x: 2000, topY: 460, bottomY: 595 },

    // Layer 2 to layer 3
    { x: 470, topY: 330, bottomY: 465 },
    { x: 1000, topY: 325, bottomY: 455 },
    { x: 1550, topY: 330, bottomY: 460 },
    { x: 2100, topY: 320, bottomY: 450 },
  ],
  npcs: [
    {
      x: 1000,
      y: 714,
      id: 'apprentice_bolt',
      nameKey: 'npc.apprentice_bolt.name',
      dialogueKeys: [
        'npc.apprentice_bolt.line1',
        'npc.apprentice_bolt.line2',
        'npc.apprentice_bolt.line3',
      ],
    },
  ],
  monsters: [
    // Feral wind-up prototypes
    { x: 500, y: 700, type: 'robo' },
    { x: 1200, y: 700, type: 'robo' },
    { x: 2100, y: 700, type: 'robo' },
    { x: 2350, y: 700, type: 'robo' },
    { x: 300, y: 585, type: 'robo' },
    { x: 1400, y: 580, type: 'robo' },

    // Stray balls
    { x: 800, y: 700, type: 'gong' },
    { x: 1600, y: 700, type: 'gong' },
    { x: 1950, y: 565, type: 'gong' },

    // Loose laser pointers
    { x: 1000, y: 450, type: 'laser' },
    { x: 2200, y: 400, type: 'laser' },
  ],
};

export default MAP_BASEMENT;
