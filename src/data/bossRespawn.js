// src/data/bossRespawn.js
// Pure data + logic — boss respawn rules (no Phaser imports, Node-validatable).
//
// A boss carries two independent pieces of state:
//   story progress  "has it EVER been defeated"  permanent (`<id>Defeated` flag
//                   + bosses[id].firstDefeatedAt); drives one-time story/unlocks
//   alive state     "is it in the map NOW"       derived from
//                   bosses[id].lastDefeatedAt and BOSS_TYPES[id].respawnSec

// Scene-side timing for a boss whose timer runs out while the player is
// standing in its map.
export const BOSS_RESPAWN = {
  checkIntervalMs: 3000,   // how often the scene polls the wall-clock timer
  warningMs: 2000,         // warning (shake + text) -> boss appears
  clearRadiusPx: 200,      // keep the spawn point this clear of the player...
  maxClearWaitMs: 5000,    // ...for at most this long, then spawn anyway
};

// bossDef:  a BOSS_TYPES entry ({ respawnSec })
// bossSave: bosses[id] from the save ({ firstDefeatedAt, lastDefeatedAt },
//           ISO strings) or undefined when never defeated
// now:      wall-clock epoch ms (Date.now()), so the timer keeps running
//           while the game is closed
export function isBossAlive(bossDef, bossSave, now) {
  if (!bossSave) return true;
  const lastDefeatedMs = Date.parse(bossSave.lastDefeatedAt);
  if (Number.isNaN(lastDefeatedMs)) return true;
  const elapsedMs = now - lastDefeatedMs;
  // A defeat stamped in the future means the system clock was set back. Fail
  // open (boss alive) rather than lock the boss out until the clock catches up.
  if (elapsedMs < 0) return true;
  return elapsedMs >= bossDef.respawnSec * 1000;
}
