// Merge held touch pointers with real keyboard keys without synthesizing events.
export default class ControlState {
  constructor() {
    this.actions = new Map();
    this.pointers = new Map();
  }

  bind(action, keyboard = {}) {
    const state = { keyboard, pointers: new Set(), pressed: false, tap: false };
    this.actions.set(action, state);
    return {
      get isDown() { return !!keyboard.isDown || state.pointers.size > 0 || state.tap; },
      get _justDown() { return !!keyboard._justDown || state.pressed; },
      set _justDown(value) { keyboard._justDown = value; state.pressed = value; },
    };
  }

  press(action, pointerId) {
    if (this.pointers.get(pointerId) === action) return;
    this.release(pointerId);
    const state = this.actions.get(action);
    if (!state) return;
    if (!state.pointers.size) state.pressed = true;
    state.pointers.add(pointerId);
    state.tap = true;
    this.pointers.set(pointerId, action);
  }

  release(pointerId, cancelled = false) {
    const action = this.pointers.get(pointerId);
    const state = this.actions.get(action);
    state?.pointers.delete(pointerId);
    if (state && cancelled && !state.pointers.size) { state.tap = false; state.pressed = false; }
    this.pointers.delete(pointerId);
  }

  endFrame() {
    for (const state of this.actions.values()) { state.tap = false; state.pressed = false; }
  }

  reset() {
    this.pointers.clear();
    for (const state of this.actions.values()) {
      state.pointers.clear(); state.tap = false; state.pressed = false;
    }
  }
}
