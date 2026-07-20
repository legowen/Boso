// src/data/worldmap.js
// Pure data - world map screen layout (normalized 0..1 panel coordinates).
// The overlay shows only the current region's maps; edges are derived at
// runtime from each map's portal list.

export const WORLD_MAP_LAYOUT = {
  // === Shelter Isle ===
  shelter_ward: { x: 0.15, y: 0.5 },
  shelter_hall: { x: 0.45, y: 0.5 },
  shelter_yard: { x: 0.75, y: 0.5 },

  // === Buddy House ===
  high_table: { x: 0.5, y: 0.18 },
  sofa_ridge: { x: 0.22, y: 0.46 },
  kitchen_floor: { x: 0.78, y: 0.46 },
  hallway_run: { x: 0.5, y: 0.62 },
  bookshelf_cliffs: { x: 0.28, y: 0.85 },
  backyard_gate: { x: 0.68, y: 0.88 },

  // === Home (original house) ===
  garden: { x: 0.08, y: 0.30 },
  yard: { x: 0.08, y: 0.64 },
  livingroom: { x: 0.23, y: 0.64 },
  kitchen: { x: 0.38, y: 0.64 },
  basement: { x: 0.38, y: 0.88 },
  hallway: { x: 0.53, y: 0.64 },
  bedroom: { x: 0.53, y: 0.32 },
  rooftop: { x: 0.70, y: 0.14 },
  playroom: { x: 0.68, y: 0.64 },
  attic: { x: 0.84, y: 0.40 },
  closet: { x: 0.93, y: 0.66 },
};

// Panel title per region.
export const REGION_TITLES = {
  shelter: 'SHELTER ISLE',
  buddy: 'BUDDY HOUSE',
  house: 'HOUSE MAP',
};
