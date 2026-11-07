---
name: plan-stories
description: "Break a spec or the brief's MVP into small single-concern stories with testable acceptance criteria and add them to the backlog. Use when the user wants to plan work, split a feature, or decide build order."
argument-hint: "<spec-slug | brief | pasted list>"
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /plan-stories — stories into the backlog

Input: `$ARGUMENTS` — a spec slug/path, `brief` (plan the MVP), or a pasted list.

1. Delegate to **producer** with: the source doc(s), `docs.backlog` (create it from the
   template if missing), `docs.decisions`, `paths.*`, and the backlog format section
   of `.claude/studio/workflow.md`.
2. At rigor `standard`, send producer's draft to **technical-director** for a
   feasibility and shared-file check; apply required changes.
3. Show the user the new stories: id, slug, one line, ACs count, Visible yes/no, order.
   - `autonomous`: write them to the backlog and report.
   - `guided` / `ask-first`: ask for approval (AskUserQuestion: apply / change order /
     edit) before writing.
4. Link the spec to its stories (`Backlog:` line in the spec) and set the spec status
   to `ready` if its questions are answered.
5. Tidy: move `[x]` items into `## Done` only when no story branch is open (check
   `git branch` for unmerged `feat/`/`fix/` branches); otherwise leave them in place.
6. Next step: `/build <first story id>`.
