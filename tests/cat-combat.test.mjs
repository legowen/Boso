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
const modules = new Map();
async function readModule(url) {
  if (modules.has(url.href)) return modules.get(url.href);
  const module = new vm.SourceTextModule(await fs.readFile(url, 'utf8'), { context, identifier: url.href });
  modules.set(url.href, module);
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
    setOrigin() { return this; }, setScale() { return this; }, setBounce() { return this; },
    setCollideWorldBounds() { return this; }, setDisplaySize() { return this; },
    setAlpha() { return this; }, setTint() { return this; },
    setPosition(x, y) { Object.assign(this, { x, y }); return this; },
    setVelocityX(x) { this.body.velocity.x = x; return this; },
    setVelocityY(y) { this.body.velocity.y = y; return this; },
    setVelocity(x, y) { this.setVelocityX(x); this.setVelocityY(y); return this; },
    play(key) { this.animation = key; return this; },
    getBounds() { return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height }; },
    destroy() { this.active = false; },
  };
}
function fixture(id = 'seoli') {
  const timers = [];
  const scene = {
    time: { now: 0, delayedCall(delay, run) { timers.push({ at: scene.time.now + delay, run }); } },
    add: { zone: object, image: object, text: object },
    anims: { exists: () => true }, textures: { exists: () => false },
    tweens: { add() {} }, events: { emit() {} },
    physics: { add: { sprite(x, y) {
      const sprite = object(x, y);
      sprite.body = {
        blocked: { down: true }, touching: { down: false }, velocity: { x: 0, y: 0 },
        checkCollision: { down: true, up: true },
        setSize(w, h) { this.width = w * 0.75; this.height = h * 0.75; return this; },
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
  const foot = () => p.sprite.body.offset.y * 0.75 + p.sprite.body.height;
  const before = foot(), height = p.sprite.body.height;
  p.setCrouching(true);
  assert.equal(p.sprite.body.height, 28);
  assert.ok(p.sprite.body.height < height);
  assert.equal(foot(), before);
  p.performAttack(); assert.equal(p.attackHitbox.y, p.sprite.y + 14);
  p.clearAttack(); p.updateAnimation(); assert.equal(p.sprite.animation, 'seoli_crouch');
  p.setCrouching(false); assert.equal(foot(), before); assert.equal(p.sprite.body.height, height);
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
