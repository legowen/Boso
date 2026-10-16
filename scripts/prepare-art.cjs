// Mechanical extraction and nearest-neighbor packing of approved generated art.
// Run npm ci, then npm run art:build. Sharp is a dev dependency.
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'art/source');
const output = path.join(root, 'public/assets/images');
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

async function components(file, cols, rows) {
  const { data, info } = await sharp(path.join(source, `${file}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const seen = new Int32Array(w * h);
  const queue = new Int32Array(w * h);
  const items = []; let id = 0;
  for (let pos = 0; pos < w * h; pos++) {
    if (seen[pos] || data[pos * 4 + 3] < 100) continue;
    id++; let head = 0, tail = 0; queue[tail++] = pos; seen[pos] = id;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    while (head < tail) {
      const v = queue[head++], x = v % w, y = Math.floor(v / w);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const n of [x > 0 ? v - 1 : -1, x < w - 1 ? v + 1 : -1, y > 0 ? v - w : -1, y < h - 1 ? v + w : -1]) {
        if (n >= 0 && !seen[n] && data[n * 4 + 3] >= 100) { seen[n] = id; queue[tail++] = n; }
      }
    }
    if (tail > 1500) items.push({ id, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
  }
  const cells = new Array(cols * rows);
  for (const box of items) {
    const col = Math.min(cols - 1, Math.floor((box.x + box.w / 2) / w * cols));
    const row = Math.min(rows - 1, Math.floor((box.y + box.h / 2) / h * rows));
    const index = row * cols + col;
    if (cells[index]) throw new Error(`${file}: two components in cell ${index}`);
    const pixels = Buffer.alloc(box.w * box.h * 4);
    for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) {
      const from = (box.y + y) * w + box.x + x, to = (y * box.w + x) * 4;
      if (seen[from] === box.id) data.copy(pixels, to, from * 4, from * 4 + 4);
    }
    cells[index] = { ...box, pixels };
  }
  if (cells.filter(Boolean).length !== cols * rows) throw new Error(`${file}: missing cells`);
  return cells;
}

async function fitSprite(cell, width, height, dest, scale) {
  const s = scale || Math.min((width - 2) / cell.w, (height - 2) / cell.h);
  const sw = Math.max(1, Math.round(cell.w * s)), sh = Math.max(1, Math.round(cell.h * s));
  const small = await sharp(cell.pixels, { raw: { width: cell.w, height: cell.h, channels: 4 } })
    .resize(sw, sh, { kernel: 'nearest' }).png().toBuffer();
  const groundAligned = dest && /tex\/(npc|boss_|monster_|player_|cage)/.test(dest);
  const buffer = await sharp({ create: { width, height, channels: 4, background: transparent } })
    .composite([{ input: small, left: Math.floor((width - sw) / 2), top: scale ? 88 - sh : groundAligned ? height - sh - 1 : Math.floor((height - sh) / 2) }]).png().toBuffer();
  if (dest) await fs.writeFile(path.join(output, dest), buffer);
  return buffer;
}

async function main() {
  for (const sub of ['cats', 'tex', 'world']) await fs.mkdir(path.join(output, sub), { recursive: true });
  for (const name of ['seoli', 'bomi']) {
    const cells = await components(name, 4, 4);
    const scale = 86 / Math.max(...cells.flatMap(c => [c.w, c.h]));
    const frames = await Promise.all(cells.map(c => fitSprite(c, 96, 96, null, scale)));
    await sharp({ create: { width: 384, height: 384, channels: 4, background: transparent } })
      .composite(frames.map((input, i) => ({ input, left: (i % 4) * 96, top: Math.floor(i / 4) * 96 })))
      .png().toFile(path.join(output, 'cats', `${name}.png`));
    await fs.writeFile(path.join(output, 'cats', `${name}-portrait.png`), frames[15]);
    await fitSprite(cells[0], 40, 56, `tex/player_${name}.png`);
  }
  const monsterNames = ['bangul','gong','laser','nabi','pari','robo','dustmote','lonesome','straykitten','sockslinker','yarnroller','crumbhopper','mothcircler','rcracer'];
  const { MONSTER_TYPES } = await import('../src/data/monsters.js');
  const monsterCells = await components('monsters', 4, 4);
  for (let i = 0; i < monsterNames.length; i++) {
    const key = monsterNames[i], cfg = MONSTER_TYPES[key];
    await fitSprite(monsterCells[i], cfg.width, cfg.height, `tex/monster_${key}.png`);
  }
  await fitSprite(monsterCells[14], 96, 40, 'tex/ambush_vroom.png');
  await fitSprite(monsterCells[15], 76, 64, 'tex/ambush_rumble.png');
  await fitSprite(monsterCells[6], 20, 20, 'tex/proj_dust.png');
  const bossCells = await components('bosses', 3, 2);
  const bosses = [['boss_hug_guardian',140,160],['boss_vacuum_king',120,150],['boss_dr_embrace',90,120],['boss_biggie',150,130],['proj_arm',120,50],['proj_arm_dr',110,44]];
  for (let i = 0; i < bosses.length; i++) { const [key,w,h] = bosses[i]; await fitSprite(bossCells[i],w,h,`tex/${key}.png`); }
  const propCells = await components('props', 4, 4);
  const props = [['npc',36,52],['npc_owen',36,52],['npc_nurse',36,52],['npc_gear',36,52],['npc_plush',36,52],['npc_hound',36,52],['drop_treat',16,16],['drop_cookie',16,16],['drop_milk',14,18],['cage',96,76],['portal',48,64],['portal_hidden',48,64],['fx_wind',88,52],['fx_paw',64,52],['proj_bark',26,18],['fx_hit',28,28]];
  for (let i = 0; i < props.length; i++) { const [key,w,h] = props[i]; await fitSprite(propCells[i],w,h,`tex/${key}.png`); }
  await fitSprite((await components('haku', 1, 1))[0], 36, 52, 'tex/npc_hedgehog.png');
  for (const [name,cols,rows,keys,size] of [
    ['backgrounds',3,3,['shelter','garden','living','kitchen','library','workshop','attic','bedroom','cellar'],[512,342]],
    ['terrain',4,2,['grass','wood','shelter','kitchen','books','workshop','magic','cellar'],[128,128]],
  ]) {
    const file=path.join(source,`${name}.png`), meta=await sharp(file).metadata();
    for (let i=0;i<keys.length;i++) {
      const x=Math.round((i%cols)*meta.width/cols),y=Math.round(Math.floor(i/cols)*meta.height/rows);
      const width=Math.round((i%cols+1)*meta.width/cols)-x,height=Math.round((Math.floor(i/cols)+1)*meta.height/rows)-y;
      await sharp(file).extract({left:x,top:y,width,height}).resize(...size,{kernel:'nearest'}).png()
        .toFile(path.join(output,'world',`${name==='terrain'?'tile':'bg'}_${keys[i]}.png`));
    }
  }
  await sharp(path.join(source,'ship.png')).resize(1200,800,{kernel:'nearest'}).png().toFile(path.join(output,'world','travel_ship.png'));
  await sharp(path.join(source,'voyage.png')).resize(1536,512,{kernel:'nearest'}).png().toFile(path.join(output,'world','bg_voyage.png'));
  console.log('Prepared cat animation sheets, portraits, world art, and all entity textures.');
}
main().catch(err=>{console.error(err);process.exitCode=1;});
