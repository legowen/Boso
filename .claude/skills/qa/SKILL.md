---
name: qa
description: "Adversarially verify the current branch or a story without changing anything: run all checks and have the qa-validator try to break it. Use when the user asks to verify, validate, test or double-check work."
argument-hint: "[S-### | B-###]"
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /qa — try to break it

Input: `$ARGUMENTS` — a story id, or empty for the story on the current branch.

1. `bash .claude/scripts/run-check.sh all`.
2. Delegate to **qa-validator** with the story id, its `AC:` lines, the spec path and
   the branch. If there is no story (ad-hoc work), give it the diff against
   `git.main_branch` and ask it to infer intent from commits.
3. Report the qa-validator's verdict and findings unchanged, plus the check results
   line. Do not fix anything here; suggest `/build <id>` to run the fix loop.
4. Record the verdict in `.claude/state/active.md`.
