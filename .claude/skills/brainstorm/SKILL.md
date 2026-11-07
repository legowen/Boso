---
name: brainstorm
description: "Find or sharpen a concept and write the one-page brief (game or app). Use when the user has no idea yet, a vague idea, wants alternatives, or wants to restart the concept."
argument-hint: "[theme or idea, optional]"
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /brainstorm — from idea to brief

Lead: **creative-director** (delegate with the Agent tool when the exploration is
large; otherwise do it in the main session with its principles). Speak in
`language.conversation`; write the brief in `language.docs`.

1. If `docs.brief` already has content, ask whether to refine it or explore a new
   direction. Never overwrite a brief without approval.
2. Ask at most four questions in one AskUserQuestion call, skipping what the user
   already said: who it is for and what they should feel; a reference game/app they
   love; target platform/device; how big (weekend, month, long project).
3. Offer three distinct concepts. Each: a one-sentence pitch, the core loop (or core
   flow for apps), the hook that makes it different, the riskiest assumption, and the
   reference it borrows from. Make them genuinely different, not three flavours.
4. The user picks or mixes. Refine once with them.
5. Write `docs.brief` from `.claude/studio/templates/game-brief.md` (or `app-brief.md`
   when `project.type` is app). One screen. MVP ≤ 7 lines, explicit out-of-scope.
6. Set `project.stage` to `concept` if it was empty.
7. Next step: `/spec <first MVP feature>` or straight to `/plan-stories` if the brief is
   enough for small stories (rigor minimal).
