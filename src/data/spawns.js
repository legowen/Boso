// src/data/spawns.js
// Named entry spawns (pure data - no Phaser, validated by scripts/validate.mjs).
//
// Save slots store WHERE a map was entered, never raw coordinates. Entry
// spawns are derived from the existing map data so there is no second
// table to keep in sync:
//   'default'     - the map's own spawnX/spawnY (new game, death respawn,
//                   cage arrival)
//   'from:<map>'  - where the portal in <map> that leads here drops you
// A (source, target) portal pair is unique across all maps, so
// 'from:<source>' identifies exactly one landing point per target map.

import { MAPS_DATA } from './maps.js';

export const DEFAULT_SPAWN_ID = 'default';

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function portalSpawnId(sourceMapKey) {
  return `from:${sourceMapKey}`;
}

function buildSpawnTable() {
  const table = {};
  for (const [key, map] of Object.entries(MAPS_DATA)) {
    table[key] = { [DEFAULT_SPAWN_ID]: { x: map.spawnX, y: map.spawnY } };
  }
  for (const [sourceKey, map] of Object.entries(MAPS_DATA)) {
    for (const portal of map.portals || []) {
      const target = table[portal.targetMap];
      if (target) target[portalSpawnId(sourceKey)] = { x: portal.spawnX, y: portal.spawnY };
    }
  }
  return table;
}

const SPAWN_TABLE = buildSpawnTable();

// Every entry spawn of a map, keyed by spawn id.
export function spawnPointsFor(mapKey) {
  return hasOwn(SPAWN_TABLE, mapKey) ? SPAWN_TABLE[mapKey] : {};
}

// Landing point for (map, spawnId). A missing or unknown spawnId (for
// example a portal that was removed since the save was written) falls back
// to the map's default spawn. Returns null for an unknown map.
export function resolveSpawn(mapKey, spawnId) {
  if (!hasOwn(SPAWN_TABLE, mapKey)) return null;
  const points = SPAWN_TABLE[mapKey];
  const id = hasOwn(points, spawnId) ? spawnId : DEFAULT_SPAWN_ID;
  return { id, x: points[id].x, y: points[id].y };
}
