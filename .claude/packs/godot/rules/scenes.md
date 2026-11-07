---
paths:
  - "**/*.tscn"
  - "**/*.tres"
  - "project.godot"
---

# Godot scene and resource rules

- Text formats: keep `[ext_resource]` ids, `uid://` values and node paths consistent
  when editing; never renumber resources by hand.
- Commit `.uid` and `.import` files with their sources; never commit `.godot/`.
- Changes to `project.godot` (input map, autoloads, display settings) affect every
  branch: keep them in their own story when possible.
