#!/usr/bin/env node
// scripts/validate.mjs
// Node ESM data validator for the Boso world data. Pure Node — no Phaser.
// Run with: node scripts/validate.mjs (or npm run validate)
//
// Collects ALL failures, prints one '[FAIL] <map>: <detail>' line each,
// and exits 1 if any check failed; otherwise prints a PASS summary.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MAPS_DATA, START_MAP, REGION_HOME } from '../src/data/maps.js';
import { MONSTER_TYPES, BOSS_TYPES } from '../src/data/monsters.js';
import { BGM_KEYS } from '../src/data/audio.js';
import { QUESTS } from '../src/data/quests.js';
import { ITEMS } from '../src/data/items.js';
import { TRAVEL_ROUTES, AMBUSH_TYPES } from '../src/data/travel.js';
import { WORLD_MAP_LAYOUT, REGION_TITLE_KEYS } from '../src/data/worldmap.js';
import { OPTIONAL_TEXTURES } from '../src/data/assets.js';
import { STORY } from '../src/data/story.js';
import { CHARACTERS } from '../src/data/characters.js';
import en from '../src/i18n/en.js';
import ko from '../src/i18n/ko.js';
import { FONT_FACES } from '../src/i18n/fonts.js';
import { readWoff2CodePoints } from './fontCoverage.mjs';
import { BOSS_RESPAWN, isBossAlive } from '../src/data/bossRespawn.js';
import { PATTERN_TYPES, NON_DAMAGING_TYPES, FAIRNESS, STATUS_RULES } from '../src/data/bossPatterns.js';
import { pickPattern, readyAtFor, cooldownMultFor } from '../src/systems/BossBrain.js';
import { DEFAULT_SPAWN_ID, portalSpawnId, resolveSpawn } from '../src/data/spawns.js';
import { createSlotData, serializeSlot, parseSlot, SLOT_SCHEMA_VERSION } from '../src/systems/SaveManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');

// Max vertical distance below an entity at which a platform still counts
// as its supporting surface.
const SUPPORT_RANGE = 220;

// Monster movement styles that walk on the ground (need platform support).
const GROUND_MOVEMENTS = new Set([
  'snail', 'bouncer', 'charger',
  'pouncer', 'inchworm', 'roller', 'multiHop', 'racer',
]);

const failures = [];
let checkCount = 0;

function check(condition, scope, detail) {
  checkCount += 1;
  if (!condition) failures.push(`[FAIL] ${scope}: ${detail}`);
}

// True if the map has a platform surface within [y, y+SUPPORT_RANGE]
// whose horizontal range covers x.
function hasSupport(map, x, y) {
  return (map.platforms || []).some(
    (p) => p.y >= y && p.y <= y + SUPPORT_RANGE && x >= p.x && x <= p.x + p.w
  );
}

function inBounds(map, x, y) {
  return x >= 0 && x <= map.width && y >= 0 && y <= map.height;
}

// ===== Check 1: required fields + exactly one full-width ground platform =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  for (const field of ['nameKey', 'width', 'height', 'spawnX', 'spawnY']) {
    check(
      map[field] !== undefined && map[field] !== null,
      key,
      `missing required field '${field}'`
    );
  }
  const grounds = (map.platforms || []).filter((p) => p.isGround);
  check(
    grounds.length === 1,
    key,
    `expected exactly 1 isGround platform, found ${grounds.length}`
  );
  if (grounds.length === 1) {
    const g = grounds[0];
    check(
      g.x <= 0 && g.x + g.w >= map.width,
      key,
      `ground platform (x=${g.x}, w=${g.w}) does not cover full width ${map.width}`
    );
  }
}

// ===== Check 2: support rule for spawn, portals (+ targets), NPCs, ground monsters =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  check(
    hasSupport(map, map.spawnX, map.spawnY),
    key,
    `spawn point (${map.spawnX},${map.spawnY}) has no supporting platform within ${SUPPORT_RANGE}px`
  );
  (map.portals || []).forEach((portal, i) => {
    check(
      hasSupport(map, portal.x, portal.y),
      key,
      `portal[${i}] '${portal.labelKey}' at (${portal.x},${portal.y}) has no supporting platform`
    );
    const target = MAPS_DATA[portal.targetMap];
    if (target) {
      check(
        hasSupport(target, portal.spawnX, portal.spawnY),
        key,
        `portal[${i}] target spawn (${portal.spawnX},${portal.spawnY}) in '${portal.targetMap}' has no supporting platform`
      );
    }
  });
  (map.npcs || []).forEach((npc, i) => {
    check(
      hasSupport(map, npc.x, npc.y),
      key,
      `npc[${i}] '${npc.id}' at (${npc.x},${npc.y}) has no supporting platform`
    );
  });
  (map.monsters || []).forEach((m, i) => {
    const type = MONSTER_TYPES[m.type];
    if (type && GROUND_MOVEMENTS.has(type.movement)) {
      check(
        hasSupport(map, m.x, m.y),
        key,
        `ground monster[${i}] '${m.type}' at (${m.x},${m.y}) has no supporting platform`
      );
    }
  });
}

// ===== Check 3: portal targets exist, target spawns in bounds, hidden portals flagged =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  (map.portals || []).forEach((portal, i) => {
    const target = MAPS_DATA[portal.targetMap];
    check(
      !!target,
      key,
      `portal[${i}] '${portal.labelKey}' targets unknown map '${portal.targetMap}'`
    );
    if (target) {
      check(
        inBounds(target, portal.spawnX, portal.spawnY),
        key,
        `portal[${i}] target spawn (${portal.spawnX},${portal.spawnY}) outside bounds of '${portal.targetMap}' (${target.width}x${target.height})`
      );
    }
    if (portal.hidden) {
      check(
        typeof portal.requiresFlag === 'string' && portal.requiresFlag.length > 0,
        key,
        `hidden portal[${i}] '${portal.labelKey}' must have a requiresFlag string`
      );
    }
  });
}

// ===== Check 4: reachability BFS over portals + travel routes =====
check(
  !!MAPS_DATA[START_MAP],
  'world',
  `START_MAP '${START_MAP}' is not in MAPS_DATA`
);

// Travel routes are one-way graph edges (from -> to), like portals.
function reachableFrom(startKey) {
  const visited = new Set();
  const queue = [startKey];
  while (queue.length > 0) {
    const k = queue.shift();
    if (visited.has(k) || !MAPS_DATA[k]) continue;
    visited.add(k);
    for (const portal of MAPS_DATA[k].portals || []) {
      queue.push(portal.targetMap); // hidden edges included
    }
    for (const route of Object.values(TRAVEL_ROUTES)) {
      if (route.from === k) queue.push(route.to);
    }
  }
  return visited;
}

{
  const visited = reachableFrom(START_MAP);
  for (const key of Object.keys(MAPS_DATA)) {
    check(
      visited.has(key),
      key,
      `not reachable from START_MAP '${START_MAP}' via portals/travel routes`
    );
  }
}

// Town reachability: every Buddy House map must be reachable from the
// town (high_table), with cage routes counted as edges.
{
  const fromTown = reachableFrom('high_table');
  for (const [key, map] of Object.entries(MAPS_DATA)) {
    if (map.region !== 'buddy') continue;
    check(
      fromTown.has(key),
      key,
      `buddy-region map not reachable from town 'high_table'`
    );
  }
}

// ===== Check 5: monster types valid, in bounds, flying monsters not too high =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  (map.monsters || []).forEach((m, i) => {
    const type = MONSTER_TYPES[m.type];
    check(!!type, key, `monster[${i}] has unknown type '${m.type}'`);
    check(
      inBounds(map, m.x, m.y),
      key,
      `monster[${i}] '${m.type}' at (${m.x},${m.y}) is outside map bounds`
    );
    if (type && !GROUND_MOVEMENTS.has(type.movement)) {
      check(
        m.y >= 100,
        key,
        `flying monster[${i}] '${m.type}' y=${m.y} must be >= 100`
      );
    }
  });
}

// ===== Check 6: boss ids valid + required boss placements =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  if (map.boss) {
    check(
      !!BOSS_TYPES[map.boss.id],
      key,
      `boss id '${map.boss.id}' is not in BOSS_TYPES`
    );
    check(
      inBounds(map, map.boss.x, map.boss.y),
      key,
      `boss '${map.boss.id}' at (${map.boss.x},${map.boss.y}) is outside map bounds`
    );
  }
}
check(
  !!(MAPS_DATA.attic && MAPS_DATA.attic.boss && MAPS_DATA.attic.boss.id === 'hugGuardian'),
  'attic',
  `must have boss 'hugGuardian'`
);
check(
  !!(MAPS_DATA.closet && MAPS_DATA.closet.boss && MAPS_DATA.closet.boss.id === 'vacuumKing'),
  'closet',
  `must have boss 'vacuumKing'`
);
check(
  !!(MAPS_DATA.shelter_yard && MAPS_DATA.shelter_yard.boss && MAPS_DATA.shelter_yard.boss.id === 'drEmbrace'),
  'shelter_yard',
  `must have boss 'drEmbrace'`
);
check(
  !!(MAPS_DATA.backyard_gate && MAPS_DATA.backyard_gate.boss && MAPS_DATA.backyard_gate.boss.id === 'biggie'),
  'backyard_gate',
  `must have boss 'biggie'`
);

// ===== Check 7: ropes well-formed and anchored to platform surfaces =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  (map.ropes || []).forEach((rope, i) => {
    check(
      rope.topY < rope.bottomY,
      key,
      `rope[${i}] topY=${rope.topY} must be < bottomY=${rope.bottomY}`
    );
    check(
      inBounds(map, rope.x, rope.topY) && inBounds(map, rope.x, rope.bottomY),
      key,
      `rope[${i}] at x=${rope.x} (${rope.topY}..${rope.bottomY}) is outside map bounds`
    );
    const anchored = (map.platforms || []).some(
      (p) => Math.abs(p.y - rope.topY) <= 2 && rope.x >= p.x && rope.x <= p.x + p.w
    );
    check(
      anchored,
      key,
      `rope[${i}] topY=${rope.topY} does not anchor to any platform surface at x=${rope.x}`
    );
  });
}

// ===== Check 8: every map bgm is a known BGM key =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  check(
    BGM_KEYS.includes(map.bgm),
    key,
    `bgm '${map.bgm}' is not in BGM_KEYS [${BGM_KEYS.join(', ')}]`
  );
}

// ===== Check 10: quests — unique ids, real givers, valid targets & rewards =====
{
  const questIds = new Set();
  const allNpcNames = new Set();
  for (const map of Object.values(MAPS_DATA)) {
    (map.npcs || []).forEach((npc) => allNpcNames.add(npc.id));
  }
  for (const quest of QUESTS) {
    check(!questIds.has(quest.id), `quest:${quest.id}`, 'duplicate quest id');
    questIds.add(quest.id);
    check(
      allNpcNames.has(quest.giver),
      `quest:${quest.id}`,
      `giver '${quest.giver}' is not an NPC in any map`
    );
    const target = quest.objective && quest.objective.target;
    check(
      !!(MONSTER_TYPES[target] || BOSS_TYPES[target]),
      `quest:${quest.id}`,
      `objective target '${target}' is not a monster or boss type`
    );
    check(
      quest.objective && quest.objective.count >= 1,
      `quest:${quest.id}`,
      'objective count must be >= 1'
    );
    for (const arr of ['offerKeys', 'completeKeys']) {
      check(
        Array.isArray(quest[arr]) && quest[arr].length > 0,
        `quest:${quest.id}`,
        `missing '${arr}' lines`
      );
    }
    const reward = quest.reward || {};
    for (const key of Object.keys(reward.items || {})) {
      check(!!ITEMS[key], `quest:${quest.id}`, `reward item '${key}' is not in ITEMS`);
    }
  }
}

// ===== Check 11: drop tables — sane ranges and valid item keys =====
for (const [key, type] of Object.entries(MONSTER_TYPES)) {
  const drops = type.drops;
  check(!!drops, `monster:${key}`, 'missing drops table');
  if (drops) {
    check(
      drops.treatsMin >= 0 && drops.treatsMin <= drops.treatsMax,
      `monster:${key}`,
      `bad treats range ${drops.treatsMin}..${drops.treatsMax}`
    );
    (drops.items || []).forEach((entry) => {
      check(!!ITEMS[entry.key], `monster:${key}`, `drop item '${entry.key}' is not in ITEMS`);
      check(
        entry.chance > 0 && entry.chance <= 1,
        `monster:${key}`,
        `drop chance ${entry.chance} out of (0,1]`
      );
    });
  }
}
for (const [key, boss] of Object.entries(BOSS_TYPES)) {
  const drops = boss.drops;
  check(!!drops, `boss:${key}`, 'missing drops table');
  if (drops) {
    for (const itemKey of Object.keys(drops.items || {})) {
      check(!!ITEMS[itemKey], `boss:${key}`, `drop item '${itemKey}' is not in ITEMS`);
    }
  }
}

// ===== Check 11b: boss respawn — timers, warning text, isBossAlive cases =====
for (const [key, boss] of Object.entries(BOSS_TYPES)) {
  check(
    typeof boss.respawnSec === 'number' && Number.isFinite(boss.respawnSec) && boss.respawnSec > 0,
    `boss:${key}`,
    `respawnSec must be a number > 0 (got ${boss.respawnSec})`
  );
  check(
    typeof STORY.bossRespawn[key] === 'string' && STORY.bossRespawn[key].length > 0,
    `boss:${key}`,
    'missing STORY.bossRespawn warning text'
  );
}
for (const [name, value] of Object.entries(BOSS_RESPAWN)) {
  check(Number.isFinite(value) && value > 0, 'BOSS_RESPAWN', `${name} must be a number > 0 (got ${value})`);
}
{
  const def = { respawnSec: 300 };
  const T0 = Date.parse('2026-01-01T00:00:00.000Z');
  const defeatedAt = { firstDefeatedAt: new Date(T0).toISOString(), lastDefeatedAt: new Date(T0).toISOString() };
  const alive = (save, now) => isBossAlive(def, save, now);
  check(alive(undefined, T0) === true, 'isBossAlive', 'a never-defeated boss must be alive');
  check(alive(defeatedAt, T0) === false, 'isBossAlive', 'a just-defeated boss must be away');
  check(alive(defeatedAt, T0 + 299999) === false, 'isBossAlive', 'a boss 1ms before its timer must be away');
  check(alive(defeatedAt, T0 + 300000) === true, 'isBossAlive', 'a boss exactly at its timer must be alive');
  check(alive(defeatedAt, T0 + 300001) === true, 'isBossAlive', 'a boss after its timer must be alive');
  check(alive(defeatedAt, T0 - 60000) === true, 'isBossAlive', 'a defeat stamped in the future (clock set back) must not lock the boss out');
}

// ===== Check 12: regions — every map tagged, region homes exist =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  check(
    typeof map.region === 'string' && !!REGION_HOME[map.region],
    key,
    `region '${map.region}' is not a known region (${Object.keys(REGION_HOME).join(', ')})`
  );
  check(
    !!WORLD_MAP_LAYOUT[key],
    key,
    'missing WORLD_MAP_LAYOUT entry (world map overlay node)'
  );
}
for (const [region, home] of Object.entries(REGION_HOME)) {
  check(
    !!MAPS_DATA[home],
    `region:${region}`,
    `REGION_HOME target '${home}' is not in MAPS_DATA`
  );
  check(
    !!REGION_TITLE_KEYS[region],
    `region:${region}`,
    'missing REGION_TITLE_KEYS entry (world map panel title)'
  );
}

// ===== Check 13: travel routes — endpoints, duration, bgm, ambush table =====
for (const [key, route] of Object.entries(TRAVEL_ROUTES)) {
  check(!!MAPS_DATA[route.from], `route:${key}`, `from '${route.from}' is not in MAPS_DATA`);
  check(!!MAPS_DATA[route.to], `route:${key}`, `to '${route.to}' is not in MAPS_DATA`);
  check(
    typeof route.durationSec === 'number' && route.durationSec > 0,
    `route:${key}`,
    `durationSec must be > 0 (got ${route.durationSec})`
  );
  check(
    BGM_KEYS.includes(route.bgm),
    `route:${key}`,
    `bgm '${route.bgm}' is not in BGM_KEYS`
  );
  if (route.ambush) {
    const spawns = route.ambush.spawns;
    check(
      Array.isArray(spawns) && spawns.length > 0,
      `route:${key}`,
      'ambush must carry a non-empty spawns array'
    );
    (spawns || []).forEach((spawn, i) => {
      check(
        !!AMBUSH_TYPES[spawn.type],
        `route:${key}`,
        `ambush spawn[${i}] type '${spawn.type}' is not in AMBUSH_TYPES`
      );
      const win = spawn.atSec;
      const windowOk =
        Array.isArray(win) && win.length === 2 &&
        win[0] > 0 && win[0] <= win[1] && win[1] < route.durationSec;
      check(
        windowOk,
        `route:${key}`,
        `ambush spawn[${i}] atSec [${win}] must satisfy 0 < min <= max < durationSec`
      );
    });
  }
}
for (const [key, type] of Object.entries(AMBUSH_TYPES)) {
  check(
    type.kind === 'dasher' || type.kind === 'tanker',
    `ambush:${key}`,
    `unknown kind '${type.kind}'`
  );
  check(
    OPTIONAL_TEXTURES.includes(`ambush_${key}`),
    `ambush:${key}`,
    `texture key 'ambush_${key}' missing from OPTIONAL_TEXTURES`
  );
}

// ===== Check 14: NPC travel references + guides/cage placement =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  (map.npcs || []).forEach((npc, i) => {
    if (npc.travelRoute !== undefined) {
      const route = TRAVEL_ROUTES[npc.travelRoute];
      check(
        !!route,
        key,
        `npc[${i}] '${npc.id}' travelRoute '${npc.travelRoute}' is not in TRAVEL_ROUTES`
      );
      if (route) {
        check(
          route.from === key,
          key,
          `npc[${i}] '${npc.id}' travelRoute '${npc.travelRoute}' departs from '${route.from}', not this map`
        );
      }
      check(
        !!map.cage,
        key,
        `npc[${i}] '${npc.id}' offers travel but the map has no cage prop`
      );
    }
    if (npc.travelRequiresFlag !== undefined) {
      check(
        typeof npc.travelRequiresFlag === 'string' && npc.travelRequiresFlag.length > 0,
        key,
        `npc[${i}] '${npc.id}' travelRequiresFlag must be a non-empty string`
      );
      check(
        Array.isArray(npc.travelLockedKeys) && npc.travelLockedKeys.length > 0,
        key,
        `npc[${i}] '${npc.id}' gated travel needs travelLockedKeys`
      );
    }
  });
  (map.npcs || []).forEach((npc, i) => {
    check(typeof npc.id === 'string' && npc.id.length > 0, key, `npc[${i}] needs a string id`);
    check(
      npc.nameKey === `npc.${npc.id}.name`,
      key,
      `npc[${i}] nameKey must be 'npc.${npc.id}.name' (got '${npc.nameKey}')`
    );
    check(
      Array.isArray(npc.dialogueKeys) && npc.dialogueKeys.length > 0,
      key,
      `npc[${i}] '${npc.id}' needs dialogueKeys`
    );
  });
  (map.guides || []).forEach((guide, i) => {
    check(
      inBounds(map, guide.x, guide.y),
      key,
      `guide[${i}] at (${guide.x},${guide.y}) is outside map bounds`
    );
    check(
      typeof guide.textKey === 'string' && guide.textKey.length > 0,
      key,
      `guide[${i}] has no textKey`
    );
  });
  if (map.cage) {
    check(
      inBounds(map, map.cage.x, map.cage.y),
      key,
      `cage at (${map.cage.x},${map.cage.y}) is outside map bounds`
    );
    check(
      hasSupport(map, map.cage.x, map.cage.y - 1),
      key,
      `cage at (${map.cage.x},${map.cage.y}) has no supporting platform`
    );
  }
}

// ===== Check 15: texture key registry — monsters & bosses covered =====
for (const key of Object.keys(MONSTER_TYPES)) {
  check(
    OPTIONAL_TEXTURES.includes(`monster_${key}`),
    `monster:${key}`,
    `texture key 'monster_${key}' missing from OPTIONAL_TEXTURES`
  );
}
for (const bossTexture of [
  'boss_hug_guardian', 'boss_vacuum_king', 'boss_dr_embrace', 'boss_biggie',
]) {
  check(
    OPTIONAL_TEXTURES.includes(bossTexture),
    'bosses',
    `texture key '${bossTexture}' missing from OPTIONAL_TEXTURES`
  );
}

// ===== Check 16: save slots — default spawns, spawn ids, slot schema round-trip =====
for (const [key, map] of Object.entries(MAPS_DATA)) {
  // Every map defines a default spawn that resolves to its own spawnX/spawnY.
  const spawn = resolveSpawn(key, DEFAULT_SPAWN_ID);
  check(
    spawn !== null && spawn.id === DEFAULT_SPAWN_ID && spawn.x === map.spawnX && spawn.y === map.spawnY,
    key,
    'default spawn does not resolve to the map spawnX/spawnY'
  );
  check(
    Number.isFinite(map.spawnX) && Number.isFinite(map.spawnY) && inBounds(map, map.spawnX, map.spawnY),
    key,
    `default spawn (${map.spawnX}, ${map.spawnY}) is not inside the map`
  );
}

// A saved spawnId must land exactly where the portal that produced it does.
for (const [key, map] of Object.entries(MAPS_DATA)) {
  for (const portal of map.portals || []) {
    const landing = resolveSpawn(portal.targetMap, portalSpawnId(key));
    check(
      landing !== null && landing.id === portalSpawnId(key) && landing.x === portal.spawnX && landing.y === portal.spawnY,
      key,
      `portal to '${portal.targetMap}' does not resolve to spawn '${portalSpawnId(key)}'`
    );
  }
}
check(
  resolveSpawn('kitchen', 'from:no_such_portal').id === DEFAULT_SPAWN_ID,
  'save slots',
  'an unknown spawnId must fall back to the default spawn'
);

// Slot schema: create -> serialize -> parse -> deep equal (no Phaser involved).
{
  const sample = createSlotData({
    slot: 2,
    characterId: 'bomi',
    mapId: START_MAP,
    storyFlags: { tutorialCompleted: true },
    bosses: { drEmbrace: { firstDefeatedAt: '2026-01-01T00:00:00.000Z', lastDefeatedAt: '2026-01-02T00:00:00.000Z' } },
    characters: { bomi: { level: 2, exp: 3, treats: 4, items: { cookie: 1 }, quests: {} } },
  });
  const parsed = parseSlot(serializeSlot(sample), 2);
  let equal = parsed.ok;
  if (equal) {
    try {
      assert.deepStrictEqual(parsed.data, sample);
    } catch (e) {
      equal = false;
    }
  }
  check(equal, 'save slots', 'slot data does not survive create -> serialize -> parse');
  check(sample.version === SLOT_SCHEMA_VERSION && SLOT_SCHEMA_VERSION === 1, 'save slots', 'slot schema version must be 1');

  const rejected = (patch) => parseSlot(JSON.stringify({ ...sample, ...patch }), 2);
  check(rejected({ version: SLOT_SCHEMA_VERSION + 1 }).ok === false, 'save slots', 'loader accepted a wrong version');
  check(rejected({ version: undefined }).ok === false, 'save slots', 'loader accepted a missing version');
  check(rejected({ mapId: 'no_such_map' }).ok === false, 'save slots', 'loader accepted an unknown mapId');
  check(rejected({ mapId: 'constructor' }).ok === false, 'save slots', 'loader accepted an inherited key as mapId');
  check(parseSlot('{not json', 2).ok === false, 'save slots', 'loader accepted invalid JSON');
}

// ===== Check 17: i18n — locale parity, referenced keys, no tofu =====
// Display text lives only in src/i18n/{en,ko}.js. Data stores keys.
const localeKeys = (locale) => new Set(Object.keys(locale));
const enKeys = localeKeys(en);
const koKeys = localeKeys(ko);

for (const key of enKeys) check(koKeys.has(key), 'i18n', `ko is missing key '${key}'`);
for (const key of koKeys) check(enKeys.has(key), 'i18n', `ko has key '${key}' that en does not`);

const placeholders = (text) => (String(text).match(/\{\w+\}/g) || []).sort().join(',');
for (const key of enKeys) {
  check(typeof en[key] === 'string' && en[key].trim().length > 0, 'i18n', `en '${key}' must be a non-empty string`);
  if (!koKeys.has(key)) continue;
  check(typeof ko[key] === 'string' && ko[key].trim().length > 0, 'i18n', `ko '${key}' must be a non-empty string`);
  check(
    placeholders(en[key]) === placeholders(ko[key]),
    'i18n',
    `'${key}' placeholders differ between en (${placeholders(en[key])}) and ko (${placeholders(ko[key])})`
  );
}

// Every *Key / *Keys field in the data layer must name an English key.
function collectKeyRefs(value, where, out) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectKeyRefs(item, `${where}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [name, child] of Object.entries(value)) {
      const here = `${where}.${name}`;
      if (/Key$/.test(name) && typeof child === 'string') out.push([here, child]);
      else if (/Keys$/.test(name) && Array.isArray(child)) child.forEach((k, i) => out.push([`${here}[${i}]`, k]));
      else collectKeyRefs(child, here, out);
    }
  }
}
{
  const refs = [];
  collectKeyRefs(MAPS_DATA, 'MAPS_DATA', refs);
  collectKeyRefs(MONSTER_TYPES, 'MONSTER_TYPES', refs);
  collectKeyRefs(BOSS_TYPES, 'BOSS_TYPES', refs);
  collectKeyRefs(QUESTS, 'QUESTS', refs);
  collectKeyRefs(ITEMS, 'ITEMS', refs);
  collectKeyRefs(TRAVEL_ROUTES, 'TRAVEL_ROUTES', refs);
  collectKeyRefs(AMBUSH_TYPES, 'AMBUSH_TYPES', refs);
  collectKeyRefs(CHARACTERS, 'CHARACTERS', refs);
  Object.values(REGION_TITLE_KEYS).forEach((k, i) => refs.push([`REGION_TITLE_KEYS[${i}]`, k]));
  // STORY holds nothing but keys (strings, arrays of strings, nested objects)
  (function walkStory(value, where) {
    if (typeof value === 'string') refs.push([where, value]);
    else if (Array.isArray(value)) value.forEach((v, i) => walkStory(v, `${where}[${i}]`));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => walkStory(v, `${where}.${k}`));
  }(STORY, 'STORY'));
  // Keys derived from ids at runtime
  for (const quest of QUESTS) refs.push([`QUESTS.${quest.id} giver name`, `npc.${quest.giver}.name`]);
  for (const key of Object.keys(BOSS_TYPES)) {
    refs.push([`BOSS_TYPES.${key} respawn warning`, `story.bossRespawn.${key}`]);
  }
  for (const [where, key] of refs) {
    check(enKeys.has(key), where, `locale key '${key}' is not defined in src/i18n/en.js`);
  }
}

// Every static t('key') / addLocalizedText(..., 'key') / translate(lang, 'key')
// in source must resolve too.
const KEY_CALLS = [
  /\bt\(\s*'([\w.]+)'/g,
  /\bt\(\s*"([\w.]+)"/g,
  /\btranslate\([^,()]+,\s*'([\w.]+)'/g,
  /addLocalizedText\([^,]+,[^,]+,[^,]+,\s*'([\w.]+)'/g,
];

// Data fields that held display text before the i18n change; code reading
// them would silently get `undefined`.
const LEGACY_FIELDS = [
  /\.data\.dialogue\b/, /\btravelLockedLines\b/, /\bwarnText\b/, /\bREGION_TITLES\b/,
  /\b(?:portal|portalData)\.label\b/, /\.cfg\.name\b/, /\bnpc(?:Data|Obj\.data)?\.name\b/,
];

// No tofu: every character of every string must exist in each pixel font.
for (const face of FONT_FACES) {
  const file = path.join(REPO_ROOT, 'public', 'assets', 'fonts', face.file);
  let covered;
  try {
    covered = readWoff2CodePoints(file);
  } catch (e) {
    check(false, `font:${face.family}`, `cannot read ${path.relative(REPO_ROOT, file)}: ${e.message}`);
    continue;
  }
  for (const [lang, locale] of [['en', en], ['ko', ko]]) {
    const missing = new Set();
    for (const text of Object.values(locale)) {
      for (const ch of String(text)) {
        if (ch !== '\n' && !covered.has(ch.codePointAt(0))) missing.add(ch);
      }
    }
    check(missing.size === 0, `font:${face.family}`, `${lang} uses glyphs the font lacks: ${[...missing].join(' ')}`);
  }
}
check(
  fs.existsSync(path.join(REPO_ROOT, 'public', 'assets', 'fonts', 'Galmuri-OFL.txt')),
  'fonts',
  'the font license (public/assets/fonts/Galmuri-OFL.txt) must ship with the font files'
);

// ===== Check 18: boss patterns — types, numbers, fairness rules =====
// Boss attacks are data (BOSS_TYPES[id].phases). Numbers are tuning knobs, but
// these rules keep every fight fair and the brain from stalling.
{
  const positive = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
  const nonNegative = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

  // Small seeded rng so the simulation below is reproducible
  const seeded = (seed) => () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const checkOnHit = (scope, onHit) => {
    if (!onHit) return;
    check(!!STATUS_RULES[onHit.status], scope, `onHit.status '${onHit.status}' is not a known status`);
    if (STATUS_RULES[onHit.status]) {
      check(
        positive(onHit.ms) && onHit.ms <= STATUS_RULES[onHit.status].maxMs,
        scope,
        `onHit.ms must be 1..${STATUS_RULES[onHit.status].maxMs} for ${onHit.status} (got ${onHit.ms})`
      );
    }
  };

  const PARAM_RULES = {
    meleeSwipe: (p, c) => { c(positive(p.range) && positive(p.height) && positive(p.damage), 'needs range, height, damage > 0'); },
    areaSlam: (p, c) => {
      c(positive(p.width) && positive(p.hitHeight) && positive(p.damage), 'needs width, hitHeight, damage > 0');
      c(p.count === undefined || (Number.isInteger(p.count) && p.count >= 1 && p.count <= 6), 'count must be an integer 1..6');
      c(p.target === 'player' || p.target === 'random', "target must be 'player' or 'random'");
    },
    projectile: (p, c) => {
      c(positive(p.speed) && positive(p.damage), 'needs speed and damage > 0');
      c(typeof p.texture === 'string' && p.texture.length > 0, 'needs a texture key');
      c(p.origin === undefined || p.origin === 'boss' || p.origin === 'edge', "origin must be 'boss' or 'edge'");
      c(p.count === undefined || (Number.isInteger(p.count) && p.count >= 1 && p.count <= 9), 'count must be an integer 1..9');
    },
    dashSweep: (p, c) => {
      c(positive(p.speed) && positive(p.damage), 'needs speed and damage > 0');
      c(p.lowProfile === undefined || (p.lowProfile > 0 && p.lowProfile <= 1), 'lowProfile must be in (0, 1]');
    },
    fieldWide: (p, c) => {
      c(positive(p.damage), 'needs damage > 0');
      c(p.airborne === true || positive(p.safeRadius), 'must be dodgeable: airborne: true and/or a safeRadius');
    },
    pull: (p, c) => {
      c(positive(p.durationMs) && positive(p.pull), 'needs durationMs and pull > 0');
      // "Walk against it": the pull must never outrun the slowest cat
      c(p.pull < Math.min(...CHARACTERS.map((ch) => ch.stats.spd)), `pull must stay below every cat's move speed (${Math.min(...CHARACTERS.map((ch) => ch.stats.spd))})`);
      c(p.touchDamage === undefined || nonNegative(p.touchDamage), 'touchDamage must be >= 0');
    },
    summon: (p, c) => {
      c(!!MONSTER_TYPES[p.monster], `summons unknown monster '${p.monster}'`);
      c(Number.isInteger(p.count) && p.count >= 1 && p.count <= FAIRNESS.maxMinionsPerBoss, `count must be 1..${FAIRNESS.maxMinionsPerBoss}`);
      c(p.max === undefined || (Number.isInteger(p.max) && p.max >= p.count && p.max <= FAIRNESS.maxMinionsPerBoss), `max must be count..${FAIRNESS.maxMinionsPerBoss}`);
    },
    guard: (p, c) => { c(positive(p.durationMs), 'needs durationMs > 0'); },
  };
  check(
    PATTERN_TYPES.every((type) => typeof PARAM_RULES[type] === 'function'),
    'boss patterns',
    'every pattern type needs a parameter rule in the validator'
  );

  for (const [bossId, boss] of Object.entries(BOSS_TYPES)) {
    if (boss.phases === undefined) continue; // Biggie still runs his own pattern code
    const where = `boss:${bossId}`;
    const phases = boss.phases;
    check(Array.isArray(phases) && phases.length >= 1, where, 'phases must be a non-empty array');
    if (!Array.isArray(phases) || phases.length === 0) continue;

    check(phases[0].hpBelow === 1.0, where, `the first phase must start at hpBelow 1.0 (got ${phases[0].hpBelow})`);
    phases.forEach((phase, i) => {
      const at = `${where} phase ${i + 1}`;
      if (i > 0) {
        check(phase.hpBelow > 0 && phase.hpBelow < phases[i - 1].hpBelow, at, `phases must be sorted by hpBelow descending (got ${phase.hpBelow} after ${phases[i - 1].hpBelow})`);
        check(typeof phase.roarKey === 'string' && phase.roarKey.length > 0, at, 'every phase after the first needs a roarKey (the phase-change callout)');
      }
      check(positive(phase.gapMs), at, `gapMs must be > 0 (got ${phase.gapMs})`);
      if (phase.enrage) {
        check(phase.enrage.cooldownMult > 0 && phase.enrage.cooldownMult <= 1, at, 'enrage.cooldownMult must be in (0, 1]');
        check(phase.enrage.speedMult >= 1, at, 'enrage.speedMult must be >= 1');
      }
      check(Array.isArray(phase.patterns) && phase.patterns.length > 0, at, 'a phase needs at least one pattern');
      if (!Array.isArray(phase.patterns)) return;

      const ids = new Set();
      phase.patterns.forEach((pattern) => {
        const pat = `${at} pattern ${pattern.id}`;
        check(typeof pattern.id === 'string' && pattern.id.length > 0 && !ids.has(pattern.id), pat, 'pattern ids must be unique within a phase');
        ids.add(pattern.id);
        check(PATTERN_TYPES.includes(pattern.type), pat, `unknown type '${pattern.type}'`);
        check(typeof pattern.nameKey === 'string' && pattern.nameKey.length > 0, pat, 'missing nameKey');
        check(positive(pattern.weight), pat, `weight must be > 0 (got ${pattern.weight})`);
        check(nonNegative(pattern.cooldownMs), pat, `cooldownMs must be >= 0 (got ${pattern.cooldownMs})`);
        check(nonNegative(pattern.telegraphMs), pat, `telegraphMs must be >= 0 (got ${pattern.telegraphMs})`);
        if (!NON_DAMAGING_TYPES.includes(pattern.type)) {
          check(pattern.telegraphMs >= FAIRNESS.minTelegraphMs, pat, `damaging attacks need telegraphMs >= ${FAIRNESS.minTelegraphMs} (got ${pattern.telegraphMs})`);
        }
        if (pattern.type === 'fieldWide') {
          check(pattern.telegraphMs >= FAIRNESS.minFieldWideTelegraphMs, pat, `fieldWide needs telegraphMs >= ${FAIRNESS.minFieldWideTelegraphMs} (got ${pattern.telegraphMs})`);
        }
        const params = pattern.params || {};
        if (PARAM_RULES[pattern.type]) PARAM_RULES[pattern.type](params, (ok, msg) => check(ok, pat, msg));
        checkOnHit(pat, params.onHit);
      });

      // A boss must never be locked out: some pattern that is neither a
      // fieldWide nor a capped summon is ready again by the next pick
      // (cooldowns start when a pattern starts; the next pick comes at the
      // earliest telegraph + gap later).
      const filler = phase.patterns.filter((p) => p.type !== 'fieldWide' && p.type !== 'summon'
        && Math.round(p.cooldownMs * cooldownMultFor(phase)) <= p.telegraphMs + phase.gapMs);
      check(filler.length > 0, at, 'needs a pattern that is always ready again by the next pick (not fieldWide/summon, cooldown <= telegraph + gap)');

      // Simulate 1000 picks: never the same fieldWide twice in a row, never stalled
      const rng = seeded(1234);
      const cooldowns = {};
      const history = [];
      let now = 0;
      let stalled = false;
      let consecutiveWipes = false;
      for (let n = 0; n < 1000; n += 1) {
        const pick = pickPattern(phase, cooldowns, history, now, rng);
        if (!pick) { stalled = true; break; }
        if (pick.type === 'fieldWide' && history.length && history[history.length - 1].type === 'fieldWide') consecutiveWipes = true;
        history.push(pick);
        cooldowns[pick.id] = readyAtFor(pick, phase, now);
        now += pick.telegraphMs + phase.gapMs;
      }
      check(!stalled, at, 'the brain stalled with every pattern on cooldown');
      check(!consecutiveWipes, at, 'the same fieldWide was picked twice in a row');
    });

    // The two big fights show three distinct phases, the last one an enrage
    if (bossId === 'hugGuardian' || bossId === 'vacuumKing') {
      check(phases.length === 3, where, `needs exactly 3 phases (got ${phases.length})`);
      check(!!phases[phases.length - 1].enrage, where, 'the last phase must be the enrage phase');
      check(phases.slice(0, -1).every((phase) => !phase.enrage), where, 'only the last phase enrages');
    }

    if (boss.balance !== undefined) {
      check(Number.isInteger(boss.balance.intendedLevel) && boss.balance.intendedLevel >= 1, where, 'balance.intendedLevel must be an integer >= 1');
      check(boss.balance.uptime > 0 && boss.balance.uptime <= 1, where, 'balance.uptime must be in (0, 1]');
    }
  }
}

// ===== Check 9: source scan =====
// - Hangul only in src/i18n/ko.* (the ranges are built from char codes so this
//   file stays Hangul-free):
//   Jamo U+1100-U+11FF, Compatibility Jamo U+3130-U+318F, Syllables U+AC00-U+D7AF.
// - no console.log
// - every static i18n key used in src exists in en
// - best effort: no string literal handed straight to add.text( / setText(
const hangulRange = (from, to) => `${String.fromCharCode(from)}-${String.fromCharCode(to)}`;
const hangulRegex = new RegExp(`[${hangulRange(0x1100, 0x11FF)}${hangulRange(0x3130, 0x318F)}${hangulRange(0xAC00, 0xD7AF)}]`);
const LOCALE_FILE = /^ko\.[\w.]+$/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && /\.(js|mjs|cjs|css|html)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// Split call arguments at depth 0, honouring strings and nesting.
function splitArgs(source, openIndex) {
  const args = [];
  let depth = 0;
  let quote = null;
  let current = '';
  for (let i = openIndex + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      current += ch;
      if (ch === '\\') { current += source[i + 1]; i += 1; } else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; current += ch; continue; }
    if ('([{'.includes(ch)) depth += 1;
    if (')]}'.includes(ch)) {
      if (depth === 0) { args.push(current.trim()); return args; }
      depth -= 1;
    }
    if (ch === ',' && depth === 0) { args.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  return args;
}

// A literal counts as user-facing text when it has a Latin letter outside
// ${...} interpolations (symbols like the heart or arrows are fine).
function hasLiteralText(arg) {
  if (!arg || !/^['"`]/.test(arg)) return false;
  return /[A-Za-z]/.test(arg.replace(/\$\{[^}]*\}/g, ''));
}

const SCAN_ROOTS = [SRC_DIR, path.join(REPO_ROOT, 'scripts'), path.join(REPO_ROOT, 'tests')];
const scanFiles = [...SCAN_ROOTS.filter((dir) => fs.existsSync(dir)).flatMap((dir) => walk(dir)), path.join(REPO_ROOT, 'index.html')];

for (const file of scanFiles) {
  const rel = path.relative(REPO_ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  const isLocale = path.dirname(file) === path.join(SRC_DIR, 'i18n') && LOCALE_FILE.test(path.basename(file));
  check(isLocale || !hangulRegex.test(content), rel, 'contains Hangul outside src/i18n/ko.*');
  if (!file.startsWith(SRC_DIR)) continue;
  check(!content.includes('console.log'), rel, `contains 'console.log'`);
  if (path.dirname(file) === path.join(SRC_DIR, 'i18n')) continue;
  if (!/\.js$/.test(file)) continue;

  for (const pattern of LEGACY_FIELDS) {
    check(!pattern.test(content), rel, `uses removed text field ${pattern} (data now stores locale keys)`);
  }
  for (const pattern of KEY_CALLS) {
    for (const match of content.matchAll(pattern)) {
      check(enKeys.has(match[1]), rel, `uses locale key '${match[1]}' that is not in en.js`);
    }
  }
  // t('key', { ... }) must pass exactly the placeholders the English string uses
  for (const match of content.matchAll(/\bt\(\s*'([\w.]+)'\s*(?:\)|,\s*\{)/g)) {
    if (!enKeys.has(match[1])) continue;
    const needed = (en[match[1]].match(/\{(\w+)\}/g) || []).map((p) => p.slice(1, -1)).sort();
    let given = [];
    if (!match[0].endsWith(')')) {
      const open = match.index + match[0].length - 1;
      let depth = 0;
      let current = '';
      const parts = [];
      for (let i = open + 1; i < content.length; i += 1) {
        const ch = content[i];
        if ('([{'.includes(ch)) depth += 1;
        if (')]}'.includes(ch)) {
          if (depth === 0) break;
          depth -= 1;
        }
        if (ch === ',' && depth === 0) { parts.push(current); current = ''; } else current += ch;
      }
      parts.push(current);
      given = parts.map((part) => part.trim().split(':')[0].trim()).filter(Boolean).sort();
    }
    check(
      JSON.stringify(given) === JSON.stringify(needed),
      rel,
      `t('${match[1]}') passes {${given.join(', ')}} but the string needs {${needed.join(', ')}}`
    );
  }
  for (const call of ['.add.text(', '.setText(']) {
    let from = 0;
    for (;;) {
      const at = content.indexOf(call, from);
      if (at === -1) break;
      from = at + call.length;
      const args = splitArgs(content, at + call.length - 1);
      const textArg = call === '.add.text(' ? args[2] : args[0];
      const line = content.slice(0, at).split('\n').length;
      check(!hasLiteralText(textArg), `${rel}:${line}`, `hardcoded string passed to ${call.slice(1)}) - use t('key')`);
    }
  }
}

// ===== Report =====
if (failures.length > 0) {
  for (const line of failures) {
    console.log(line);
  }
  console.log(`${failures.length} failure(s) out of ${checkCount} checks.`);
  process.exit(1);
} else {
  console.log(`VALIDATION PASSED (${checkCount} checks)`);
}
