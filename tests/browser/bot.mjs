// tests/browser/bot.mjs
// The in-page half of the browser tests: `installBot` is serialized into the
// page (so it may not close over anything) and defines window.BOT, a
// reaction-delay dodge bot.
//
// A trial puts the player somewhere, starts one boss pattern and plays a
// policy for as long as the pattern lasts. The policy only starts reacting
// BOT.LATENCY ms after the telegraph appears (a human's reaction time) and
// presses keys exactly like a player: the cats' real physics apply.
//
//   spec(scene, args) -> {
//     spawnX            where the player stands (feet on the floor)
//     start(scene)      starts the pattern (and may reposition the player)
//     policy(scene, t)  -> { left, right, jump } for this frame
//     until(scene, t)   true once the trial is over
//     maxMs             hard stop
//   }

export function installBot() {
  const dt = 1000 / 60;

  // Small seeded rng so a boss's own random choices (arm side, burst spots,
  // summon side) repeat from run to run
  const mulberry32 = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  window.BOT = {
    LATENCY: 250,
    dt,
    rng: mulberry32,

    // While parked the boss never picks a pattern by itself: only the ones a
    // test starts run. Tests that need the live scheduler set this to false.
    parked: true,

    step(game) {
      if (window.BOT.parked) {
        const boss = game.scene.getScene('GameScene').boss;
        if (boss) boss.nextPickAt = Infinity;
      }
      window.__t += dt;
      window.__simNow += dt;
      game.headlessStep(window.__t, dt);
    },

    setKeys(scene, keys) {
      scene.cursors.left.isDown = !!keys.left;
      scene.cursors.right.isDown = !!keys.right;
      scene.cursors.up.isDown = false;
      scene.cursors.down.isDown = false;
      scene.keys.alt.isDown = !!keys.jump;
      scene.keys.ctrl.isDown = !!keys.attack;
    },

    // The map's own monsters would muddy "no damage taken" (a pari flying by
    // is not what the test is about): switch them off
    hideMapMonsters(scene) {
      scene.monsters.forEach((monster) => {
        monster.sprite.setActive(false).setVisible(false);
        monster.sprite.body.enable = false;
        monster.hpBar.setVisible(false);
        monster.hpBarBg.setVisible(false);
      });
    },

    // True once the pattern has finished (and at least minMs have passed)
    patternOver(scene, t, minMs = 300) {
      return t > minMs && scene.boss.runs.length === 0;
    },

    // Moves the player well outside a running fieldWide's green safe zone, so
    // standing still (or jumping) is what decides the outcome
    awayFromSafeZone(scene) {
      const run = scene.boss.runs[0];
      const { safeRadius } = run.params;
      const x = scene.player.sprite.x;
      if (Math.abs(x - run.safeX) > safeRadius + 60) return;
      const left = run.safeX - safeRadius - 120;
      const right = run.safeX + safeRadius + 120;
      const useRight = right <= scene.mapData.width - 60 && (left < 60 || Math.abs(right - x) < Math.abs(left - x));
      scene.player.sprite.body.reset(useRight ? right : left, scene.boss.groundSurface() - 40);
    },

    // What PatternBoss does when a phase begins, without the roar
    setPhase(boss, index) {
      boss.phaseIndex = index;
      const enrage = boss.phases[index].enrage;
      boss.speedMult = enrage ? enrage.speedMult : 1;
    },

    // Every trial starts from the boss's spawn state
    resetBoss(scene) {
      const boss = scene.boss;
      boss.cancelRuns();
      boss.projectiles.forEach((shot) => boss.destroyFx(shot.sprite));
      boss.projectiles = [];
      boss.sprite.body.reset(boss.startX, boss.baseY);
      boss.sprite.setVelocity(0, 0);
      boss.direction = 1;
      boss.phaseIndex = 0;
      boss.speedMult = 1;
      boss.hp = boss.maxHp;
      boss.invulnerable.clear();
      boss.hoverOverrideY = null;
      boss.touchDamageOverride = null;
      boss.contactSuppressed = false;
      boss.contactCooldown = false;
      boss.history = [];
      boss.cooldowns = {};
      boss.nextPickAt = Infinity;
      window.BOT.parked = true;
      boss.rng = mulberry32(7);
      boss.restoreScale();
    },

    async trial(game, scene, make, options) {
      const boss = scene.boss;
      const player = scene.player;
      window.BOT.resetBoss(scene);
      player.maxHp = player.hp = 100000;
      player.clearStatus();
      player.isKnockedBack = false;

      const spec = make(scene);
      player.sprite.body.reset(spec.spawnX, boss.groundSurface() - 40);
      player.sprite.setVelocity(0, 0);
      for (let i = 0; i < 20; i += 1) window.BOT.step(game); // let the player land

      const hp0 = player.hp;
      spec.start(scene);
      let t = 0;
      let firstHitMs = null;
      while (t < spec.maxMs) {
        const keys = options.idle ? {} : (spec.policy(scene, t) || {});
        window.BOT.setKeys(scene, keys);
        boss.nextPickAt = Infinity; // only the pattern under test runs
        const before = player.hp;
        window.BOT.step(game);
        t += dt;
        if (player.hp < before && firstHitMs === null) firstHitMs = Math.round(t);
        if (spec.until(scene, t)) break;
      }
      window.BOT.setKeys(scene, {});
      return { lost: hp0 - player.hp, firstHitMs, stunned: player.isStunned(), ms: Math.round(t) };
    },
  };
}
