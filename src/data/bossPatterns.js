// src/data/bossPatterns.js
// Pure data — boss attack pattern rules and phase tables (no Phaser imports,
// Node-validatable). The decision logic lives in systems/BossBrain.js, the
// Phaser side (telegraphs, hitboxes) in systems/PatternExecutor.js.
//
// A boss entry in BOSS_TYPES carries `phases`:
//   { hpBelow, gapMs, roarKey?, enrage?, patterns: [pattern, ...] }
// and every pattern is
//   { id, type, nameKey, weight, cooldownMs, telegraphMs, overlap?, params }
// All numbers are starting points for tuning.

// Reusable attack primitives; the executor has one handler per type.
export const PATTERN_TYPES = [
  'meleeSwipe',  // hitbox in front of the boss            -> step back / jump
  'areaSlam',    // red ground zone(s), then a hit          -> move out
  'projectile',  // 1-N straight or spread projectiles      -> move / jump
  'dashSweep',   // boss charges across the floor           -> jump over
  'fieldWide',   // hits everyone on the ground             -> be airborne / stand in the safe zone
  'pull',        // sustained pull toward the boss          -> walk against it
  'summon',      // spawns existing monster types           -> kill or avoid
  'guard',       // boss takes no damage for a while        -> wait it out
];

// Types that never hurt the player directly (no telegraph minimum).
export const NON_DAMAGING_TYPES = ['summon', 'guard'];

// Fairness rules, enforced by scripts/validate.mjs and the brain tests.
export const FAIRNESS = {
  minTelegraphMs: 600,           // every damaging attack
  minFieldWideTelegraphMs: 1000, // fieldWide wipes need more reaction time
  maxMinionsPerBoss: 4,          // alive at once, per boss
};

// Player status effects applied by pattern hits (`onHit: { status, ms }`).
export const STATUS_RULES = {
  slow: { speedMult: 0.6, maxMs: 4000 },
  stun: { maxMs: 1500, immunityMs: 2000 }, // no stun-lock: immune after one ends
};

// Phase change: a short invulnerable roar so the transition reads clearly.
export const PHASE_TRANSITION = {
  roarMs: 1000,
  shakeIntensity: 0.012,
};

// Telegraph visuals shared by every handler.
export const TELEGRAPH_STYLE = {
  color: 0xE74C3C,
  safeColor: 0x2ECC71,
  minFillAlpha: 0.16,
  maxFillAlpha: 0.6,
};

// ===== Hug Guardian (Zakum homage, "too much love") =====

const PAW_SWIPE = {
  id: 'pawSwipe',
  type: 'meleeSwipe',
  nameKey: 'boss.hugGuardian.pawSwipe',
  weight: 4,
  cooldownMs: 1800,
  telegraphMs: 800,
  params: { range: 130, height: 90, damage: 18 },
};

const HUG_GRAB = {
  id: 'hugGrab',
  type: 'areaSlam',
  nameKey: 'boss.hugGuardian.hugGrab',
  weight: 3,
  cooldownMs: 6000,
  telegraphMs: 900,
  params: { width: 160, hitHeight: 110, target: 'player', damage: 25, onHit: { status: 'stun', ms: 1200 } },
};

const CALL_FRIENDS = {
  id: 'callFriends',
  type: 'summon',
  nameKey: 'boss.hugGuardian.callFriends',
  weight: 2,
  cooldownMs: 14000,
  telegraphMs: 800,
  params: { monster: 'bangul', count: 2, max: 4 },
};

const GROUP_HUG = {
  id: 'groupHug',
  type: 'fieldWide',
  nameKey: 'boss.hugGuardian.groupHug',
  weight: 2,
  cooldownMs: 12000,
  telegraphMs: 1700,
  params: { damage: 40, safeRadius: 140, airborne: true },
};

const CUDDLE_SHIELD = {
  id: 'cuddleShield',
  type: 'guard',
  nameKey: 'boss.hugGuardian.cuddleShield',
  weight: 2,
  cooldownMs: 16000,
  telegraphMs: 600,
  params: { durationMs: 3000 },
};

const withHit = (pattern, onHit) => ({ ...pattern, params: { ...pattern.params, onHit } });

export const HUG_GUARDIAN_PHASES = [
  {
    hpBelow: 1.0,
    gapMs: 1400,
    patterns: [PAW_SWIPE, HUG_GRAB, CALL_FRIENDS],
  },
  {
    hpBelow: 0.6,
    gapMs: 1200,
    roarKey: 'boss.hugGuardian.phase2',
    patterns: [withHit(PAW_SWIPE, { status: 'slow', ms: 2000 }), HUG_GRAB, CALL_FRIENDS, GROUP_HUG],
  },
  {
    hpBelow: 0.3,
    gapMs: 1000,
    roarKey: 'boss.hugGuardian.phase3',
    enrage: { cooldownMult: 0.7, speedMult: 1.3 },
    patterns: [withHit(PAW_SWIPE, { status: 'slow', ms: 2000 }), HUG_GRAB, CALL_FRIENDS, GROUP_HUG, CUDDLE_SHIELD],
  },
];

// ===== Dr. Embrace (tutorial boss: a gentler two-phase set) =====

const ARM_REACH = {
  id: 'armReach',
  type: 'projectile',
  nameKey: 'boss.drEmbrace.armReach',
  weight: 3,
  cooldownMs: 4500,
  telegraphMs: 1100,
  params: { origin: 'edge', count: 1, speed: 240, damage: 8, texture: 'proj_arm_dr', laneHeight: 44 },
};

const CHECKUP_SLAM = {
  id: 'checkupSlam',
  type: 'areaSlam',
  nameKey: 'boss.drEmbrace.checkupSlam',
  weight: 2,
  cooldownMs: 4500,
  telegraphMs: 1100,
  params: { width: 200, hitHeight: 110, target: 'player', damage: 10 },
};

const CHECKUP_HUG = {
  id: 'checkupHug',
  type: 'fieldWide',
  nameKey: 'boss.drEmbrace.checkupHug',
  weight: 2,
  cooldownMs: 12000,
  telegraphMs: 2300,
  params: { damage: 15, safeRadius: 190, airborne: true },
};

export const DR_EMBRACE_PHASES = [
  {
    hpBelow: 1.0,
    gapMs: 4200,
    patterns: [ARM_REACH, CHECKUP_SLAM],
  },
  {
    hpBelow: 0.5,
    gapMs: 3600,
    roarKey: 'boss.drEmbrace.phase2',
    patterns: [ARM_REACH, CHECKUP_SLAM, CHECKUP_HUG],
  },
];

// ===== Vacuum King (hidden boss: the primal fear of every pet) =====

const SUCTION = {
  id: 'suction',
  type: 'pull',
  nameKey: 'boss.vacuumKing.suction',
  weight: 3,
  cooldownMs: 5000,
  telegraphMs: 800,
  params: { durationMs: 2500, pull: 150 },
};

const DUST_BALLS = {
  id: 'dustBalls',
  type: 'projectile',
  nameKey: 'boss.vacuumKing.dustBalls',
  weight: 4,
  cooldownMs: 1800,
  telegraphMs: 700,
  params: { count: 3, spreadDeg: 16, speed: 200, damage: 15, texture: 'proj_dust', lifespanMs: 4000 },
};

const FLOOR_SWEEP = {
  id: 'floorSweep',
  type: 'dashSweep',
  nameKey: 'boss.vacuumKing.floorSweep',
  weight: 3,
  cooldownMs: 8000,
  telegraphMs: 1000,
  params: { speed: 520, damage: 22, lowProfile: 0.45 },
};

const CALL_FLIES = {
  id: 'callFlies',
  type: 'summon',
  nameKey: 'boss.vacuumKing.callFlies',
  weight: 2,
  cooldownMs: 15000,
  telegraphMs: 800,
  params: { monster: 'pari', count: 2, max: 4 },
};

const BAG_BURST = {
  id: 'bagBurst',
  type: 'areaSlam',
  nameKey: 'boss.vacuumKing.bagBurst',
  weight: 3,
  cooldownMs: 7000,
  telegraphMs: 1000,
  params: { width: 140, hitHeight: 130, count: 3, target: 'random', damage: 24, minGapPx: 90, spreadPx: 450 },
};

// Drops to floor level while it inhales: touching it then hurts a lot. The
// pull stays below every cat's move speed, so walking against it always works.
const FULL_SUCTION = {
  id: 'fullSuction',
  type: 'pull',
  nameKey: 'boss.vacuumKing.fullSuction',
  weight: 2,
  cooldownMs: 12000,
  telegraphMs: 1000,
  params: { durationMs: 3000, pull: 180, lowerBody: true, hold: true, touchDamage: 55, banner: true },
};

// From phase 2 on, suction and dust balls may run at the same time
const overlapping = (pattern) => ({ ...pattern, overlap: true });

export const VACUUM_KING_PHASES = [
  {
    hpBelow: 1.0,
    gapMs: 1300,
    patterns: [SUCTION, DUST_BALLS, FLOOR_SWEEP],
  },
  {
    hpBelow: 0.5,
    gapMs: 1100,
    roarKey: 'boss.vacuumKing.phase2',
    patterns: [overlapping(SUCTION), overlapping(DUST_BALLS), FLOOR_SWEEP, CALL_FLIES],
  },
  {
    hpBelow: 0.25,
    gapMs: 900,
    roarKey: 'boss.vacuumKing.phase3',
    enrage: { cooldownMult: 0.7, speedMult: 1.3 },
    patterns: [overlapping(SUCTION), overlapping(DUST_BALLS), FLOOR_SWEEP, CALL_FLIES, BAG_BURST, FULL_SUCTION],
  },
];
