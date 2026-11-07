---
name: release
description: "Prepare a release: version, patch notes, changelog, full checks and the platform's release checklist, stopping before anything is published. Use when the user wants to ship, deploy, release, publish or submit a build."
argument-hint: "[version]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /release — get ready to ship

Input: `$ARGUMENTS` — a version, or empty to propose one.

1. Delegate to **release-manager** with the active packs, the last tag
   (`git describe --tags --abbrev=0`, may not exist), and `docs.backlog`.
2. It returns: proposed version, patch notes (in `language.ingame`), changelog, check
   results, and the pack checklist with each item done / needs user / n.a.
3. Show it. Writing the notes/changelog files and creating a release branch or tag are
   always-ask. Publishing (deploy, store upload, pushing tags) is the user's action:
   give the exact commands or dashboard steps.
