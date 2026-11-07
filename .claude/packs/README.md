# Platform packs

A pack adds one stack to the studio: a specialist agent, path-scoped rules, check
commands and a release checklist. Core agents work with any pack.

```
<pack>/
  pack.yaml        name, description, detect rule, default checks.* and paths.*
  STACK.md         inserted into CLAUDE.md's Stack block when active
  agents/*.md      copied to .claude/agents/ on activation
  rules/*.md       copied to .claude/rules/<pack>.<file> on activation
  skills/<name>/   optional, copied to .claude/skills/ on activation
  release.md       read by the release-manager
```

- List: `bash .claude/scripts/pack.sh list`
- Activate / deactivate: `bash .claude/scripts/pack.sh activate <pack>` (start a new session after)
- Several packs can be active (e.g. a game plus its companion app). The first pack's
  checks fill `studio.yaml`; adjust them when you combine packs.
- New stack: `/new-pack <name>` (or `bash .claude/scripts/pack.sh new <name>` and fill it in).
- Edit a pack here, then activate it again to install the change; your local edits to
  installed copies are kept and reported by `pack.sh status`.
