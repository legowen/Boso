// src/data/map_kitchen_floor.js
// Kitchen Floor - crumb country east of High Table Village.
// Crumbs hop in packs under the counters.

const MAP_KITCHEN_FLOOR = {
  name: 'Kitchen Floor',
  region: 'buddy',
  width: 2400,
  height: 800,
  spawnX: 160,
  spawnY: 680,
  bgm: 'bgm_buddy',
  bgColors: {
    top: [0xFEF9E7, 0xFDEBD0],
    bottom: [0xFDEBD0, 0xF8C471],
    mountain: 0xB9770E,
  },
  platforms: [
    // === Ground (kitchen tiles) ===
    { x: 0, y: 740, w: 2400, h: 60, isGround: true },

    // === Stool tops & open drawers ===
    { x: 350, y: 600, w: 240, h: 16, isGround: false },
    { x: 800, y: 560, w: 260, h: 16, isGround: false },
    { x: 1300, y: 600, w: 240, h: 16, isGround: false },
    { x: 1800, y: 560, w: 260, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '← High Table Village', targetMap: 'high_table', spawnX: 2020, spawnY: 780 },
    { x: 2340, y: 690, label: '→ Hallway Runway', targetMap: 'hallway_run', spawnX: 2440, spawnY: 640 },
  ],
  ropes: [
    { x: 470, topY: 600, bottomY: 700 },
    { x: 930, topY: 560, bottomY: 700 },
    { x: 1920, topY: 560, bottomY: 700 },
  ],
  npcs: [],
  monsters: [
    { x: 500, y: 700, type: 'crumbhopper' },
    { x: 900, y: 700, type: 'crumbhopper' },
    { x: 1450, y: 700, type: 'crumbhopper' },
    { x: 2000, y: 700, type: 'crumbhopper' },
    { x: 1200, y: 700, type: 'yarnroller' },
    { x: 700, y: 560, type: 'bangul' },
    { x: 1850, y: 520, type: 'bangul' },
  ],
};

export default MAP_KITCHEN_FLOOR;
