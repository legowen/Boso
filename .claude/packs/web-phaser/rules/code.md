---
paths:
  - "src/**/*.js"
  - "src/**/*.ts"
  - "src/**/*.mjs"
---

# Phaser code rules

- Comments, identifiers and log messages in `language.code` (English by default).
- Gameplay values come from data modules, never literals in scenes (exceptions: 0, 1,
  and layout math that is not a design decision).
- Time-based logic uses `delta` or Phaser timers, never frame counts.
- Every listener added in a scene is removed on `shutdown`; every timer/tween owned by
  an object is destroyed with it.
- No game state in UI scenes or DOM overlays; they display and emit events.
- Player-facing strings come from the text data/i18n source, not inline literals.
- Debug-only code sits behind `import.meta.env.DEV`.
- Left-facing sprites use `setFlipX(true)`.
