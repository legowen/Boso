# Release checklist — web (Phaser + Vite)

- [ ] `bash .claude/scripts/run-check.sh all` has no FAIL
- [ ] Production build runs from `dist/` (`npx vite preview`) with no console errors (capture-web.mjs on the preview URL)
- [ ] `base` path correct for where it is hosted; all asset URLs load (no 404 in the network log)
- [ ] File-name case matches every reference (case-sensitive host)
- [ ] Debug features unreachable in production (`import.meta.env.DEV` guards)
- [ ] Save data from the previous release loads (migration tested)
- [ ] Audio starts after the first input on Chrome and Safari
- [ ] Works at the supported window sizes; touch controls if mobile is supported
- [ ] Page title, favicon, social preview image and description set
- [ ] Version number visible in game (title screen or settings)
- [ ] Preview deployment checked by the user → user promotes to production
