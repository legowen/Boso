import ControlState from '../systems/ControlState.js';
import './touch-controls.css';

export function usesTouchControls() {
  return typeof window !== 'undefined' &&
    (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
}

export default class TouchControls {
  constructor(scene, { travel = false } = {}) {
    this.scene = scene;
    this.state = new ControlState();
    this.enabled = usesTouchControls();
    this.abort = new AbortController();
    this.continueAction = null;
    scene.events.once('shutdown', () => this.destroy());
    if (!this.enabled) return;

    for (const action of ['left', 'right', 'up', 'down']) {
      scene.cursors[action] = this.state.bind(action, scene.cursors[action]);
    }
    for (const action of Object.keys(scene.keys)) {
      scene.keys[action] = this.state.bind(action, scene.keys[action]);
    }

    this.root = document.createElement('div');
    this.root.className = 'touch-controls';
    this.root.setAttribute('aria-label', 'Game touch controls');
    this.buttons = new Map();
    const pad = this.group('touch-pad');
    for (const [action, label] of [['up', '↑'], ['left', '←'], ['down', '↓'], ['right', '→']]) {
      this.button(pad, action, label, `Move ${action}`);
    }
    const actions = this.group('touch-actions');
    this.button(actions, 'space', 'TALK', 'Talk or continue');
    if (scene.player.charId === 'seoli') this.button(actions, 'x', 'WIND', 'Wind gust');
    this.button(actions, 'ctrl', 'HIT', 'Attack');
    this.button(actions, 'alt', 'JUMP', 'Jump');
    this.tools = this.group('touch-tools');
    this.tools.hidden = true;
    this.button(this.tools, 'one', 'HP', 'Use cookie');
    this.button(this.tools, 'two', 'MP', 'Use milk');
    if (!travel) {
      this.button(this.tools, 'i', 'BAG', 'Open or close bag');
      this.button(this.tools, 'm', 'MAP', 'Open or close map');
      this.button(this.tools, 'pause', 'MENU', 'Pause or resume');
    }
    this.button(this.root, 'more', '•••', 'More controls').classList.add('touch-more');
    document.body.append(this.root);

    const reset = () => this.reset();
    this.listen(window, 'blur', reset);
    this.listen(window, 'pagehide', reset);
    this.listen(window, 'resize', reset);
    this.listen(document, 'visibilitychange', reset);
    this.afterFrame = () => { this.state.endFrame(); this.update(); };
    scene.events.on('postupdate', this.afterFrame);
  }

  group(className) {
    const group = document.createElement('div');
    group.className = className;
    this.root.append(group);
    return group;
  }

  listen(target, event, handler) {
    target.addEventListener(event, handler, { signal: this.abort.signal });
  }

  button(parent, action, label, description) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.action = action;
    button.setAttribute('aria-label', description);
    this.buttons.set(action, button);
    parent.append(button);
    this.listen(button, 'contextmenu', event => event.preventDefault());
    this.listen(button, 'pointerdown', event => {
      event.preventDefault(); event.stopPropagation();
      button.setPointerCapture(event.pointerId);
      if (action === 'more') { this.tools.hidden = !this.tools.hidden; return; }
      if (action === 'pause') {
        if (this.scene.isTransitioning || this.scene.player.hp <= 0) return;
        this.reset();
        if (this.scene.isPaused) this.scene.closePauseMenu(); else this.scene.openPauseMenu();
        return;
      }
      if (action === 'space' && this.continueAction) { this.continueAction(); return; }
      if (button.disabled) return;
      this.state.press(action, event.pointerId);
      button.classList.add('pressed');
    });
    const release = event => {
      this.state.release(event.pointerId, event.type !== 'pointerup');
      if (!this.state.actions.get(action)?.pointers.size) button.classList.remove('pressed');
    };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) this.listen(button, event, release);
    return button;
  }

  update() {
    const scene = this.scene;
    const hardBlocked = scene.isPaused || scene.isTransitioning || scene.arrived || scene.player.hp <= 0;
    const overlay = scene.worldMap || scene.bag || scene.isPaused;
    const blocked = hardBlocked || overlay;
    this.root.classList.toggle('overlay-open', !!overlay);
    if (blocked) this.state.reset();
    for (const [action, button] of this.buttons) {
      button.disabled = !!blocked && !['more', 'pause'].includes(action) &&
        !(!hardBlocked && ['i', 'm'].includes(action)) && !(action === 'space' && this.continueAction);
      if (blocked) button.classList.remove('pressed');
    }
    this.buttons.get('space').textContent = this.continueAction ? 'CONTINUE' : scene.dialogue ? 'NEXT' : 'TALK';
  }

  reset() {
    this.state.reset();
    for (const button of this.buttons?.values() || []) button.classList.remove('pressed');
  }

  // Death and ending screens also need a one-shot continuation without keys.
  waitForContinue(callback) {
    let done = false;
    const advance = () => {
      if (done) return;
      done = true;
      this.scene.input.keyboard.off('keydown-SPACE', advance);
      this.continueAction = null;
      this.reset();
      callback();
    };
    this.continueAction = advance;
    this.keyboardContinue = advance;
    this.scene.input.keyboard.once('keydown-SPACE', advance);
    if (this.enabled) this.update();
  }

  destroy() {
    this.reset();
    this.abort.abort();
    if (this.afterFrame) this.scene.events.off('postupdate', this.afterFrame);
    if (this.keyboardContinue) this.scene.input.keyboard.off('keydown-SPACE', this.keyboardContinue);
    this.root?.remove();
  }
}
