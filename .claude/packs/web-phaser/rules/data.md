---
paths:
  - "src/data/**"
  - "public/assets/**/*.json"
---

# Game data rules

- Data modules never import Phaser or browser APIs; they must load in plain Node so
  `checks.validate` can check them.
- Ids are stable, lowercase, and never reused. References between files use ids, and
  every reference must resolve (the validation script checks it).
- When you add or rename a field, update the validation script and every consumer in
  the same story.
- Units are explicit in key names when not obvious: `respawnSeconds`, `speedPxPerSec`.
- Keep JSON valid (no comments, no trailing commas); the edit hook checks it.
