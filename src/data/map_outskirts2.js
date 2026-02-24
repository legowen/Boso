// src/data/map_outskirts2.js
// Village Outskirts II - Evening hunting field (same difficulty as Village Outskirts)

const MAP_OUTSKIRTS2 = {
  name: 'Village Outskirts II',
  width: 3200,
  height: 800,
  spawnX: 80,
  spawnY: 680,
  bgColors: {
    top: [0x2E1A3E, 0x3D2850],
    bottom: [0x3D2850, 0x4A3560],
    mountain: 0x2A1A35,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Layer 1 (low platforms, y: 580~620) ===
    { x: 150, y: 620, w: 180, h: 16, isGround: false },
    { x: 480, y: 600, w: 220, h: 16, isGround: false },
    { x: 850, y: 580, w: 200, h: 16, isGround: false },
    { x: 1200, y: 610, w: 250, h: 16, isGround: false },
    { x: 1560, y: 590, w: 180, h: 16, isGround: false },
    { x: 1920, y: 620, w: 200, h: 16, isGround: false },
    { x: 2280, y: 580, w: 220, h: 16, isGround: false },
    { x: 2640, y: 600, w: 200, h: 16, isGround: false },

    // === Layer 2 (mid platforms, y: 420~480) ===
    { x: 300, y: 460, w: 200, h: 16, isGround: false },
    { x: 680, y: 440, w: 250, h: 16, isGround: false },
    { x: 1080, y: 470, w: 200, h: 16, isGround: false },
    { x: 1450, y: 430, w: 220, h: 16, isGround: false },
    { x: 1820, y: 460, w: 180, h: 16, isGround: false },
    { x: 2180, y: 420, w: 240, h: 16, isGround: false },
    { x: 2560, y: 450, w: 200, h: 16, isGround: false },

    // === Layer 3 (high platforms, y: 280~340) ===
    { x: 450, y: 320, w: 220, h: 16, isGround: false },
    { x: 900, y: 300, w: 200, h: 16, isGround: false },
    { x: 1300, y: 280, w: 250, h: 16, isGround: false },
    { x: 1700, y: 310, w: 200, h: 16, isGround: false },
    { x: 2100, y: 290, w: 220, h: 16, isGround: false },
    { x: 2500, y: 320, w: 200, h: 16, isGround: false },
  ],
  portals: [
    { x: 50, y: 690, label: '← Golden Plains', targetMap: 'plains', spawnX: 3100, spawnY: 680 },
    { x: 3150, y: 690, label: '→ Sanctuary', targetMap: 'sanctuary', spawnX: 80, spawnY: 680 },
  ],
  ropes: [
    // Ground to Layer 1
    { x: 240, topY: 620, bottomY: 700 },
    { x: 590, topY: 600, bottomY: 700 },
    { x: 950, topY: 580, bottomY: 700 },
    { x: 1320, topY: 610, bottomY: 700 },
    { x: 1650, topY: 590, bottomY: 700 },
    { x: 2020, topY: 620, bottomY: 700 },
    { x: 2390, topY: 580, bottomY: 700 },
    { x: 2740, topY: 600, bottomY: 700 },

    // Layer 1 to Layer 2
    { x: 400, topY: 460, bottomY: 600 },
    { x: 800, topY: 440, bottomY: 580 },
    { x: 1180, topY: 470, bottomY: 610 },
    { x: 1560, topY: 430, bottomY: 590 },
    { x: 1920, topY: 460, bottomY: 620 },
    { x: 2300, topY: 420, bottomY: 580 },
    { x: 2660, topY: 450, bottomY: 600 },

    // Layer 2 to Layer 3
    { x: 530, topY: 320, bottomY: 460 },
    { x: 980, topY: 300, bottomY: 440 },
    { x: 1420, topY: 280, bottomY: 430 },
    { x: 1820, topY: 310, bottomY: 460 },
    { x: 2220, topY: 290, bottomY: 420 },
    { x: 2600, topY: 320, bottomY: 450 },
  ],
  npcs: [],
  monsters: [
    // Ground monsters (6)
    { x: 300, y: 700, hp: 50 },
    { x: 700, y: 700, hp: 50 },
    { x: 1100, y: 700, hp: 50 },
    { x: 1500, y: 700, hp: 50 },
    { x: 2000, y: 700, hp: 50 },
    { x: 2500, y: 700, hp: 50 },

    // Layer 1 monsters (6)
    { x: 530, y: 560, hp: 60 },
    { x: 900, y: 540, hp: 60 },
    { x: 1300, y: 570, hp: 60 },
    { x: 1620, y: 550, hp: 60 },
    { x: 1970, y: 580, hp: 60 },
    { x: 2690, y: 560, hp: 60 },

    // Layer 2 monsters (5)
    { x: 380, y: 420, hp: 80 },
    { x: 780, y: 400, hp: 80 },
    { x: 1500, y: 390, hp: 80 },
    { x: 2230, y: 380, hp: 80 },
    { x: 2610, y: 410, hp: 80 },

    // Layer 3 monsters (3)
    { x: 550, y: 280, hp: 100 },
    { x: 1400, y: 240, hp: 100 },
    { x: 2200, y: 250, hp: 100 },
  ],
};

export default MAP_OUTSKIRTS2;
