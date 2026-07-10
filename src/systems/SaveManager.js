// src/systems/SaveManager.js
// Persistent save data (story flags) backed by localStorage.
// Must be safe everywhere: Node (validator/tools), browser privacy mode,
// or any environment where storage throws. Falls back to an in-memory
// object so the game keeps working within the current session.

const SAVE_KEY = 'boso_save_v1';

// Module-level in-memory fallback, used when localStorage is unavailable
// or throws (e.g. privacy mode quota errors, Node without DOM globals).
let memoryData = null;

function defaultData() {
  return { flags: {} };
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
            if (!parsed.flags || typeof parsed.flags !== 'object') {
              parsed.flags = {};
            }
            return parsed;
          }
        }
      } catch (e) {
        // Corrupt JSON or storage read failure — fall through to fallback.
      }
    }
    if (memoryData) {
      return memoryData;
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
}
