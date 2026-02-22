// src/data/map_haven.js
// Haven Village - Starting town map

const MAP_HAVEN = {
  name: 'Haven Village',
  width: 3200,
  height: 800,
  spawnX: 150,
  spawnY: 680,
  bgColors: {
    top: [0x0D1B2A, 0x1B2838],
    bottom: [0x1B2838, 0x2C3E50],
    mountain: 0x1A2530,
  },
  platforms: [
    { x: 0, y: 740, w: 3200, h: 60, isGround: true },
    { x: 300, y: 580, w: 200, h: 16, isGround: false },
    { x: 600, y: 480, w: 250, h: 16, isGround: false },
    { x: 950, y: 560, w: 180, h: 16, isGround: false },
    { x: 1200, y: 440, w: 220, h: 16, isGround: false },
    { x: 1500, y: 520, w: 160, h: 16, isGround: false },
    { x: 1750, y: 600, w: 280, h: 16, isGround: false },
    { x: 2100, y: 480, w: 200, h: 16, isGround: false },
    { x: 2400, y: 380, w: 240, h: 16, isGround: false },
    { x: 2700, y: 540, w: 200, h: 16, isGround: false },
    { x: 2900, y: 420, w: 180, h: 16, isGround: false },
  ],
  portals: [
    { x: 3100, y: 690, label: '→ Village Outskirts', targetMap: 'outskirts', spawnX: 80, spawnY: 680 },
  ],
  ropes: [
    { x: 400, topY: 580, bottomY: 700 },
    { x: 650, topY: 480, bottomY: 580 },
    { x: 1040, topY: 560, bottomY: 700 },
    { x: 1250, topY: 440, bottomY: 560 },
    { x: 1560, topY: 520, bottomY: 700 },
    { x: 1850, topY: 600, bottomY: 700 },
    { x: 2150, topY: 480, bottomY: 600 },
    { x: 2750, topY: 540, bottomY: 700 },
    { x: 2950, topY: 420, bottomY: 540 },
    { x: 2500, topY: 380, bottomY: 700 },
  ],
  npcs: [
    { x: 500, y: 714, name: 'Village Elder' },
  ],
  monsters: [
    { x: 1000, y: 700, hp: 40 },
    { x: 1600, y: 700, hp: 40 },
    { x: 2200, y: 700, hp: 60 },
    { x: 2800, y: 700, hp: 60 },
  ],
};

export default MAP_HAVEN;