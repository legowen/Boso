// src/data/worldmap.js
// Pure data - world map screen layout (normalized 0..1 panel coordinates).
// Edges are derived at runtime from each map's portal list.

export const WORLD_MAP_LAYOUT = {
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
