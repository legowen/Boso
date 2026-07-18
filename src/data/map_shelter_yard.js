// src/data/map_shelter_yard.js
// Shelter Yard - Paw Shelter Clinic. Tutorial boss (Dr. Embrace) and the
// departure cage where Owen waits (Maple Island harbor homage).

const MAP_SHELTER_YARD = {
  name: 'Shelter Yard',
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
    { x: 60, y: 650, label: '← Clinic Hallway', targetMap: 'shelter_hall', spawnX: 1440, spawnY: 640 },
  ],
  ropes: [
    { x: 290, topY: 580, bottomY: 660 },
    { x: 1540, topY: 580, bottomY: 660 },
  ],
  npcs: [
    {
      x: 1620,
      y: 674,
      name: 'Owen',
      texture: 'npc_owen',
      travelRoute: 'shelter_to_buddy',
      travelRequiresFlag: 'drEmbraceDefeated',
      travelLockedLines: [
        'There you are, {player}! I am Owen - I signed your adoption papers today.',
        'We can leave as soon as Dr. Embrace clears you... but he is out in the yard, insisting on one last goodbye hug for every patient.',
        'Show him you are strong enough for the big world, then come back to me!',
      ],
      dialogue: [
        'There you are, {player}! I am Owen - I signed your adoption papers today.',
        'I have to leave on a long work trip right away... terrible timing, I know.',
        'So you will stay at my best friend\'s house for a while. Big place, big table, one VERY big dog.',
        'The travel cage is cozy, I promise. Ready for your new world?',
      ],
    },
  ],
  monsters: [
    { x: 420, y: 660, type: 'straykitten' },
  ],
  boss: { id: 'drEmbrace', x: 900, y: 620 },
  guides: [
    { x: 200, y: 480, text: 'Dr. Embrace loves goodbye hugs.\nGreen circle = the ONLY safe spot!' },
    { x: 1620, y: 540, text: 'Talk to Owen (SPACE)\nto board the travel cage' },
  ],
  cage: { x: 1730, y: 700 },
};

export default MAP_SHELTER_YARD;
