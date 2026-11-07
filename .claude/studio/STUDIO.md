# Studio Operating Manual

This project runs on a small, engine-agnostic studio: core agents that work for any
game or app, plus one or more **platform packs** (web-phaser, unity, godot,
mobile-expo, ...) that add the stack specialist, path rules and check commands.
Everything configurable lives in `.claude/studio.yaml`.

## 1. Settings

Read `.claude/studio.yaml` before acting on anything it covers. Do not guess a value
it holds. Key settings:

- `language.*` — speak to the user in `language.conversation`; write design docs in
  `language.docs`; write code comments, identifiers and commit messages in
  `language.code`; write player-facing text in `language.ingame`. A hook rejects
  CJK text in code when `language.code` is `en`.
- `mode.automation` — how much you may do without asking (section 3).
- `mode.rigor` — how much documentation and review (see `.claude/studio/workflow.md`).
- `checks.*` — the commands that prove the work. An empty command is
  **NOT CONFIGURED**, never a pass.

## 2. The pipeline

```
concept      spec    plan           build    verify   (playtest)   done
/brainstorm ─► /spec ─► /plan-stories ─► /build ─► /qa ─► /playtest ─► /done
```

Full detail: `.claude/studio/workflow.md`. Who does what: `.claude/studio/roster.md`.
Skills orchestrate from the main session; each step hands a precise brief to one
subagent and gets a report back.

## 3. Automation

| Mode | You may, without asking | You stop and ask before |
|---|---|---|
| `autonomous` (default) | create a feature branch; read, write, edit and run anything inside the current story's scope; run checks; commit on the feature branch | anything in the always-ask list |
| `guided` | same, but stop once after the plan for a story and show it | the plan, plus the always-ask list |
| `ask-first` | read and run checks | every write, plus the always-ask list |

**Always ask, in every mode:**
- pushing, opening or merging a PR, merging into `git.main_branch`
- deleting files or folders the story did not create
- adding, removing or upgrading a dependency
- editing `.claude/**`, `CLAUDE.md`, `.claude/studio.yaml`, CI or deploy config (except
  the changes a skill the user invoked exists to make: `/start`, `/adopt` after its
  approval step, `/new-pack`, `/studio-sync`)
- changing save-data formats or anything that breaks existing player saves
- anything that costs money, uses credentials, or publishes (stores, Vercel prod, itch, Steam)
- a design decision the spec leaves open and that changes what the player experiences

When unattended and blocked by one of these, finish everything else, write the
decision into `.claude/state/active.md` with options, and stop.

## 4. Branch discipline

- **One concern per branch.** One story = one branch = one PR. Name it
  `<git.branch_prefix><story-slug>` (e.g. `feat/monster-respawn`); use `fix/` for bugs.
- Never commit on `git.main_branch` (a hook blocks it when `git.block_commit_on_main`).
- Commit messages: Conventional Commits in `language.code`
  (`feat: add monster respawn timer`).
- Resolve merge conflicts locally, reading both sides and keeping both intents.
  Never pick a side wholesale, never use a web conflict editor.
- If a story turns out to need a second concern, stop and split it in the backlog.
- Shared docs on branches: tick backlog checkboxes in place, append decisions at the
  end. Never reorder or move backlog lines on a story branch.

## 5. Evidence, not claims

- Report every check as `PASS`, `FAIL`, or `NOT RUN (<why>)`. A check that did not
  run is never reported as passing; a scan of the wrong folder is not a clean result.
- A story that changes anything the player can see is not done until someone has
  **looked** at it (`/playtest`, procedure in `.claude/studio/run-and-observe.md`).
- Helper scripts in `.claude/scripts/` print observations, not verdicts. You decide.

## 6. Documents stay small

- Core docs (paths in `docs.*`): one brief, one backlog, one decisions log.
- A spec is written only for a feature too big for a backlog entry, in `docs.specs`.
- Do not create other Markdown files without asking. Prefer adding a section to an
  existing doc.
- `docs.references` lists project docs every agent should know exist; read the one
  relevant to the task, not all of them.

## 7. Engineering defaults (every engine)

- Gameplay and tuning values live in data (JSON, ScriptableObjects, Resources),
  not hard-coded. Keep the data layer free of engine imports where the stack allows,
  so it can be validated outside the engine.
- Frame-rate independent movement and timers.
- Systems talk through events/signals, not direct references to UI.
- Player-visible strings come from one place so they can be localized later.
- Follow the active pack's specialist and rules for everything stack-specific.

## 8. Session checkpoint

`.claude/state/active.md` (gitignored) is the working memory between sessions and
after compaction. Read it first when resuming. Update it at the end of each pipeline
step: current story, branch, what is done, what is next, open decisions.
Template: `.claude/studio/templates/active.md`.

## 9. Reporting back

End each step with: what changed (files), checks run with results, anything not
done and why, and the one next step. No step-by-step recap.
