import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { BOSS_TYPES } from '../src/data/monsters.js';
import { MAPS_DATA } from '../src/data/maps.js';
import { NPC } from '../src/utils/constants.js';
import { npcTexture } from '../src/data/worldArt.js';
import { ENTITY_ART_BOUNDS } from '../src/data/entityArtBounds.js';
import { applyBossArt, bossCombatBounds, entityArtLayout } from '../src/systems/EntityArt.js';

// Exercise the installed Phaser physics body without needing a browser renderer.
const require = createRequire(import.meta.url);
const Body = require('phaser/src/physics/arcade/Body.js');
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const bosses = [
  ['drEmbrace', 'boss_dr_embrace', 24, 8], ['hugGuardian', 'boss_hug_guardian', 24, 8],
  ['biggie', 'boss_biggie', 30, 10], ['vacuumKing', 'boss_vacuum_king', 20, 10],
];

function spriteFor(key, cfg) {
  const sprite = {
    x: 600, y: 500, width: cfg.width, height: cfg.height,
    angle: 0, scaleX: 1, scaleY: 1, texture: { key },
    displayWidth: cfg.width, displayHeight: cfg.height,
    displayOriginX: cfg.width / 2, displayOriginY: cfg.height / 2,
    frame: { realWidth: cfg.width, realHeight: cfg.height }, getCenter() {},
    setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; },
    setOrigin(x, y) { this.displayOriginX = x * cfg.width; this.displayOriginY = y * cfg.height; return this; },
  };
  sprite.body = new Body({ defaults: {}, bounds: {} }, sprite);
  return sprite;
}

test('boss art restores configured proportions without changing physics or combat ranges', () => {
  for (const [id, key, insetX, insetY] of bosses) {
    const cfg = BOSS_TYPES[id], sprite = spriteFor(key, cfg), original = spriteFor(key, cfg);
    const bw = cfg.width - insetX, bh = cfg.height - insetY;
    original.body.setSize(bw, bh);
    const art = applyBossArt(sprite, cfg, bw, bh);
    const bounds = ENTITY_ART_BOUNDS[key];
    near((bounds.bottom - bounds.top) * art.scale, cfg.height * 1.5);
    // The visible foot meets the actual physics bottom, even after squash/stretch.
    for (const [sx, sy] of [[1, 1], [1.08, 1], [1.15, 0.8], [0.94, 1.12], [1, 1]]) {
      sprite.setScale(art.scale * sx, art.scale * sy);
      original.setScale(sx, sy);
      sprite.body.updateFromGameObject(); original.body.updateFromGameObject();
      for (const prop of ['x', 'y', 'width', 'height']) near(sprite.body[prop], original.body[prop]);
      near(sprite.y + (bounds.bottom - sprite.displayOriginY) * sprite.scaleY, sprite.body.bottom);
      const combat = bossCombatBounds({ cfg, sprite, art });
      near(combat.x, sprite.x - cfg.width * sx / 2);
      near(combat.y, sprite.y - cfg.height * sy / 2);
      near(combat.width, cfg.width * sx); near(combat.height, cfg.height * sy);
    }
  }
});

test('all NPC art stands on its existing foot anchor and dialogue stays reachable', () => {
  for (const map of Object.values(MAPS_DATA)) for (const npc of map.npcs) {
    const key = npcTexture(npc), bounds = ENTITY_ART_BOUNDS[key];
    const art = entityArtLayout(key, NPC.HEIGHT, NPC.HEIGHT / 2);
    near((bounds.bottom - bounds.top) * art.scale, 78);
    const foot = npc.y + (bounds.bottom - NPC.HEIGHT * art.originY) * art.scale;
    near(foot, npc.y + 26);
    assert.ok(Math.abs(foot - 30 - npc.y) < NPC.INTERACT_DISTANCE);
    assert.ok(npc.y + art.top < npc.y - 40, 'old fixed name tag would overlap enlarged art');
  }
});

test('visible bounds match committed pixels, including wide padded bosses', async () => {
  for (const [key, bounds] of Object.entries(ENTITY_ART_BOUNDS)) {
    const { data, info } = await sharp(await fs.readFile(new URL(`../public/assets/images/tex/${key}.png`, import.meta.url)))
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rows = [];
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] >= 100) {
        rows.push(y); break;
      }
    }
    assert.deepEqual(bounds, { top: rows[0], bottom: rows.at(-1) + 1 }, key);
  }
});
