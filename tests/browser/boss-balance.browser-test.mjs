// The fight-length model (src/data/bossBalance.js) says how long a boss fight
// lasts from the cats' combo DPS. This checks that DPS against the real game:
// hold the attack key on a boss that stands still and count the damage.
//
// Run: npm run test:browser (needs Chromium: npx playwright-core install chromium)

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { comboDps } from '../../src/data/bossBalance.js';
import { launchBrowser, openGame, startServer } from './harness.mjs';

const LEVEL = 10;
const MEASURE_MS = 20000;
const TOLERANCE = 0.05;

let server;
let browser;

before(async () => {
  server = await startServer();
  browser = await launchBrowser();
});

after(async () => {
  await browser.close();
  await server.close();
});

describe('combo DPS: the balance model matches the game', () => {
  for (const characterId of ['seoli', 'bomi']) {
    it(`${characterId} at level ${LEVEL}`, async () => {
      const game = await openGame(browser, server.url, { mapKey: 'attic', characterId, level: LEVEL });
      try {
        const measured = await game.scene((scene, ms) => {
          const boss = scene.boss;
          window.BOT.resetBoss(scene);
          boss.patrol = () => boss.sprite.setVelocityX(0); // a boss that walks away would hide hits
          boss.contactSuppressed = true;
          boss.hp = boss.maxHp = 1e9;                       // measure damage, never kill it
          scene.player.hp = scene.player.maxHp = 1e9;
          // a melee cat's usual distance: just off the boss's front edge, facing it
          scene.player.sprite.body.reset(boss.sprite.x - 70 - 40, boss.groundSurface() - 40);
          scene.player.facingRight = true;
          const before = boss.hp;
          const steps = Math.round(ms / window.BOT.dt);
          for (let i = 0; i < steps; i += 1) {
            window.BOT.setKeys(scene, { attack: true });
            boss.nextPickAt = Infinity;
            window.BOT.step(window.__game);
          }
          window.BOT.setKeys(scene, {});
          return (before - boss.hp) / (ms / 1000);
        }, MEASURE_MS);

        const model = comboDps(characterId, LEVEL);
        const error = Math.abs(measured / model - 1);
        assert.ok(
          error < TOLERANCE,
          `measured ${measured.toFixed(1)} dps vs model ${model.toFixed(1)} (${(error * 100).toFixed(1)}% off, allowed ${TOLERANCE * 100}%)`
        );
        assert.deepEqual(game.errors, []);
      } finally {
        await game.page.close();
      }
    });
  }
});
