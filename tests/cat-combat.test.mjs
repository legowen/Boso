import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { CHARACTERS, getCharacter } from '../src/data/characters.js';

// Exercise real Player code without starting a renderer or replacing combat logic.
const context = vm.createContext({ Date, Math, Set });
const phaser = new vm.SyntheticModule(['default'], function () {
  this.setExport('default', {
    Math: { Clamp: (n, min, max) => Math.max(min, Math.min(max, n)) },
    Geom: { Rectangle: class { constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); } } },
  });
}, { context });
// Cache the in-flight link promise: modules shared by several importers
// (a diamond in the import graph) are requested concurrently and must not
// be handed out before they finish linking.
const modules = new Map();
function readModule(url) {
  if (!modules.has(url.href)) modules.set(url.href, loadModule(url));
  return modules.get(url.href);
}
async function loadModule(url) {
  const module = new vm.SourceTextModule(await fs.readFile(url, 'utf8'), { context, identifier: url.href });
  await module.link((specifier, parent) => specifier === 'phaser' ? phaser : readModule(new URL(specifier, parent.identifier)));
  return module;
}
const playerModule = await readModule(new URL('../src/entities/Player.js', import.meta.url));
await playerModule.evaluate();
const Player = playerModule.namespace.default;

function object(x = 0, y = 0, width = 0, height = 0) {
  return {
    x, y, width, height, active: true, anims: { isPaused: false, pause() {}, resume() {} },
    setDepth() { return this; }, setFlipX(v) { this.flipX = v; return this; },
    setOrigin(x, y = x) { this.originX = x; this.originY = y; return this; },
    setScale(value) { this.scaleX = value; this.scaleY = value; return this; }, setBounce() { return this; },
    setCollideWorldBounds() { return this; }, setDisplaySize() { return this; },
    setAlpha() { return this; }, setTint() { return this; }, clearTint() { return this; },
    setPosition(x, y) { Object.assign(this, { x, y }); return this; },
    setVelocityX(x) { this.body.velocity.x = x; return this; },
    setVelocityY(y) { this.body.velocity.y = y; return this; },
    setVelocity(x, y) { this.setVelocityX(x); this.setVelocityY(y); return this; },
    play(key) { this.animation = key; return this; },
    getBounds() { return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height }; },
    destroy() { this.active = false; },
  };
}
// Status icons draw with a Graphics object; any drawing call is a no-op here
function graphics() {
  const noop = new Proxy({}, { get: () => () => noop });
  return noop;
}
function fixture(id = 'seoli') {
  const timers = [];
  const scene = {
    time: { now: 0, delayedCall(delay, run) { timers.push({ at: scene.time.now + delay, run }); } },
    add: { zone: object, image: object, text: object, graphics: () => graphics() },
    anims: { exists: () => true }, textures: { exists: () => false },
    tweens: { add() {} }, events: { emit() {} },
    physics: { add: { sprite(x, y) {
      const sprite = object(x, y);
      sprite.body = {
        blocked: { down: true }, touching: { down: false }, velocity: { x: 0, y: 0 },
        checkCollision: { down: true, up: true },
        setSize(w, h) { this.width = w * sprite.scaleX; this.height = h * sprite.scaleY; return this; },
        setOffset(x, y) { this.offset = { x, y }; return this; },
        setAllowGravity(allowed) { this.allowGravity = allowed; },
      };
      return sprite;
    } } },
  };
  const player = new Player(scene, 200, 300, { id });
  function advance(ms) {
    const end = scene.time.now + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      if (!timers.length || timers[0].at > end) break;
      const timer = timers.shift(); scene.time.now = timer.at; timer.run();
    }
    scene.time.now = end;
  }
  return { scene, player, advance };
}

test('two cats preserve the intended speed, health and power differences', () => {
  const seoli = fixture().player, bomi = fixture('bomi').player;
  assert.deepEqual(CHARACTERS.map(c => c.id), ['seoli', 'bomi']);
  assert.ok(seoli.moveSpeed > bomi.moveSpeed);
  assert.ok(seoli.jumpPower < bomi.jumpPower);
  assert.ok(bomi.maxHp > seoli.maxHp);
  assert.ok(bomi.attackPower > seoli.attackPower);
  assert.equal(getCharacter('boso_swift').id, 'seoli');
  assert.equal(getCharacter('boso_brave').id, 'bomi');
});

for (const id of ['seoli', 'bomi']) {
  test(`${id}: three-hit combo cycles, increases damage, and resets after a pause`, () => {
    const { player: p, advance } = fixture(id);
    const damage = [];
    for (let i = 0; i < 4; i++) {
      p.performAttack();
      assert.equal(p.comboStep, i % 3);
      damage.push(p.attackDamage);
      const target = {};
      assert.equal(p.canHit(target), true);
      p.registerHit(target);
      assert.equal(p.canHit(target), false);
      assert.equal(p.canHit({}), true);
      advance(p.combat.cooldown + 70);
      assert.equal(p.attackHitbox, null);
    }
    assert.ok(damage[0] < damage[1] && damage[1] < damage[2]);
    assert.equal(damage[3], damage[0]);
    advance(900); p.performAttack(); assert.equal(p.comboStep, 0);
  });
}

test('Seoli wind reaches farther; Bomi stays close and attack direction is stable', () => {
  const seoli = fixture(), bomi = fixture('bomi');
  for (const f of [seoli, bomi]) {
    const p = f.player;
    p.facingRight = false; p.performAttack();
    p.facingRight = true; // Moving during the swing cannot reverse its direction.
    f.advance(p.combat.duration - 1); p.updateAttackEffect();
    assert.ok(p.attackHitbox.x < p.sprite.x);
  }
  const s = seoli.player, b = bomi.player;
  assert.ok(s.sprite.x - s.attackHitbox.x > 100);
  assert.equal(b.sprite.x - b.attackHitbox.x, 34);
});

test('crouch keeps the foot anchor, reduces the hurt body, and permits a low attack', () => {
  const { player: p } = fixture();
  const foot = () => (p.sprite.body.offset.y - p.sprite.originY * 96) * p.sprite.scaleY + p.sprite.body.height;
  const before = foot(), height = p.sprite.body.height;
  assert.ok(p.sprite.scaleX > 0.75);
  assert.ok(Math.abs(before - 30) < 1e-9, 'visual scaling keeps the old world foot anchor');
  assert.equal(height, 56);
  assert.equal(p.sprite.body.width, 32);
  p.setCrouching(true);
  assert.equal(p.sprite.body.height, 28);
  assert.ok(p.sprite.body.height < height);
  assert.ok(Math.abs(foot() - before) < 1e-9);
  p.performAttack(); assert.equal(p.attackHitbox.y, p.sprite.y + 14);
  p.clearAttack(); p.updateAnimation(); assert.equal(p.sprite.animation, 'seoli_crouch');
  p.setCrouching(false); assert.ok(Math.abs(foot() - before) < 1e-9); assert.equal(p.sprite.body.height, height);
});

test('damage and rope grabs cancel active attacks; climbing and death block new ones', () => {
  const { player: p, advance } = fixture();
  p.performAttack(); p.takeDamage(5, 1);
  assert.equal(p.attackHitbox, null); assert.equal(p.canHit({}), false);
  advance(400); p.performAttack(); assert.ok(p.attackHitbox);
  p.grabRope({ x: 200, topY: 0, bottomY: 500 });
  assert.equal(p.attackHitbox, null);
  advance(500); p.performAttack(); assert.equal(p.attackHitbox, null);
  p.takeDamage(9999, 1); advance(500); p.performAttack();
  assert.equal(p.hp, 0); assert.equal(p.attackHitbox, null);
  assert.equal(p.sprite.body.enable, false);
});

test('movement selects run, jump, fall, and climb animations', () => {
  const { player: p } = fixture('bomi');
  p.sprite.body.velocity.x = 100; p.updateAnimation(); assert.equal(p.sprite.animation, 'bomi_run');
  p.sprite.body.blocked.down = false; p.sprite.body.velocity.y = -100;
  p.updateAnimation(); assert.equal(p.sprite.animation, 'bomi_jump');
  p.sprite.body.velocity.y = 100; p.updateAnimation(); assert.equal(p.sprite.animation, 'bomi_fall');
  p.grabRope({ x: 200 }); p.updateAnimation(); assert.equal(p.sprite.animation, 'bomi_climb');
});

const keyboard = (held = {}) => ({
  cursors: { left: { isDown: !!held.left }, right: { isDown: !!held.right }, up: { isDown: false }, down: { isDown: false } },
  keys: { alt: { isDown: false }, ctrl: { isDown: !!held.ctrl } },
});

test('slow: move speed x0.6 while it lasts, normal again afterwards', () => {
  const { player: p, advance } = fixture();
  const input = keyboard({ right: true });
  p.update(input.cursors, input.keys);
  assert.equal(p.sprite.body.velocity.x, p.moveSpeed);
  assert.equal(p.applyStatus('slow', 2000), true);
  assert.equal(p.isSlowed(), true);
  p.update(input.cursors, input.keys);
  assert.ok(Math.abs(p.sprite.body.velocity.x - p.moveSpeed * 0.6) < 1e-9);
  advance(2000);
  p.update(input.cursors, input.keys);
  assert.equal(p.isSlowed(), false);
  assert.equal(p.sprite.body.velocity.x, p.moveSpeed);
});

test('stun: no movement, attacks, rope grabs or potions; capped at 1.5s; 2s immunity afterwards', () => {
  const { player: p, advance } = fixture();
  p.items.cookie = 3;
  p.hp = p.maxHp - 50;
  const input = keyboard({ right: true, ctrl: true });
  assert.equal(p.applyStatus('stun', 9000), true);
  assert.equal(p.isStunned(), true);
  p.update(input.cursors, input.keys);
  assert.equal(p.sprite.body.velocity.x, 0, 'stunned players do not move');
  assert.equal(p.attackHitbox, null, 'stunned players do not attack');
  p.performAttack();
  assert.equal(p.attackHitbox, null);
  assert.equal(p.useItem('cookie'), false, 'no potions while stunned');
  assert.equal(p.items.cookie, 3);

  advance(1499);
  assert.equal(p.isStunned(), true);
  advance(1);
  assert.equal(p.isStunned(), false, 'a stun never lasts longer than 1.5s');
  p.update(input.cursors, input.keys);
  assert.equal(p.sprite.body.velocity.x, p.moveSpeed, 'input works again');
  assert.equal(p.useItem('cookie'), true);

  assert.equal(p.applyStatus('stun', 1000), false, 'immune right after a stun');
  advance(1999);
  assert.equal(p.applyStatus('stun', 1000), false, 'still immune 1ms before the 2s are up');
  advance(1);
  assert.equal(p.applyStatus('stun', 1000), true);
});

test('stun interrupts a swing and a rope; death clears every status', () => {
  const { player: p } = fixture();
  p.performAttack();
  assert.ok(p.attackHitbox);
  p.grabRope({ x: 200, topY: 0, bottomY: 500 });
  p.performAttack(); // climbing: ignored, the first swing was already cancelled by the grab
  assert.equal(p.attackHitbox, null);
  assert.equal(p.isClimbing, true);
  p.applyStatus('stun', 1000);
  assert.equal(p.isClimbing, false, 'a stunned player falls off the rope');
  assert.equal(p.sprite.body.allowGravity, true);
  p.applyStatus('slow', 1000);
  p.takeDamage(9999, 1);
  assert.equal(p.isStunned(), false);
  assert.equal(p.isSlowed(), false);
  assert.equal(p.applyStatus('stun', 1000), false, 'the dead cannot be stunned');
});
