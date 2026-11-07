# Release checklist — Unity

- [ ] `bash .claude/scripts/run-check.sh all` has no FAIL (EditMode/PlayMode tests run in batch mode)
- [ ] Player Settings: company, product name, version, bundle identifier, icons, splash
- [ ] Scenes in Build Settings in the right order; no test/debug scenes included
- [ ] Development Build and script debugging OFF for the release build
- [ ] Old saves load (migration tested)
- [ ] Target platforms built and launched once each (Windows / macOS / Android / iOS as applicable)
- [ ] Mobile: IL2CPP, ARM64, target API level meets store minimum, safe areas, permissions
- [ ] Store assets: screenshots, description, age rating, privacy policy (mobile)
- [ ] Upload (Steam / itch.io / Google Play / App Store) done by the user
