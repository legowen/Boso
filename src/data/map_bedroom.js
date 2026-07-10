// src/data/map_bedroom.js
// Owner's Bedroom - quiet upstairs room off the hallway.
// Open-world branch: the window leads to the rooftop (alternate attic route).

const MAP_BEDROOM = {
  name: "Owner's Bedroom",
  width: 2400,
  height: 800,
  spawnX: 160,
  spawnY: 680,
  bgm: 'bgm_home',
  bgColors: {
    top: [0x1E2A4A, 0x2E3E6A],
    bottom: [0x2E3E6A, 0x4A5A8A],
    mountain: 0x16203A,
  },
  platforms: [
    // === Ground (carpet) ===
    { x: 0, y: 740, w: 2400, h: 60, isGround: true },

    // === Column 1 (the bed) ===
    { x: 180, y: 615, w: 240, h: 16, isGround: false },
    { x: 260, y: 465, w: 220, h: 16, isGround: false },
    { x: 340, y: 325, w: 200, h: 16, isGround: false },

    // === Column 2 (dresser) ===
    { x: 720, y: 600, w: 220, h: 16, isGround: false },
    { x: 800, y: 455, w: 220, h: 16, isGround: false },
    { x: 880, y: 320, w: 200, h: 16, isGround: false },

    // === Column 3 (desk & shelf) ===
    { x: 1260, y: 610, w: 240, h: 16, isGround: false },
    { x: 1340, y: 460, w: 220, h: 16, isGround: false },
    { x: 1420, y: 325, w: 200, h: 16, isGround: false },

    // === Column 4 (wardrobe) ===
    { x: 1800, y: 605, w: 220, h: 16, isGround: false },
    { x: 1880, y: 455, w: 220, h: 16, isGround: false },

    // === Window sill (right end) ===
    { x: 2150, y: 620, w: 200, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '← Hallway', targetMap: 'hallway', spawnX: 1350, spawnY: 560 },
    { x: 2340, y: 690, label: '→ Rooftop Window', targetMap: 'rooftop', spawnX: 140, spawnY: 680 },
  ],
  ropes: [
    // Ground to layer 1
    { x: 330, topY: 615, bottomY: 700 },
    { x: 820, topY: 600, bottomY: 700 },
    { x: 1360, topY: 610, bottomY: 700 },
    { x: 1900, topY: 605, bottomY: 700 },
    { x: 2230, topY: 620, bottomY: 700 },

    // Layer 1 to layer 2
    { x: 360, topY: 465, bottomY: 605 },
    { x: 870, topY: 455, bottomY: 590 },
    { x: 1420, topY: 460, bottomY: 600 },
    { x: 1950, topY: 455, bottomY: 595 },

    // Layer 2 to layer 3
    { x: 450, topY: 325, bottomY: 455 },
    { x: 970, topY: 320, bottomY: 445 },
    { x: 1510, topY: 325, bottomY: 450 },
  ],
  npcs: [
    {
      x: 400,
      y: 714,
      name: 'Dozy the Kitten',
      dialogue: [
        'Yaaawn... the Owner used to nap here every afternoon...',
        'The window leads to the rooftop. From there you can sneak into the attic skylight!',
      ],
    },
  ],
  monsters: [
    // Pillow bubbles
    { x: 500, y: 700, type: 'bangul' },
    { x: 1000, y: 700, type: 'bangul' },
    { x: 280, y: 575, type: 'bangul' },

    // Dream butterflies
    { x: 700, y: 400, type: 'nabi' },
    { x: 1300, y: 350, type: 'nabi' },
    { x: 1900, y: 420, type: 'nabi' },

    // Bouncy balls under the bed
    { x: 1500, y: 700, type: 'gong' },
    { x: 2100, y: 700, type: 'gong' },
  ],
};

export default MAP_BEDROOM;
