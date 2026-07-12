// src/data/monsters.js
// Pure data — monster & boss type definitions (no Phaser imports).
// Movement values are consumed by GameScene AI dispatch and boss entities.

export const MONSTER_TYPES = {
  // Lowest tier — soap-bubble experiment. Moves like a MapleStory snail:
  // slow ground patrol, random pauses, turns at walls and ledges.
  bangul: {
    name: 'Bangul',
    hp: 30,
    touchDamage: 5,
    exp: 8,
    drops: { treatsMin: 2, treatsMax: 4, items: [{ key: 'cookie', chance: 0.06 }] },
    width: 34,
    height: 30,
    color: 0x85C1E9,
    movement: 'snail',
    speed: 20,
    walkMsMin: 1500,
    walkMsMax: 3000,
    pauseMsMin: 800,
    pauseMsMax: 1600,
    pauseChance: 0.35,
  },

  // Bouncing-ball experiment. Moves like a MapleStory slime/mushroom:
  // hops around ignoring terrain edges, sometimes toward the player.
  gong: {
    name: 'Gong',
    hp: 50,
    touchDamage: 8,
    exp: 12,
    drops: { treatsMin: 3, treatsMax: 6, items: [{ key: 'cookie', chance: 0.07 }] },
    width: 34,
    height: 32,
    color: 0xE74C3C,
    movement: 'bouncer',
    jumpVelocityY: -320,
    jumpVelocityX: 130,
    jumpCooldownMin: 1100,
    jumpCooldownMax: 2200,
    chasePlayerChance: 0.4,
  },

  // Laser-pointer dot. Moves like Stitch: free flight, waypoint wander,
  // dashes at the player when close.
  laser: {
    name: 'Laser',
    hp: 80,
    touchDamage: 12,
    exp: 18,
    drops: { treatsMin: 5, treatsMax: 9, items: [{ key: 'milk', chance: 0.08 }] },
    width: 26,
    height: 26,
    color: 0xFF3B3B,
    movement: 'flyerDash',
    flySpeed: 90,
    dashSpeed: 260,
    dashRange: 280,
    dashDurationMs: 600,
    dashCooldownMs: 3500,
    wanderRadius: 240,
    pauseMsMin: 200,
    pauseMsMax: 800,
  },

  // Mid tier — butterfly. Sine-wave gliding flight.
  nabi: {
    name: 'Nabi',
    hp: 120,
    touchDamage: 15,
    exp: 25,
    drops: { treatsMin: 8, treatsMax: 13, items: [{ key: 'cookie', chance: 0.08 }] },
    width: 38,
    height: 32,
    color: 0xF7DC6F,
    movement: 'sineGlider',
    flySpeed: 60,
    sineAmplitude: 46,
    sineFrequency: 2.2,
    patrolRange: 220,
  },

  // Mid tier — fly. Fast erratic jitter, biased toward the player.
  pari: {
    name: 'Pari',
    hp: 140,
    touchDamage: 18,
    exp: 30,
    drops: { treatsMin: 10, treatsMax: 16, items: [{ key: 'milk', chance: 0.08 }] },
    width: 24,
    height: 22,
    color: 0x566573,
    movement: 'jitter',
    speedMin: 140,
    speedMax: 210,
    retargetMsMin: 280,
    retargetMsMax: 620,
    chaseBias: 0.5,
    leashRadius: 300,
  },

  // Wind-up robot - a feral Gearist prototype from the basement.
  // Patrols slowly; when the player lines up it winds up, then charges
  // like a MapleStory wild boar (charges straight, even off ledges).
  robo: {
    name: 'Robo',
    hp: 90,
    touchDamage: 14,
    exp: 22,
    drops: { treatsMin: 6, treatsMax: 10, items: [{ key: 'cookie', chance: 0.08 }, { key: 'milk', chance: 0.05 }] },
    width: 32,
    height: 38,
    color: 0x95A5A6,
    movement: 'charger',
    speed: 30,
    chargeSpeed: 240,
    detectRangeX: 220,
    detectRangeY: 60,
    windupMs: 500,
    chargeMs: 900,
    cooldownMs: 2200,
  },
};

export const BOSS_TYPES = {
  // Field boss (Zakum homage) — a giant toy golem built to hug.
  hugGuardian: {
    name: 'Hug Guardian',
    hp: 1500,
    touchDamage: 20,
    exp: 300,
    drops: { treats: 180, items: { cookie: 2 } },
    width: 140,
    height: 160,
    color: 0xB08840,
    walkSpeed: 25,
    patrolRange: 120,
    attackIntervalMin: 4500,
    attackIntervalMax: 6500,
    armSweep: { damage: 20, speed: 220, width: 120, height: 50 },
    slam: { damage: 25, telegraphMs: 800, radius: 180 },
    fieldHug: { damage: 40, telegraphMs: 1700, safeRadius: 140 },
  },

  // Special hidden boss — the primal fear of every pet: the vacuum.
  vacuumKing: {
    name: 'Vacuum King',
    hp: 2200,
    touchDamage: 25,
    exp: 500,
    drops: { treats: 280, items: { cookie: 2, milk: 2 } },
    width: 120,
    height: 150,
    color: 0x5D6D7E,
    hoverSpeed: 40,
    patrolRange: 300,
    suction: { onMs: 3000, offMs: 2500, pull: 150 },
    dust: { damage: 15, speed: 200, intervalMs: 1200, lifespanMs: 4000, size: 20 },
  },
};
