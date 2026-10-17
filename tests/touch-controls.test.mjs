import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import ControlState from '../src/systems/ControlState.js';

const JustDown = createRequire(import.meta.url)('phaser/src/input/keyboard/keys/JustDown.js');

test('movement, jump and held attack work simultaneously, and releasing one finger preserves the others', () => {
  const input = new ControlState();
  const left = input.bind('left'), jump = input.bind('alt'), hit = input.bind('ctrl');
  input.press('left', 1); input.press('alt', 2); input.press('ctrl', 3);
  for (let frame = 0; frame < 5; frame++) {
    assert.ok(left.isDown && jump.isDown && hit.isDown); input.endFrame();
  }
  input.release(2); assert.equal(jump.isDown, false); assert.ok(left.isDown && hit.isDown);
  input.press('ctrl', 4); input.endFrame(); input.release(3); assert.ok(hit.isDown);
  input.release(4); input.release(1); assert.equal(hit.isDown || left.isDown, false);
});

test('short taps survive until a frame; talk is consumed once; keyboard and touch can coexist', () => {
  const input = new ControlState();
  const keyboard = { isDown: false, _justDown: false };
  const talk = input.bind('space', keyboard);
  input.press('space', 1); input.release(1);
  assert.ok(talk.isDown); assert.ok(JustDown(talk)); assert.equal(JustDown(talk), false);
  input.endFrame(); assert.equal(talk.isDown, false);
  keyboard.isDown = true; keyboard._justDown = true;
  assert.ok(talk.isDown && JustDown(talk));
  input.press('space', 2); input.reset(); assert.ok(talk.isDown, 'touch reset does not release a real key');
  keyboard.isDown = false; assert.equal(talk.isDown, false);
});

test('cancelled touches and pointer changes cannot leave stuck actions', () => {
  const input = new ControlState();
  const left = input.bind('left'), right = input.bind('right');
  input.press('left', 1); input.endFrame(); input.press('right', 1);
  assert.equal(left.isDown, false); assert.ok(right.isDown);
  input.release(1, true); assert.equal(right.isDown, false);
  input.press('left', 1); input.press('right', 2); input.reset();
  assert.equal(left.isDown || right.isDown || JustDown(left), false);
});

// DOM event fixture exercises real control lifecycle and pointer event handlers.
class Element extends EventTarget {
  constructor() {
    super(); this.children = []; this.dataset = {}; this.hidden = false; this.disabled = false;
    const classes = new Set();
    this.classList = { add: c => classes.add(c), remove: c => classes.delete(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) };
  }
  append(child) { this.children.push(child); child.parent = this; }
  remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
  setAttribute() {}
  setPointerCapture() {}
  pointer(type, id = 1) {
    const event = new Event(type, { cancelable: true }); event.pointerId = id; this.dispatchEvent(event);
  }
}

async function fixture(touch = true) {
  const window = new EventTarget(), document = new EventTarget();
  window.matchMedia = () => ({ matches: touch });
  document.createElement = () => new Element(); document.body = new Element();
  const context = vm.createContext({ window, document, navigator: { maxTouchPoints: touch ? 5 : 0 }, AbortController });
  const modules = new Map();
  async function load(url) {
    if (modules.has(url.href)) return modules.get(url.href);
    const source = url.pathname.endsWith('.css') ? '' : await fs.readFile(url, 'utf8');
    const module = new vm.SourceTextModule(source, { context, identifier: url.href });
    modules.set(url.href, module);
    await module.link((specifier, parent) => load(new URL(specifier, parent.identifier)));
    return module;
  }
  const module = await load(new URL('../src/ui/TouchControls.js', import.meta.url)); await module.evaluate();
  const scene = {
    events: new EventEmitter(), input: { keyboard: new EventEmitter() }, player: { charId: 'seoli', hp: 100 },
    cursors: Object.fromEntries(['left','right','up','down'].map(k => [k, {}])),
    keys: Object.fromEntries(['ctrl','alt','space','x','one','two','i','m'].map(k => [k, {}])),
    openPauseMenu() { this.isPaused = true; }, closePauseMenu() { this.isPaused = false; },
  };
  const controls = new module.namespace.default(scene);
  return { controls, scene, window, document };
}

test('touch UI releases on blur/rotation, supports pause and respawn, and cleans up at scene shutdown', async () => {
  const { controls, scene, window, document } = await fixture();
  const button = action => controls.buttons.get(action);
  button('right').pointer('pointerdown'); scene.events.emit('postupdate'); assert.ok(scene.cursors.right.isDown);
  window.dispatchEvent(new Event('blur')); assert.equal(scene.cursors.right.isDown, false);
  button('ctrl').pointer('pointerdown', 2); window.dispatchEvent(new Event('resize'));
  assert.equal(scene.keys.ctrl.isDown, false);
  button('pause').pointer('pointerdown'); scene.events.emit('postupdate'); assert.equal(button('alt').disabled, true);
  button('pause').pointer('pointerdown'); scene.events.emit('postupdate'); assert.equal(button('alt').disabled, false);
  scene.player.hp = 0; let wakes = 0;
  controls.waitForContinue(() => wakes++);
  assert.equal(button('space').disabled, false);
  button('space').pointer('pointerdown'); scene.input.keyboard.emit('keydown-SPACE');
  assert.equal(wakes, 1, 'touch and keyboard cannot trigger two scene transitions');
  button('left').pointer('pointerdown'); scene.events.emit('shutdown');
  assert.equal(scene.cursors.left.isDown, false);
  assert.equal(document.body.children.length, 0);
  assert.equal(scene.events.listenerCount('postupdate'), 0);
  assert.equal(scene.input.keyboard.listenerCount('keydown-SPACE'), 0);
});

test('desktop gets no touch overlay and retains unrelated scene listeners', async () => {
  const { controls, scene, document } = await fixture(false);
  assert.equal(controls.enabled, false); assert.equal(document.body.children.length, 0);
  scene.events.on('postupdate', () => {});
  scene.events.emit('shutdown'); assert.equal(scene.events.listenerCount('postupdate'), 1);
});
