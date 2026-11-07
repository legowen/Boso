---
name: start
description: "Set up the studio for a NEW project: choose game or app, platform pack, automation and rigor, then create the core design docs. Use when the user just copied the template, says start/setup/new project, or no pack is active and there is no code yet."
argument-hint: "[no arguments]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git init*), Bash(git add*), Bash(git commit*), Bash(git switch*), Bash(git status*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /start — new project setup

Speak to the user in `language.conversation` (default Korean).

## 1. Make sure this is a new project
Look for existing code: `package.json`, `src/`, `Assets/` + `ProjectSettings/`,
`project.godot`, `pubspec.yaml`, `*.uproject`, `app.json`. If real code exists, stop and
recommend `/adopt` instead (it keeps what is there). Template files under `.claude/`
do not count.

## 2. Ask (one AskUserQuestion call, up to four questions)
Run `bash .claude/scripts/pack.sh list` first so the pack options are real.
1. **What are you making?** game / app.
2. **Platform pack** — the packs from the list, each with one line on when it fits
   (browser game → web-phaser; PC/console/mobile game with an editor → unity or godot;
   phone app → mobile-expo). Allow "not sure": then recommend one in one sentence from
   their answer to 1 and the target device, and confirm. If none fits (Flutter,
   Unreal, ...), say `/new-pack <name>` can create it and continue without a pack.
3. **Automation** — autonomous (Recommended: works through a story and commits on the
   feature branch, asks only for the always-ask list) / guided / ask-first.
4. **Rigor** — minimal (Recommended: one-page brief, docs only when needed) / standard.
The project name defaults to the folder name; mention it and let them change it.
Languages default to: talk ko, docs ko, code en, in-game en. Mention them in one line
and change only if the user asks.

## 3. Apply
- `bash .claude/scripts/config.sh set project.name "<name>"`, `project.type`,
  `mode.automation`, `mode.rigor` (and languages if changed).
- `bash .claude/scripts/pack.sh activate <pack>` for each chosen pack.
- Create the core docs from `.claude/studio/templates/`: `docs.brief` (game-brief.md or
  app-brief.md, title filled, the rest left as prompts), `docs.backlog`,
  `docs.decisions`.
- Replace the text between `<!-- studio:project:start -->` and
  `<!-- studio:project:end -->` in `CLAUDE.md` with two lines: the project name and type,
  and "Design docs: design/ (see .claude/studio.yaml docs.*)".
- Replace the root `README.md` with a short README for the project (name, one-line
  pitch placeholder, how to run from the pack's `checks.run`, link to `design/brief.md`).
  The template guide stays at `.claude/studio/GUIDE.md`.
- If the folder is not a git repository: `git init -b main`, then one commit
  `chore: set up studio` on main (the guard allows the first commit).
  If it is a repository, create branch `chore/studio-setup` and commit there.

## 4. Finish
Tell the user in three or four lines: what was set, that a **new Claude Code session**
is needed for the pack's agents to load, and the next step:
`/brainstorm` if there is no concept yet, `/spec <feature>` if there is.
