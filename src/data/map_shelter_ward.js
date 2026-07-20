// src/data/map_shelter_ward.js
// Recovery Ward - Paw Shelter Clinic. Bomi the kitten wakes up here.
// Movement/jump/rope tutorial room (Maple Island homage).

const MAP_SHELTER_WARD = {
  name: 'Recovery Ward',
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
    { x: 1140, y: 650, label: '→ Clinic Hallway', targetMap: 'shelter_hall', spawnX: 170, spawnY: 640 },
  ],
  ropes: [
    { x: 600, topY: 560, bottomY: 660 },
  ],
  npcs: [
    {
      x: 320,
      y: 674,
      name: 'Nurse Mimsy',
      dialogue: [
        'Good morning, little {player}! You slept three whole days.',
        'This is the Paw Shelter Clinic. You are safe here.',
        'Stretch those paws: walk with the ARROW KEYS, hop with ALT.',
        'When you can climb the rope in the middle, you are ready for the hallway.',
      ],
    },
  ],
  monsters: [],
  guides: [
    { x: 180, y: 560, text: '← → Move   ALT Jump' },
    { x: 600, y: 480, text: '↑ near a rope to grab it,\n↑ / ↓ to climb, ALT to hop off' },
    { x: 620, y: 640, text: 'Jump up through platforms!\n↓ + ALT drops back down' },
    { x: 1080, y: 560, text: 'Stand on a portal\nand press ↑ to enter' },
  ],
};

export default MAP_SHELTER_WARD;
