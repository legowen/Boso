// src/systems/StatusEffects.js
// Pure (no Phaser) player status effects: slow and stun.
//
//   slow  move speed x0.6 for a duration
//   stun  no input; capped at 1.5s, and a finished stun leaves 2s of
//         immunity to new stuns (no stun-lock)
//
// `now` is whatever clock the caller keeps (Player uses scene.time.now, which
// stands still while the game is paused).

import { STATUS_RULES } from '../data/bossPatterns.js';

export default class StatusTracker {
  constructor() {
    this.clear();
  }

  clear() {
    this.slowUntil = 0;
    this.stunUntil = 0;
    this.stunEverApplied = false;
  }

  // Returns true when the status was (re)applied.
  apply(type, ms, now) {
    if (!(ms > 0) || !STATUS_RULES[type]) return false;
    const rules = STATUS_RULES[type];
    const duration = Math.min(ms, rules.maxMs);
    if (type === 'stun') {
      // Covers both "already stunned" and the 2s immunity after it ends
      if (this.stunEverApplied && now < this.stunUntil + rules.immunityMs) return false;
      this.stunUntil = now + duration;
      this.stunEverApplied = true;
      return true;
    }
    this.slowUntil = Math.max(this.slowUntil, now + duration);
    return true;
  }

  isStunned(now) {
    return now < this.stunUntil;
  }

  isSlowed(now) {
    return now < this.slowUntil;
  }

  speedMult(now) {
    return this.isSlowed(now) ? STATUS_RULES.slow.speedMult : 1;
  }

  // True while a new stun would be refused (stunned, or still immune)
  isStunImmune(now) {
    return this.stunEverApplied && now < this.stunUntil + STATUS_RULES.stun.immunityMs;
  }
}
