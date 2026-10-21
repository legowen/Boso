import fs from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { measureEntityArt } from './measure-entity-art.mjs';

const root = new URL('../', import.meta.url);
export const REFRESHED_ASSETS = [
  ['travel_ship', 'world', 1200, 800],
  ['cage', 'tex', 96, 76],
  ['npc', 'tex', 36, 52],
  ['npc_gear', 'tex', 36, 52],
  ['npc_nurse', 'tex', 36, 52],
  ['portal', 'tex', 48, 64],
  ['portal_hidden', 'tex', 48, 64],
];

// Mechanical packing only: preserve generated colors/alpha and aspect ratio.
// Keep all components (including tails, handles and portal sparks).
export async function prepareAssetRefresh() {
  for (const [key, folder, width, height] of REFRESHED_ASSETS) {
    const source = await fs.readFile(new URL(`art/source/refresh/${key}.png`, root));
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let left = info.width, top = info.height, right = -1, bottom = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 100) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right < left) throw new Error(`Empty replacement: ${key}`);
    const packed = await sharp(source).extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
      .resize(width - 2, height - 2, { fit: 'inside', kernel: 'nearest' }).png().toBuffer();
    const size = await sharp(packed).metadata();
    const y = key === 'travel_ship' ? Math.floor((height - size.height) / 2)
      : height - size.height - (key.startsWith('portal') ? 0 : 1);
    await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: packed, left: Math.floor((width - size.width) / 2), top: y }])
      .png().toFile(fileURLToPath(new URL(`public/assets/images/${folder}/${key}.png`, root)));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareAssetRefresh();
  await measureEntityArt();
}
