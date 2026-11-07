---
paths:
  - "app/**/*.ts"
  - "app/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "components/**/*.tsx"
---

# Expo app code rules

- Comments and identifiers in `language.code`. Components PascalCase, hooks `useX`.
- No inline user-facing strings when the project localizes; use the i18n source.
- Every async effect handles unmount/cancel; every subscription is cleaned up.
- No secrets in code. Tokens via `expo-secure-store`.
- Interactive elements have accessibility labels and ≥ 44 pt touch targets.
- Business logic in plain TS modules with unit tests, not inside components.
