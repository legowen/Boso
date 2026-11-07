---
name: build
description: "Implement one backlog story end to end on its own branch: implement, run checks, adversarial verification, playtest when visible, fix loop. Use when the user says build, implement, start or continue a story (S-### or B-###)."
argument-hint: "[S-### | B-###]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*), Bash(git switch*), Bash(git checkout -b *), Bash(git add *), Bash(git commit *), Bash(git stash*), Bash(git branch*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /build — one story, one branch

Input: `$ARGUMENTS` — a story id (`S-012`, `B-004`) or empty (continue the `[~]`
story, else the first `[ ]` under Now). Read `mode.automation` and `git.*` from
`.claude/studio.yaml`.

## 1. Prepare
- Read the story, its `AC:` lines, `Visible:`, and its spec if linked. If the story has
  no testable ACs, stop and suggest `/plan-stories` to fix it.
- Git: `git status`. Uncommitted changes that do not belong to this story → stop and
  ask. Create or switch to the branch `<git.branch_prefix><slug>` (use `fix/` for
  `B-` ids) from `git.main_branch`.
- Mark the story `[~]` in the backlog. Update `.claude/state/active.md`.
- `guided` or `ask-first`: read the relevant code yourself, write a short plan (files,
  approach per AC, data changes, risks) and wait for approval.

## 2. Implement
Choose the implementer (`.claude/studio/roster.md` → "Who builds"): the active pack's
specialist for files in its stack; backend-engineer for server/sync work; else
developer. Delegate with the Agent tool. The brief contains:
- story id, slug, summary, every `AC:` line verbatim, spec path
- the files and folders likely involved (from your reading of `paths.*`)
- "Follow `.claude/rules/` for the paths you edit. Do not commit. Run
  `bash .claude/scripts/run-check.sh all` before reporting. Report files changed and
  how each AC is met."

## 3. Prove it
1. Run `bash .claude/scripts/run-check.sh all` yourself. Do not rely on the
   implementer's report.
2. Delegate to **qa-validator**: story id, ACs, branch, spec path. It returns PASS/FAIL
   with findings.
3. If `Visible: yes`: delegate to **playtester** with the story id, ACs and which
   scene/screen to open.
4. **Fix loop**: blocker/major findings, failing checks or `OBSERVED-DEFECT` go back to
   the implementer in a new Agent call with the findings verbatim. Then repeat 3.1–3.3.
   At most **3 rounds**; after that stop and report what still fails and why.
5. `MANUAL NEEDED` from the playtester: keep going, but the story cannot be closed
   until the user confirms the checklist.

## 4. Hand over
- Update `.claude/state/active.md` (story, branch, checks, verdicts, what is left).
- `autonomous`: if checks have no FAIL, qa-validator is PASS, and playtest is OBSERVED
  or not needed, continue straight into the `/done` procedure
  (`.claude/skills/done/SKILL.md`). Otherwise stop and report.
- `guided` / `ask-first`: report and suggest `/done`.
- Report: files changed, check results line, QA verdict, run result, open items.
