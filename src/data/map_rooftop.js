// src/data/map_rooftop.js
// Rooftop - windy heights above the house. Highest-tier hunting ground.
// Open-world branch: bedroom window on one side, attic skylight on the other.

const MAP_ROOFTOP = {
  name: 'Rooftop',
  region: 'house',
  width: 2800,
  height: 800,
  spawnX: 140,
  spawnY: 680,
  bgm: 'bgm_toybox',
  bgColors: {
    top: [0x2A1A3E, 0x4A2A5E],
    bottom: [0x4A2A5E, 0x8A4A6E],
    mountain: 0x1E1230,
  },
  platforms: [
    // === Roof ridge (ground) ===
    { x: 0, y: 740, w: 2800, h: 60, isGround: true },

    // === Column 1 (chimney) ===
    { x: 200, y: 620, w: 240, h: 16, isGround: false },
    { x: 280, y: 470, w: 220, h: 16, isGround: false },
    { x: 360, y: 330, w: 200, h: 16, isGround: false },

    // === Column 2 (antenna mast) ===
    { x: 800, y: 605, w: 220, h: 16, isGround: false },
    { x: 880, y: 460, w: 220, h: 16, isGround: false },
    { x: 960, y: 320, w: 200, h: 16, isGround: false },

    // === Column 3 (dormer roof) ===
    { x: 1400, y: 615, w: 240, h: 16, isGround: false },
    { x: 1480, y: 465, w: 220, h: 16, isGround: false },
    { x: 1560, y: 325, w: 200, h: 16, isGround: false },

    // === Column 4 (water tank) ===
    { x: 2000, y: 600, w: 220, h: 16, isGround: false },
    { x: 2080, y: 455, w: 220, h: 16, isGround: false },

    // === Skylight ledge (right end) ===
    { x: 2450, y: 615, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '↓ Bedroom Window', targetMap: 'bedroom', spawnX: 2240, spawnY: 680 },
    { x: 2740, y: 690, label: '↓ Attic Skylight', targetMap: 'attic', spawnX: 1900, spawnY: 500 },
  ],
  ropes: [
    // Ridge to layer 1
    { x: 350, topY: 620, bottomY: 700 },
    { x: 900, topY: 605, bottomY: 700 },
    { x: 1500, topY: 615, bottomY: 700 },
    { x: 2100, topY: 600, bottomY: 700 },
    { x: 2530, topY: 615, bottomY: 700 },

    // Layer 1 to layer 2
    { x: 380, topY: 470, bottomY: 610 },
    { x: 950, topY: 460, bottomY: 595 },
    { x: 1550, topY: 465, bottomY: 605 },
    { x: 2150, topY: 455, bottomY: 590 },

    // Layer 2 to layer 3
    { x: 470, topY: 330, bottomY: 460 },
    { x: 1050, topY: 320, bottomY: 450 },
    { x: 1650, topY: 325, bottomY: 455 },
  ],
  npcs: [],
  monsters: [
    // Rooftop flies (strongest field mobs)
    { x: 500, y: 350, type: 'pari' },
    { x: 1100, y: 300, type: 'pari' },
    { x: 1800, y: 380, type: 'pari' },
    { x: 2400, y: 320, type: 'pari' },

    // Stray laser dots in the dusk
    { x: 700, y: 500, type: 'laser' },
    { x: 1300, y: 550, type: 'laser' },
    { x: 2000, y: 480, type: 'laser' },
    { x: 2600, y: 420, type: 'laser' },

    // Night butterflies
    { x: 900, y: 420, type: 'nabi' },
    { x: 2200, y: 400, type: 'nabi' },
  ],
};

export default MAP_ROOFTOP;
