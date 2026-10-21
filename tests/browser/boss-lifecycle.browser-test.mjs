// What happens around the attacks: phase changes, the roar, guard, slow/stun
// from real hits, summoned minions, and every way a fight can end. Runs the
// real bosses in headless Chromium with time stepped by hand.
//
// Run: npm run test:browser (needs Chromium: npx playwright-core install chromium)

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { launchBrowser, openGame, startServer } from './harness.mjs';

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

// A page for the duration of fn, always closed afterwards
async function withGame(options, fn) {
  const game = await openGame(browser, server.url, options);
  try {
    await fn(game);
    assert.deepEqual(game.errors, [], 'the page logged errors');
  } finally {
    await game.page.close();
  }
}

// ----- in-page helpers (serialized into the page: no closures) -----

// Every pattern of every phase: start it, let it finish and fade, and check
// it left nothing behind (effects, projectiles, tints, hover lane, scale).
const runEveryPattern = (scene) => {
  const boss = scene.boss;
  const problems = [];
  const step = (ms) => {
    for (let t = 0; t < ms; t += window.BOT.dt) {
      boss.nextPickAt = Infinity;
      window.BOT.step(window.__game);
    }
  };
  boss.phases.forEach((phase, index) => phase.patterns.forEach((pattern) => {
    const name = `phase ${index + 1} ${pattern.id}`;
    window.BOT.resetBoss(scene);
    window.BOT.setPhase(boss, index);
    scene.player.hp = scene.player.maxHp = 100000;
    scene.player.clearStatus();
    scene.player.sprite.body.reset(200, boss.groundSurface() - 40);
    scene.player.sprite.setVelocity(0, 0);

    if (!boss.startPatternById(pattern.id)) {
      problems.push(`${name}: did not start`);
      return;
    }
    let waited = 0;
    while ((boss.runs.length > 0 || boss.projectiles.length > 0) && waited < 25000) {
      step(100);
      waited += 100;
    }
    if (waited >= 25000) problems.push(`${name}: still running after 25s`);
    step(3000); // callouts and rings fade on tweens
    scene.removeMinions(boss);
    boss.minions = [];
    step(1000);

    if (boss.fx.size > 0) problems.push(`${name}: left ${boss.fx.size} effect objects`);
    if (boss.invulnerable.size > 0) problems.push(`${name}: still invulnerable (${[...boss.invulnerable]})`);
    if (boss.hoverOverrideY !== null) problems.push(`${name}: still on a hover lane`);
    if (boss.touchDamageOverride !== null) problems.push(`${name}: touch damage override not restored`);
    if (boss.contactSuppressed) problems.push(`${name}: contact damage still suppressed`);
    if (Object.keys(boss.tints).length > 0) problems.push(`${name}: tint layers left (${Object.keys(boss.tints)})`);
    if (Math.abs(boss.sprite.scaleX / boss.art.scale - 1) > 0.01 || Math.abs(boss.sprite.scaleY / boss.art.scale - 1) > 0.01) {
      problems.push(`${name}: body scale not restored`);
    }
    if (scene.monsters.some((m) => m.summoned && !m.discard)) problems.push(`${name}: minions left behind`);
  }));
  return problems;
};

// An idle player in front of a boss that fights by itself through the HP
// fractions in `arg.fractions`; checks the rules the brain promises.
const naturalFight = (scene, arg) => {
  const boss = scene.boss;
  window.BOT.resetBoss(scene);
  window.BOT.parked = false;
  boss.nextPickAt = 0;
  boss.rng = window.BOT.rng(11);
  scene.player.sprite.body.reset(arg.spawnX, boss.groundSurface() - 40);

  const stats = {
    maxMinions: 0,
    exclusiveViolations: 0,
    foreignPatterns: 0,
    phasesSeen: [],
    overlapsByPhase: {},
    belowFloor: 0,
  };
  const original = boss.startPattern.bind(boss);
  boss.startPattern = (pattern) => {
    if (!boss.phase.patterns.includes(pattern)) stats.foreignPatterns += 1;
    return original(pattern);
  };

  for (const fraction of arg.fractions) {
    if (boss.hp > boss.maxHp * fraction) {
      boss.hp = boss.maxHp * fraction + 1;
      boss.applyDamage(1);
    }
    for (let t = 0; t < arg.msPerPhase; t += window.BOT.dt) {
      scene.player.hp = 1e6;
      window.BOT.step(window.__game);
      if (!scene.boss) break;
      if (!stats.phasesSeen.includes(boss.phaseIndex)) stats.phasesSeen.push(boss.phaseIndex);
      stats.maxMinions = Math.max(stats.maxMinions, scene.monsters.filter((m) => m.summoned && !m.discard && !m.isDying).length);
      if (boss.runs.filter((run) => !run.pattern.overlap).length > 1) stats.exclusiveViolations += 1;
      if (boss.runs.length > 1) {
        const key = boss.runs.map((run) => run.pattern.id).sort().join('+');
        stats.overlapsByPhase[boss.phaseIndex] = { ...(stats.overlapsByPhase[boss.phaseIndex] || {}), [key]: true };
      }
      if (boss.sprite.y > scene.mapData.height) stats.belowFloor += 1;
    }
  }
  boss.startPattern = original;
  window.BOT.parked = true;
  return stats;
};

describe('Hug Guardian: phases and effects (attic)', () => {
  let game;
  before(async () => { game = await openGame(browser, server.url, { mapKey: 'attic', characterId: 'seoli', level: 10 }); });
  after(async () => { await game.page.close(); });

  it('changes phase strictly below 60% and 30%, with an invulnerable roar that absorbs hits', async () => {
    const result = await game.scene((scene) => {
      window.BOT.resetBoss(scene);
      const boss = scene.boss;
      const out = {};
      boss.hp = 4201; // 60% of 7000 is 4200
      boss.applyDamage(1);
      out.atSixty = { hp: boss.hp, phase: boss.phaseIndex };
      boss.applyDamage(1);
      out.belowSixty = { hp: boss.hp, phase: boss.phaseIndex, roar: boss.invulnerable.has('roar') };
      boss.applyDamage(500);
      out.hpAfterRoarHit = boss.hp;
      return out;
    });
    assert.deepEqual(result.atSixty, { hp: 4200, phase: 0 }, 'exactly 60% is still phase 1');
    assert.deepEqual(result.belowSixty, { hp: 4199, phase: 1, roar: true });
    assert.equal(result.hpAfterRoarHit, 4199, 'a hit during the roar is absorbed');

    await game.advance(1100);
    const after = await game.scene((scene) => {
      const boss = scene.boss;
      const invulnerable = boss.invulnerable.size;
      boss.applyDamage(100);
      const landed = boss.hp === 4099;
      boss.hp = 2101;
      boss.applyDamage(1);
      const atThirty = { hp: boss.hp, phase: boss.phaseIndex };
      boss.applyDamage(1);
      return { invulnerable, landed, atThirty, phaseBelowThirty: boss.phaseIndex, enraged: boss.speedMult };
    });
    assert.equal(after.invulnerable, 0, 'the roar ends after about a second');
    assert.equal(after.landed, true, 'hits land again afterwards');
    assert.deepEqual(after.atThirty, { hp: 2100, phase: 1 }, 'exactly 30% is still phase 2');
    assert.equal(after.phaseBelowThirty, 2);
    assert.equal(after.enraged, 1.3, 'the last phase is faster');
  });

  it('a phase change cancels the running pattern, then the fight carries on', async () => {
    await game.scene((scene) => {
      window.BOT.resetBoss(scene);
      const boss = scene.boss;
      scene.player.sprite.body.reset(boss.sprite.x - 300, boss.groundSurface() - 40);
      boss.startPatternById('hugGrab');
      boss.hp = 4201;
      boss.applyDamage(2);
      window.BOT.parked = false; // the fight carries on by itself from here
    });
    const during = await game.scene((scene) => ({ runs: scene.boss.runs.length, fx: scene.boss.fx.size, phase: scene.boss.phaseIndex }));
    assert.equal(during.runs, 0, 'the telegraph is cancelled');
    assert.equal(during.phase, 1);
    await game.advance(1000 + 1200 + 1500);
    const later = await game.scene((scene) => {
      window.BOT.parked = true;
      return { started: scene.boss.history.length, inRoar: scene.boss.invulnerable.size };
    });
    assert.equal(later.inRoar, 0);
    assert.ok(later.started > 0, 'the boss keeps attacking after the roar');
  });

  it('Cuddle Shield: no damage while guarding, normal damage afterwards', async () => {
    await game.scene((scene) => {
      window.BOT.resetBoss(scene);
      window.BOT.setPhase(scene.boss, 2);
      scene.player.sprite.body.reset(scene.boss.sprite.x - 400, scene.boss.groundSurface() - 40);
      scene.boss.startPatternById('cuddleShield');
    });
    await game.advance(750);
    const guarding = await game.scene((scene) => {
      const boss = scene.boss;
      const before = boss.hp;
      boss.applyDamage(100);
      return { guard: boss.invulnerable.has('guard'), unchanged: boss.hp === before };
    });
    assert.deepEqual(guarding, { guard: true, unchanged: true });
    await game.advance(3300);
    const afterGuard = await game.scene((scene) => {
      const boss = scene.boss;
      const before = boss.hp;
      boss.applyDamage(100);
      return { guard: boss.invulnerable.has('guard'), lost: before - boss.hp };
    });
    assert.deepEqual(afterGuard, { guard: false, lost: 100 });
  });

  it('Paw Swipe slows from phase 2, Hug Grab stuns once and then the cat is immune for 2s', async () => {
    const swipe = await game.trial((scene) => ({
      spawnX: scene.boss.sprite.x - 70 - 50,
      start: (s) => { window.BOT.setPhase(s.boss, 1); s.boss.startPatternById('pawSwipe'); },
      policy: () => ({}),
      until: (s, t) => window.BOT.patternOver(s, t),
      maxMs: 3000,
    }));
    assert.equal(swipe.lost, 18);
    const slowed = await game.scene((scene) => ({ slowed: scene.player.isSlowed(), stunned: scene.player.isStunned() }));
    assert.deepEqual(slowed, { slowed: true, stunned: false });

    const grab = await game.trial((scene) => ({
      spawnX: scene.boss.sprite.x - 300,
      start: (s) => { s.boss.startPatternById('hugGrab'); },
      policy: () => ({}),
      until: (s, t) => t > 900 + 200,
      maxMs: 3000,
    }));
    assert.equal(grab.lost, 25);
    assert.equal(grab.stunned, true, 'Hug Grab stuns');

    // stun lasts 1.2s; a second grab 1.3s later lands inside the 2s immunity
    await game.advance(1300);
    const second = await game.scene((scene) => {
      const hp = scene.player.hp;
      scene.boss.startPatternById('hugGrab');
      return hp;
    });
    await game.advance(1100);
    const afterSecond = await game.scene((scene, hp) => ({ lost: hp - scene.player.hp, stunned: scene.player.isStunned() }), second);
    assert.deepEqual(afterSecond, { lost: 25, stunned: false });
  });

  it('Call Friends: at most 4 minions, they pay nothing and fade away when killed', async () => {
    const result = await game.scene((scene) => {
      window.BOT.resetBoss(scene);
      const boss = scene.boss;
      scene.player.sprite.body.reset(boss.sprite.x - 500, boss.groundSurface() - 40);
      const alive = () => scene.monsters.filter((m) => m.summoned && !m.discard && !m.isDying).length;
      const cast = () => {
        boss.startPatternById('callFriends');
        for (let t = 0; t < 1400; t += window.BOT.dt) { boss.nextPickAt = Infinity; window.BOT.step(window.__game); }
      };
      const counts = [];
      for (let i = 0; i < 3; i += 1) { cast(); counts.push(alive()); }

      const reward = () => scene.player.level * 100000 + scene.player.exp * 10 + scene.player.treats;
      const before = reward();
      const target = scene.monsters.find((m) => m.summoned && !m.discard);
      target.hp = 1;
      scene.killMonster(target);
      for (let t = 0; t < 1000; t += window.BOT.dt) { boss.nextPickAt = Infinity; window.BOT.step(window.__game); }
      return { counts, rewardChange: reward() - before, afterKill: alive(), listed: scene.monsters.includes(target) };
    });
    assert.deepEqual(result.counts, [2, 4, 4], 'the cap is 4 however often it calls');
    assert.equal(result.rewardChange, 0, 'no EXP, treats or drops');
    assert.equal(result.afterKill, 3);
    assert.equal(result.listed, false, 'a killed minion leaves the monster list (no respawn)');
  });

  it('every pattern completes cleanly and leaves nothing behind', async () => {
    assert.deepEqual(await game.scene(runEveryPattern), []);
  });

  it('fights through all three phases on its own without breaking its rules', async () => {
    const stats = await game.scene(naturalFight, { fractions: [0.9, 0.7, 0.45, 0.2, 0.08], msPerPhase: 40000, spawnX: 950 });
    assert.deepEqual(stats.phasesSeen.sort(), [0, 1, 2]);
    assert.ok(stats.maxMinions <= 4, `${stats.maxMinions} minions alive at once`);
    assert.equal(stats.exclusiveViolations, 0, 'two non-overlapping patterns ran at once');
    assert.equal(stats.foreignPatterns, 0, 'a pattern from another phase was picked');
  });
});

describe('Vacuum King: effects (closet)', () => {
  let game;
  before(async () => { game = await openGame(browser, server.url, { mapKey: 'closet', characterId: 'seoli', level: 14 }); });
  after(async () => { await game.page.close(); });

  it('Floor Sweep flattens the boss, drops it to the floor and restores it', async () => {
    await game.scene((scene) => {
      window.BOT.resetBoss(scene);
      scene.player.sprite.body.reset(250, scene.boss.groundSurface() - 40);
      scene.boss.startPatternById('floorSweep');
    });
    await game.advance(980);
    const wound = await game.scene((scene) => ({
      flat: scene.boss.sprite.scaleY / scene.boss.art.scale,
      lowered: scene.boss.sprite.y > 650,
    }));
    assert.ok(Math.abs(wound.flat - 0.45) < 0.05, `flattened to ${wound.flat}`);
    assert.equal(wound.lowered, true, 'on the floor lane by the time it charges');

    await game.advance(300);
    assert.equal(await game.scene((scene) => scene.boss.contactSuppressed), true, 'the sweep replaces the touch damage while it charges');

    await game.advance(6000);
    const done = await game.scene((scene) => ({
      runs: scene.boss.runs.length,
      scale: scene.boss.sprite.scaleY / scene.boss.art.scale,
      lane: scene.boss.hoverOverrideY,
      suppressed: scene.boss.contactSuppressed,
    }));
    assert.deepEqual(done, { runs: 0, scale: 1, lane: null, suppressed: false });
  });

  it('Full Power Suction drops the boss and makes touching it hurt, then restores both', async () => {
    await game.scene((scene) => {
      window.BOT.resetBoss(scene);
      window.BOT.setPhase(scene.boss, 2);
      scene.player.sprite.body.reset(250, scene.boss.groundSurface() - 40);
      scene.boss.startPatternById('fullSuction');
    });
    await game.advance(1500);
    const pulling = await game.scene((scene) => ({
      touch: scene.boss.touchDamage(),
      lowered: scene.boss.sprite.y > 600,
      holdsStill: Math.abs(scene.boss.sprite.body.velocity.x) < 1,
    }));
    assert.deepEqual(pulling, { touch: 55, lowered: true, holdsStill: true });

    await game.advance(3500);
    const done = await game.scene((scene) => ({ touch: scene.boss.touchDamage(), lane: scene.boss.hoverOverrideY, runs: scene.boss.runs.length }));
    assert.deepEqual(done, { touch: 25, lane: null, runs: 0 });
  });

  it('Call Flies summons pari that count toward the cap of 4', async () => {
    const result = await game.scene((scene) => {
      window.BOT.resetBoss(scene);
      window.BOT.setPhase(scene.boss, 1);
      scene.player.sprite.body.reset(250, scene.boss.groundSurface() - 40);
      const types = [];
      for (let i = 0; i < 3; i += 1) {
        scene.boss.startPatternById('callFlies');
        for (let t = 0; t < 1400; t += window.BOT.dt) { scene.boss.nextPickAt = Infinity; window.BOT.step(window.__game); }
        types.push(scene.monsters.filter((m) => m.summoned && !m.discard).map((m) => m.type).join(','));
      }
      return types;
    });
    assert.deepEqual(result, ['pari,pari', 'pari,pari,pari,pari', 'pari,pari,pari,pari']);
  });

  it('every pattern completes cleanly and leaves nothing behind', async () => {
    assert.deepEqual(await game.scene(runEveryPattern), []);
  });

  it('suction and dust balls overlap from phase 2 on, never in phase 1, and nothing else ever does', async () => {
    const stats = await game.scene(naturalFight, { fractions: [0.99, 0.7, 0.45, 0.2, 0.08], msPerPhase: 70000, spawnX: 250 });
    assert.deepEqual(stats.phasesSeen.sort(), [0, 1, 2]);
    assert.ok(stats.maxMinions <= 4, `${stats.maxMinions} minions alive at once`);
    assert.equal(stats.exclusiveViolations, 0);
    assert.equal(stats.foreignPatterns, 0);
    assert.equal(stats.belowFloor, 0, 'the boss never sank through the floor');
    assert.equal(stats.overlapsByPhase[0], undefined, 'phase 1 runs one pattern at a time');
    for (const phase of [1, 2]) {
      assert.deepEqual(Object.keys(stats.overlapsByPhase[phase] || {}), ['dustBalls+suction'], `phase ${phase + 1} overlaps`);
    }
  });
});

describe('Dr. Embrace: the tutorial boss (shelter yard)', () => {
  let game;
  before(async () => { game = await openGame(browser, server.url, { mapKey: 'shelter_yard', characterId: 'seoli', level: 2 }); });
  after(async () => { await game.page.close(); });

  it('adds the Check-up Hug when it drops below 50%', async () => {
    const result = await game.scene((scene) => {
      window.BOT.resetBoss(scene);
      const boss = scene.boss;
      const before = boss.phase.patterns.map((p) => p.id);
      boss.hp = Math.floor(boss.maxHp * 0.5) + 1;
      boss.applyDamage(1);
      boss.applyDamage(1);
      return { before, phase: boss.phaseIndex, after: boss.phase.patterns.map((p) => p.id), roar: boss.invulnerable.has('roar') };
    });
    assert.deepEqual(result.before, ['armReach', 'checkupSlam']);
    assert.equal(result.phase, 1);
    assert.deepEqual(result.after, ['armReach', 'checkupSlam', 'checkupHug']);
    assert.equal(result.roar, true);
  });

  it('every pattern completes cleanly and leaves nothing behind', async () => {
    assert.deepEqual(await game.scene(runEveryPattern), []);
  });

  it('fights through both phases on its own without breaking its rules', async () => {
    const stats = await game.scene(naturalFight, { fractions: [0.9, 0.4], msPerPhase: 60000, spawnX: 500 });
    assert.deepEqual(stats.phasesSeen.sort(), [0, 1]);
    assert.equal(stats.exclusiveViolations, 0);
    assert.equal(stats.foreignPatterns, 0);
  });
});

describe('the end of a fight', () => {
  it('the player dying mid-telegraph cancels the pattern', async () => {
    await withGame({ mapKey: 'attic' }, async (game) => {
      await game.scene((scene) => {
        window.BOT.resetBoss(scene);
        scene.player.sprite.body.reset(scene.boss.sprite.x - 300, scene.boss.groundSurface() - 40);
        scene.boss.startPatternById('hugGrab');
      });
      await game.advance(400);
      await game.scene((scene) => scene.player.takeDamage(scene.player.hp, 1));
      await game.advance(200);
      const state = await game.scene((scene) => ({ hp: scene.player.hp, runs: scene.boss.runs.length }));
      assert.deepEqual(state, { hp: 0, runs: 0 });
      // the red zone is gone; only the pattern's name callout is left, fading on its own
      await game.advance(2000);
      assert.equal(await game.scene((scene) => scene.boss.fx.size), 0);
    });
  });

  it('defeating the Hug Guardian mid-pattern pays out, records the kill and clears minions and effects', async () => {
    await withGame({ mapKey: 'attic' }, async (game) => {
      await game.scene((scene) => {
        window.BOT.resetBoss(scene);
        window.BOT.setPhase(scene.boss, 1);
        scene.player.sprite.body.reset(scene.boss.sprite.x - 500, scene.boss.groundSurface() - 40);
        scene.boss.startPatternById('callFriends');
        for (let t = 0; t < 1400; t += window.BOT.dt) { scene.boss.nextPickAt = Infinity; window.BOT.step(window.__game); }
        scene.boss.startPatternById('groupHug');
        window.__boss = scene.boss;
        window.__rewardBefore = scene.player.level * 100000 + scene.player.exp;
      });
      await game.advance(500);
      const kill = await game.scene((scene) => {
        const boss = scene.boss;
        const minions = scene.monsters.filter((m) => m.summoned && !m.discard).length;
        boss.hp = 1;
        boss.applyDamage(5);
        return {
          minions,
          defeated: boss.defeated,
          sceneBoss: scene.boss,
          fx: boss.fx.size,
          runs: boss.runs.length,
          flag: window.bosoDev.SaveManager.getFlag('hugGuardianDefeated'),
          respawnWatch: scene.bossRespawn && scene.bossRespawn.phase,
        };
      });
      assert.equal(kill.minions, 2);
      assert.equal(kill.defeated, true);
      assert.equal(kill.sceneBoss, null);
      assert.equal(kill.fx, 0);
      assert.equal(kill.runs, 0);
      assert.equal(kill.flag, true);
      assert.equal(kill.respawnWatch, 'waiting');

      await game.advance(1500);
      const after = await game.scene((scene) => ({
        summoned: scene.monsters.filter((m) => m.summoned).length,
        paid: scene.player.level * 100000 + scene.player.exp > window.__rewardBefore,
        fx: window.__boss.fx.size,
      }));
      assert.deepEqual(after, { summoned: 0, paid: true, fx: 0 });
    });
  });

  it('leaving the map mid-fight and coming back gives a fresh boss at full HP', async () => {
    await withGame({ mapKey: 'attic' }, async (game) => {
      await game.scene((scene) => {
        window.BOT.resetBoss(scene);
        window.BOT.setPhase(scene.boss, 2);
        scene.boss.hp = scene.boss.maxHp * 0.2;
        scene.boss.startPatternById('callFriends');
        for (let t = 0; t < 1200; t += window.BOT.dt) { scene.boss.nextPickAt = Infinity; window.BOT.step(window.__game); }
        scene.boss.startPatternById('groupHug');
        scene.changeMap('playroom', 3040, 680);
      });
      await game.advance(1500);
      assert.deepEqual(await game.scene((scene) => ({ map: scene.currentMapKey, boss: !!scene.boss })), { map: 'playroom', boss: false });

      await game.scene((scene) => scene.changeMap('attic', 120, 680));
      await game.advance(1500);
      const back = await game.scene((scene) => ({
        map: scene.currentMapKey,
        hp: scene.boss.hp,
        max: scene.boss.maxHp,
        phase: scene.boss.phaseIndex,
        summoned: scene.monsters.filter((m) => m.summoned).length,
      }));
      assert.deepEqual(back, { map: 'attic', hp: 7000, max: 7000, phase: 0, summoned: 0 });
    });
  });

  it('defeating the Vacuum King mid-pattern starts the ending and clears every effect', async () => {
    await withGame({ mapKey: 'closet', level: 14 }, async (game) => {
      await game.scene((scene) => {
        window.BOT.resetBoss(scene);
        window.BOT.setPhase(scene.boss, 2);
        scene.player.sprite.body.reset(250, scene.boss.groundSurface() - 40);
        scene.boss.startPatternById('suction');
        scene.boss.startPatternById('dustBalls');
        window.__boss = scene.boss;
      });
      await game.advance(1000);
      const kill = await game.scene((scene) => {
        const boss = scene.boss;
        const running = boss.runs.map((run) => run.pattern.id).sort();
        const shotsInFlight = boss.projectiles.length;
        boss.hp = 1;
        boss.applyDamage(5);
        return {
          running,
          shotsInFlight,
          defeated: boss.defeated,
          fx: boss.fx.size,
          shots: boss.projectiles.length,
          flag: window.bosoDev.SaveManager.getFlag('vacuumKingDefeated'),
          cleared: window.bosoDev.SaveManager.getFlag('demoCleared'),
          ending: scene.isTransitioning,
        };
      });
      assert.deepEqual(kill.running, ['suction'], 'the suction is still pulling when the boss falls');
      assert.equal(kill.shotsInFlight, 3, 'and the dust balls are still flying');
      assert.deepEqual(
        { defeated: kill.defeated, fx: kill.fx, shots: kill.shots, flag: kill.flag, cleared: kill.cleared, ending: kill.ending },
        { defeated: true, fx: 0, shots: 0, flag: true, cleared: true, ending: true }
      );
    });
  });
});
