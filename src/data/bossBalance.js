// src/data/bossBalance.js
// Pure data + math — a rough "how long does the fight take" model, so boss HP
// can be tuned against the player's damage instead of by feel.
//
// Target: a full fight takes roughly 2-4 minutes at the intended level.
// BOSS_TYPES[id].balance = { intendedLevel, uptime } feeds the model:
//   intendedLevel  the level a player is expected to have at that boss
//   uptime         share of the fight the player spends actually hitting it
//                  (the rest is dodging, repositioning and waiting out
//                  telegraphs); 0.35 is a middling player
// Wind Gust (Seoli's ranged attack) is ignored: it is MP-limited and weaker.

import { getCharacter, LEVEL_GROWTH, COMBO_MULTIPLIERS } from './characters.js';
import { PHASE_TRANSITION } from './bossPatterns.js';

export const FIGHT_TARGET_SEC = { min: 120, max: 240 };

// Damage per second while holding the attack key down (three-hit combo loop)
export function comboDps(characterId, level) {
  const { stats, combat } = getCharacter(characterId);
  const attack = stats.atk + (level - 1) * LEVEL_GROWTH.atk;
  // Each swing waits its cooldown; the third hit adds a 70ms recovery
  const cycleMs = combat.cooldown * COMBO_MULTIPLIERS.length + 70;
  const cycleDamage = attack * COMBO_MULTIPLIERS.reduce((sum, mult) => sum + mult, 0);
  return (cycleDamage / cycleMs) * 1000;
}

// Seconds from first hit to the kill, including the time the boss cannot be
// hurt (phase roars and an upper bound of guard stances).
export function estimateFightSeconds(bossCfg, characterId) {
  const { intendedLevel, uptime } = bossCfg.balance;
  const dps = comboDps(characterId, intendedLevel) * uptime;
  const phases = bossCfg.phases;

  let seconds = 0;
  phases.forEach((phase, i) => {
    const lower = i + 1 < phases.length ? phases[i + 1].hpBelow : 0;
    const phaseSec = ((phase.hpBelow - lower) * bossCfg.hp) / dps;
    seconds += phaseSec;
    if (i > 0) seconds += PHASE_TRANSITION.roarMs / 1000;
    const mult = phase.enrage ? phase.enrage.cooldownMult : 1;
    phase.patterns.filter((p) => p.type === 'guard').forEach((guard) => {
      const casts = Math.ceil(phaseSec / ((guard.cooldownMs * mult) / 1000));
      seconds += casts * (guard.params.durationMs / 1000);
    });
  });
  return seconds;
}

// Seconds a jump spends higher than `clearancePx` above its takeoff height
// (v = jump speed, g = gravity). Zero when the jump never gets that high.
// Used to check that "jump over it" attacks leave enough room to react.
export function jumpClearSeconds(jumpSpeed, gravity, clearancePx) {
  const disc = jumpSpeed * jumpSpeed - 2 * gravity * clearancePx;
  return disc > 0 ? Math.sqrt(disc) * 2 / gravity : 0;
}
