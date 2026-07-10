// src/data/assets.js
// Pure data — optional texture override registry (no Phaser imports).
// If a PNG exists at the override path, PreloadScene loads it under the
// matching texture key, and the `textures.exists(key)` guards in entity
// code skip procedural generation. Missing files 404 harmlessly.

export const OPTIONAL_TEXTURES = [
  'player_boso_brave', 'player_boso_swift', 'npc', 'portal', 'portal_hidden',
  'monster_bangul', 'monster_gong', 'monster_laser', 'monster_nabi', 'monster_pari',
  'monster_robo',
  'boss_hug_guardian', 'boss_vacuum_king', 'proj_arm', 'proj_dust',
];

// Path tried by PreloadScene for each optional texture key.
export function textureOverridePath(key) {
  return `assets/images/tex/${key}.png`;
}
