#!/usr/bin/env node
// scripts/validate.mjs
// Node ESM data validator for the Boso world data. Pure Node — no Phaser.
// Run with: node scripts/validate.mjs (or npm run validate)
//
// Collects ALL failures, prints one '[FAIL] <map>: <detail>' line each,
// and exits 1 if any check failed; otherwise prints a PASS summary.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MAPS_DATA, START_MAP, REGION_HOME } from '../src/data/maps.js';
import { MONSTER_TYPES, BOSS_TYPES } from '../src/data/monsters.js';
import { BGM_KEYS } from '../src/data/audio.js';
import { QUESTS } from '../src/data/quests.js';
import { ITEMS } from '../src/data/items.js';
import { TRAVEL_ROUTES, AMBUSH_TYPES } from '../src/data/travel.js';
import { WORLD_MAP_LAYOUT, REGION_TITLES } from '../src/data/worldmap.js';
import { OPTIONAL_TEXTURES } from '../src/data/assets.js';

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
  for (const field of ['name', 'width', 'height', 'spawnX', 'spawnY']) {
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
      `portal[${i}] '${portal.label}' at (${portal.x},${portal.y}) has no supporting platform`
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
      `npc[${i}] '${npc.name}' at (${npc.x},${npc.y}) has no supporting platform`
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
      `portal[${i}] '${portal.label}' targets unknown map '${portal.targetMap}'`
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
        `hidden portal[${i}] '${portal.label}' must have a requiresFlag string`
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
    (map.npcs || []).forEach((npc) => allNpcNames.add(npc.name));
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
    for (const arr of ['offer', 'complete']) {
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
    !!REGION_TITLES[region],
    `region:${region}`,
    'missing REGION_TITLES entry (world map panel title)'
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
        `npc[${i}] '${npc.name}' travelRoute '${npc.travelRoute}' is not in TRAVEL_ROUTES`
      );
      if (route) {
        check(
          route.from === key,
          key,
          `npc[${i}] '${npc.name}' travelRoute '${npc.travelRoute}' departs from '${route.from}', not this map`
        );
      }
      check(
        !!map.cage,
        key,
        `npc[${i}] '${npc.name}' offers travel but the map has no cage prop`
      );
    }
    if (npc.travelRequiresFlag !== undefined) {
      check(
        typeof npc.travelRequiresFlag === 'string' && npc.travelRequiresFlag.length > 0,
        key,
        `npc[${i}] '${npc.name}' travelRequiresFlag must be a non-empty string`
      );
      check(
        Array.isArray(npc.travelLockedLines) && npc.travelLockedLines.length > 0,
        key,
        `npc[${i}] '${npc.name}' gated travel needs travelLockedLines`
      );
    }
  });
  (map.guides || []).forEach((guide, i) => {
    check(
      inBounds(map, guide.x, guide.y),
      key,
      `guide[${i}] at (${guide.x},${guide.y}) is outside map bounds`
    );
    check(
      typeof guide.text === 'string' && guide.text.length > 0,
      key,
      `guide[${i}] has no text`
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

// ===== Check 9: source scan — no Korean characters, no console.log in src/ =====
// Korean ranges via unicode escapes (this file must not contain literal Korean):
// Hangul Jamo U+1100-U+11FF, Compatibility Jamo U+3130-U+318F,
// Hangul Syllables U+AC00-U+D7AF.
const koreanRegex = /[ᄀ-ᇿ㄰-㆏가-힯]/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && /\.(js|mjs)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

for (const file of walk(SRC_DIR)) {
  const rel = path.relative(REPO_ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  check(!koreanRegex.test(content), rel, 'contains Korean characters');
  check(!content.includes('console.log'), rel, `contains 'console.log'`);
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
