// src/data/map_garden.js
// Secret Garden - overgrown side garden west of the backyard.
// Open-world branch: connects the yard AND the kitchen back door.

const MAP_GARDEN = {
  name: 'Secret Garden',
  width: 2400,
  height: 800,
  spawnX: 140,
  spawnY: 680,
  bgm: 'bgm_home',
  bgColors: {
    top: [0x2E5E2E, 0x4A8A4A],
    bottom: [0x4A8A4A, 0x6FAF5F],
    mountain: 0x1E4E1E,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 2400, h: 60, isGround: true },

    // === Hedge & trellis columns ===
    { x: 180, y: 620, w: 220, h: 16, isGround: false },
    { x: 650, y: 600, w: 220, h: 16, isGround: false },
    { x: 1150, y: 610, w: 240, h: 16, isGround: false },
    { x: 1650, y: 595, w: 220, h: 16, isGround: false },
    { x: 2100, y: 615, w: 220, h: 16, isGround: false },

    { x: 300, y: 470, w: 220, h: 16, isGround: false },
    { x: 800, y: 460, w: 220, h: 16, isGround: false },
    { x: 1300, y: 465, w: 240, h: 16, isGround: false },
    { x: 1800, y: 455, w: 220, h: 16, isGround: false },

    { x: 480, y: 330, w: 220, h: 16, isGround: false },
    { x: 1100, y: 320, w: 240, h: 16, isGround: false },
    { x: 1650, y: 325, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '→ Kitchen Back Door', targetMap: 'kitchen', spawnX: 340, spawnY: 680 },
    { x: 2340, y: 690, label: '→ Backyard', targetMap: 'yard', spawnX: 2260, spawnY: 680 },
  ],
  ropes: [
    // Ground to layer 1
    { x: 260, topY: 620, bottomY: 700 },
    { x: 730, topY: 600, bottomY: 700 },
    { x: 1240, topY: 610, bottomY: 700 },
    { x: 1730, topY: 595, bottomY: 700 },
    { x: 2180, topY: 615, bottomY: 700 },

    // Layer 1 to layer 2
    { x: 380, topY: 470, bottomY: 610 },
    { x: 840, topY: 460, bottomY: 590 },
    { x: 1350, topY: 465, bottomY: 600 },
    { x: 1830, topY: 455, bottomY: 585 },

    // Layer 2 to layer 3
    { x: 500, topY: 330, bottomY: 460 },
    { x: 1310, topY: 320, bottomY: 455 },
    { x: 1840, topY: 325, bottomY: 445 },
  ],
  npcs: [
    {
      x: 500,
      y: 714,
      name: 'Haku the Hedgehog',
      dialogue: [
        'Psst... this garden connects straight to the kitchen back door.',
        'The bugs here sting harder than the house bubbles. Watch yourself, pup.',
      ],
    },
  ],
  monsters: [
    // Ground bubbles
    { x: 800, y: 700, type: 'bangul' },
    { x: 1500, y: 700, type: 'bangul' },

    // Garden butterflies
    { x: 600, y: 420, type: 'nabi' },
    { x: 1200, y: 380, type: 'nabi' },
    { x: 1900, y: 430, type: 'nabi' },

    // Garden flies
    { x: 900, y: 300, type: 'pari' },
    { x: 1600, y: 520, type: 'pari' },
    { x: 2200, y: 350, type: 'pari' },
  ],
};

export default MAP_GARDEN;
