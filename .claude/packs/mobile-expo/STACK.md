### App — React Native + Expo (pack: mobile-expo)
- Expo SDK (version in `package.json`), TypeScript strict, file-based routing with expo-router under `app/`.
- Specialist: **mobile-specialist**. Path rules: `.claude/rules/mobile-expo.*.md`.
- Run `npx expo start` (Expo Go or a development build) · typecheck `npx tsc --noEmit` · builds with EAS (`eas build`), store upload with `eas submit` — user actions.
- Native configuration only through `app.json`/`app.config.ts` and config plugins; changing it needs a new development build.
- On Windows: Android emulator or a device locally; iOS builds through EAS cloud.
- Playtest: web target + `capture-web.mjs --viewport 390x844`, or Android emulator + `adb exec-out screencap -p`.
