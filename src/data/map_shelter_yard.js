// src/data/map_shelter_yard.js
// Shelter Yard - Paw Shelter Clinic. Tutorial boss (Dr. Embrace) and the
// departure cage where Owen waits (Maple Island harbor homage).

const MAP_SHELTER_YARD = {
  nameKey: 'map.shelter_yard.name',
  region: 'shelter',
  width: 1800,
  height: 760,
  spawnX: 120,
  spawnY: 640,
  bgm: 'bgm_shelter',
  bgColors: {
    top: [0xFEF9E7, 0xFCF3CF],
    bottom: [0xFCF3CF, 0xA9DFBF],
    mountain: 0x52BE80,
  },
  platforms: [
    // === Ground (yard lawn) ===
    { x: 0, y: 700, w: 1800, h: 60, isGround: true },

    // === Planter boxes (dodge perches for the check-up hug) ===
    { x: 200, y: 580, w: 200, h: 16, isGround: false },
    { x: 1450, y: 580, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 650, labelKey: 'portal.shelter_yard.shelter_hall', targetMap: 'shelter_hall', spawnX: 1440, spawnY: 640 },
  ],
  ropes: [
    { x: 290, topY: 580, bottomY: 660 },
    { x: 1540, topY: 580, bottomY: 660 },
  ],
  npcs: [
    {
      x: 1620,
      y: 674,
      id: 'owen',
      nameKey: 'npc.owen.name',
      texture: 'npc_owen',
      travelRoute: 'shelter_to_buddy',
      travelRequiresFlag: 'drEmbraceDefeated',
      travelLockedKeys: [
        'npc.owen.shelter.line1',
        'npc.owen.shelter.locked1',
        'npc.owen.shelter.locked2',
      ],
      dialogueKeys: [
        'npc.owen.shelter.line1',
        'npc.owen.shelter.line2',
        'npc.owen.shelter.line3',
        'npc.owen.shelter.line4',
      ],
    },
  ],
  monsters: [
    { x: 420, y: 660, type: 'straykitten' },
  ],
  boss: { id: 'drEmbrace', x: 900, y: 620 },
  guides: [
    { x: 200, y: 480, textKey: 'guide.shelter_yard.1' },
    { x: 1620, y: 540, textKey: 'guide.shelter_yard.2' },
  ],
  cage: { x: 1730, y: 700 },
};

export default MAP_SHELTER_YARD;
