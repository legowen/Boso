// src/systems/SaveManager.js
// Persistent save data backed by localStorage: three independent save slots.
// Must be safe everywhere: Node (validator/tools), browser privacy mode,
// or any environment where storage throws. Falls back to an in-memory copy
// so the game keeps working within the current session.
//
// Storage keys:
//   boso.save.slot1 .. boso.save.slot3   one JSON object per slot (schema v1)
//   boso.settings                        global (not per-slot) settings
//   boso_save_v1                         LEGACY single save, migrated into
//                                        slot 1 once by migrateLegacy()
//
// The story-flag / character-progress API (getFlag, setFlag, getCharacter,
// setCharacter) is unchanged for callers: it now reads and writes the
// ACTIVE slot, which is set by startNewGame() or continueSlot().

import { MAPS_DATA, START_MAP } from '../data/maps.js';
import { BOSS_TYPES } from '../data/monsters.js';
import { CHARACTERS, getCharacter as getCharacterDef, maxHpFor } from '../data/characters.js';
import { DEFAULT_SPAWN_ID } from '../data/spawns.js';

export const SLOT_COUNT = 3;

// Data-shape version of a slot object (independent of the legacy blob's 3).
export const SLOT_SCHEMA_VERSION = 1;

export const SETTINGS_KEY = 'boso.settings';
export const LEGACY_SAVE_KEY = 'boso_save_v1';
const PROBE_KEY = 'boso.probe';

// Legacy blobs carry no position. Players who already finished the tutorial
// resume in the Buddy House town; everyone else restarts the tutorial.
const LEGACY_TOWN_MAP = 'high_table';

export function slotStorageKey(slot) {
  return `boso.save.slot${slot}`;
}

function isSlotNumber(slot) {
  return Number.isInteger(slot) && slot >= 1 && slot <= SLOT_COUNT;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isIsoDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

// ===== Pure slot helpers (no storage, no Phaser) =====

// A brand-new slot object: nothing carries over from earlier runs.
export function createSlotData({
  slot,
  characterId,
  mapId = START_MAP,
  spawnId = DEFAULT_SPAWN_ID,
  hp,
  storyFlags = {},
  bosses = {},
  characters = {},
  playTimeSec = 0,
  now = new Date().toISOString(),
}) {
  const id = getCharacterDef(characterId).id;
  return {
    version: SLOT_SCHEMA_VERSION,
    slot,
    createdAt: now,
    updatedAt: now,
    playTimeSec,
    mapId,
    spawnId,
    hp: hp === undefined ? maxHpFor(id, 1) : hp,
    storyFlags,
    bosses,
    // Per-slot character progress (level/exp/treats/items/quests per cat).
    characterId: id,
    characters,
  };
}

export function serializeSlot(data) {
  return JSON.stringify(data);
}

// Validate a stored slot string. Returns { ok: true, data } or
// { ok: false, reason }. Never throws, never repairs: a slot that fails
// here is shown as "Corrupted" and left untouched.
export function parseSlot(raw, expectedSlot) {
  const fail = (reason) => ({ ok: false, reason });
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return fail('invalid-json');
  }
  if (!isPlainObject(data)) return fail('invalid-shape');
  if (data.version !== SLOT_SCHEMA_VERSION) return fail('unsupported-version');
  if (!isSlotNumber(data.slot) || (expectedSlot !== undefined && data.slot !== expectedSlot)) {
    return fail('invalid-slot');
  }
  if (!isIsoDate(data.createdAt) || !isIsoDate(data.updatedAt)) return fail('invalid-date');
  if (!Number.isFinite(data.playTimeSec) || data.playTimeSec < 0) return fail('invalid-playtime');
  if (typeof data.mapId !== 'string' || !hasOwn(MAPS_DATA, data.mapId)) return fail('unknown-map');
  if (typeof data.spawnId !== 'string') return fail('invalid-spawn');
  if (!Number.isFinite(data.hp)) return fail('invalid-hp');
  if (!isPlainObject(data.storyFlags)) return fail('invalid-flags');
  if (!isPlainObject(data.bosses)) return fail('invalid-bosses');
  for (const record of Object.values(data.bosses)) {
    if (!isPlainObject(record) || !isIsoDate(record.firstDefeatedAt) || !isIsoDate(record.lastDefeatedAt)) {
      return fail('invalid-bosses');
    }
  }
  if (!CHARACTERS.some((character) => character.id === data.characterId)) return fail('invalid-character');
  if (!isPlainObject(data.characters)) return fail('invalid-characters');
  return { ok: true, data };
}

// ===== Legacy (single-blob) save =====

// Bring any older/partial legacy blob up to its final (v3) shape without
// losing progress. Unknown extra fields are preserved as-is.
// v1 (implicit): { flags }, later + characters
// v2: adds an explicit `version` field; flags/characters normalized
// v3: maps legacy playable characters to Seoli and Bomi, retaining originals
const LEGACY_SAVE_VERSION = 3;

function normalizeLegacy(data) {
  if (!data.flags || typeof data.flags !== 'object') {
    data.flags = {};
  }
  if (!data.characters || typeof data.characters !== 'object') {
    data.characters = {};
  }
  if (typeof data.version !== 'number' || data.version < LEGACY_SAVE_VERSION) {
    // v3: retain legacy records and copy progress to the corrected cats.
    if (!data.characters.seoli && data.characters.boso_swift) {
      data.characters.seoli = { ...data.characters.boso_swift };
    }
    const brave = data.characters.boso_brave;
    const bomi = data.characters.bomi;
    if (brave && (!bomi || brave.level > bomi.level || (brave.level === bomi.level && (brave.exp || 0) > (bomi.exp || 0)))) {
      if (bomi) data.characters.legacy_bomi = { ...bomi };
      data.characters.bomi = { ...brave };
    }
    data.version = LEGACY_SAVE_VERSION;
  }
  return data;
}

// The legacy blob has no "active cat": resume with the more advanced one.
function mostAdvancedCharacter(characters) {
  const score = (id) => {
    const progress = characters[id];
    return progress && typeof progress.level === 'number'
      ? progress.level * 1e6 + (progress.exp || 0)
      : -1;
  };
  return score('bomi') > score('seoli') ? 'bomi' : 'seoli';
}

// ===== Storage access =====

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      return localStorage;
    }
  } catch (e) {
    // Accessing localStorage itself can throw in some sandboxed contexts.
  }
  return null;
}

// Entries here exist only while their last write did NOT reach real storage
// (unavailable, blocked, quota): they keep the session consistent.
const memoryStore = new Map();

function readRaw(key) {
  if (memoryStore.has(key)) return memoryStore.get(key);
  const storage = getStorage();
  if (storage) {
    try {
      const value = storage.getItem(key);
      if (value !== null && value !== undefined) return value;
    } catch (e) {
      // Read failure behaves like an empty key.
    }
  }
  return null;
}

// Returns true when the value reached real storage.
function writeRaw(key, value) {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      memoryStore.delete(key);
      return true;
    } catch (e) {
      // Quota exceeded / privacy mode - keep the in-memory copy below.
    }
  }
  memoryStore.set(key, value);
  return false;
}

function removeRaw(key) {
  memoryStore.delete(key);
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch (e) {
      // Nothing more to do.
    }
  }
}

function readSlot(slot) {
  const raw = readRaw(slotStorageKey(slot));
  if (raw === null) return { slot, status: 'empty' };
  const parsed = parseSlot(raw, slot);
  return parsed.ok
    ? { slot, status: 'ok', data: parsed.data }
    : { slot, status: 'corrupted', reason: parsed.reason };
}

// ===== Active slot state =====

let activeSlot = null;      // 1-3 once a game is started or continued
let activeData = null;      // the parsed slot object being played
let scratchData = null;     // unsaved stand-in if gameplay runs with no slot
let playing = false;        // a gameplay scene is active
let playStartedAt = null;   // wall-clock marker; null while hidden / idle

function current() {
  if (activeData) return activeData;
  if (!scratchData) scratchData = createSlotData({ slot: 1, characterId: CHARACTERS[0].id });
  return scratchData;
}

function activate(slot, data) {
  activeSlot = slot;
  activeData = data;
  playStartedAt = playing && !isDocumentHidden() ? Date.now() : null;
}

function isDocumentHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function persistActive() {
  if (!activeData) return;
  writeRaw(slotStorageKey(activeData.slot), serializeSlot(activeData));
}

function accruePlayTime() {
  if (!activeData || playStartedAt === null) return;
  const now = Date.now();
  activeData.playTimeSec = round3(activeData.playTimeSec + Math.max(0, now - playStartedAt) / 1000);
  playStartedAt = now;
}

export default class SaveManager {
  // ===== Slots =====

  // False when storage is missing or blocked (the game still runs from the
  // in-memory copy; the title shows a notice).
  static isStorageAvailable() {
    const storage = getStorage();
    if (!storage) return false;
    try {
      storage.setItem(PROBE_KEY, '1');
      storage.removeItem(PROBE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  // [{ slot, status: 'empty' }
  //  { slot, status: 'ok', data }
  //  { slot, status: 'corrupted', reason }] for slots 1..SLOT_COUNT.
  static listSlots() {
    const slots = [];
    for (let slot = 1; slot <= SLOT_COUNT; slot += 1) slots.push(readSlot(slot));
    return slots;
  }

  static hasAnySave() {
    return SaveManager.listSlots().some((entry) => entry.status !== 'empty');
  }

  // True if any readable slot has the story flag set (title-screen badge).
  static anySlotHasFlag(name) {
    return SaveManager.listSlots().some(
      (entry) => entry.status === 'ok' && !!entry.data.storyFlags[name]
    );
  }

  static getActiveSlot() {
    return activeSlot;
  }

  // Begin a fresh run in a slot, replacing whatever it held. Everything
  // (flags, bosses, hp, progress) starts from scratch.
  static startNewGame(slot, characterId) {
    if (!isSlotNumber(slot)) throw new RangeError(`Invalid save slot: ${slot}`);
    const data = createSlotData({ slot, characterId, mapId: START_MAP, spawnId: DEFAULT_SPAWN_ID });
    activate(slot, data);
    persistActive();
    return data;
  }

  // Make a stored slot the active one. Returns what the game needs to
  // resume, or null if the slot is empty or corrupted.
  static continueSlot(slot) {
    if (!isSlotNumber(slot)) return null;
    const entry = readSlot(slot);
    if (entry.status !== 'ok') return null;
    activate(slot, entry.data);
    const { characterId, mapId, spawnId, hp } = entry.data;
    return { characterId, mapId, spawnId, hp };
  }

  // Swap the active slot's companion in place (pause menu). The new cat
  // keeps its own saved progress; position resumes at the last entry spawn.
  static switchCharacter(characterId) {
    if (!activeData) return null;
    activeData.characterId = getCharacterDef(characterId).id;
    persistActive();
    return { characterId: activeData.characterId, mapId: activeData.mapId, spawnId: activeData.spawnId, hp: null };
  }

  // ===== Autosave =====

  // Record where the player is. Called after a map is entered and when the
  // tab is hidden. Only the fields present in `patch` change; hp <= 0 is
  // ignored so a death screen never becomes the resume point.
  static saveProgress(patch = {}) {
    if (!activeData) return;
    if (typeof patch.mapId === 'string' && hasOwn(MAPS_DATA, patch.mapId)) activeData.mapId = patch.mapId;
    if (typeof patch.spawnId === 'string') activeData.spawnId = patch.spawnId;
    if (Number.isFinite(patch.hp) && patch.hp > 0) activeData.hp = patch.hp;
    accruePlayTime();
    activeData.updatedAt = new Date().toISOString();
    persistActive();
  }

  // Boss defeat: bump the boss record, keep the legacy `<id>Defeated` flag
  // (portals/quests/travel read it) and autosave.
  static recordBossDefeat(bossId, patch = {}) {
    if (!activeData) return;
    const now = new Date().toISOString();
    const previous = activeData.bosses[bossId];
    activeData.bosses[bossId] = {
      firstDefeatedAt: previous && isIsoDate(previous.firstDefeatedAt) ? previous.firstDefeatedAt : now,
      lastDefeatedAt: now,
    };
    activeData.storyFlags[`${bossId}Defeated`] = true;
    SaveManager.saveProgress(patch);
  }

  // A gameplay scene (map or cage ride) became / stopped being active.
  // Play time only accrues between these calls and only while the tab is
  // visible.
  static beginPlay() {
    playing = true;
    playStartedAt = activeData && !isDocumentHidden() ? Date.now() : null;
  }

  static endPlay() {
    if (activeData) SaveManager.saveProgress();
    playing = false;
    playStartedAt = null;
  }

  // Tab switch / mobile close: save, then stop the clock until visible again.
  static handleHidden(patch = {}) {
    SaveManager.saveProgress(patch);
    playStartedAt = null;
  }

  static handleVisible() {
    if (playing && activeData) playStartedAt = Date.now();
  }

  // Wire visibilitychange for a gameplay scene. `getPatch` returns the
  // fields to save when hidden (for example the live hp). Returns the
  // unsubscribe function (call it on scene shutdown).
  static watchVisibility(getPatch) {
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') {
      return () => {};
    }
    const onChange = () => {
      if (document.visibilityState === 'hidden') {
        SaveManager.handleHidden(getPatch ? getPatch() : {});
      } else {
        SaveManager.handleVisible();
      }
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }

  // ===== Story flags & character progress (active slot) =====

  // Read a boolean story flag (e.g. 'hugGuardianDefeated').
  static getFlag(name) {
    return !!current().storyFlags[name];
  }

  // Set a story flag and persist immediately.
  static setFlag(name, value = true) {
    current().storyFlags[name] = value;
    persistActive();
  }

  // Read persistent character progress or null. Normalizes missing fields
  // so older saves (level/exp only) keep working.
  static getCharacter(charId) {
    if (!charId) return null;
    const progress = current().characters[charId];
    if (!progress || typeof progress.level !== 'number') return null;
    return {
      level: progress.level,
      exp: progress.exp || 0,
      treats: progress.treats || 0,
      items: progress.items && typeof progress.items === 'object' ? { ...progress.items } : {},
      quests: progress.quests && typeof progress.quests === 'object' ? { ...progress.quests } : {},
    };
  }

  // Persist character progress into the active slot (each slot has its own
  // levels, treats, items and quests).
  static setCharacter(charId, progress) {
    if (!charId) return;
    current().characters[charId] = {
      level: progress.level,
      exp: progress.exp,
      treats: progress.treats || 0,
      items: progress.items || {},
      quests: progress.quests || {},
    };
    persistActive();
  }

  // ===== Global settings (not per slot) =====

  static getSettings() {
    const raw = readRaw(SETTINGS_KEY);
    if (raw === null) return {};
    try {
      const parsed = JSON.parse(raw);
      return isPlainObject(parsed) ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  static updateSettings(patch) {
    const merged = { ...SaveManager.getSettings(), ...patch };
    writeRaw(SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  }

  // ===== Legacy migration =====

  // One-time, on boot: if the legacy single save exists and every slot is
  // empty, convert it into slot 1 and remove the legacy key.
  // Returns 'none' | 'skipped' | 'invalid' | 'failed' | 'migrated'.
  // The legacy key is only removed after slot 1 verifiably holds the data;
  // an unreadable legacy blob is left alone.
  static migrateLegacy() {
    const raw = readRaw(LEGACY_SAVE_KEY);
    if (raw === null) return 'none';
    if (SaveManager.listSlots().some((entry) => entry.status !== 'empty')) return 'skipped';

    let legacy;
    try {
      legacy = JSON.parse(raw);
    } catch (e) {
      return 'invalid';
    }
    if (!isPlainObject(legacy)) return 'invalid';
    legacy = normalizeLegacy(legacy);

    const characterId = mostAdvancedCharacter(legacy.characters);
    const progress = legacy.characters[characterId];
    const level = progress && typeof progress.level === 'number' ? progress.level : 1;
    const now = new Date().toISOString();

    // Legacy bosses carry no timestamps: backfill "defeated as of now".
    const bosses = {};
    for (const bossId of Object.keys(BOSS_TYPES)) {
      if (legacy.flags[`${bossId}Defeated`]) bosses[bossId] = { firstDefeatedAt: now, lastDefeatedAt: now };
    }

    const data = createSlotData({
      slot: 1,
      characterId,
      mapId: legacy.flags.tutorialCompleted ? LEGACY_TOWN_MAP : START_MAP,
      spawnId: DEFAULT_SPAWN_ID,
      hp: maxHpFor(characterId, level),
      storyFlags: legacy.flags,
      bosses,
      characters: legacy.characters,
      now,
    });

    if (!writeRaw(slotStorageKey(1), serializeSlot(data))) return 'failed';
    if (readSlot(1).status !== 'ok') return 'failed';
    removeRaw(LEGACY_SAVE_KEY);
    return 'migrated';
  }
}
