---
paths:
  - "Assets/**/*.cs"
---

# Unity C# rules

- Comments and identifiers in `language.code`. PascalCase types/methods, camelCase
  locals, `_camelCase` private fields (or match the project's existing style).
- No tuning literals in code: values come from ScriptableObjects or data files.
- No `GameObject.Find`, `FindObjectOfType` or `GetComponent` inside `Update`/`FixedUpdate`.
- Time-based logic uses `Time.deltaTime`/`fixedDeltaTime`.
- Player-facing strings come from the localization/text source.
- Every subscription (`+=`) has a matching unsubscription (`OnDisable`/`OnDestroy`).
- Editor-only code is in an `Editor` folder or `#if UNITY_EDITOR` block.
