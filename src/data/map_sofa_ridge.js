// src/data/map_sofa_ridge.js
// Sofa Ridge - cushion highlands west of High Table Village.
// Socks and yarn balls roam the plush slopes.

const MAP_SOFA_RIDGE = {
  name: 'Sofa Ridge',
  region: 'buddy',
  width: 2400,
  height: 900,
  spawnX: 2240,
  spawnY: 780,
  bgm: 'bgm_buddy',
  bgColors: {
    top: [0xF5EEF8, 0xEBDEF0],
    bottom: [0xEBDEF0, 0xD2B4DE],
    mountain: 0x7D3C98,
  },
  platforms: [
    // === Ground (carpet) ===
    { x: 0, y: 840, w: 2400, h: 60, isGround: true },

    // === Cushion plateaus ===
    { x: 300, y: 700, w: 300, h: 20, isGround: false },
    { x: 650, y: 560, w: 320, h: 20, isGround: false },
    { x: 1050, y: 640, w: 300, h: 20, isGround: false },
    { x: 1450, y: 520, w: 320, h: 20, isGround: false },
    { x: 1900, y: 680, w: 300, h: 20, isGround: false },
  ],
  portals: [
    { x: 60, y: 790, label: '← Hallway Runway', targetMap: 'hallway_run', spawnX: 160, spawnY: 640 },
    { x: 2340, y: 790, label: '→ High Table Village', targetMap: 'high_table', spawnX: 180, spawnY: 780 },
  ],
  ropes: [
    { x: 420, topY: 700, bottomY: 800 },
    { x: 790, topY: 560, bottomY: 800 },
    { x: 1580, topY: 520, bottomY: 800 },
    { x: 2020, topY: 680, bottomY: 800 },
  ],
  npcs: [],
  monsters: [
    { x: 450, y: 660, type: 'sockslinker' },
    { x: 780, y: 520, type: 'sockslinker' },
    { x: 1550, y: 480, type: 'sockslinker' },
    { x: 900, y: 800, type: 'yarnroller' },
    { x: 1700, y: 800, type: 'yarnroller' },
    { x: 1150, y: 600, type: 'gong' },
    { x: 2000, y: 640, type: 'gong' },
  ],
};

export default MAP_SOFA_RIDGE;
