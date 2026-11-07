# Release checklist — Expo app

- [ ] `bash .claude/scripts/run-check.sh all` has no FAIL
- [ ] Version (`expo.version`) and build numbers (iOS buildNumber / Android versionCode) bumped
- [ ] Icons, adaptive icon, splash screen for both platforms
- [ ] Permission usage strings present and accurate
- [ ] Privacy policy URL; Apple privacy labels and Google Play Data safety form filled to match what the app collects
- [ ] Tested on a physical Android device and on iOS (TestFlight or a device build)
- [ ] Production EAS build (`eas build --profile production`) — run by the user
- [ ] Store listing: screenshots per required device size, description, keywords, age rating
- [ ] Internal testing track / TestFlight check before production — user promotes
- [ ] OTA update policy decided (runtimeVersion) before the first release
