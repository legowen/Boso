# Release checklist — Godot 4

- [ ] `bash .claude/scripts/run-check.sh all` has no FAIL
- [ ] Export templates installed for the Godot version in use
- [ ] Export presets: name, version, icon, bundle id (mobile), excluded debug resources
- [ ] Release export (not debug) launched once per target platform
- [ ] Old saves load (migration tested)
- [ ] Web export: SharedArrayBuffer/threads settings match the host (COOP/COEP headers) or threads disabled
- [ ] Store/page assets: screenshots, description, (mobile) privacy policy
- [ ] Upload (itch.io / Steam / stores) done by the user
