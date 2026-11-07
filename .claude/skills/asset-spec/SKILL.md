---
name: asset-spec
description: "Write exact asset specs and generation prompts (sprites, tiles, UI, icons, backgrounds, music, SFX) that match the project's style and pipeline. Use when the user needs new art or audio for a feature, or prompts for an image or sound generator."
argument-hint: "<asset | feature | spec-slug>"
allowed-tools: Read, Glob, Grep, Write, Edit, Agent, AskUserQuestion, Bash(bash .claude/scripts/*), Bash(git status*), Bash(git diff*), Bash(git log*)
---

!`bash .claude/scripts/status.sh --short`

The block above is the project state (from `.claude/scripts/status.sh`). If it is empty, run that script yourself before continuing.

# /asset-spec — assets that drop straight in

Input: `$ARGUMENTS` — an asset, a list, a feature, or a spec slug.

1. Visual assets → **art-director**; audio → **audio-designer**. Brief them with:
   `art.style`, `art.pipeline`, the active pack's asset rules (in `.claude/rules/`),
   existing assets under `paths.assets` to match, and the spec that needs the asset.
2. Output goes to `design/assets.md` (one section per asset, template
   `.claude/studio/templates/asset-spec.md`); create the file if missing.
3. For generated art, each spec includes a ready-to-paste prompt per animation and the
   post-processing steps of the pipeline, ending with the exact file names and atlas
   keys the code will load.
4. Report: assets specified, prompts ready, what the code expects (keys/paths), and
   who integrates it (usually a story for the pack specialist).
