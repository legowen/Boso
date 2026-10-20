import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { MAPS_DATA } from '../src/data/maps.js';
import { MAP_ART, WORLD_THEMES, WORLD_TEXTURES, EXTRA_TEXTURES, portalLayout } from '../src/data/worldArt.js';
import { PORTAL } from '../src/utils/constants.js';
import { OPTIONAL_TEXTURES } from '../src/data/assets.js';
import { MONSTER_TYPES } from '../src/data/monsters.js';
import { CAT_FRAME_SIZE, CAT_ANIMATIONS } from '../src/data/characters.js';

const imageRoot = new URL('../public/assets/images/', import.meta.url);

test('portals sit on their supporting platform and remain reachable from the ground', () => {
  for (const [key, map] of Object.entries(MAPS_DATA)) for (const portal of map.portals) {
    const layout = portalLayout(portal, map.platforms);
    assert.ok(map.platforms.some(p => p.y === layout.groundY && portal.x >= p.x && portal.x <= p.x + p.w), key);
    const playerCenterY = layout.groundY - 30;
    assert.ok(Math.abs(playerCenterY - layout.centerY) < PORTAL.ACTIVATE_DISTANCE, key);
    assert.ok(layout.hintY < layout.labelY && layout.labelY < layout.groundY - layout.height, key);
  }
  assert.equal(portalLayout({ x: 100, y: 200 }, [
    { x: 0, y: 700, w: 300 }, { x: 50, y: 250, w: 100 },
  ]).groundY, 250, 'an elevated portal uses its ledge instead of the map floor');
});
async function png(relative) {
  const data = await fs.readFile(new URL(relative, imageRoot));
  assert.equal(data.subarray(1, 4).toString(), 'PNG', relative);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), colorType: data[25] };
}

test('every map and every registered world/entity texture has bundled art', async () => {
  assert.deepEqual(Object.keys(MAP_ART).sort(), Object.keys(MAPS_DATA).sort());
  for (const theme of Object.values(MAP_ART)) assert.ok(WORLD_THEMES[theme]);
  for (const key of WORLD_TEXTURES) await png(`world/${key}.png`);
  for (const key of [...OPTIONAL_TEXTURES, ...EXTRA_TEXTURES]) {
    assert.equal((await png(`tex/${key}.png`)).colorType, 6, `${key} has RGBA transparency`);
  }
});

test('cat sheets contain all sixteen frames and monster/boss textures match collision sizes', async () => {
  for (const id of ['seoli', 'bomi']) {
    const image = await png(`cats/${id}.png`);
    assert.equal(image.width, CAT_FRAME_SIZE * 4);
    assert.equal(image.height, CAT_FRAME_SIZE * 4);
    assert.equal(image.colorType, 6);
  }
  for (const animation of Object.values(CAT_ANIMATIONS)) {
    assert.ok(animation.frames.length > 0);
    for (const frame of animation.frames) assert.ok(frame >= 0 && frame < 16);
  }
  for (const [type, cfg] of Object.entries(MONSTER_TYPES)) {
    const image = await png(`tex/monster_${type}.png`);
    assert.equal(image.width, cfg.width, type); assert.equal(image.height, cfg.height, type);
  }
  for (const [key, width, height] of [
    ['boss_hug_guardian', 140, 160], ['boss_dr_embrace', 90, 120],
    ['boss_biggie', 150, 130], ['boss_vacuum_king', 120, 150],
  ]) {
    const image = await png(`tex/${key}.png`);
    assert.equal(image.width, width, key); assert.equal(image.height, height, key);
  }
});

test('sprites have real alpha and every cat animation cell contains visible artwork', async () => {
  for (const key of [...OPTIONAL_TEXTURES, ...EXTRA_TEXTURES]) {
    const stats = await sharp(await fs.readFile(new URL(`tex/${key}.png`, imageRoot))).stats();
    assert.equal(stats.channels[3].min, 0, `${key} has transparent space`);
    assert.ok(stats.channels[3].max > 200, `${key} has visible pixels`);
  }
  for (const id of ['seoli', 'bomi']) {
    const input = await fs.readFile(new URL(`cats/${id}.png`, imageRoot));
    for (let frame = 0; frame < 16; frame++) {
      const { data } = await sharp(input).extract({
        left: (frame % 4) * 96, top: Math.floor(frame / 4) * 96, width: 96, height: 96,
      }).raw().toBuffer({ resolveWithObject: true });
      let visible = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 100) visible++;
      assert.ok(visible > 500, `${id} frame ${frame} is not empty`);
      assert.equal(data[3], 0, `${id} frame ${frame} has clean transparent margins`);
    }
  }
});
