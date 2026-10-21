// src/data/map_shelter_ward.js
// Recovery Ward - Paw Shelter Clinic. Bomi the kitten wakes up here.
// Movement/jump/rope tutorial room (Maple Island homage).

const MAP_SHELTER_WARD = {
  nameKey: 'map.shelter_ward.name',
  region: 'shelter',
  width: 1200,
  height: 760,
  spawnX: 120,
  spawnY: 640,
  bgm: 'bgm_shelter',
  bgColors: {
    top: [0xE8F8F5, 0xD1F2EB],
    bottom: [0xD1F2EB, 0xA3E4D7],
    mountain: 0x76D7C4,
  },
  platforms: [
    // === Ground (ward floor) ===
    { x: 0, y: 700, w: 1200, h: 60, isGround: true },

    // === Recovery beds & supply cabinet tops ===
    { x: 180, y: 580, w: 180, h: 16, isGround: false },
    { x: 520, y: 560, w: 200, h: 16, isGround: false },
    { x: 880, y: 580, w: 180, h: 16, isGround: false },
  ],
  portals: [
    { x: 1140, y: 650, labelKey: 'portal.shelter_ward.shelter_hall', targetMap: 'shelter_hall', spawnX: 170, spawnY: 640 },
  ],
  ropes: [
    { x: 600, topY: 560, bottomY: 660 },
  ],
  npcs: [
    {
      x: 320,
      y: 674,
      id: 'nurse_mimsy',
      nameKey: 'npc.nurse_mimsy.name',
      dialogueKeys: [
        'npc.nurse_mimsy.line1',
        'npc.nurse_mimsy.line2',
        'npc.nurse_mimsy.line3',
        'npc.nurse_mimsy.line4',
      ],
    },
  ],
  monsters: [],
  guides: [
    { x: 180, y: 560, textKey: 'guide.shelter_ward.1' },
    { x: 600, y: 480, textKey: 'guide.shelter_ward.2' },
    { x: 620, y: 640, textKey: 'guide.shelter_ward.3' },
    { x: 1080, y: 560, textKey: 'guide.shelter_ward.4' },
  ],
};

export default MAP_SHELTER_WARD;
