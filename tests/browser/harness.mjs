// tests/browser/harness.mjs
// Boots the real game in headless Chromium so tests can drive a boss fight.
//
//   startServer()   a Vite dev server on a free port (the dev-only
//                   window.bosoDev hooks exist only in dev builds)
//   openGame()      a page with GameScene started on a map, the render loop
//                   stopped and time stepped by hand (see advance)
//
// Needs a Chromium that Playwright can find: `npx playwright-core install
// chromium` (or PLAYWRIGHT_BROWSERS_PATH). Run with `npm run test:browser`.

import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { installBot } from './bot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Headless Chromium cannot decode the BGM files and its software GL driver
// logs performance hints; neither says anything about the game.
const IGNORED_CONSOLE = [/decode audio data/i, /Error decoding audio/i, /Failed to process file.*audio/i, /GL Driver Message/i];
const isIgnored = (text) => IGNORED_CONSOLE.some((pattern) => pattern.test(text));

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

export async function startServer() {
  const port = await freePort();
  const server = await createServer({
    root: ROOT,
    logLevel: 'error',
    // Pre-bundle Phaser up front: a cold cache otherwise reloads the page mid-test
    optimizeDeps: { include: ['phaser'] },
    server: { host: '127.0.0.1', port, strictPort: true, open: false },
  });
  await server.listen();
  return { url: `http://127.0.0.1:${port}/`, close: () => server.close() };
}

export async function launchBrowser() {
  return chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
}

// Starts GameScene on `mapKey` as `characterId` at `level`. The map's own
// monsters are switched off unless quietMap is false, so damage taken comes
// from the boss alone. Trials give the player a huge HP pool: damage is
// measured as HP lost, never as a death.
export async function openGame(browser, serverUrl, { mapKey, characterId = 'seoli', level = 10, quietMap = true }) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (error) => { if (!isIgnored(error.message)) errors.push(`pageerror: ${error.message}`); });
  page.on('console', (message) => {
    if ((message.type() === 'error' || message.type() === 'warning') && !isIgnored(message.text())) {
      errors.push(`${message.type()}: ${message.text()}`);
    }
  });

  await page.goto(serverUrl);
  // bosoDev.game is a promise; resolve it once so the waits below can be
  // synchronous (Playwright does not wait for an async predicate)
  await page.waitForFunction(() => !!(window.bosoDev && window.bosoDev.game), null, { timeout: 60000 });
  await page.evaluate(async () => { window.__game = await window.bosoDev.game; });
  // PreloadScene hands over to the title (scene key 'MenuScene') once every asset is in
  await page.waitForFunction(() => window.__game.scene.isActive('MenuScene'), null, { timeout: 60000 });

  await page.evaluate(async ({ mapKey, characterId, level }) => {
    const game = await window.bosoDev.game;
    const saves = window.bosoDev.SaveManager;
    saves.startNewGame(1, characterId);
    saves.setCharacter(characterId, { level, exp: 0, treats: 0, items: { cookie: 5, milk: 5 }, quests: {} });
    game.scene.getScenes(true).forEach((scene) => game.scene.stop(scene.sys.settings.key));
    game.scene.start('GameScene', { mapKey, characterData: { id: characterId }, freshRun: true });
  }, { mapKey, characterId, level });
  await page.waitForFunction(() => {
    const scene = window.__game.scene.getScene('GameScene');
    return !!(scene && scene.player && scene.sys.isActive());
  }, null, { timeout: 30000 });

  // Deterministic time: stop the rAF loop and step frames by hand. Phaser's
  // tweens and the monster AI read Date.now(), so it follows the stepped clock.
  await page.evaluate(async () => {
    const game = await window.bosoDev.game;
    game.loop.stop();
    window.__t = performance.now();
    window.__simNow = Date.now();
    Date.now = () => window.__simNow;
  });
  await page.evaluate(installBot);
  if (quietMap) await page.evaluate(() => window.BOT.hideMapMonsters(window.__game.scene.getScene('GameScene')));

  // Runs fn(scene, arg) inside the page (fn must not close over anything)
  const scene = (fn, arg) => page.evaluate(async ({ src, arg }) => {
    const game = await window.bosoDev.game;
    const current = game.scene.getScene('GameScene');
    return (new Function('scene', 'arg', `return (${src})(scene, arg)`))(current, arg);
  }, { src: fn.toString(), arg });

  // Steps ms of game time at 60fps without rendering
  const advance = (ms) => page.evaluate(async (ms) => {
    const game = await window.bosoDev.game;
    const frames = Math.max(1, Math.round(ms / window.BOT.dt));
    for (let i = 0; i < frames; i += 1) window.BOT.step(game);
  }, ms);

  // One bot trial: spec(scene, args) -> { spawnX, start, policy, until, maxMs }
  // (see bot.mjs); options.idle replaces the policy with "do nothing".
  const trial = (spec, args = {}, options = {}) => page.evaluate(async ({ src, args, options }) => {
    const game = await window.bosoDev.game;
    const current = game.scene.getScene('GameScene');
    const make = new Function(`return (${src})`)();
    return window.BOT.trial(game, current, (s) => make(s, args), options);
  }, { src: spec.toString(), args, options });

  return { page, errors, scene, advance, trial };
}
