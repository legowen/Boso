// src/data/map_high_table.js
// High Table Village - the town of Buddy House (Victoria/Orbis-style hub).
// The village sits on top of the dining table; the cage station and Owen
// wait there. Route B home unlocks after befriending Biggie.

const MAP_HIGH_TABLE = {
  nameKey: 'map.high_table.name',
  region: 'buddy',
  width: 2200,
  height: 900,
  spawnX: 1100,
  spawnY: 380,
  bgm: 'bgm_buddy',
  bgColors: {
    top: [0xFDF2E9, 0xFAE5D3],
    bottom: [0xFAE5D3, 0xEDBB99],
    mountain: 0xD35400,
  },
  platforms: [
    // === Ground (living room floor) ===
    { x: 0, y: 840, w: 2200, h: 60, isGround: true },

    // === The high table (village level) ===
    { x: 700, y: 420, w: 800, h: 24, isGround: false },

    // === Chair seats (the way up) ===
    { x: 520, y: 640, w: 180, h: 16, isGround: false },
    { x: 1520, y: 640, w: 180, h: 16, isGround: false },

    // === Floor clutter (footstools) ===
    { x: 250, y: 720, w: 180, h: 16, isGround: false },
    { x: 1900, y: 720, w: 180, h: 16, isGround: false },
  ],
  portals: [
    { x: 80, y: 790, labelKey: 'portal.high_table.sofa_ridge', targetMap: 'sofa_ridge', spawnX: 2240, spawnY: 780 },
    { x: 2120, y: 790, labelKey: 'portal.high_table.kitchen_floor', targetMap: 'kitchen_floor', spawnX: 160, spawnY: 680 },
  ],
  ropes: [
    // Floor to chair seats
    { x: 600, topY: 640, bottomY: 800 },
    { x: 1600, topY: 640, bottomY: 800 },
    // Chair seats to the tabletop
    { x: 780, topY: 420, bottomY: 630 },
    { x: 1440, topY: 420, bottomY: 630 },
  ],
  npcs: [
    {
      x: 1180,
      y: 394,
      id: 'owen',
      nameKey: 'npc.owen.name',
      texture: 'npc_owen',
      travelRoute: 'buddy_to_home',
      travelRequiresFlag: 'biggieDefeated',
      travelLockedKeys: [
        'npc.owen.table.locked1',
        'npc.owen.table.locked2',
        'npc.owen.table.locked3',
      ],
      dialogueKeys: [
        'npc.owen.table.line1',
        'npc.owen.table.line2',
        'npc.owen.table.line3',
      ],
    },
    {
      x: 900,
      y: 394,
      id: 'granny_tabby',
      nameKey: 'npc.granny_tabby.name',
      dialogueKeys: [
        'npc.granny_tabby.line1',
        'npc.granny_tabby.line2',
        'npc.granny_tabby.line3',
      ],
    },
  ],
  monsters: [
    { x: 400, y: 800, type: 'bangul' },
    { x: 1750, y: 800, type: 'bangul' },
    { x: 1150, y: 800, type: 'crumbhopper' },
  ],
  guides: [
    { x: 1300, y: 300, textKey: 'guide.high_table.1' },
  ],
  cage: { x: 1330, y: 420 },
};

export default MAP_HIGH_TABLE;
