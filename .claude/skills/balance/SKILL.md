---
name: balance
description: "Analyze game balance from the data files: difficulty curve, time-to-kill, rewards, economy, progression pacing; propose concrete value changes. Use when the user asks about balance, difficulty, tuning or numbers."
argument-hint: "[area]"
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /balance — numbers from the data

Input: `$ARGUMENTS` — an area (monsters, map 3, economy, boss) or empty for an overview.

1. Delegate to **game-designer**: read `paths.data`, compute with a throwaway script in
   `.claude/state/` if useful, and return tables plus outliers with reasons.
2. Show the user the key table(s) and at most five proposed changes (file, key, old →
   new, why).
3. Change data only if the user asks; then it becomes a story (`/plan-stories` or add a
   `S-###` directly) so it goes through `/build` and verification.
