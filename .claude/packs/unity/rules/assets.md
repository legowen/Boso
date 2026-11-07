---
paths:
  - "Assets/**/*.unity"
  - "Assets/**/*.prefab"
  - "Assets/**/*.asset"
  - "Assets/**/*.meta"
---

# Unity serialized asset rules

- These files are Unity YAML. Do not hand-edit beyond trivial value changes; never
  change `fileID`, `guid` or `m_` structure. Prefer an editor script or tell the user
  the exact editor steps.
- Never delete, rename or regenerate a `.meta` file on its own; move assets with their
  `.meta`.
- One concern per branch matters most here: two branches editing the same scene or
  prefab will conflict. Say so in the report when you touch one.
