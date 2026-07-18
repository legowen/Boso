// src/data/map_bookshelf_cliffs.js
// Bookshelf Cliffs - the vertical climb of Buddy House. Zig-zag shelf
// boards with ropes; moths circle the reading lamps. The window at the
// top leads out to the backyard gate.

const MAP_BOOKSHELF_CLIFFS = {
  name: 'Bookshelf Cliffs',
  region: 'buddy',
  width: 1600,
  height: 1500,
  spawnX: 140,
  spawnY: 1380,
  bgm: 'bgm_buddy',
  bgColors: {
    top: [0x4A3728, 0x5D4037],
    bottom: [0x5D4037, 0x795548],
    mountain: 0x3E2723,
  },
  platforms: [
    // === Ground (study floor) ===
    { x: 0, y: 1440, w: 1600, h: 60, isGround: true },

    // === Zig-zag shelf boards ===
    { x: 200, y: 1300, w: 300, h: 16, isGround: false },
    { x: 700, y: 1160, w: 300, h: 16, isGround: false },
    { x: 200, y: 1020, w: 300, h: 16, isGround: false },
    { x: 700, y: 880, w: 300, h: 16, isGround: false },
    { x: 200, y: 740, w: 300, h: 16, isGround: false },
    { x: 700, y: 600, w: 300, h: 16, isGround: false },

    // === Step stool to the window ledge ===
    { x: 1050, y: 540, w: 140, h: 16, isGround: false },

    // === Window ledge (top landing) ===
    { x: 1100, y: 460, w: 340, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 1390, label: '← Hallway Runway', targetMap: 'hallway_run', spawnX: 1400, spawnY: 640 },
    { x: 1380, y: 410, label: '↑ Backyard Window', targetMap: 'backyard_gate', spawnX: 160, spawnY: 680 },
  ],
  ropes: [
    // Each rope hangs from a shelf down past the one below it
    { x: 320, topY: 1300, bottomY: 1430 },
    { x: 820, topY: 1160, bottomY: 1290 },
    { x: 320, topY: 1020, bottomY: 1290 },
    { x: 820, topY: 880, bottomY: 1150 },
    { x: 320, topY: 740, bottomY: 1010 },
    { x: 820, topY: 600, bottomY: 870 },
    { x: 1200, topY: 460, bottomY: 590 },
  ],
  npcs: [],
  monsters: [
    // Moths circling the reading lamps
    { x: 500, y: 1100, type: 'mothcircler' },
    { x: 500, y: 700, type: 'mothcircler' },
    { x: 1150, y: 800, type: 'mothcircler' },
    // Dust between the books
    { x: 900, y: 400, type: 'dustmote' },
    { x: 300, y: 500, type: 'dustmote' },
    // A stray laser dot hunting the stairwell air
    { x: 1100, y: 1250, type: 'laser' },
  ],
};

export default MAP_BOOKSHELF_CLIFFS;
