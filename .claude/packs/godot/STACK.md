### Game — Godot 4 (pack: godot)
- Engine: Godot 4 (version in `project.godot` `config/features`), GDScript with static typing.
- Specialist: **godot-specialist**. Path rules: `.claude/rules/godot.*.md`.
- Scenes (`.tscn`) compose nodes; data in custom `Resource` files (`.tres`) under `paths.data`.
- The `godot` executable must be on PATH (or set `checks.*` with its full path).
- Commit `.uid` files (Godot 4.4+) and `*.import` files; ignore `.godot/`.
- Playtest: `godot --path . --windowed --resolution 1280x720 <scene> --write-movie <out>.png --quit-after 90`.
