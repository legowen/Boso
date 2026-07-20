// src/data/travel.js
// Pure data - cage travel routes and ambush monster definitions
// (no Phaser imports, validated by scripts/validate.mjs).
//
// A route is ridden from an Owen NPC (npc.travelRoute in map data) and
// plays out in TravelScene: the player rides inside a pet cage while the
// world scrolls by. Ambush spawns are randomized inside their atSec
// windows when the ride starts (MapleStory Balrog-ship homage).

export const TRAVEL_ROUTES = {
  // Route A - the tutorial voyage. Short and safe.
  shelter_to_buddy: {
    name: 'To Buddy House',
    from: 'shelter_yard',
    to: 'high_table',
    durationSec: 15,
    bgm: 'bgm_travel',
    ambush: null,
  },

  // Route B - the main line home. Long, and the road is not friendly.
  buddy_to_home: {
    name: 'Ride Home',
    from: 'high_table',
    to: 'yard',
    durationSec: 60,
    bgm: 'bgm_travel',
    ambush: {
      spawns: [
        { type: 'vroom', atSec: [8, 16] },
        { type: 'rumble', atSec: [20, 30] },
        { type: 'vroom', atSec: [34, 42] },
        { type: 'rumble', atSec: [44, 52] },
      ],
    },
  },

  // Route B return leg - back to Buddy House.
  home_to_buddy: {
    name: 'To Buddy House',
    from: 'yard',
    to: 'high_table',
    durationSec: 60,
    bgm: 'bgm_travel',
    ambush: {
      spawns: [
        { type: 'rumble', atSec: [10, 18] },
        { type: 'vroom', atSec: [22, 30] },
        { type: 'vroom', atSec: [34, 42] },
        { type: 'rumble', atSec: [46, 54] },
      ],
    },
  },
};

export const TRAVEL_ROUTE_KEYS = Object.keys(TRAVEL_ROUTES);

// Ambush monsters only exist inside TravelScene (not MONSTER_TYPES).
// kind 'dasher': invulnerable, telegraphs at one cage edge, then streaks
//   across the play area once and despawns.
// kind 'tanker': spawns at an edge, slowly closes in while emitting
//   expanding shockwave rings; can be fought and killed.
export const AMBUSH_TYPES = {
  vroom: {
    name: 'Vroom',
    kind: 'dasher',
    damage: 14,
    speed: 540,
    telegraphMs: 1000,
    width: 96,
    height: 40,
    color: 0xE74C3C,
  },
  rumble: {
    name: 'Rumble',
    kind: 'tanker',
    hp: 150,
    touchDamage: 10,
    exp: 40,
    speed: 24,
    waveDamage: 10,
    waveIntervalMs: 2800,
    waveSpeed: 170,
    waveMaxRadius: 240,
    width: 76,
    height: 64,
    color: 0x6E2C00,
    drops: { treatsMin: 10, treatsMax: 16 },
  },
};
