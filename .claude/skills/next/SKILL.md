---
name: next
description: "Show where the project stands and the single best next step: stage, active packs, branch, story in progress, last check results, backlog. Use when the user asks what's next, where we are, or resumes after a break."
argument-hint: "[no arguments]"
allowed-tools: Read, Glob, Grep, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git log*)
---

!`bash .claude/scripts/status.sh`

!`bash .claude/scripts/pack.sh status`

# /next — where are we

The blocks above are observations. If empty, run `bash .claude/scripts/status.sh` and
`bash .claude/scripts/pack.sh status`.

1. Read `.claude/state/active.md` if it exists.
2. Tell the user, in `language.conversation`, in at most six lines: what is in
   progress (story, branch, last verdicts), anything blocking or waiting on them,
   checks that failed or were never run, pack drift if any, and **one** recommended
   next step with the command to run.
3. If the studio is not set up: recommend `/start` (no code) or `/adopt` (existing code).
