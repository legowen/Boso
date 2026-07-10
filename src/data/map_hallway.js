// src/data/map_hallway.js
// Hallway & Stairs - vertical climb to the upper floor

const MAP_HALLWAY = {
  name: 'Hallway & Stairs',
  width: 1800,
  height: 1400,
  spawnX: 120,
  spawnY: 1280,
  bgm: 'bgm_toybox',
  bgColors: {
    top: [0x1A1A2E, 0x2C2C44],
    bottom: [0x2C2C44, 0x3E3E5C],
    mountain: 0x14142A,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 1340, w: 1800, h: 60, isGround: true },

    // === Staircase (bottom-left to top-right) ===
    { x: 150, y: 1220, w: 300, h: 16, isGround: false },
    { x: 350, y: 1100, w: 300, h: 16, isGround: false },
    { x: 550, y: 980, w: 300, h: 16, isGround: false },
    { x: 750, y: 860, w: 300, h: 16, isGround: false },
    { x: 950, y: 740, w: 300, h: 16, isGround: false },
    { x: 1150, y: 620, w: 300, h: 16, isGround: false },
    { x: 1350, y: 500, w: 300, h: 16, isGround: false },
    { x: 1450, y: 380, w: 300, h: 16, isGround: false },

    // === Top landing (upper-floor exit) ===
    { x: 1500, y: 260, w: 240, h: 16, isGround: false },

    // === Side ledges (picture frames & shoe rack) ===
    { x: 900, y: 1220, w: 220, h: 16, isGround: false },
    { x: 100, y: 860, w: 220, h: 16, isGround: false },
    { x: 400, y: 620, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 1290, label: '← Kitchen', targetMap: 'kitchen', spawnX: 3040, spawnY: 680 },
    { x: 1620, y: 210, label: '↑ Toy Workshop', targetMap: 'playroom', spawnX: 120, spawnY: 680 },
  ],
  ropes: [
    // Ground to stairs
    { x: 250, topY: 1220, bottomY: 1300 },
    { x: 980, topY: 1220, bottomY: 1300 },

    // Staircase climb (each rope hangs from the overlap zone above)
    { x: 400, topY: 1100, bottomY: 1210 },
    { x: 600, topY: 980, bottomY: 1090 },
    { x: 800, topY: 860, bottomY: 970 },
    { x: 1000, topY: 740, bottomY: 850 },
    { x: 1200, topY: 620, bottomY: 730 },
    { x: 1400, topY: 500, bottomY: 610 },
    { x: 1550, topY: 380, bottomY: 490 },
    { x: 1600, topY: 260, bottomY: 370 },
  ],
  npcs: [],
  monsters: [
    // Balls bouncing down the stairs
    { x: 400, y: 1300, type: 'gong' },
    { x: 900, y: 1300, type: 'gong' },
    { x: 1400, y: 1300, type: 'gong' },
    { x: 450, y: 1060, type: 'gong' },
    { x: 1050, y: 700, type: 'gong' },
    { x: 980, y: 1180, type: 'gong' },

    // Laser dots patrolling the stairwell air
    { x: 500, y: 1150, type: 'laser' },
    { x: 900, y: 900, type: 'laser' },
    { x: 1300, y: 650, type: 'laser' },
    { x: 600, y: 450, type: 'laser' },
    { x: 1500, y: 320, type: 'laser' },
  ],
};

export default MAP_HALLWAY;
