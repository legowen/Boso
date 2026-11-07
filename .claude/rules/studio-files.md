---
paths:
  - ".claude/**"
  - "CLAUDE.md"
---

# Studio framework files

- Changing anything under `.claude/` or `CLAUDE.md` is on the always-ask list.
  Say what you will change and why, then wait.
- Agent and skill prompts are written in English.
- Keep `.claude/studio.yaml` in its simple format (two levels, inline lists); the
  scripts parse it without a YAML library. Prefer `bash .claude/scripts/config.sh set`.
- Edit packs in `.claude/packs/<pack>/`, then re-run `bash .claude/scripts/pack.sh activate <pack>`
  to install the change. Installed copies in `.claude/agents/` and `.claude/rules/`
  that differ from the pack show up in `pack.sh status`.
- Shell scripts must stay portable: bash 3.2+, POSIX awk/grep/sed, LF line endings,
  no jq or Python dependency.
- After changing scripts, hooks, agents or skills, run `bash .claude/scripts/selftest.sh`.
