---
name: done
description: "Close a verified story: confirm evidence for every acceptance criterion, review the diff, update backlog and decisions, and commit on the story branch (push/PR only with approval). Use when the user says a story is done, finished, ready to commit or ready for a PR."
argument-hint: "[S-### | B-###]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*), Bash(git switch*), Bash(git checkout -b *), Bash(git add *), Bash(git commit *), Bash(git stash*), Bash(git branch*), Bash(git push*), Bash(gh pr*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /done — close the story

Input: `$ARGUMENTS` — a story id, or empty for the story on the current branch.

## 1. Gate (stop at the first failure and report it)
- On the story's branch, not on `git.main_branch`.
- `bash .claude/scripts/run-check.sh all` has no FAIL. NOT CONFIGURED checks are listed
  in the report, never described as passing.
- A qa-validator PASS exists for the current code (from `/build` or `/qa` in this
  session, recorded in `.claude/state/active.md`). If code changed since, run `/qa`
  again.
- `Visible: yes` stories have `Run result: OBSERVED` or a user-confirmed MANUAL
  checklist.
- Every `AC:` line has evidence: test, validation rule, or screenshot.

## 2. Review
- Delegate to **code-reviewer**. Fix trivial issues on the branch (re-run checks after).
  Out-of-scope files → ask the user: move to a new story, or keep.
- Rigor `standard` and player-facing change: also ask the director of the domain
  (creative-director for feel/look/text, technical-director for architecture).

## 3. Record
- Backlog: change the story's checkbox to `[x]` in place. Do not move the line (moving
  lines makes parallel branches conflict; `/plan-stories` tidies Done later).
- Decisions: append any decision made during the story (format in workflow.md).
- Spec: set status `done`; move anything durable (rules other features rely on) into
  the brief or a decision entry, since specs are not tracked in git by default.
- `.claude/state/active.md`: story closed, next suggested story.

## 4. Commit
- Stage only files that belong to the story (list them from `git status`; never stage
  unrelated changes). Commit with a Conventional Commit message in `language.code`,
  e.g. `feat: respawn monsters after configured delay (S-012)`. The commit hook runs
  the guards and `checks.validate`; if it blocks, fix the cause and commit again.
- Push / PR: if `git.auto_push` is false, ask the user (AskUserQuestion: push and open
  PR / push only / not now). For a PR, use `gh pr create` when available with a body
  containing summary, ACs with evidence, check results and screenshot names;
  otherwise give the user the compare URL. Never merge.

## 5. Report
Commit hash and message, what was recorded, PR link or the next manual step, and the
next story to `/build`.
