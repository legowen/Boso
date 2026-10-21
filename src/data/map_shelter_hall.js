// src/data/map_shelter_hall.js
// Clinic Hallway - Paw Shelter Clinic. First combat: dust motes, a shy
// ghost of loneliness, and one very energetic fellow kitten.

const MAP_SHELTER_HALL = {
  nameKey: 'map.shelter_hall.name',
  region: 'shelter',
  width: 1600,
  height: 760,
  spawnX: 100,
  spawnY: 640,
  bgm: 'bgm_shelter',
  bgColors: {
    top: [0xEBF5FB, 0xD6EAF8],
    bottom: [0xD6EAF8, 0xAED6F1],
    mountain: 0x85C1E9,
  },
  platforms: [
    // === Ground (hallway floor) ===
    { x: 0, y: 700, w: 1600, h: 60, isGround: true },

    // === Waiting benches & shelf tops ===
    { x: 250, y: 570, w: 200, h: 16, isGround: false },
    { x: 650, y: 540, w: 220, h: 16, isGround: false },
    { x: 1100, y: 570, w: 200, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 650, labelKey: 'portal.shelter_hall.shelter_ward', targetMap: 'shelter_ward', spawnX: 1030, spawnY: 640 },
    { x: 1540, y: 650, labelKey: 'portal.shelter_hall.shelter_yard', targetMap: 'shelter_yard', spawnX: 150, spawnY: 640 },
  ],
  ropes: [
    { x: 340, topY: 570, bottomY: 660 },
    { x: 1190, topY: 570, bottomY: 660 },
  ],
  npcs: [
    {
      x: 420,
      y: 674,
      id: 'keeper_tobi',
      nameKey: 'npc.keeper_tobi.name',
      dialogueKeys: [
        'npc.keeper_tobi.line1',
        'npc.keeper_tobi.line2',
        'npc.keeper_tobi.line3',
      ],
    },
  ],
  monsters: [
    { x: 550, y: 320, type: 'dustmote' },
    { x: 900, y: 280, type: 'dustmote' },
    { x: 1250, y: 340, type: 'lonesome' },
    { x: 750, y: 660, type: 'straykitten' },
    { x: 1350, y: 660, type: 'straykitten' },
  ],
  guides: [
    { x: 250, y: 470, textKey: 'guide.shelter_hall.1' },
    { x: 900, y: 560, textKey: 'guide.shelter_hall.2' },
    { x: 1450, y: 560, textKey: 'guide.shelter_hall.3' },
  ],
};

export default MAP_SHELTER_HALL;
