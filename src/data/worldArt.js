import { PORTAL } from '../utils/constants.js';

// All twenty maps share a themed art family; collision geometry stays in map data.
export const WORLD_THEMES = {
  shelter: { background: 'bg_shelter', terrain: 'tile_shelter', color: 0xB9DACD },
  garden: { background: 'bg_garden', terrain: 'tile_grass', color: 0xCFE8D0 },
  living: { background: 'bg_living', terrain: 'tile_wood', color: 0xDCC5A1 },
  kitchen: { background: 'bg_kitchen', terrain: 'tile_kitchen', color: 0xC8DCD1 },
  library: { background: 'bg_library', terrain: 'tile_books', color: 0xB9A38E },
  workshop: { background: 'bg_workshop', terrain: 'tile_workshop', color: 0xD8BD96 },
  attic: { background: 'bg_attic', terrain: 'tile_magic', color: 0xA09CC3 },
  bedroom: { background: 'bg_bedroom', terrain: 'tile_wood', color: 0x94A8CB },
  cellar: { background: 'bg_cellar', terrain: 'tile_cellar', color: 0x8F95AD },
};

export const MAP_ART = {
  shelter_ward: 'shelter', shelter_hall: 'shelter', shelter_yard: 'garden',
  high_table: 'living', sofa_ridge: 'living', kitchen_floor: 'kitchen',
  hallway_run: 'library', bookshelf_cliffs: 'library', backyard_gate: 'garden',
  yard: 'garden', garden: 'garden', livingroom: 'living', kitchen: 'kitchen',
  hallway: 'library', playroom: 'workshop', attic: 'attic', closet: 'cellar',
  bedroom: 'bedroom', rooftop: 'bedroom', basement: 'cellar',
};

export const EXTRA_TEXTURES = [
  'npc_nurse', 'npc_gear', 'npc_plush', 'npc_hound', 'npc_hedgehog',
  'fx_wind', 'fx_paw', 'fx_hit',
];

export const WORLD_TEXTURES = [
  ...new Set(Object.values(WORLD_THEMES).flatMap((theme) => [theme.background, theme.terrain])),
  'travel_ship', 'bg_voyage',
];

export function npcTexture(npc) {
  if (npc.texture) return npc.texture;
  // npc.id is the stable identifier (display names are translated)
  if (/nurse/.test(npc.id)) return 'npc_nurse';
  if (/hedgehog|haku/.test(npc.id)) return 'npc_hedgehog';
  if (/gear|clock|mechanic|bolt/.test(npc.id)) return 'npc_gear';
  if (/plush|stitch|sew/.test(npc.id)) return 'npc_plush';
  if (/hound|dog|old_bell/.test(npc.id)) return 'npc_hound';
  return 'npc';
}

export function portalLayout(portal, platforms) {
  const surfaces = platforms.filter(platform => portal.x >= platform.x &&
    portal.x <= platform.x + platform.w && platform.y >= portal.y);
  const groundY = surfaces.length ? Math.min(...surfaces.map(platform => platform.y)) : portal.y + PORTAL.HEIGHT / 2;
  const height = PORTAL.HEIGHT * PORTAL.DISPLAY_SCALE;
  return { groundY, height, centerY: groundY - height / 2,
    labelY: groundY - height - 14, hintY: groundY - height - 40 };
}
