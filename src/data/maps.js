// src/data/maps.js
// Map registry (pure data) - Node-validatable via scripts/validate.mjs

import MAP_YARD from './map_yard.js';
import MAP_GARDEN from './map_garden.js';
import MAP_LIVINGROOM from './map_livingroom.js';
import MAP_KITCHEN from './map_kitchen.js';
import MAP_BASEMENT from './map_basement.js';
import MAP_HALLWAY from './map_hallway.js';
import MAP_BEDROOM from './map_bedroom.js';
import MAP_ROOFTOP from './map_rooftop.js';
import MAP_PLAYROOM from './map_playroom.js';
import MAP_ATTIC from './map_attic.js';
import MAP_CLOSET from './map_closet.js';
import MAP_SHELTER_WARD from './map_shelter_ward.js';
import MAP_SHELTER_HALL from './map_shelter_hall.js';
import MAP_SHELTER_YARD from './map_shelter_yard.js';
import MAP_HIGH_TABLE from './map_high_table.js';
import MAP_SOFA_RIDGE from './map_sofa_ridge.js';
import MAP_KITCHEN_FLOOR from './map_kitchen_floor.js';
import MAP_HALLWAY_RUN from './map_hallway_run.js';
import MAP_BOOKSHELF_CLIFFS from './map_bookshelf_cliffs.js';
import MAP_BACKYARD_GATE from './map_backyard_gate.js';

export const MAPS_DATA = {
  // === Shelter Isle (tutorial region) ===
  shelter_ward: MAP_SHELTER_WARD,
  shelter_hall: MAP_SHELTER_HALL,
  shelter_yard: MAP_SHELTER_YARD,

  // === Buddy House (second region) ===
  high_table: MAP_HIGH_TABLE,
  sofa_ridge: MAP_SOFA_RIDGE,
  kitchen_floor: MAP_KITCHEN_FLOOR,
  hallway_run: MAP_HALLWAY_RUN,
  bookshelf_cliffs: MAP_BOOKSHELF_CLIFFS,
  backyard_gate: MAP_BACKYARD_GATE,

  // === Home (the original house world) ===
  yard: MAP_YARD,
  garden: MAP_GARDEN,
  livingroom: MAP_LIVINGROOM,
  kitchen: MAP_KITCHEN,
  basement: MAP_BASEMENT,
  hallway: MAP_HALLWAY,
  bedroom: MAP_BEDROOM,
  rooftop: MAP_ROOFTOP,
  playroom: MAP_PLAYROOM,
  attic: MAP_ATTIC,
  closet: MAP_CLOSET,
};

// Every new game starts at the Paw Shelter Clinic (Maple Island homage).
export const START_MAP = 'shelter_ward';

// Death respawn target per region ("home" map of each region).
export const REGION_HOME = {
  shelter: 'shelter_ward',
  buddy: 'high_table',
  house: 'yard',
};

// Where the player wakes up after dying on the given map.
export function respawnMapFor(mapKey) {
  const map = MAPS_DATA[mapKey];
  const home = map && REGION_HOME[map.region];
  return home || START_MAP;
}
