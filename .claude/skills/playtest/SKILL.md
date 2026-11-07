---
name: playtest
description: "Launch the game or app, capture screenshots of a story's change or a given scene/screen, compare them with the acceptance criteria, and keep the evidence. Use when the user asks to playtest, look at, screenshot or check what something looks like."
argument-hint: "[S-### | scene | url]"
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /playtest — look at it

Input: `$ARGUMENTS` — a story id, or a scene/screen/URL to look at.

1. Delegate to **playtester** with: the story id and `AC:` lines (or the scene and what
   to look for), the active pack, `checks.run`, and
   `.claude/studio/run-and-observe.md`.
2. Show the user the run result line, the defects with screenshot names, and open the
   most informative screenshot path in the report so they can view it.
3. `NOT RUN` because a tool is missing: show the one install command and ask whether to
   install it (adding a dependency is always-ask).
4. `MANUAL NEEDED`: give the user the checklist and wait for their answer before the
   story can close.
