---
paths:
  - "**/*.gd"
---

# GDScript rules

- Comments and identifiers in `language.code`; snake_case for functions and variables,
  PascalCase for `class_name`, UPPER_CASE for constants.
- Static types on variables, parameters and return values.
- Tuning values via `@export` or Resources, not literals in logic.
- Movement in `_physics_process(delta)`; time with timers or `delta`.
- Children emit signals; parents call methods on children. Disconnect signals you
  connect manually when the listener can outlive the emitter.
- Player-facing strings through `tr()` keys when the project localizes.
