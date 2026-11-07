---
paths:
  - "design/**"
  - "docs/**"
---

# Design document rules

- Write in `language.docs` from `.claude/studio.yaml`. Keep identifiers, file names,
  data keys and code in English so they match the code.
- Short beats complete. A brief is one screen; a spec rarely needs more than two.
  Cut anything that does not change what gets built.
- Numbers that will be tuned go in a **Tuning** table with the data file and key that
  will hold them. Never bury a number in prose.
- Acceptance criteria are testable statements about what the player or user sees or
  what the data contains. "Feels good" is not testable; "the jump apex is 2 tiles,
  read from `player.json:jumpApexTiles`" is.
- The backlog and decisions log follow the formats in `.claude/studio/workflow.md`;
  skills parse them, so keep their shape.
- Do not create new files in `design/` other than the configured docs and specs
  without asking.
