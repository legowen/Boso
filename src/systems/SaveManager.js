// src/systems/SaveManager.js
// Persistent save data (story flags) backed by localStorage.
// Must be safe everywhere: Node (validator/tools), browser privacy mode,
// or any environment where storage throws. Falls back to an in-memory
// object so the game keeps working within the current session.

const SAVE_KEY = 'boso_save_v1';

// Data-shape version stored inside the save (the storage key stays
// 'boso_save_v1' so pre-versioning saves keep loading).
// v1 (implicit): { flags }, later + characters
// v2: adds an explicit `version` field; flags/characters normalized
const SAVE_VERSION = 2;

// Module-level in-memory fallback, used when localStorage is unavailable
// or throws (e.g. privacy mode quota errors, Node without DOM globals).
let memoryData = null;

function defaultData() {
  return { version: SAVE_VERSION, flags: {}, characters: {} };
}

// Bring any older/partial save up to the current shape without losing
// progress. Unknown extra fields are preserved as-is.
function migrate(data) {
  if (!data.flags || typeof data.flags !== 'object') {
    data.flags = {};
  }
  if (!data.characters || typeof data.characters !== 'object') {
    data.characters = {};
  }
  if (typeof data.version !== 'number' || data.version < SAVE_VERSION) {
    // v1 -> v2: purely additive (nothing to rewrite), just stamp it
    data.version = SAVE_VERSION;
  }
  return data;
}

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

export default class SaveManager {
  // Load save data, returning a well-formed object even on any failure.
  static load() {
    const storage = getStorage();
    if (storage) {
      try {
        const raw = storage.getItem(SAVE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return migrate(parsed);
          }
        }
      } catch (e) {
        // Corrupt JSON or storage read failure — fall through to fallback.
      }
    }
    if (memoryData) {
      return migrate(memoryData);
    }
    return defaultData();
  }

  // Persist save data. Always keeps the in-memory copy in sync so a
  // failed localStorage write still preserves state for this session.
  static save(data) {
    memoryData = data;
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(SAVE_KEY, JSON.stringify(data));
      } catch (e) {
        // Quota exceeded / privacy mode — in-memory copy still holds.
      }
    }
  }

  // Read a boolean story flag (e.g. 'hugGuardianDefeated').
  static getFlag(name) {
    const data = SaveManager.load();
    return !!(data.flags && data.flags[name]);
  }

  // Set a story flag and persist immediately.
  static setFlag(name, value = true) {
    const data = SaveManager.load();
    data.flags[name] = value;
    SaveManager.save(data);
  }

  // Read persistent character progress or null. Normalizes missing fields
  // so older saves (level/exp only) keep working.
  static getCharacter(charId) {
    if (!charId) return null;
    const data = SaveManager.load();
    const progress = data.characters && data.characters[charId];
    if (!progress || typeof progress.level !== 'number') return null;
    return {
      level: progress.level,
      exp: progress.exp || 0,
      treats: progress.treats || 0,
      items: progress.items && typeof progress.items === 'object' ? { ...progress.items } : {},
      quests: progress.quests && typeof progress.quests === 'object' ? { ...progress.quests } : {},
    };
  }

  // Persist character progress (MapleStory-style: survives new games).
  static setCharacter(charId, progress) {
    if (!charId) return;
    const data = SaveManager.load();
    if (!data.characters || typeof data.characters !== 'object') {
      data.characters = {};
    }
    data.characters[charId] = {
      level: progress.level,
      exp: progress.exp,
      treats: progress.treats || 0,
      items: progress.items || {},
      quests: progress.quests || {},
    };
    SaveManager.save(data);
  }
}
