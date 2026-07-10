// src/data/map_yard.js
// Sunny Backyard - starting town where Boso wakes up

const MAP_YARD = {
  name: 'Sunny Backyard',
  width: 2400,
  height: 800,
  spawnX: 150,
  spawnY: 680,
  bgm: 'bgm_home',
  bgColors: {
    top: [0x87CEEB, 0xB0E0FF],
    bottom: [0xB0E0FF, 0x90C978],
    mountain: 0x2E7D32,
  },
  platforms: [
    // === Ground ===
    { x: 0, y: 740, w: 2400, h: 60, isGround: true },

    // === Garden props (fences, doghouse roof, planters) ===
    { x: 200, y: 620, w: 200, h: 16, isGround: false },
    { x: 700, y: 600, w: 220, h: 16, isGround: false },
    { x: 1300, y: 610, w: 200, h: 16, isGround: false },
    { x: 1900, y: 590, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '← Secret Garden', targetMap: 'garden', spawnX: 2260, spawnY: 680 },
    { x: 2340, y: 690, label: '→ Living Room', targetMap: 'livingroom', spawnX: 120, spawnY: 680 },
  ],
  ropes: [
    { x: 280, topY: 620, bottomY: 700 },
    { x: 790, topY: 600, bottomY: 700 },
    { x: 1390, topY: 610, bottomY: 700 },
    { x: 1990, topY: 590, bottomY: 700 },
  ],
  npcs: [
    {
      x: 400,
      y: 714,
      name: 'Miyo the Cat',
      dialogue: [
        "Meow... Boso? The Owner hasn't come down for days.",
        'The toy creatures escaped from the attic lab. Be careful out there!',
      ],
    },
    {
      x: 700,
      y: 714,
      name: 'Old Bell',
      dialogue: [
        'Woof. In my day, this yard was quiet...',
        'A strange garden lies to the west. Its bugs sting - level up a bit first!',
        'Lost? Press M to open the house map.',
      ],
    },
  ],
  monsters: [
    // Gentle tutorial bubbles
    { x: 900, y: 700, type: 'bangul' },
    { x: 1400, y: 700, type: 'bangul' },
    { x: 1900, y: 700, type: 'bangul' },
  ],
};

export default MAP_YARD;
