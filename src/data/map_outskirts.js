// src/data/map_outskirts.js
// Village Outskirts - Monster hunting field

const MAP_OUTSKIRTS = {
  name: 'Village Outskirts',
  width: 3200,
  height: 800,
  spawnX: 80,
  spawnY: 680,
  bgColors: {
    top: [0x1A0A2E, 0x16213E],
    bottom: [0x16213E, 0x0F3460],
    mountain: 0x121A2A,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Layer 1 (low platforms, y: 580~620) ===
    { x: 150, y: 620, w: 180, h: 16, isGround: false },
    { x: 500, y: 600, w: 220, h: 16, isGround: false },
    { x: 850, y: 580, w: 200, h: 16, isGround: false },
    { x: 1200, y: 610, w: 250, h: 16, isGround: false },
    { x: 1550, y: 590, w: 180, h: 16, isGround: false },
    { x: 1900, y: 620, w: 200, h: 16, isGround: false },
    { x: 2250, y: 580, w: 220, h: 16, isGround: false },
    { x: 2600, y: 600, w: 200, h: 16, isGround: false },

    // === Layer 2 (mid platforms, y: 420~480) ===
    { x: 300, y: 460, w: 200, h: 16, isGround: false },
    { x: 700, y: 440, w: 250, h: 16, isGround: false },
    { x: 1100, y: 470, w: 200, h: 16, isGround: false },
    { x: 1450, y: 430, w: 220, h: 16, isGround: false },
    { x: 1800, y: 460, w: 180, h: 16, isGround: false },
    { x: 2150, y: 420, w: 240, h: 16, isGround: false },
    { x: 2550, y: 450, w: 200, h: 16, isGround: false },

    // === Layer 3 (high platforms, y: 280~340) ===
    { x: 450, y: 320, w: 220, h: 16, isGround: false },
    { x: 900, y: 300, w: 200, h: 16, isGround: false },
    { x: 1300, y: 280, w: 250, h: 16, isGround: false },
    { x: 1700, y: 310, w: 200, h: 16, isGround: false },
    { x: 2100, y: 290, w: 220, h: 16, isGround: false },
    { x: 2500, y: 320, w: 200, h: 16, isGround: false },
  ],
  portals: [
    // Back to village (left side)
    { x: 50, y: 690, label: '← Haven Village', targetMap: 'haven', spawnX: 3000, spawnY: 680 },
    // Next map (right side)
    { x: 3150, y: 690, label: '→ Deep Forest', targetMap: 'forest', spawnX: 80, spawnY: 680 },
  ],
  ropes: [
    // Ground to Layer 1
    { x: 240, topY: 620, bottomY: 700 },
    { x: 610, topY: 600, bottomY: 700 },
    { x: 950, topY: 580, bottomY: 700 },
    { x: 1320, topY: 610, bottomY: 700 },
    { x: 1640, topY: 590, bottomY: 700 },
    { x: 2000, topY: 620, bottomY: 700 },
    { x: 2360, topY: 580, bottomY: 700 },
    { x: 2700, topY: 600, bottomY: 700 },

    // Layer 1 to Layer 2
    { x: 400, topY: 460, bottomY: 600 },
    { x: 820, topY: 440, bottomY: 580 },
    { x: 1200, topY: 470, bottomY: 610 },
    { x: 1550, topY: 430, bottomY: 590 },
    { x: 1900, topY: 460, bottomY: 620 },
    { x: 2270, topY: 420, bottomY: 580 },
    { x: 2650, topY: 450, bottomY: 600 },

    // Layer 2 to Layer 3
    { x: 500, topY: 320, bottomY: 460 },
    { x: 950, topY: 300, bottomY: 440 },
    { x: 1400, topY: 280, bottomY: 430 },
    { x: 1800, topY: 310, bottomY: 460 },
    { x: 2200, topY: 290, bottomY: 420 },
    { x: 2600, topY: 320, bottomY: 450 },
  ],
  npcs: [],
  monsters: [
    // Ground monsters (6) - 2 elite
    { x: 300, y: 700, hp: 50 },
    { x: 700, y: 700, hp: 100, type: 'elite' },
    { x: 1100, y: 700, hp: 50 },
    { x: 1500, y: 700, hp: 50 },
    { x: 2000, y: 700, hp: 100, type: 'elite' },
    { x: 2500, y: 700, hp: 50 },

    // Layer 1 monsters (6) - 2 elite
    { x: 550, y: 560, hp: 60 },
    { x: 900, y: 540, hp: 120, type: 'elite' },
    { x: 1300, y: 570, hp: 60 },
    { x: 1600, y: 550, hp: 60 },
    { x: 1950, y: 580, hp: 120, type: 'elite' },
    { x: 2650, y: 560, hp: 60 },

    // Layer 2 monsters (5) - 1 elite
    { x: 400, y: 420, hp: 80 },
    { x: 800, y: 400, hp: 160, type: 'elite' },
    { x: 1500, y: 390, hp: 80 },
    { x: 2200, y: 380, hp: 80 },
    { x: 2600, y: 410, hp: 80 },

    // Layer 3 monsters (3) - 1 elite
    { x: 550, y: 280, hp: 100 },
    { x: 1400, y: 240, hp: 200, type: 'elite' },
    { x: 2200, y: 250, hp: 100 },
  ],
};

export default MAP_OUTSKIRTS;