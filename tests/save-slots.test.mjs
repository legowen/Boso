import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS_DATA, START_MAP } from '../src/data/maps.js';
import { DEFAULT_SPAWN_ID, portalSpawnId, resolveSpawn, spawnPointsFor } from '../src/data/spawns.js';
import { formatPlayTime, formatSavedAt } from '../src/utils/format.js';

// SaveManager keeps module-level state (active slot, in-memory fallback), so
// every test imports its own instance via a unique query string.
let instance = 0;
async function freshModule() {
  return import(`../src/systems/SaveManager.js?instance=${instance += 1}`);
}

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

async function withStorage(storage, run) {
  if (storage) globalThis.localStorage = storage;
  try {
    const module = await freshModule();
    await run(module.default, module, storage);
  } finally {
    delete globalThis.localStorage;
  }
}

const slotKey = (n) => `boso.save.slot${n}`;

test('slot data round-trips: create -> serialize -> parse -> deep equal', async () => {
  const { createSlotData, serializeSlot, parseSlot } = await freshModule();
  const data = createSlotData({
    slot: 2, characterId: 'bomi', mapId: 'kitchen', spawnId: 'from:livingroom', hp: 120,
    storyFlags: { biggieDefeated: true }, characters: { bomi: { level: 3, exp: 4, treats: 5, items: { cookie: 2 }, quests: {} } },
    bosses: { biggie: { firstDefeatedAt: '2026-01-01T00:00:00.000Z', lastDefeatedAt: '2026-01-02T00:00:00.000Z' } },
    playTimeSec: 61.5,
  });
  assert.equal(data.version, 1);
  const parsed = parseSlot(serializeSlot(data), 2);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.data, data);
});

test('the loader rejects wrong versions, unknown maps and malformed slots', async () => {
  const { createSlotData, parseSlot } = await freshModule();
  const good = createSlotData({ slot: 1, characterId: 'seoli' });
  const reason = (patch, expected) => parseSlot(JSON.stringify({ ...good, ...patch }), expected).reason;
  assert.equal(parseSlot(JSON.stringify(good), 1).ok, true);
  assert.equal(reason({ version: 2 }), 'unsupported-version');
  assert.equal(reason({ version: undefined }), 'unsupported-version');
  assert.equal(reason({ mapId: 'deleted_map' }), 'unknown-map');
  assert.equal(reason({ mapId: 'constructor' }), 'unknown-map', 'inherited keys are not maps');
  assert.equal(reason({ mapId: 5 }), 'unknown-map');
  assert.equal(reason({ slot: 4 }), 'invalid-slot');
  assert.equal(reason({}, 2), 'invalid-slot', 'a slot stored under the wrong key');
  assert.equal(reason({ hp: 'lots' }), 'invalid-hp');
  assert.equal(reason({ playTimeSec: -1 }), 'invalid-playtime');
  assert.equal(reason({ updatedAt: 'yesterday' }), 'invalid-date');
  assert.equal(reason({ storyFlags: [] }), 'invalid-flags');
  assert.equal(reason({ bosses: { biggie: {} } }), 'invalid-bosses');
  assert.equal(reason({ characterId: 'rex' }), 'invalid-character');
  assert.equal(parseSlot('{not json').reason, 'invalid-json');
  assert.equal(parseSlot('[]').reason, 'invalid-shape');
  assert.equal(parseSlot('null').reason, 'invalid-shape');
});

test('an unknown spawnId is not corruption: it falls back to the default spawn', async () => {
  const { createSlotData, parseSlot } = await freshModule();
  const data = createSlotData({ slot: 1, characterId: 'seoli', mapId: 'kitchen', spawnId: 'from:removed_portal' });
  assert.equal(parseSlot(JSON.stringify(data), 1).ok, true);
  const landing = resolveSpawn('kitchen', 'from:removed_portal');
  assert.equal(landing.id, DEFAULT_SPAWN_ID);
  assert.deepEqual([landing.x, landing.y], [MAPS_DATA.kitchen.spawnX, MAPS_DATA.kitchen.spawnY]);
  assert.equal(resolveSpawn('kitchen', undefined).id, DEFAULT_SPAWN_ID);
  assert.equal(resolveSpawn('no_such_map', 'default'), null);
  assert.equal(resolveSpawn('constructor', 'default'), null);
});

test('every portal lands on the spawn named after its source map', () => {
  for (const [source, map] of Object.entries(MAPS_DATA)) {
    assert.ok(spawnPointsFor(source).default, `${source} has a default spawn`);
    for (const portal of map.portals) {
      const landing = resolveSpawn(portal.targetMap, portalSpawnId(source));
      assert.equal(landing.id, portalSpawnId(source), `${source} -> ${portal.targetMap}`);
      assert.deepEqual([landing.x, landing.y], [portal.spawnX, portal.spawnY]);
    }
  }
});

test('with no save in any slot there is nothing to continue', async () => {
  await withStorage(fakeStorage(), (SaveManager) => {
    assert.equal(SaveManager.hasAnySave(), false);
    assert.deepEqual(SaveManager.listSlots().map((slot) => slot.status), ['empty', 'empty', 'empty']);
    assert.equal(SaveManager.continueSlot(1), null);
    assert.equal(SaveManager.isStorageAvailable(), true);
  });
});

test('new game in an empty slot does not touch other slots', async () => {
  await withStorage(fakeStorage(), (SaveManager, _module, storage) => {
    SaveManager.startNewGame(1, 'seoli');
    SaveManager.setFlag('biggieDefeated');
    const slot1 = storage.getItem(slotKey(1));
    SaveManager.startNewGame(3, 'bomi');
    assert.equal(storage.getItem(slotKey(1)), slot1, 'slot 1 byte-for-byte unchanged');
    assert.equal(storage.getItem(slotKey(2)), null, 'slot 2 still empty');
    assert.deepEqual(SaveManager.listSlots().map((slot) => slot.status), ['ok', 'empty', 'ok']);
  });
});

test('a fresh new game resets everything: flags, bosses, hp and character progress', async () => {
  await withStorage(fakeStorage(), (SaveManager) => {
    SaveManager.startNewGame(1, 'seoli');
    SaveManager.setCharacter('seoli', { level: 7, exp: 10, treats: 99, items: { cookie: 4 }, quests: { q: 'done' } });
    SaveManager.beginPlay();
    SaveManager.saveProgress({ mapId: 'attic', spawnId: 'from:playroom', hp: 33 });
    SaveManager.recordBossDefeat('hugGuardian', { hp: 33 });
    SaveManager.endPlay();
    assert.equal(SaveManager.getFlag('hugGuardianDefeated'), true);

    const fresh = SaveManager.startNewGame(1, 'seoli');
    assert.equal(SaveManager.getFlag('hugGuardianDefeated'), false, 'boss alive again');
    assert.deepEqual(fresh.bosses, {});
    assert.deepEqual(fresh.storyFlags, {});
    assert.deepEqual(fresh.characters, {});
    assert.equal(SaveManager.getCharacter('seoli'), null, 'no level/items leak into the new run');
    assert.equal(fresh.mapId, START_MAP);
    assert.equal(fresh.spawnId, DEFAULT_SPAWN_ID);
    assert.equal(fresh.hp, 100);
    assert.equal(fresh.playTimeSec, 0);
    assert.equal(SaveManager.listSlots()[0].data.hp, 100, 'the reset reached storage');
  });
});

test('continue restores map, entry spawn, hp, flags and progress after a "refresh"', async () => {
  const storage = fakeStorage();
  await withStorage(storage, (SaveManager) => {
    SaveManager.startNewGame(2, 'bomi');
    SaveManager.setFlag('tutorialCompleted');
    SaveManager.setCharacter('bomi', { level: 3, exp: 5, treats: 8, items: { milk: 1 }, quests: {} });
    SaveManager.beginPlay();
    SaveManager.saveProgress({ mapId: 'kitchen', spawnId: 'from:livingroom', hp: 77 });
  });
  // New module instance = page reload: only storage survives.
  await withStorage(storage, (SaveManager) => {
    assert.equal(SaveManager.getFlag('tutorialCompleted'), false, 'nothing active before Continue');
    const resume = SaveManager.continueSlot(2);
    assert.deepEqual(resume, { characterId: 'bomi', mapId: 'kitchen', spawnId: 'from:livingroom', hp: 77 });
    assert.equal(SaveManager.getFlag('tutorialCompleted'), true);
    assert.equal(SaveManager.getCharacter('bomi').level, 3);
    assert.equal(SaveManager.getCharacter('bomi').items.milk, 1);
    assert.equal(SaveManager.getActiveSlot(), 2);
  });
});

test('autosave never stores coordinates and ignores a dead hp', async () => {
  const storage = fakeStorage();
  await withStorage(storage, (SaveManager) => {
    SaveManager.startNewGame(1, 'seoli');
    SaveManager.saveProgress({ mapId: 'kitchen', spawnId: 'from:livingroom', hp: 64 });
    SaveManager.saveProgress({ hp: 0 });
    SaveManager.saveProgress({ mapId: 'not_a_map' });
    const stored = JSON.parse(storage.getItem(slotKey(1)));
    assert.equal(stored.hp, 64);
    assert.equal(stored.mapId, 'kitchen');
    assert.equal(stored.spawnId, 'from:livingroom');
    assert.equal(JSON.stringify(stored).includes('"x"'), false);
    for (const key of Object.keys(stored)) assert.ok(!/^(x|y|spawnX|spawnY)$/.test(key), key);
  });
});

test('play time accrues only while a gameplay scene is active and the tab is visible', async () => {
  const realNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    await withStorage(fakeStorage(), (SaveManager) => {
      SaveManager.startNewGame(1, 'seoli');
      now += 5000; // title screen time does not count
      SaveManager.beginPlay();
      now += 10_000;
      SaveManager.saveProgress({ hp: 90 }); // e.g. a map transition
      assert.equal(SaveManager.listSlots()[0].data.playTimeSec, 10);
      now += 4000;
      SaveManager.handleHidden({ hp: 80 }); // tab hidden: saves, then the clock stops
      assert.equal(SaveManager.listSlots()[0].data.playTimeSec, 14);
      assert.equal(SaveManager.listSlots()[0].data.hp, 80);
      now += 600_000; // ten minutes in another tab
      SaveManager.saveProgress(); // a save landing while hidden must not count them
      assert.equal(SaveManager.listSlots()[0].data.playTimeSec, 14);
      SaveManager.handleVisible();
      now += 6000;
      SaveManager.endPlay(); // scene shutdown
      assert.equal(SaveManager.listSlots()[0].data.playTimeSec, 20);
      now += 99_000; // idle after the scene ended
      SaveManager.saveProgress();
      assert.equal(SaveManager.listSlots()[0].data.playTimeSec, 20);
    });
  } finally {
    Date.now = realNow;
  }
});

test('boss defeat keeps the first time, updates the last, and sets the legacy flag', async () => {
  await withStorage(fakeStorage(), (SaveManager, _module, storage) => {
    SaveManager.startNewGame(1, 'seoli');
    SaveManager.recordBossDefeat('biggie', { hp: 50 });
    const first = SaveManager.listSlots()[0].data.bosses.biggie;
    assert.equal(first.firstDefeatedAt, first.lastDefeatedAt);
    assert.equal(SaveManager.getFlag('biggieDefeated'), true);

    // Pretend the first defeat happened long ago, then reload and win again.
    const stored = JSON.parse(storage.getItem(slotKey(1)));
    stored.bosses.biggie = { firstDefeatedAt: '2000-01-01T00:00:00.000Z', lastDefeatedAt: '2000-01-01T00:00:00.000Z' };
    storage.setItem(slotKey(1), JSON.stringify(stored));
    SaveManager.continueSlot(1);
    SaveManager.recordBossDefeat('biggie');
    const again = SaveManager.listSlots()[0].data.bosses.biggie;
    assert.equal(again.firstDefeatedAt, '2000-01-01T00:00:00.000Z', 'first defeat time is preserved');
    assert.ok(Date.parse(again.lastDefeatedAt) > Date.parse('2000-01-01T00:00:00.000Z'), 'last defeat time moves');
  });
});

test('corrupted slots are listed as corrupted, cannot be continued, and are never deleted', async () => {
  const garbage = '{"version":1,"slot":2,"mapId":"deleted_map"';
  const storage = fakeStorage({ [slotKey(2)]: garbage, [slotKey(3)]: JSON.stringify({ version: 9 }) });
  await withStorage(storage, (SaveManager) => {
    const statuses = SaveManager.listSlots().map((slot) => slot.status);
    assert.deepEqual(statuses, ['empty', 'corrupted', 'corrupted']);
    assert.equal(SaveManager.hasAnySave(), true, 'a corrupted slot still counts as occupied');
    assert.equal(SaveManager.continueSlot(2), null);
    assert.equal(SaveManager.continueSlot(3), null);
    assert.equal(storage.getItem(slotKey(2)), garbage, 'left exactly as found');
    assert.ok(storage.getItem(slotKey(3)));
    assert.equal(SaveManager.listSlots()[2].reason, 'unsupported-version');
  });
});

test('a map that no longer exists marks the slot corrupted', async () => {
  await withStorage(fakeStorage(), (SaveManager, module, storage) => {
    const data = module.createSlotData({ slot: 1, characterId: 'seoli', mapId: 'kitchen' });
    storage.setItem(slotKey(1), module.serializeSlot({ ...data, mapId: 'map_from_the_future' }));
    assert.equal(SaveManager.listSlots()[0].status, 'corrupted');
    assert.equal(SaveManager.listSlots()[0].reason, 'unknown-map');
  });
});

test('legacy save migrates into slot 1 with flags, cats, bosses and legacy records intact', async () => {
  const legacy = {
    version: 2,
    flags: { biggieDefeated: true, tutorialCompleted: true },
    characters: {
      boso_swift: { level: 4, exp: 12, treats: 30, items: { cookie: 3 }, quests: { old: 'done' } },
      boso_brave: { level: 5, exp: 20 },
      bomi: { level: 2, exp: 4 },
    },
  };
  const storage = fakeStorage({ boso_save_v1: JSON.stringify(legacy) });
  await withStorage(storage, (SaveManager) => {
    assert.equal(SaveManager.migrateLegacy(), 'migrated');
    assert.equal(storage.getItem('boso_save_v1'), null, 'legacy key removed');
    assert.deepEqual(SaveManager.listSlots().map((slot) => slot.status), ['ok', 'empty', 'empty']);

    const slot = SaveManager.listSlots()[0].data;
    assert.equal(slot.mapId, 'high_table', 'tutorial finished -> resume in the town');
    assert.equal(slot.spawnId, DEFAULT_SPAWN_ID);
    assert.equal(slot.characterId, 'bomi', 'the more advanced cat');
    assert.equal(slot.hp, 160 + 4 * 12, 'full health for Bomi Lv.5');
    assert.equal(slot.storyFlags.biggieDefeated, true);
    assert.ok(slot.bosses.biggie.firstDefeatedAt, 'defeated boss gets a record');
    assert.equal(slot.bosses.hugGuardian, undefined);
    assert.equal(slot.characters.seoli.items.cookie, 3);
    assert.equal(slot.characters.bomi.level, 5);
    assert.equal(slot.characters.legacy_bomi.level, 2);
    assert.deepEqual(slot.characters.seoli, slot.characters.boso_swift);

    assert.equal(SaveManager.migrateLegacy(), 'none', 'runs once');
    SaveManager.continueSlot(1);
    assert.equal(SaveManager.getFlag('biggieDefeated'), true);
    assert.equal(SaveManager.getCharacter('seoli').quests.old, 'done');
  });
});

test('a legacy save from before the tutorial ends restarts the tutorial', async () => {
  const storage = fakeStorage({ boso_save_v1: JSON.stringify({ flags: {}, characters: { boso_swift: { level: 2 } } }) });
  await withStorage(storage, (SaveManager) => {
    assert.equal(SaveManager.migrateLegacy(), 'migrated');
    const slot = SaveManager.listSlots()[0].data;
    assert.equal(slot.mapId, START_MAP);
    assert.equal(slot.characterId, 'seoli');
  });
});

test('legacy migration never overwrites a used slot and never deletes unreadable data', async () => {
  const legacy = JSON.stringify({ version: 3, flags: { biggieDefeated: true }, characters: {} });
  await withStorage(fakeStorage({ boso_save_v1: legacy }), (SaveManager, module, storage) => {
    SaveManager.startNewGame(2, 'seoli');
    assert.equal(SaveManager.migrateLegacy(), 'skipped');
    assert.equal(storage.getItem('boso_save_v1'), legacy, 'legacy key kept');
    assert.equal(storage.getItem(slotKey(1)), null);
  });
  const storage = fakeStorage({ boso_save_v1: '{broken' });
  await withStorage(storage, (SaveManager) => {
    assert.equal(SaveManager.migrateLegacy(), 'invalid');
    assert.equal(storage.getItem('boso_save_v1'), '{broken');
    assert.equal(SaveManager.hasAnySave(), false);
  });
});

test('legacy key survives when slot 1 cannot be written', async () => {
  const storage = fakeStorage({ boso_save_v1: JSON.stringify({ flags: {}, characters: {} }) });
  const realSet = storage.setItem;
  storage.setItem = (key, value) => {
    if (key === slotKey(1)) throw new Error('quota');
    return realSet(key, value);
  };
  await withStorage(storage, (SaveManager) => {
    assert.equal(SaveManager.migrateLegacy(), 'failed');
    assert.ok(storage.getItem('boso_save_v1'), 'still there to retry next boot');
  });
});

test('without usable storage the game still runs from memory and reports it', async () => {
  // No localStorage at all (Node) ...
  await withStorage(null, (SaveManager) => {
    assert.equal(SaveManager.isStorageAvailable(), false);
    SaveManager.startNewGame(1, 'seoli');
    SaveManager.setFlag('tutorialCompleted');
    SaveManager.saveProgress({ mapId: 'kitchen', hp: 40 });
    assert.equal(SaveManager.getFlag('tutorialCompleted'), true);
    assert.equal(SaveManager.listSlots()[0].data.mapId, 'kitchen', 'readable within the session');
  });
  // ... and storage that throws on every access (blocked cookies / private mode).
  const blocked = {
    getItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('denied'); },
    removeItem: () => { throw new Error('denied'); },
  };
  await withStorage(blocked, (SaveManager) => {
    assert.equal(SaveManager.isStorageAvailable(), false);
    assert.equal(SaveManager.hasAnySave(), false);
    SaveManager.startNewGame(2, 'bomi');
    SaveManager.setCharacter('bomi', { level: 2, exp: 1 });
    assert.equal(SaveManager.getCharacter('bomi').level, 2);
    assert.equal(SaveManager.migrateLegacy(), 'none');
  });
});

test('flags and progress work (unsaved) even if gameplay starts with no slot', async () => {
  await withStorage(fakeStorage(), (SaveManager, _module, storage) => {
    assert.equal(SaveManager.getFlag('anything'), false);
    SaveManager.setFlag('anything');
    assert.equal(SaveManager.getFlag('anything'), true);
    assert.equal(storage.map.size, 0, 'a scratch session never reaches storage');
  });
});

test('global settings live under boso.settings, outside every slot', async () => {
  await withStorage(fakeStorage(), (SaveManager, _module, storage) => {
    assert.deepEqual(SaveManager.getSettings(), {});
    SaveManager.updateSettings({ lang: 'ko' });
    SaveManager.updateSettings({ volume: 0.5 });
    assert.deepEqual(JSON.parse(storage.getItem('boso.settings')), { lang: 'ko', volume: 0.5 });
    SaveManager.startNewGame(1, 'seoli');
    assert.deepEqual(SaveManager.getSettings(), { lang: 'ko', volume: 0.5 }, 'new games keep settings');
    storage.setItem('boso.settings', '{oops');
    assert.deepEqual(SaveManager.getSettings(), {}, 'bad settings fall back to defaults');
  });
});

test('slot list formatting', () => {
  assert.equal(formatPlayTime(0), '0m');
  assert.equal(formatPlayTime(59), '0m');
  assert.equal(formatPlayTime(754), '12m');
  assert.equal(formatPlayTime(3600), '1h 00m');
  assert.equal(formatPlayTime(3600 * 12 + 65 * 60), '13h 05m');
  assert.equal(formatPlayTime(NaN), '0m');
  assert.equal(formatSavedAt('garbage'), '-');
  assert.notEqual(formatSavedAt('2026-10-20T14:05:00.000Z'), '-');
});
