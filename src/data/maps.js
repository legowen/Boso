// src/data/maps.js
// Map registry (pure data) - Node-validatable via scripts/validate.mjs

import MAP_YARD from './map_yard.js';
import MAP_LIVINGROOM from './map_livingroom.js';
import MAP_KITCHEN from './map_kitchen.js';
import MAP_HALLWAY from './map_hallway.js';
import MAP_PLAYROOM from './map_playroom.js';
import MAP_ATTIC from './map_attic.js';
import MAP_CLOSET from './map_closet.js';

export const MAPS_DATA = {
  yard: MAP_YARD,
  livingroom: MAP_LIVINGROOM,
  kitchen: MAP_KITCHEN,
  hallway: MAP_HALLWAY,
  playroom: MAP_PLAYROOM,
  attic: MAP_ATTIC,
  closet: MAP_CLOSET,
};

export const START_MAP = 'yard';
