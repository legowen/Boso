// src/data/map_closet.js
// Vacuum Closet - hidden lair of the Vacuum King

const MAP_CLOSET = {
  name: 'Vacuum Closet',
  region: 'house',
  width: 1600,
  height: 800,
  spawnX: 140,
  spawnY: 680,
  bgm: 'bgm_hidden',
  bgColors: {
    top: [0x0A0A0F, 0x14141A],
    bottom: [0x14141A, 0x1E1E28],
    mountain: 0x08080C,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 1600, h: 60, isGround: true },

    // === Storage boxes (suction cover / attack perch) ===
    { x: 300, y: 600, w: 200, h: 16, isGround: false },
    { x: 1100, y: 560, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '← Attic Laboratory', targetMap: 'attic', spawnX: 2100, spawnY: 680 },
  ],
  ropes: [
    { x: 380, topY: 600, bottomY: 700 },
    { x: 1180, topY: 560, bottomY: 700 },
  ],
  npcs: [],
  monsters: [],
  boss: { id: 'vacuumKing', x: 1100, y: 430 },
};

export default MAP_CLOSET;
