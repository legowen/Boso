import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAIRNESS, STATUS_RULES, PATTERN_TYPES, NON_DAMAGING_TYPES,
  HUG_GUARDIAN_PHASES, DR_EMBRACE_PHASES, VACUUM_KING_PHASES,
} from '../src/data/bossPatterns.js';
import {
  selectPhase, pickPattern, planBurstSpots, readyAtFor, cooldownMultFor, speedMultFor, summonCap,
} from '../src/systems/BossBrain.js';
import StatusTracker from '../src/systems/StatusEffects.js';
import { BOSS_TYPES, MONSTER_TYPES } from '../src/data/monsters.js';
import { CHARACTERS } from '../src/data/characters.js';
import { GRAVITY, PLAYER } from '../src/utils/constants.js';
import { estimateFightSeconds, comboDps, jumpClearSeconds, FIGHT_TARGET_SEC } from '../src/data/bossBalance.js';

// Deterministic rng so every run draws the same sequence
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const swipe = { id: 'swipe', type: 'meleeSwipe', weight: 4, cooldownMs: 1000, telegraphMs: 800 };
const slam = { id: 'slam', type: 'areaSlam', weight: 3, cooldownMs: 5000, telegraphMs: 900 };
const wipe = { id: 'wipe', type: 'fieldWide', weight: 2, cooldownMs: 1000, telegraphMs: 1700 };
const call = { id: 'call', type: 'summon', weight: 2, cooldownMs: 9000, telegraphMs: 800 };
const phaseOf = (...patterns) => ({ hpBelow: 1, gapMs: 1000, patterns });

test('selectPhase: boundaries are strict (exactly 0.6 / 0.3 stay in the earlier phase)', () => {
  const phases = HUG_GUARDIAN_PHASES;
  assert.equal(phases[0].hpBelow, 1.0);
  assert.equal(selectPhase(1, phases), 0, 'full HP');
  assert.equal(selectPhase(0.61, phases), 0);
  assert.equal(selectPhase(0.6, phases), 0, 'exactly 60% is still phase 1');
  assert.equal(selectPhase(0.5999, phases), 1, 'just under 60% is phase 2');
  assert.equal(selectPhase(0.3, phases), 1, 'exactly 30% is still phase 2');
  assert.equal(selectPhase(0.2999, phases), 2, 'just under 30% is the enrage phase');
  assert.equal(selectPhase(0, phases), 2);
  assert.equal(selectPhase(-5, phases), 2, 'overkill stays in the last phase');
});

test('selectPhase: integer HP boundaries and degenerate input', () => {
  const phases = HUG_GUARDIAN_PHASES;
  const max = 7000;
  assert.equal(selectPhase(4200 / max, phases), 0, '4200/7000 is exactly 0.6');
  assert.equal(selectPhase(4199 / max, phases), 1);
  assert.equal(selectPhase(2100 / max, phases), 1, '2100/7000 is exactly 0.3');
  assert.equal(selectPhase(2099 / max, phases), 2);
  assert.equal(selectPhase(Number.NaN, phases), 0, 'NaN never skips ahead');
  assert.equal(selectPhase(0.2, []), 0);
  assert.equal(selectPhase(0.2, undefined), 0);
  assert.equal(selectPhase(0.2, DR_EMBRACE_PHASES), 1);
  assert.equal(selectPhase(0.5, DR_EMBRACE_PHASES), 0);
});

test('enrage multipliers: only the enrage phase changes anything', () => {
  assert.equal(cooldownMultFor(HUG_GUARDIAN_PHASES[0]), 1);
  assert.equal(cooldownMultFor(HUG_GUARDIAN_PHASES[2]), 0.7);
  assert.equal(speedMultFor(HUG_GUARDIAN_PHASES[1]), 1);
  assert.equal(speedMultFor(HUG_GUARDIAN_PHASES[2]), 1.3);
  const pattern = { cooldownMs: 10000 };
  assert.equal(readyAtFor(pattern, HUG_GUARDIAN_PHASES[0], 500), 10500);
  assert.equal(readyAtFor(pattern, HUG_GUARDIAN_PHASES[2], 500), 7500, 'x0.7 in the enrage phase');
});

test('pickPattern: a pattern on cooldown is never picked', () => {
  const phase = phaseOf(swipe, slam);
  const rng = mulberry32(1);
  const cooldowns = { slam: 5000 };
  for (let i = 0; i < 200; i += 1) {
    assert.equal(pickPattern(phase, cooldowns, [], 4999, rng).id, 'swipe');
  }
  const seen = new Set();
  for (let i = 0; i < 200; i += 1) seen.add(pickPattern(phase, cooldowns, [], 5000, rng).id);
  assert.deepEqual([...seen].sort(), ['slam', 'swipe'], 'ready again exactly at readyAt');
  assert.equal(pickPattern(phase, { swipe: 9000, slam: 9000 }, [], 100, rng), null, 'all on cooldown');
  assert.equal(pickPattern(phaseOf(), {}, [], 0, rng), null, 'empty phase');
});

test('pickPattern: picks follow the weights', () => {
  const phase = phaseOf(swipe, slam, wipe);
  const rng = mulberry32(7);
  const counts = { swipe: 0, slam: 0, wipe: 0 };
  const picks = 20000;
  for (let i = 0; i < picks; i += 1) counts[pickPattern(phase, {}, [], 0, rng).id] += 1;
  const total = swipe.weight + slam.weight + wipe.weight;
  for (const p of [swipe, slam, wipe]) {
    const expected = p.weight / total;
    assert.ok(Math.abs(counts[p.id] / picks - expected) < 0.02, `${p.id}: ${counts[p.id] / picks} vs ${expected}`);
  }
});

test('pickPattern: exclusive patterns block, overlap patterns may join, summons respect the cap', () => {
  const rng = mulberry32(3);
  const a = { id: 'a', type: 'pull', weight: 1, cooldownMs: 0, telegraphMs: 800, overlap: true };
  const b = { id: 'b', type: 'projectile', weight: 1, cooldownMs: 0, telegraphMs: 700, overlap: true };
  const c = { id: 'c', type: 'dashSweep', weight: 1, cooldownMs: 0, telegraphMs: 1000 };
  const phase = phaseOf(a, b, c);
  assert.equal(pickPattern(phase, {}, [], 0, rng, { active: [c] }), null, 'exclusive running');
  for (let i = 0; i < 100; i += 1) {
    assert.equal(pickPattern(phase, {}, [], 0, rng, { active: [a] }).id, 'b', 'only the other overlap pattern joins');
  }
  assert.equal(pickPattern(phase, {}, [], 0, rng, { active: [a, b] }), null, 'both already running');

  const summonPhase = phaseOf(swipe, call);
  const ids = new Set();
  for (let i = 0; i < 200; i += 1) ids.add(pickPattern(summonPhase, {}, [], 0, rng, { minionsAlive: FAIRNESS.maxMinionsPerBoss }).id);
  assert.deepEqual([...ids], ['swipe'], 'no summon once the cap is reached');
  ids.clear();
  for (let i = 0; i < 200; i += 1) ids.add(pickPattern(summonPhase, {}, [], 0, rng, { minionsAlive: 1 }).id);
  assert.ok(ids.has('call'), 'summons stay available below the cap');
});

test('summonCap: a pattern may lower the cap, never raise it', () => {
  assert.equal(summonCap({ params: { max: 2 } }), 2);
  assert.equal(summonCap({ params: { max: 9 } }), FAIRNESS.maxMinionsPerBoss);
  assert.equal(summonCap({ params: {} }), FAIRNESS.maxMinionsPerBoss);
  assert.equal(summonCap({ params: { max: 3 } }, 2), 2);
  const small = { id: 's', type: 'summon', weight: 1, cooldownMs: 0, telegraphMs: 800, params: { max: 2 } };
  const rng = mulberry32(2);
  assert.equal(pickPattern(phaseOf(small), {}, [], 0, rng, { minionsAlive: 2 }), null, 'its own max of 2 is reached');
  assert.equal(pickPattern(phaseOf(small), {}, [], 0, rng, { minionsAlive: 1 }).id, 's');
});

// Runs the scheduler the way the entity does: start -> cooldown -> run time -> gap
function simulate(phase, picks, seed) {
  const rng = mulberry32(seed);
  const cooldowns = {};
  const history = [];
  const sequence = [];
  let now = 0;
  while (sequence.length < picks) {
    const pattern = pickPattern(phase, cooldowns, history, now, rng);
    if (!pattern) {
      now += 50;
      continue;
    }
    sequence.push(pattern);
    history.push(pattern);
    if (history.length > 8) history.shift();
    cooldowns[pattern.id] = readyAtFor(pattern, phase, now);
    now += pattern.telegraphMs + 400 + phase.gapMs;
  }
  return sequence;
}

const ALL_PHASE_TABLES = [
  ['hugGuardian', HUG_GUARDIAN_PHASES], ['drEmbrace', DR_EMBRACE_PHASES], ['vacuumKing', VACUUM_KING_PHASES],
];

test('no fieldWide twice in a row over 1000 simulated picks, in every phase', () => {
  for (const [name, phases] of ALL_PHASE_TABLES) {
    phases.forEach((phase, i) => {
      for (let seed = 1; seed <= 5; seed += 1) {
        const sequence = simulate(phase, 1000, seed);
        let wipes = 0;
        sequence.forEach((p, n) => {
          if (p.type !== 'fieldWide') return;
          wipes += 1;
          if (n > 0) assert.notEqual(sequence[n - 1].type, 'fieldWide', `${name} phase ${i} seed ${seed} pick ${n}`);
        });
        if (phase.patterns.some((p) => p.type === 'fieldWide')) {
          assert.ok(wipes > 0, `${name} phase ${i}: the simulation should actually pick the fieldWide pattern`);
        }
      }
    });
  }
});

test('the rule holds even when fieldWide is the heaviest pattern and has no cooldown', () => {
  const phase = phaseOf({ ...wipe, weight: 50, cooldownMs: 0 }, swipe);
  const sequence = simulate(phase, 1000, 11);
  sequence.forEach((p, n) => {
    if (n > 0 && p.type === 'fieldWide') assert.notEqual(sequence[n - 1].type, 'fieldWide');
  });
  assert.ok(sequence.filter((p) => p.type === 'fieldWide').length > 300);
});

test('a boss is never locked out: a filler pattern is ready again by the next pick', () => {
  const dataPhases = ALL_PHASE_TABLES.flatMap(([, phases]) => phases);
  for (const phase of dataPhases) {
    const filler = phase.patterns.filter((p) => p.type !== 'fieldWide' && p.type !== 'summon'
      && Math.round(p.cooldownMs * cooldownMultFor(phase)) <= p.telegraphMs + phase.gapMs);
    assert.ok(filler.length > 0, `phase ${phase.hpBelow} has no always-ready pattern`);
  }
  // ...so a long simulation never has to wait for a cooldown
  for (const phase of dataPhases) {
    const rng = mulberry32(5);
    const cooldowns = {};
    const history = [];
    let now = 0;
    for (let n = 0; n < 500; n += 1) {
      const pattern = pickPattern(phase, cooldowns, history, now, rng);
      assert.ok(pattern, `phase ${phase.hpBelow} stalled at pick ${n}`);
      history.push(pattern);
      cooldowns[pattern.id] = readyAtFor(pattern, phase, now);
      now += pattern.telegraphMs + phase.gapMs;
    }
  }
});

test('planBurstSpots: first zone on the player, every zone in bounds with a dodge pocket between them', () => {
  const rng = mulberry32(21);
  for (let trial = 0; trial < 500; trial += 1) {
    const playerX = 100 + rng() * 1400;
    const spots = planBurstSpots({
      playerX, count: 3, width: 140, minGapPx: 90, minX: 100, maxX: 1500, spreadPx: 450, rng,
    });
    assert.ok(spots.length >= 1 && spots.length <= 3);
    assert.equal(spots[0], Math.min(1500, Math.max(100, playerX)), 'first zone is under the player');
    for (const x of spots) assert.ok(x >= 100 && x <= 1500, `spot ${x} out of bounds`);
    for (let i = 0; i < spots.length; i += 1) {
      for (let j = i + 1; j < spots.length; j += 1) {
        assert.ok(Math.abs(spots[i] - spots[j]) - 140 >= 90 - 1e-9, 'zones keep a gap between their edges');
      }
    }
  }
  const crowded = planBurstSpots({
    playerX: 800, count: 3, width: 140, minGapPx: 90, minX: 700, maxX: 900, spreadPx: 450, rng,
  });
  assert.ok(crowded.length < 3, 'a zone that cannot fit with a gap is dropped instead of overlapping');
});

test('every pattern definition uses a known type, positive weight and sane numbers', () => {
  for (const [, phases] of ALL_PHASE_TABLES) {
    for (const phase of phases) {
      for (const p of phase.patterns) {
        assert.ok(PATTERN_TYPES.includes(p.type), `${p.id}: unknown type ${p.type}`);
        assert.ok(p.weight > 0 && p.cooldownMs >= 0 && p.telegraphMs >= 0, p.id);
        if (!NON_DAMAGING_TYPES.includes(p.type)) {
          assert.ok(p.telegraphMs >= FAIRNESS.minTelegraphMs, `${p.id}: telegraph too short`);
        }
        if (p.type === 'fieldWide') assert.ok(p.telegraphMs >= FAIRNESS.minFieldWideTelegraphMs, p.id);
      }
    }
  }
});

test('StatusTracker: slow is x0.6 and expires', () => {
  const s = new StatusTracker();
  assert.equal(s.speedMult(0), 1);
  assert.equal(s.apply('slow', 2000, 1000), true);
  assert.equal(s.speedMult(1000), STATUS_RULES.slow.speedMult);
  assert.equal(s.speedMult(2999), 0.6);
  assert.equal(s.speedMult(3000), 1);
  assert.equal(s.isStunned(1000), false, 'slow is not stun');
  s.apply('slow', 500, 2000);
  assert.equal(s.isSlowed(3000), false, 'a shorter re-hit never shortens an active slow');
  assert.equal(s.isSlowed(2999), true);
});

test('StatusTracker: stun is capped at 1.5s, then 2s of immunity (no stun-lock)', () => {
  const s = new StatusTracker();
  assert.equal(s.apply('stun', 5000, 10000), true);
  assert.equal(s.isStunned(10000), true);
  assert.equal(s.isStunned(11499), true);
  assert.equal(s.isStunned(11500), false, 'capped at 1500ms');

  assert.equal(s.apply('stun', 1000, 11000), false, 'cannot extend an active stun');
  assert.equal(s.apply('stun', 1000, 11500), false, 'immune right after it ends');
  assert.equal(s.apply('stun', 1000, 13499), false, 'still immune 1ms before the 2s are up');
  assert.equal(s.isStunImmune(13499), true);
  assert.equal(s.apply('stun', 1000, 13500), true, 'immunity ends 2s after the stun ended');
  assert.equal(s.isStunned(14000), true);
  assert.equal(s.apply('stun', 0, 99999), false, 'zero duration is ignored');
  assert.equal(s.apply('burn', 1000, 99999), false, 'unknown status is ignored');
});

test('StatusTracker: clear() lifts everything (death / respawn)', () => {
  const s = new StatusTracker();
  s.apply('stun', 1000, 0);
  s.apply('slow', 3000, 0);
  s.clear();
  assert.equal(s.isStunned(10), false);
  assert.equal(s.isSlowed(10), false);
  assert.equal(s.apply('stun', 1000, 10), true, 'no leftover immunity');
});

// ===== The real boss data =====

const patternBosses = Object.entries(BOSS_TYPES).filter(([, boss]) => boss.phases);

test('every boss with phases has valid, sorted phases and only summons real monsters', () => {
  assert.ok(patternBosses.length >= 2);
  for (const [id, boss] of patternBosses) {
    assert.equal(boss.phases[0].hpBelow, 1.0, `${id}: first phase starts at 1.0`);
    boss.phases.forEach((phase, i) => {
      if (i > 0) assert.ok(phase.hpBelow < boss.phases[i - 1].hpBelow, `${id}: phases sorted descending`);
      for (const p of phase.patterns) {
        assert.ok(PATTERN_TYPES.includes(p.type), `${id}/${p.id}: type`);
        if (p.type === 'summon') {
          assert.ok(MONSTER_TYPES[p.params.monster], `${id}/${p.id}: summoned monster exists`);
          assert.ok(p.params.count <= FAIRNESS.maxMinionsPerBoss);
        }
      }
    });
  }
});

test('Hug Guardian: 3 phases at 60% / 30% with the specified patterns', () => {
  const phases = BOSS_TYPES.hugGuardian.phases;
  assert.deepEqual(phases.map((p) => p.hpBelow), [1.0, 0.6, 0.3]);
  const ids = (phase) => phase.patterns.map((p) => p.id);
  assert.deepEqual(ids(phases[0]), ['pawSwipe', 'hugGrab', 'callFriends']);
  assert.deepEqual(ids(phases[1]), ['pawSwipe', 'hugGrab', 'callFriends', 'groupHug']);
  assert.deepEqual(ids(phases[2]), ['pawSwipe', 'hugGrab', 'callFriends', 'groupHug', 'cuddleShield']);
  const byId = (phase, id) => phase.patterns.find((p) => p.id === id);
  assert.equal(byId(phases[0], 'pawSwipe').params.onHit, undefined, 'no slow in phase 1');
  assert.deepEqual(byId(phases[1], 'pawSwipe').params.onHit, { status: 'slow', ms: 2000 });
  assert.deepEqual(byId(phases[0], 'hugGrab').params.onHit, { status: 'stun', ms: 1200 });
  assert.deepEqual(byId(phases[0], 'callFriends').params, { monster: 'bangul', count: 2, max: 4 });
  assert.equal(byId(phases[2], 'cuddleShield').params.durationMs, 3000);
  assert.deepEqual(phases[2].enrage, { cooldownMult: 0.7, speedMult: 1.3 });
  assert.equal(phases[0].enrage, undefined);
  assert.equal(phases[1].enrage, undefined);
});

test('Vacuum King: 3 phases at 50% / 25% with the specified patterns', () => {
  const phases = BOSS_TYPES.vacuumKing.phases;
  assert.deepEqual(phases.map((p) => p.hpBelow), [1.0, 0.5, 0.25]);
  const ids = (phase) => phase.patterns.map((p) => p.id);
  assert.deepEqual(ids(phases[0]), ['suction', 'dustBalls', 'floorSweep']);
  assert.deepEqual(ids(phases[1]), ['suction', 'dustBalls', 'floorSweep', 'callFlies']);
  assert.deepEqual(ids(phases[2]), ['suction', 'dustBalls', 'floorSweep', 'callFlies', 'bagBurst', 'fullSuction']);
  const byId = (phase, id) => phase.patterns.find((p) => p.id === id);

  assert.equal(byId(phases[0], 'suction').type, 'pull');
  assert.equal(byId(phases[0], 'suction').params.durationMs, 2500);
  assert.equal(byId(phases[0], 'dustBalls').type, 'projectile');
  assert.equal(byId(phases[0], 'dustBalls').params.count, 3);
  assert.ok(byId(phases[0], 'dustBalls').params.spreadDeg > 0, 'a spread');
  assert.equal(byId(phases[0], 'floorSweep').type, 'dashSweep');

  // Phase 1 alternates; from phase 2 on suction and dust balls can overlap
  assert.ok(!byId(phases[0], 'suction').overlap && !byId(phases[0], 'dustBalls').overlap);
  for (const phase of phases.slice(1)) {
    assert.equal(byId(phase, 'suction').overlap, true);
    assert.equal(byId(phase, 'dustBalls').overlap, true);
    assert.ok(!byId(phase, 'floorSweep').overlap, 'the sweep never overlaps');
  }
  assert.equal(byId(phases[1], 'callFlies').type, 'summon');
  assert.deepEqual(byId(phases[1], 'callFlies').params, { monster: 'pari', count: 2, max: 4 });

  const burst = byId(phases[2], 'bagBurst');
  assert.equal(burst.type, 'areaSlam');
  assert.equal(burst.params.count, 3);
  assert.equal(burst.params.target, 'random');
  const normal = byId(phases[2], 'suction');
  const full = byId(phases[2], 'fullSuction');
  assert.equal(full.type, 'pull');
  assert.ok(full.params.pull > normal.params.pull, 'stronger pull');
  assert.ok(full.params.touchDamage > BOSS_TYPES.vacuumKing.touchDamage, 'touching the boss during it hurts more than usual');
  assert.deepEqual(phases[2].enrage, { cooldownMult: 0.7, speedMult: 1.3 });
  assert.equal(phases[0].enrage, undefined);
  assert.equal(phases[1].enrage, undefined);
});

test('walking against any pull always works: no pull outruns the slowest cat', () => {
  const slowest = Math.min(...CHARACTERS.map((c) => c.stats.spd));
  let pulls = 0;
  for (const [, boss] of patternBosses) {
    for (const phase of boss.phases) {
      for (const p of phase.patterns.filter((x) => x.type === 'pull')) {
        pulls += 1;
        assert.ok(p.params.pull < slowest, `${p.id}: pull ${p.params.pull} must stay below ${slowest}`);
      }
    }
  }
  assert.ok(pulls > 0);
});

test('a full fight lasts about 2-4 minutes at the intended level, for both cats', () => {
  for (const [id, boss] of patternBosses) {
    if (!boss.balance) continue; // the tutorial boss is meant to be short
    for (const character of CHARACTERS) {
      const seconds = estimateFightSeconds(boss, character.id);
      assert.ok(
        seconds >= FIGHT_TARGET_SEC.min && seconds <= FIGHT_TARGET_SEC.max,
        `${id} vs ${character.id} at level ${boss.balance.intendedLevel}: ${Math.round(seconds)}s is outside ${FIGHT_TARGET_SEC.min}-${FIGHT_TARGET_SEC.max}s - tune the boss hp`
      );
    }
  }
});

test('the fight-length model reacts to hp and level the way it should', () => {
  const boss = BOSS_TYPES.hugGuardian;
  const base = estimateFightSeconds(boss, 'seoli');
  assert.ok(estimateFightSeconds({ ...boss, hp: boss.hp * 2 }, 'seoli') > base * 1.8, 'twice the hp, about twice as long');
  assert.ok(estimateFightSeconds({ ...boss, balance: { ...boss.balance, intendedLevel: boss.balance.intendedLevel + 5 } }, 'seoli') < base, 'a higher level kills faster');
  assert.ok(comboDps('seoli', 10) > comboDps('seoli', 1));
});

test('Arm Reach can be jumped by both cats with room to spare', () => {
  const arm = BOSS_TYPES.drEmbrace.phases[0].patterns.find((p) => p.id === 'armReach');
  const armWidth = 110; // proj_arm_dr.png
  const playerWidth = PLAYER.WIDTH - 8;
  const passSeconds = (armWidth + playerWidth) / arm.params.speed;
  for (const character of CHARACTERS) {
    const clear = jumpClearSeconds(-character.stats.jumpPower, GRAVITY, arm.params.laneHeight);
    assert.ok(clear - passSeconds >= 0.25, `${character.id}: ${clear.toFixed(2)}s above the arm vs ${passSeconds.toFixed(2)}s to pass`);
  }
  assert.equal(jumpClearSeconds(100, 900, 500), 0, 'a jump that never gets high enough clears nothing');
});
