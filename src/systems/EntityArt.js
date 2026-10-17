import { CAT_DISPLAY_SCALE } from '../data/characters.js';
import { ENTITY_ART_BOUNDS } from '../data/entityArtBounds.js';

// Match the cats' enlargement, using visible height instead of PNG padding.
export const ENTITY_DISPLAY_SCALE = CAT_DISPLAY_SCALE / 0.75;

export function entityArtLayout(textureKey, height, feetOffset) {
  const { top, bottom } = ENTITY_ART_BOUNDS[textureKey] || { top: 0, bottom: height };
  const scale = height * ENTITY_DISPLAY_SCALE / (bottom - top);
  const originY = (bottom - feetOffset / scale) / height;
  return { scale, originY, feetOffset, top: feetOffset - height * ENTITY_DISPLAY_SCALE };
}

export function applyBossArt(sprite, cfg, bodyWidth, bodyHeight) {
  const layout = entityArtLayout(sprite.texture.key, cfg.height, bodyHeight / 2);
  sprite.setScale(layout.scale).setOrigin(0.5, layout.originY);
  // Keep platform collisions, spawn coordinates and attack patterns unchanged.
  sprite.body.setSize(bodyWidth / layout.scale, bodyHeight / layout.scale, false);
  sprite.body.setOffset(cfg.width / 2 - bodyWidth / (2 * layout.scale),
    cfg.height * layout.originY - bodyHeight / (2 * layout.scale));
  sprite.body.updateFromGameObject();
  return layout;
}

// Combat used the original centered frame, independently of its physics inset.
// Preserve that range while display art and its foot origin grow upwards.
export function bossCombatBounds(boss) {
  const width = boss.cfg.width * Math.abs(boss.sprite.scaleX / boss.art.scale);
  const height = boss.cfg.height * Math.abs(boss.sprite.scaleY / boss.art.scale);
  const x = boss.sprite.x - width / 2, y = boss.sprite.y - height / 2;
  return { x, y, width, height, right: x + width, bottom: y + height };
}
