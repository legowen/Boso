---
name: new-pack
description: "Create a new platform pack (e.g. flutter, unreal, defold, nextjs, love2d) with its specialist agent, path rules, check commands, run-and-observe method and release checklist. Use when the user wants the studio to support another engine, framework or platform."
argument-hint: "<pack-name>"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch, AskUserQuestion, Bash(bash .claude/scripts/*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /new-pack — support another stack

Input: `$ARGUMENTS` — the pack name (lowercase, dashes), e.g. `flutter`, `unreal`.

Editing `.claude/` is always-ask: confirm the name and the stack's scope (which
engine/framework version, which target platforms) before writing.

1. `bash .claude/scripts/pack.sh new <name>` scaffolds `.claude/packs/<name>/` from
   `_template`. Read every file it created and the existing packs (web-phaser is the
   most complete example) to match their depth.
2. Research the stack's **current** conventions with WebSearch, from official docs:
   project layout, how to run/build/test/lint from a terminal, how to capture a
   screenshot of a running build without headless mode, store/deploy steps. Note the
   version you researched.
3. Fill in:
   - `pack.yaml`: description, type (game/app/both), detect rule, checks, paths.
   - `STACK.md`: the stack summary inserted into CLAUDE.md (≤ 25 lines).
   - `agents/<name>-specialist.md`: role, stack-specific rules, performance and
     platform pitfalls, testing approach, report format; keep the Studio contract
     section from the template.
   - `rules/*.md`: path-scoped rules with real globs for this stack.
   - `release.md`: the deploy/store checklist.
   - Add the stack's row to `.claude/studio/run-and-observe.md` and the pack to
     `.claude/studio/roster.md`.
4. Run `bash .claude/scripts/selftest.sh`. Fix anything it reports.
5. Report the files created and the version researched. Activate only if asked:
   `bash .claude/scripts/pack.sh activate <name>`.
