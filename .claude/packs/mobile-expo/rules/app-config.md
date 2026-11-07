---
paths:
  - "app.json"
  - "app.config.*"
  - "eas.json"
---

# Expo configuration rules

- Changing native config (plugins, permissions, bundle ids, icons, splash) requires a
  new development build; say so in the report.
- Bundle identifier / package name never change after the first store release.
- Every permission has a usage-description string that explains the benefit to the user.
- `eas.json` production profile changes are always-ask.
