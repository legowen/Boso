---
name: studio-sync
description: "Pull improvements from the studio template folder into this project's .claude/ framework files without touching project settings or docs. Use when the user improved the template and wants a game/app project to get the update."
argument-hint: "<path-to-template>"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git switch*), Bash(git add*), Bash(git commit*), Bash(git status*)
---

# /studio-sync — update this project's studio from the template

Input: `$ARGUMENTS` — the path to the template folder (e.g. `../studio-template`).

1. Dry run: `bash .claude/scripts/sync.sh "<template path>"`. Show the user the list of
   files that would be added/updated and the files kept as project-owned.
2. Changing `.claude/` is always-ask: apply only after approval, on a branch
   `chore/studio-sync`: `bash .claude/scripts/sync.sh "<template path>" --apply`.
3. Re-activate each active pack so installed agents/rules match the updated packs
   (`bash .claude/scripts/pack.sh activate <pack>`). It keeps local edits and says so.
4. Run `bash .claude/scripts/selftest.sh`, then commit `chore: sync studio from template`.
5. Remind the user to start a new session.
