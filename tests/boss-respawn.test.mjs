import test from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_TYPES } from '../src/data/monsters.js';
import { BOSS_RESPAWN, isBossAlive } from '../src/data/bossRespawn.js';

// SaveManager keeps module-level state (active slot, in-memory fallback), so
// every "app launch" imports its own instance via a unique query string.
let instance = 0;
async function launch() {
  const module = await import(`../src/systems/SaveManager.js?boss-respawn=${instance += 1}`);
  return module.default;
}

function fakeStorage() {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

async function withStorage(run) {
  globalThis.localStorage = fakeStorage();
  try {
    await run(globalThis.localStorage);
  } finally {
    delete globalThis.localStorage;
  }
}

const T0 = Date.parse('2026-01-01T00:00:00.000Z');
const stamp = (ms) => new Date(ms).toISOString();

test('every boss has a positive respawnSec and the tuning constants are sane', () => {
  assert.equal(BOSS_TYPES.hugGuardian.respawnSec, 300);
  assert.equal(BOSS_TYPES.vacuumKing.respawnSec, 600);
  for (const [id, boss] of Object.entries(BOSS_TYPES)) {
    assert.ok(Number.isFinite(boss.respawnSec) && boss.respawnSec > 0, `${id} respawnSec`);
  }
  for (const [name, value] of Object.entries(BOSS_RESPAWN)) {
    assert.ok(Number.isFinite(value) && value > 0, name);
  }
});

test('isBossAlive: never defeated, just defeated, exactly at timer, after timer', () => {
  const def = { respawnSec: 300 };
  const record = { firstDefeatedAt: stamp(T0), lastDefeatedAt: stamp(T0) };
  assert.equal(isBossAlive(def, undefined, T0), true, 'never defeated');
  assert.equal(isBossAlive(def, record, T0), false, 'just defeated');
  assert.equal(isBossAlive(def, record, T0 + 299999), false, '1ms before the timer');
  assert.equal(isBossAlive(def, record, T0 + 300000), true, 'exactly at the timer');
  assert.equal(isBossAlive(def, record, T0 + 300001), true, 'after the timer');
});

test('isBossAlive: only lastDefeatedAt matters, and a clock set back never locks a boss out', () => {
  const def = { respawnSec: 300 };
  const record = { firstDefeatedAt: stamp(T0 - 86400000), lastDefeatedAt: stamp(T0) };
  assert.equal(isBossAlive(def, record, T0 + 1000), false, 'an old first defeat does not revive the boss');
  assert.equal(isBossAlive(def, record, T0 - 60000), true, 'defeat stamped in the future');
  assert.equal(isBossAlive(def, { lastDefeatedAt: 'garbage' }, T0), true, 'unreadable stamp');
});

test('first defeat is reported once; story flag is permanent and the timer restarts each kill', async () => {
  await withStorage(async () => {
    const SaveManager = await launch();
    SaveManager.startNewGame(1, 'seoli');
    assert.equal(SaveManager.hasDefeatedBoss('hugGuardian'), false);
    assert.equal(SaveManager.isBossAlive('hugGuardian'), true);

    assert.deepEqual(SaveManager.recordBossDefeat('hugGuardian', { hp: 10 }), { first: true });
    assert.equal(SaveManager.getFlag('hugGuardianDefeated'), true);
    assert.equal(SaveManager.hasDefeatedBoss('hugGuardian'), true);
    assert.equal(SaveManager.isBossAlive('hugGuardian'), false, 'gone right after the kill');
    const first = SaveManager.listSlots()[0].data.bosses.hugGuardian;
    assert.equal(first.firstDefeatedAt, first.lastDefeatedAt);

    // Rewind the record to "defeated an hour ago", then kill it again
    const stored = JSON.parse(globalThis.localStorage.getItem('boso.save.slot1'));
    stored.bosses.hugGuardian = { firstDefeatedAt: stamp(T0), lastDefeatedAt: stamp(T0) };
    globalThis.localStorage.setItem('boso.save.slot1', JSON.stringify(stored));
    const reopened = await launch();
    reopened.continueSlot(1);
    assert.equal(reopened.isBossAlive('hugGuardian'), true, 'timer long expired');
    assert.deepEqual(reopened.recordBossDefeat('hugGuardian', { hp: 10 }), { first: false });
    const again = reopened.listSlots()[0].data.bosses.hugGuardian;
    assert.equal(again.firstDefeatedAt, stamp(T0), 'first defeat time is preserved');
    assert.ok(Date.parse(again.lastDefeatedAt) > T0, 'last defeat time moves');
    assert.equal(reopened.getFlag('hugGuardianDefeated'), true, 'story flag stays set');
    assert.equal(reopened.isBossAlive('hugGuardian'), false, 'timer restarted');
  });
});

test('closing the game keeps the timer running: Continue after respawnSec brings the boss back', async () => {
  await withStorage(async () => {
    const SaveManager = await launch();
    SaveManager.startNewGame(1, 'bomi');
    SaveManager.recordBossDefeat('vacuumKing', { hp: 50 });
    const defeatedMs = Date.parse(SaveManager.listSlots()[0].data.bosses.vacuumKing.lastDefeatedAt);
    const wait = BOSS_TYPES.vacuumKing.respawnSec * 1000;

    // "Close the tab": a brand-new SaveManager instance only has localStorage
    const afterRestart = await launch();
    assert.ok(afterRestart.continueSlot(1));
    assert.equal(afterRestart.isBossAlive('vacuumKing', defeatedMs + 1000), false, 'reopened too early');
    assert.equal(afterRestart.isBossAlive('vacuumKing', defeatedMs + wait - 1), false);
    assert.equal(afterRestart.isBossAlive('vacuumKing', defeatedMs + wait), true, 'reopened after the timer');
    assert.equal(afterRestart.hasDefeatedBoss('vacuumKing'), true, 'story progress survives the respawn');
  });
});

test('a flag without a boss record still counts as already defeated', async () => {
  await withStorage(async () => {
    const SaveManager = await launch();
    SaveManager.startNewGame(1, 'seoli');
    SaveManager.setFlag('biggieDefeated');
    assert.equal(SaveManager.hasDefeatedBoss('biggie'), true);
    assert.deepEqual(SaveManager.recordBossDefeat('biggie'), { first: false });
  });
});

test('dev reset makes defeated bosses due again without touching story progress', async () => {
  await withStorage(async () => {
    const SaveManager = await launch();
    SaveManager.startNewGame(1, 'seoli');
    SaveManager.recordBossDefeat('hugGuardian', { hp: 40 });
    SaveManager.recordBossDefeat('vacuumKing', { hp: 40 });
    const before = SaveManager.listSlots()[0].data.bosses;
    assert.equal(SaveManager.isBossAlive('hugGuardian'), false);
    assert.equal(SaveManager.isBossAlive('vacuumKing'), false);

    assert.equal(SaveManager.resetBossTimers(), 2);
    assert.equal(SaveManager.isBossAlive('hugGuardian'), true);
    assert.equal(SaveManager.isBossAlive('vacuumKing'), true);
    assert.equal(SaveManager.getFlag('hugGuardianDefeated'), true);
    assert.equal(SaveManager.hasDefeatedBoss('vacuumKing'), true);

    const after = SaveManager.listSlots()[0].data.bosses;
    assert.equal(after.hugGuardian.firstDefeatedAt, before.hugGuardian.firstDefeatedAt);
    assert.equal(SaveManager.listSlots()[0].status, 'ok', 'reset slot still parses');
    assert.deepEqual(SaveManager.recordBossDefeat('hugGuardian'), { first: false }, 'no story replay after a reset');
  });
});

test('boss timers belong to their slot: a new game starts with the boss alive', async () => {
  await withStorage(async () => {
    const SaveManager = await launch();
    SaveManager.startNewGame(1, 'seoli');
    SaveManager.recordBossDefeat('hugGuardian');
    SaveManager.startNewGame(2, 'seoli');
    assert.equal(SaveManager.isBossAlive('hugGuardian'), true);
    assert.equal(SaveManager.hasDefeatedBoss('hugGuardian'), false);
    SaveManager.continueSlot(1);
    assert.equal(SaveManager.isBossAlive('hugGuardian'), false);
  });
});
