---
name: adopt
description: "Bring an EXISTING codebase into the studio without breaking it: detect the stack, map existing docs and scripts into studio.yaml, merge CLAUDE.md, and draft the brief and backlog from what is already built. Use when the user wants to apply the studio to a project that already has code."
argument-hint: "[no arguments]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Agent, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git branch*), Bash(git log*), Bash(git symbolic-ref*), Bash(git switch*), Bash(git add*), Bash(git commit*), Bash(git stash*), Bash(npm run *), Bash(node scripts/*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /adopt — bring an existing project in

Adoption edits `CLAUDE.md`, `.claude/` and creates docs, so it is on the always-ask list
in every automation mode: investigate first, show the plan, apply only after the user
approves. Speak in `language.conversation`.

## 1. Investigate (read-only)
- **Stack**: `package.json` dependencies (`phaser` → web-phaser, `expo`/`react-native` →
  mobile-expo), `ProjectSettings/ProjectVersion.txt` (unity), `project.godot` (godot),
  `pubspec.yaml` / `*.uproject` (no pack yet → suggest `/new-pack`). Compare with each
  `.claude/packs/*/pack.yaml` `pack.detect` line.
- **Layout**: where code, data, assets and localized strings actually live. These
  become `paths.*` and may differ from the pack defaults.
- **Checks**: `package.json` scripts, `scripts/validate*`, test runners, lint config,
  CI files. Each becomes a `checks.*` command only if it exists and runs.
- **Docs**: existing `CLAUDE.md`, planning notes, scene/architecture docs, TODO lists.
  Read them. Decide which becomes the brief source, which go to `docs.references`.
- **Git**: main branch name (`git symbolic-ref refs/remotes/origin/HEAD` or the local
  default), branch naming in use (`git branch -a`), open branches, uncommitted work.
- **Existing .claude/**: settings.json, agents, skills, rules that would collide.
- **Conventions already enforced** in the old CLAUDE.md (language of comments,
  sprite rules, branch rules). Map each to a studio setting or keep it as a project rule.

## 2. Present the adoption plan (then wait for approval)
Show, compactly:
1. `studio.yaml` values you will set (project, packs, git, checks, paths, docs
   mapping, references, art.style/pipeline if the docs state them).
2. `CLAUDE.md` merge: the existing content stays, wrapped as the project block; the
   Stack markers and `@.claude/studio/STUDIO.md` import are added at the end. List any
   existing rule that STUDIO.md now duplicates; do not delete it without approval.
3. Settings/hook merge if a `.claude/settings.json` exists (union of permissions and
   hooks; never drop theirs).
4. Pack rule paths to adjust so the rules match this project's real folders.
5. Docs to create: brief (drafted from code + notes; inferred lines marked
   `(inferred)`), backlog (Now/Next from known plans and TODOs, Done with at most a few
   lines of what exists), decisions (3–6 entries for architecture that is evident in the
   code, marked as recorded-at-adoption).
6. Things you found that look broken or risky (a failing check, uncommitted work,
   conflicting conventions). Report, do not fix.
Ask for approval with AskUserQuestion: apply all / apply without docs / let me change
something.

## 3. Apply (after approval)
- Work on a branch: `git switch -c chore/adopt-studio` (stash or stop if the tree is
  dirty with unrelated work; ask).
- Activate packs with `bash .claude/scripts/pack.sh activate <pack>`, then set
  values with `config.sh set`. Edit installed rule files' `paths:` if step 2.4 said so.
- Merge CLAUDE.md and settings, create the docs. Add `.gitattributes` lines: LF for
  the studio's scripts scoped to `.claude/**` (`.claude/**/*.sh text eol=lf`,
  `.claude/**/*.mjs text eol=lf`; do not add repo-wide eol rules to an existing repo,
  that renormalizes every file) and `merge=union` for the decisions log path. Add the studio block
  of its `.gitignore` (`.claude/state/*`, `.claude/settings.local.json`, the specs folder)
  to the project's files, keeping their existing lines.
- Run `bash .claude/scripts/selftest.sh` and `bash .claude/scripts/run-check.sh all`.
- Commit on the branch: `chore: adopt studio workflow`. Do not push.

## 4. Finish
Report what changed, check results, the follow-ups, and that a new session is needed
for pack agents. Suggest `/next`, then `/plan-stories` or `/build` for the next story.
