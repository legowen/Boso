// tests/browser/scenarios.mjs
// Dodge scenarios for the boss avoidance test. Every spec is serialized into
// the page, so it must not use anything from this module: only its arguments
// and window.BOT (see bot.mjs for the spec shape).
//
// `expect: 'dodged'`  a bot that reacts BOT.LATENCY ms after the telegraph
//                     appears must take no damage
// `expect: 'hurt'`    negative control: the same attack against a player who
//                     does nothing must hurt, or "dodged" would prove nothing

// ===== Hug Guardian (attic): the boss stands at x=1400 =====

const swipeStepBack = (s) => ({
  // right at the boss's front edge: a melee cat's usual distance
  spawnX: s.boss.sprite.x - 70 - 34 - 16,
  start: (s) => { s.boss.faceTowards(s.player.sprite.x); s.boss.startPatternById('pawSwipe'); },
  policy: (s, t) => (t >= window.BOT.LATENCY ? { left: true } : {}),
  until: (s, t) => window.BOT.patternOver(s, t),
  maxMs: 3000,
});

const swipeJump = (s) => ({
  spawnX: s.boss.sprite.x - 70 - 34 - 16,
  start: (s) => { s.boss.faceTowards(s.player.sprite.x); s.boss.startPatternById('pawSwipe'); },
  policy: (s, t) => (t >= window.BOT.LATENCY && t < window.BOT.LATENCY + 60 ? { jump: true } : {}),
  until: (s, t) => window.BOT.patternOver(s, t),
  maxMs: 3000,
});

const hugGrabStepOut = (s) => ({
  spawnX: s.boss.sprite.x - 300,
  start: (s) => { s.boss.startPatternById('hugGrab'); },
  policy: (s, t) => (t >= window.BOT.LATENCY ? { left: true } : {}),
  until: (s, t) => window.BOT.patternOver(s, t),
  maxMs: 3000,
});

// A fieldWide pattern (Group Hug / Check-up Hug) from `phase` on
const fieldWideJump = (s, { patternId, phase }) => ({
  spawnX: s.boss.sprite.x - 500,
  start: (s) => {
    window.BOT.setPhase(s.boss, phase);
    s.boss.startPatternById(patternId);
    window.BOT.awayFromSafeZone(s);
    window.__impactMs = s.boss.runs[0].pattern.telegraphMs;
  },
  // be in the air from 500ms before the impact (any jump covering it works)
  policy: (s, t) => (t >= window.__impactMs - 500 && t < window.__impactMs - 440 ? { jump: true } : {}),
  until: (s, t) => window.BOT.patternOver(s, t),
  maxMs: 5000,
});

const fieldWideSafeZone = (s, { patternId, phase }) => ({
  spawnX: s.boss.sprite.x - 500,
  start: (s) => {
    window.BOT.setPhase(s.boss, phase);
    s.boss.startPatternById(patternId);
    window.BOT.awayFromSafeZone(s);
    window.__safeX = s.boss.runs[0].safeX;
  },
  policy: (s, t) => {
    if (t < window.BOT.LATENCY) return {};
    const dx = window.__safeX - s.player.sprite.x;
    return Math.abs(dx) < 20 ? {} : { right: dx > 0, left: dx < 0 };
  },
  until: (s, t) => window.BOT.patternOver(s, t),
  maxMs: 5000,
});

// ===== Dr. Embrace (shelter_yard) =====

const armReachJump = (s, { dx }) => ({
  spawnX: s.boss.sprite.x + dx,
  start: (s) => { window.__jumped = false; s.boss.startPatternById('armReach'); },
  policy: (s, t) => {
    const arm = s.boss.projectiles[0];
    if (!arm || window.__jumped || t < window.BOT.LATENCY) return {};
    // seconds until the front of the 110px arm reaches the 32px cat; jump 0.25s early
    const speed = Math.abs(arm.sprite.body.velocity.x);
    const arrive = Math.max(0, Math.abs(arm.sprite.x - s.player.sprite.x) - 55 - 16) / speed;
    if (arrive <= 0.25) { window.__jumped = true; return { jump: true }; }
    return {};
  },
  until: (s, t) => t > 800 && s.boss.runs.length === 0 && s.boss.projectiles.length === 0,
  maxMs: 20000,
});

const checkupSlamStepOut = (s) => ({
  spawnX: s.boss.sprite.x - 300,
  start: (s) => { s.boss.startPatternById('checkupSlam'); },
  policy: (s, t) => (t >= window.BOT.LATENCY ? { left: true } : {}),
  until: (s, t) => window.BOT.patternOver(s, t, 400),
  maxMs: 4000,
});

// ===== Vacuum King (closet): hovers at x=1100, y=430; floor at y=740 =====

// Walk to the roomiest spot clear of every aimed line. A slanted ball path
// sweeps sideways across the 32x56 hurt box, and the 20px ball is up to 28px
// while it spins, hence the margins.
const dustBallsSidestep = (s, { dx }) => ({
  spawnX: s.boss.sprite.x + dx,
  start: (s) => { window.__target = undefined; s.boss.startPatternById('dustBalls'); },
  policy: (s, t) => {
    if (t < window.BOT.LATENCY) return {};
    const x = s.player.sprite.x;
    const run = s.boss.runs[0];
    if (window.__target === undefined && run) {
      const y = s.player.sprite.y;
      const halfHeight = 28 + 14;
      const pad = 16 + 14;
      const lines = run.shots.map((shot) => ({
        x: shot.x + (y - shot.y) / Math.tan(shot.angle),
        reach: halfHeight / Math.abs(Math.tan(shot.angle)) + pad,
      }));
      const margin = (px) => Math.min(...lines.map((line) => Math.abs(px - line.x) - line.reach));
      let best = x;
      let bestMargin = margin(x);
      for (let px = Math.max(40, x - 230); px <= Math.min(1560, x + 230); px += 4) {
        const m = margin(px);
        if (m > bestMargin + 1) { best = px; bestMargin = m; }
      }
      window.__target = best;
    }
    if (window.__target === undefined || Math.abs(window.__target - x) < 4) return {};
    return { right: window.__target > x, left: window.__target < x };
  },
  until: (s, t) => t > 600 && s.boss.runs.length === 0 && s.boss.projectiles.length === 0,
  maxMs: 8000,
});

// The flat boss crosses the floor: be in the air while it passes
const floorSweepJump = (s, { D, enraged }) => ({
  spawnX: s.boss.sprite.x - D,
  start: (s) => {
    if (enraged) window.BOT.setPhase(s.boss, 2);
    window.__distance = s.boss.sprite.x - s.player.sprite.x;
    s.boss.startPatternById('floorSweep');
    const { pattern } = s.boss.runs[0];
    window.__telegraphMs = pattern.telegraphMs;
    window.__sweepSpeed = pattern.params.speed * s.boss.speedMult;
  },
  policy: (s, t) => {
    const arrive = window.__telegraphMs + Math.max(0, ((window.__distance - 76) / window.__sweepSpeed) * 1000);
    const at = Math.max(window.BOT.LATENCY, arrive - 450);
    return t >= at && t < at + 60 ? { jump: true } : {};
  },
  until: (s, t) => t > 1200 && s.boss.runs.length === 0,
  maxMs: 8000,
});

// Walk to the nearest dodge pocket between the three bursts
const bagBurstPocket = (s) => ({
  spawnX: 800,
  start: (s) => {
    window.BOT.setPhase(s.boss, 2);
    s.boss.startPatternById('bagBurst');
    window.__zones = s.boss.runs[0].zones.map((zone) => [zone.x, zone.right]);
  },
  policy: (s, t) => {
    if (t < window.BOT.LATENCY) return {};
    const x = s.player.sprite.x;
    const margin = 24;
    const inZone = (px) => window.__zones.some(([a, b]) => px > a - margin && px < b + margin);
    if (!inZone(x)) return {};
    let best = null;
    for (let d = 1; d < 600 && best === null; d += 2) {
      for (const sign of [-1, 1]) {
        const px = x + sign * d;
        if (px > 40 && px < 1560 && !inZone(px)) { best = px; break; }
      }
    }
    return best === null ? {} : { right: best > x, left: best < x };
  },
  until: (s, t) => t > 1200 && s.boss.runs.length === 0,
  maxMs: 6000,
});

// Keep walking away from the boss: the pull is weaker than either cat
const fullSuctionWalkAway = (s, { dx }) => ({
  spawnX: s.boss.sprite.x + dx,
  start: (s) => { window.BOT.setPhase(s.boss, 2); s.boss.startPatternById('fullSuction'); },
  policy: (s, t) => {
    if (t < window.BOT.LATENCY) return {};
    const x = s.player.sprite.x;
    const away = x >= s.boss.sprite.x ? 1 : -1;
    const atWall = (away > 0 && x > 1540) || (away < 0 && x < 60);
    return atWall ? {} : { right: away > 0, left: away < 0 };
  },
  until: (s, t) => t > 1500 && s.boss.runs.length === 0,
  maxMs: 9000,
});

const dodged = (name, spec, args = {}) => ({ name, spec, args, repeats: 3, expect: 'dodged' });
const control = (name, spec, args = {}) => ({ name: `CONTROL ${name}`, spec, args, repeats: 1, idle: true, expect: 'hurt' });

export const SUITES = [
  {
    boss: 'hugGuardian',
    mapKey: 'attic',
    level: 10,
    scenarios: [
      dodged('Paw Swipe: step back', swipeStepBack),
      dodged('Paw Swipe: jump', swipeJump),
      dodged('Hug Grab: step out of the zone', hugGrabStepOut),
      dodged('Group Hug: airborne at the impact', fieldWideJump, { patternId: 'groupHug', phase: 1 }),
      dodged('Group Hug: stand in the safe zone', fieldWideSafeZone, { patternId: 'groupHug', phase: 1 }),
      control('Paw Swipe: standing still hurts', swipeStepBack),
      control('Hug Grab: standing still hurts', hugGrabStepOut),
      control('Group Hug: standing on the ground outside the safe zone hurts', fieldWideJump, { patternId: 'groupHug', phase: 1 }),
    ],
  },
  {
    boss: 'drEmbrace',
    mapKey: 'shelter_yard',
    level: 2,
    scenarios: [
      dodged('Arm Reach: jump over it (from the left)', armReachJump, { dx: -300 }),
      dodged('Arm Reach: jump over it (from the right)', armReachJump, { dx: 300 }),
      dodged('Check-up Slam: step out of the zone', checkupSlamStepOut),
      dodged('Check-up Hug: airborne at the impact', fieldWideJump, { patternId: 'checkupHug', phase: 1 }),
      dodged('Check-up Hug: stand in the safe zone', fieldWideSafeZone, { patternId: 'checkupHug', phase: 1 }),
      control('Arm Reach: standing in the lane hurts', armReachJump, { dx: -300 }),
      control('Check-up Slam: standing still hurts', checkupSlamStepOut),
      control('Check-up Hug: standing on the ground outside the safe zone hurts', fieldWideJump, { patternId: 'checkupHug', phase: 1 }),
    ],
  },
  {
    boss: 'vacuumKing',
    mapKey: 'closet',
    level: 14,
    scenarios: [
      dodged('Dust Balls: sidestep (player left of the boss)', dustBallsSidestep, { dx: -400 }),
      dodged('Dust Balls: sidestep (player right under it)', dustBallsSidestep, { dx: 0 }),
      dodged('Dust Balls: sidestep (player right of the boss)', dustBallsSidestep, { dx: 400 }),
      dodged('Floor Sweep: jump over it from 150px', floorSweepJump, { D: 150, enraged: false }),
      dodged('Floor Sweep: jump over it from 400px', floorSweepJump, { D: 400, enraged: false }),
      dodged('Floor Sweep: jump over it from 800px', floorSweepJump, { D: 800, enraged: false }),
      dodged('Floor Sweep (enraged): jump over it from 150px', floorSweepJump, { D: 150, enraged: true }),
      dodged('Floor Sweep (enraged): jump over it from 400px', floorSweepJump, { D: 400, enraged: true }),
      dodged('Bag Burst: step into a pocket between the bursts', bagBurstPocket),
      dodged('Full Power Suction: walk away (right under the boss)', fullSuctionWalkAway, { dx: 0 }),
      dodged('Full Power Suction: walk away (100px left)', fullSuctionWalkAway, { dx: -100 }),
      dodged('Full Power Suction: walk away (100px right)', fullSuctionWalkAway, { dx: 100 }),
      dodged('Full Power Suction: walk away (300px left)', fullSuctionWalkAway, { dx: -300 }),
      dodged('Full Power Suction: walk away (450px right, near the wall)', fullSuctionWalkAway, { dx: 450 }),
      control('Dust Balls: standing still hurts', dustBallsSidestep, { dx: 0 }),
      control('Floor Sweep: standing still hurts', floorSweepJump, { D: 400, enraged: false }),
      control('Bag Burst: standing still hurts', bagBurstPocket),
      control('Full Power Suction: standing still hurts', fullSuctionWalkAway, { dx: -300 }),
    ],
  },
];
