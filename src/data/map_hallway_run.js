// src/data/map_hallway_run.js
// Hallway Runway - the long straight corridor of Buddy House.
// RC cars own this stretch; keep an eye out for the drift telegraph.

const MAP_HALLWAY_RUN = {
  name: 'Hallway Runway',
  region: 'buddy',
  width: 2600,
  height: 760,
  spawnX: 160,
  spawnY: 640,
  bgm: 'bgm_buddy',
  bgColors: {
    top: [0xEAEDED, 0xD5DBDB],
    bottom: [0xD5DBDB, 0xAEB6BF],
    mountain: 0x566573,
  },
  platforms: [
    // === Ground (hardwood runway) ===
    { x: 0, y: 700, w: 2600, h: 60, isGround: true },

    // === Low wall shelves (safe pockets above the racing line) ===
    { x: 500, y: 580, w: 220, h: 16, isGround: false },
    { x: 1200, y: 560, w: 240, h: 16, isGround: false },
    { x: 1900, y: 580, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 650, label: '← Sofa Ridge', targetMap: 'sofa_ridge', spawnX: 160, spawnY: 780 },
    { x: 1300, y: 650, label: '↑ Bookshelf Cliffs', targetMap: 'bookshelf_cliffs', spawnX: 140, spawnY: 1380 },
    { x: 2540, y: 650, label: '→ Kitchen Floor', targetMap: 'kitchen_floor', spawnX: 2240, spawnY: 680 },
  ],
  ropes: [
    { x: 590, topY: 580, bottomY: 660 },
    { x: 2000, topY: 580, bottomY: 660 },
  ],
  npcs: [],
  monsters: [
    { x: 700, y: 660, type: 'rcracer' },
    { x: 1500, y: 660, type: 'rcracer' },
    { x: 2200, y: 660, type: 'rcracer' },
    { x: 400, y: 660, type: 'crumbhopper' },
    { x: 1750, y: 660, type: 'crumbhopper' },
    { x: 1000, y: 660, type: 'robo' },
  ],
};

export default MAP_HALLWAY_RUN;
