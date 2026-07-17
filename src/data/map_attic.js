// src/data/map_attic.js
// Attic Laboratory - the Owner's lab, guarded by the Hug Guardian

const MAP_ATTIC = {
  name: 'Attic Laboratory',
  width: 2400,
  height: 800,
  spawnX: 120,
  spawnY: 680,
  bgm: 'bgm_boss',
  bgColors: {
    top: [0x1A0F2A, 0x2A1A3E],
    bottom: [0x2A1A3E, 0x3E2A55],
    mountain: 0x140A20,
  },
  platforms: [
    // === Ground (arena floor) ===
    { x: 0, y: 740, w: 2400, h: 60, isGround: true },

    // === Side crates (dodge perches) ===
    { x: 150, y: 600, w: 220, h: 16, isGround: false },
    { x: 450, y: 560, w: 200, h: 16, isGround: false },
    { x: 1750, y: 560, w: 200, h: 16, isGround: false },
    { x: 2050, y: 600, w: 220, h: 16, isGround: false },
  ],
  portals: [
    { x: 60, y: 690, label: '← Toy Workshop', targetMap: 'playroom', spawnX: 3040, spawnY: 680 },
    { x: 1830, y: 510, label: '↑ Rooftop Skylight', targetMap: 'rooftop', spawnX: 2640, spawnY: 680 },
    {
      x: 2200,
      y: 690,
      label: '? Vacuum Closet',
      targetMap: 'closet',
      spawnX: 140,
      spawnY: 680,
      hidden: true,
      requiresFlag: 'hugGuardianDefeated',
    },
  ],
  ropes: [
    { x: 230, topY: 600, bottomY: 700 },
    { x: 530, topY: 560, bottomY: 700 },
    { x: 1830, topY: 560, bottomY: 700 },
    { x: 2130, topY: 600, bottomY: 700 },
  ],
  npcs: [],
  monsters: [
    // Flies swarm the lab edges (arena center belongs to the boss;
    // right-side spawns leashed clear of the hidden portal at x=2200)
    { x: 300, y: 350, type: 'pari' },
    { x: 700, y: 300, type: 'pari' },
    { x: 1950, y: 320, type: 'pari' },
    { x: 2020, y: 400, type: 'pari' },
  ],
  boss: { id: 'hugGuardian', x: 1400, y: 620 },
};

export default MAP_ATTIC;
