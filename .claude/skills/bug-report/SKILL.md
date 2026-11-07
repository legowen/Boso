---
name: bug-report
description: "Record a bug as a backlog entry with reproduction steps and severity, checking for duplicates. Use when the user reports something broken, a crash, a glitch, or unexpected behaviour."
argument-hint: "<what went wrong>"
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /bug-report — record a bug

Input: `$ARGUMENTS` — the user's description.

1. Make it reproducible. Ask only what is missing (AskUserQuestion, max three):
   where (map/screen), steps, expected vs actual, how often, platform/device.
2. Check `docs.backlog` for a duplicate. If found, add the new detail there instead.
3. Severity: `blocker` (crash, data loss, cannot progress), `major` (feature broken,
   workaround exists), `minor` (cosmetic, rare).
4. Add under `## Bugs`: `- [ ] B-### <slug> — <one line> (sev: <level>)` with lines
   `Repro:`, `Expected:`, `Actual:`, and ACs: `AC: the repro no longer reproduces`,
   `AC: a test or validation rule covers it`, plus `Visible: yes|no`.
5. If the cause is obvious from a quick read of the code, add `Suspect: file:line`.
   Do not fix it here.
6. Next step: `/build B-###` (blockers first).
