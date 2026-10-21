// src/systems/BossBrain.js
// Pure (no Phaser) boss decision logic, Node-testable with a seeded rng.
//
//   selectPhase(hpRatio, phases)   which phase the boss is in
//   pickPattern(phase, ...)        weighted random pick with cooldowns
//   planBurstSpots(...)            where an N-spot areaSlam lands
//
// Times are in milliseconds on whatever clock the caller keeps (the entity
// uses a frame-delta clock, so pausing the game never skips a cooldown).

import { FAIRNESS } from '../data/bossPatterns.js';

// Phases are sorted by hpBelow descending and the first one is 1.0. A phase
// begins once HP drops STRICTLY below its threshold: at exactly 60% the boss
// is still in phase 1, one point of damage later it is in phase 2.
export function selectPhase(hpRatio, phases) {
  if (!Array.isArray(phases) || phases.length === 0) return 0;
  const ratio = Number.isFinite(hpRatio) ? hpRatio : 1;
  let index = 0;
  for (let i = 1; i < phases.length; i += 1) {
    if (ratio < phases[i].hpBelow) index = i;
  }
  return index;
}

// Enrage shortens cooldowns (never telegraphs, so reaction time is kept).
export function cooldownMultFor(phase) {
  const mult = phase && phase.enrage ? phase.enrage.cooldownMult : 1;
  return Number.isFinite(mult) && mult > 0 ? mult : 1;
}

export function speedMultFor(phase) {
  const mult = phase && phase.enrage ? phase.enrage.speedMult : 1;
  return Number.isFinite(mult) && mult > 0 ? mult : 1;
}

// Absolute time a pattern started at `startedAt` may be picked again.
export function readyAtFor(pattern, phase, startedAt) {
  return startedAt + Math.round(pattern.cooldownMs * cooldownMultFor(phase));
}

// Picks the next pattern, or null when nothing may start right now.
//
//   cooldowns  { [patternId]: readyAt }  excluded while readyAt > now
//   history    patterns in the order they started (last one is the newest)
//   rng        () => [0, 1)
//   ctx.active          patterns that are still running
//   ctx.minionsAlive    summons are excluded once the cap is reached
//
// Rules: nothing starts while an exclusive pattern runs; while only
// `overlap` patterns run, only another (inactive) `overlap` pattern may join;
// a fieldWide never follows a fieldWide.
export function pickPattern(phase, cooldowns, history, now, rng, ctx = {}) {
  if (!phase || !Array.isArray(phase.patterns) || phase.patterns.length === 0) return null;
  const active = ctx.active || [];
  const minionsAlive = ctx.minionsAlive || 0;
  const minionCap = ctx.minionCap || FAIRNESS.maxMinionsPerBoss;
  if (active.some((p) => !p.overlap)) return null;

  const last = history && history.length ? history[history.length - 1] : null;
  const candidates = phase.patterns.filter((p) => {
    if ((cooldowns[p.id] || 0) > now) return false;
    if (active.length > 0 && !p.overlap) return false;
    if (active.some((a) => a.id === p.id)) return false;
    if (p.type === 'fieldWide' && last && last.type === 'fieldWide') return false;
    if (p.type === 'summon' && minionsAlive >= minionCap) return false;
    return true;
  });
  if (candidates.length === 0) return null;

  const total = candidates.reduce((sum, p) => sum + p.weight, 0);
  let roll = rng() * total;
  for (const pattern of candidates) {
    roll -= pattern.weight;
    if (roll < 0) return pattern;
  }
  return candidates[candidates.length - 1];
}

// Zone centres for an areaSlam with several spots. The first spot is on the
// player (standing still is punished); the rest land within `spreadPx` of
// them. Every pair of zones keeps `minGapPx` of free floor between its
// edges, so a dodge pocket always exists.
export function planBurstSpots({ playerX, count, width, minGapPx, minX, maxX, spreadPx, rng }) {
  const clampX = (x) => Math.min(maxX, Math.max(minX, x));
  const separation = width + minGapPx;
  const spots = [clampX(playerX)];
  const lo = clampX(playerX - spreadPx);
  const hi = clampX(playerX + spreadPx);
  for (let attempt = 0; attempt < 80 && spots.length < count; attempt += 1) {
    const x = lo + rng() * (hi - lo);
    if (spots.every((s) => Math.abs(s - x) >= separation)) spots.push(x);
  }
  return spots;
}
