// src/data/map_playroom.js
// Toy Workshop - Gearist & Plushist territory, flying bugs in the air

const MAP_PLAYROOM = {
  name: 'Toy Workshop',
  region: 'house',
  width: 3200,
  height: 800,
  spawnX: 120,
  spawnY: 680,
  bgm: 'bgm_toybox',
  bgColors: {
    top: [0x4A2C6B, 0x6B4A8C],
    bottom: [0x6B4A8C, 0x9B6BB5],
    mountain: 0x3A2255,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },

    // === Column 1 (toy block towers) ===
    { x: 160, y: 620, w: 240, h: 16, isGround: false },
    { x: 240, y: 470, w: 220, h: 16, isGround: false },
    { x: 330, y: 330, w: 200, h: 16, isGround: false },

    // === Column 2 (Gearist workbench) ===
    { x: 710, y: 610, w: 220, h: 16, isGround: false },
    { x: 790, y: 460, w: 220, h: 16, isGround: false },
    { x: 880, y: 325, w: 200, h: 16, isGround: false },

    // === Column 3 (toy shelf) ===
    { x: 1260, y: 615, w: 240, h: 16, isGround: false },
    { x: 1340, y: 465, w: 220, h: 16, isGround: false },
    { x: 1430, y: 330, w: 200, h: 16, isGround: false },

    // === Column 4 (Plushist sewing table) ===
    { x: 1810, y: 605, w: 220, h: 16, isGround: false },
    { x: 1890, y: 455, w: 220, h: 16, isGround: false },
    { x: 1980, y: 320, w: 200, h: 16, isGround: false },

    // === Column 5 (doll house) ===
    { x: 2360, y: 615, w: 240, h: 16, isGround: false },
    { x: 2440, y: 465, w: 220, h: 16, isGround: false },
    { x: 2530, y: 330, w: 200, h: 16, isGround: false },

    // === Train set bridge (right end) ===
    { x: 2860, y: 620, w: 200, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '← Hallway', targetMap: 'hallway', spawnX: 1540, spawnY: 200 },
    { x: 3140, y: 690, label: '→ Attic Laboratory', targetMap: 'attic', spawnX: 120, spawnY: 680 },
  ],
  ropes: [
    // Ground to layer 1
    { x: 310, topY: 620, bottomY: 700 },
    { x: 810, topY: 610, bottomY: 700 },
    { x: 1370, topY: 615, bottomY: 700 },
    { x: 1910, topY: 605, bottomY: 700 },
    { x: 2460, topY: 615, bottomY: 700 },
    { x: 2940, topY: 620, bottomY: 700 },

    // Layer 1 to layer 2
    { x: 340, topY: 470, bottomY: 610 },
    { x: 870, topY: 460, bottomY: 600 },
    { x: 1440, topY: 465, bottomY: 605 },
    { x: 1970, topY: 455, bottomY: 595 },
    { x: 2530, topY: 465, bottomY: 605 },

    // Layer 2 to layer 3
    { x: 430, topY: 330, bottomY: 460 },
    { x: 960, topY: 325, bottomY: 450 },
    { x: 1520, topY: 330, bottomY: 455 },
    { x: 2070, topY: 320, bottomY: 445 },
    { x: 2620, topY: 330, bottomY: 455 },
  ],
  npcs: [
    {
      x: 1000,
      y: 714,
      name: 'Gearist Tinkerer',
      dialogue: [
        'Our gears gave those toys life! ...Too much life, perhaps.',
        "The Plushists' softness is a lie. COGS are truth!",
        'Our wind-up prototypes went feral in the basement. Sorry about that.',
      ],
    },
    {
      x: 1300,
      y: 714,
      name: 'Plushist Sewmaster',
      dialogue: [
        'Every stitch is love. The Gearists understand nothing.',
        'The Hug Guardian... we made it to love. It just loves too hard now.',
        'When it hugs the whole room, run to the green safe spot!',
      ],
    },
  ],
  monsters: [
    // Butterflies gliding in sine waves
    { x: 500, y: 450, type: 'nabi' },
    { x: 1100, y: 380, type: 'nabi' },
    { x: 1700, y: 420, type: 'nabi' },
    { x: 2300, y: 360, type: 'nabi' },
    { x: 2900, y: 440, type: 'nabi' },

    // Flies buzzing erratically
    { x: 700, y: 320, type: 'pari' },
    { x: 1300, y: 550, type: 'pari' },
    { x: 1900, y: 300, type: 'pari' },
    { x: 2500, y: 520, type: 'pari' },
    { x: 3000, y: 350, type: 'pari' },

    // Laser dots
    { x: 900, y: 500, type: 'laser' },
    { x: 1600, y: 550, type: 'laser' },
    { x: 2700, y: 480, type: 'laser' },
  ],
};

export default MAP_PLAYROOM;
