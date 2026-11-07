---
name: spec
description: "Write a feature spec — from a short idea or from a spec pasted from a chat. Use when the user describes a feature, mechanic, screen, system, map, character or content set to be designed before building."
argument-hint: "<feature name | idea | pasted spec>"
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /spec — feature spec

Input: `$ARGUMENTS` — a feature name, an idea, or a pasted spec from a chat.

1. **Pick the lead** by topic and delegate with the Agent tool:
   mechanics/systems/levels/enemies/economy → game-designer; screens/HUD/menus/flows →
   ux-designer; story/dialogue/text → narrative-designer; visuals/assets →
   art-director; music/SFX → audio-designer; saves/accounts/online → backend-engineer.
   Mixed features: one lead, others consulted for their section only.
2. **Brief for the lead**: the input verbatim, the paths of `docs.brief`,
   `docs.decisions`, `docs.references`, the template
   `.claude/studio/templates/spec.md`, the output path `docs.specs/<slug>.md`, and the
   data/code locations from `paths.*`. When the input is a pasted chat spec: keep every
   decision it already made, restructure into the template, and list gaps rather than
   inventing answers.
3. **Review** (rigor `standard`, or when the feature touches the pillars at any rigor):
   creative-director checks fit with the brief; technical-director checks data
   ownership/feasibility if the spec adds data formats, saves or online features.
   Apply their required changes; note optional ones.
4. **Open questions**: if the user is present, ask them (AskUserQuestion, max four).
   Write answers into the spec and set its status to `ready`. Otherwise leave them in
   the spec with status `draft`.
5. Report: spec path, the 3–5 key rules, open questions, and next step `/plan-stories <slug>`.
