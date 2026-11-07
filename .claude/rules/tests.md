---
paths:
  - "tests/**"
  - "test/**"
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/__tests__/**"
  - "Assets/Tests/**"
  - "Assets/**/Tests/**"
---

# Test rules

- Name tests after the behaviour: `respawns monster after configured delay`, not `test1`.
- Deterministic: fixed seeds, injected clocks/time, no reliance on frame timing or the
  network. A flaky test is a failing test.
- Test the data layer and pure logic directly; keep engine/scene setup out of unit
  tests where the stack allows.
- One behaviour per test. Arrange, act, assert.
- When fixing a bug, first add a test that fails for that bug, then fix it.
- Never delete or weaken a failing test to make a check pass. Report it instead.
