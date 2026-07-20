// src/data/map_shelter_hall.js
// Clinic Hallway - Paw Shelter Clinic. First combat: dust motes, a shy
// ghost of loneliness, and one very energetic fellow kitten.

const MAP_SHELTER_HALL = {
  name: 'Clinic Hallway',
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
    { x: 60, y: 650, label: '← Recovery Ward', targetMap: 'shelter_ward', spawnX: 1030, spawnY: 640 },
    { x: 1540, y: 650, label: '→ Shelter Yard', targetMap: 'shelter_yard', spawnX: 150, spawnY: 640 },
  ],
  ropes: [
    { x: 340, topY: 570, bottomY: 660 },
    { x: 1190, topY: 570, bottomY: 660 },
  ],
  npcs: [
    {
      x: 420,
      y: 674,
      name: 'Keeper Tobi',
      dialogue: [
        'Psst, {player}! The hallway dust has gotten... lively.',
        'Walk up to one and press CTRL to swat it. You have claws, use them!',
        'Pick up whatever they drop - treats are treats.',
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
    { x: 250, y: 470, text: 'CTRL Attack' },
    { x: 900, y: 560, text: 'Press 1 to eat a Cookie (+HP)\nPress I for your bag' },
    { x: 1450, y: 560, text: 'The yard is ahead -\nthe doctor wants a word...' },
  ],
};

export default MAP_SHELTER_HALL;
