// "Every damaging attack is avoidable by reacting to its telegraph."
//
// A bot that starts reacting 250ms after the telegraph appears plays each
// boss attack with BOTH cats' real physics (tests/browser/bot.mjs); it must
// take no damage. Each attack also has a negative control: a player who does
// nothing must get hurt, otherwise "no damage" would prove nothing.
//
// Run: npm run test:browser (needs Chromium: npx playwright-core install chromium)

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { launchBrowser, openGame, startServer } from './harness.mjs';
import { SUITES } from './scenarios.mjs';

const CATS = ['seoli', 'bomi'];

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

for (const suite of SUITES) {
  for (const characterId of CATS) {
    describe(`${suite.boss} (${characterId}, level ${suite.level})`, () => {
      let game;

      before(async () => {
        game = await openGame(browser, server.url, { mapKey: suite.mapKey, characterId, level: suite.level });
      });

      after(async () => {
        await game.page.close();
      });

      for (const scenario of suite.scenarios) {
        it(scenario.name, async () => {
          for (let run = 1; run <= scenario.repeats; run += 1) {
            const result = await game.trial(scenario.spec, scenario.args, { idle: !!scenario.idle });
            if (scenario.expect === 'dodged') {
              assert.equal(
                result.lost,
                0,
                `run ${run}: lost ${result.lost} HP (first hit at ${result.firstHitMs}ms into the attack)`
              );
            } else {
              assert.ok(result.lost > 0, `run ${run}: standing still should hurt, but no damage was taken`);
            }
          }
        });
      }

      it('logs no console errors', () => {
        assert.deepEqual(game.errors, []);
      });
    });
  }
}
