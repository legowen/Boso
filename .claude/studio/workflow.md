# Workflow

Read on demand by the skills. The summary lives in `STUDIO.md`.

## Steps

| Step | Skill | Lead agent | Input | Output |
|---|---|---|---|---|
| Concept | `/brainstorm` | creative-director (+ game-designer or ux-designer) | an idea, or nothing | `docs.brief` |
| Spec | `/spec` | game-designer / ux-designer / narrative-designer | a feature idea or a spec pasted from chat | `docs.specs/<slug>.md` |
| Plan | `/plan-stories` | producer (+ technical-director at `standard`) | the brief or a spec | stories in `docs.backlog` |
| Build | `/build` | pack specialist, else developer | one story | code on a feature branch |
| Verify | `/qa` | qa-validator | the branch diff | PASS/FAIL report |
| Playtest | `/playtest` | playtester | a running build | screenshots + report in `.claude/state/evidence/` |
| Done | `/done` | code-reviewer, then main session | a verified story | commit, backlog ticked, decision logged |

Side tools: `/bug-report`, `/asset-spec`, `/balance`, `/release`, `/next`, `/adopt`,
`/start`, `/new-pack`.

## Rigor

| | `minimal` (default) | `standard` |
|---|---|---|
| Docs before code | the brief | the brief + a spec for any story touching 2+ systems |
| Spec review | none | creative-director checks it against the brief |
| Plan review | none | technical-director checks feasibility and data ownership |
| Verify | qa-validator, always | qa-validator, always |
| Done review | code-reviewer | code-reviewer + director for its domain on player-facing changes |
| Decisions log | architecture and data-format choices | every choice that would be expensive to reverse |

Adversarial verification is never skipped at any rigor. Raise rigor when a project
gets a second contributor, a release date, or a system that keeps breaking.

## Backlog format (`docs.backlog`)

Skills parse this file. Keep the shape:

```markdown
# Backlog

## Now
- [~] S-012 monster-respawn — Defeated monsters respawn after a delay · spec: design/specs/monster-respawn.md
  - AC: a defeated monster reappears at its own spawn point after the delay
  - AC: the delay is read from data, not code
  - Visible: yes

## Next
- [ ] S-013 respawn-vfx — Fade-in effect when a monster respawns

## Later

## Bugs
- [ ] B-004 portal-softlock — Player can fall through the portal at map 3 edge (sev: major)

## Done
- [x] S-011 bgm-registry — Central BGM registry with null fallback
```

- `[ ]` todo, `[~]` in progress, `[x]` done. IDs: `S-###` stories, `B-###` bugs, never reused.
- Status changes happen **in place** (only the checkbox changes). Do not move lines to Done
  while working on a branch: moving lines makes parallel branches conflict. `/plan-stories`
  moves finished items to Done when it tidies the backlog on its own branch.
- The slug after the ID becomes the branch name (`feat/monster-respawn`, `fix/portal-softlock`).
- Every story has testable `AC:` lines and a `Visible: yes|no` line (yes = needs `/playtest`).
- A story should fit one branch and one sitting. Bigger → split it.

## Decisions log format (`docs.decisions`)

Append-only, newest at the bottom, headed by date and title (no numbers, so parallel
branches cannot collide). `.gitattributes` gives it `merge=union`, so two
branches that both append merge without a conflict (update that line if the path changes).

```markdown
## 2026-11-07 · Monster stats live in src/data/monsters.json
- Context: respawn needs a per-monster delay
- Decision: extend the existing monster data file instead of a new file
- Consequence: validate script must check `respawnSeconds > 0`
```

## Handing work in from a chat

Planning in a claude.ai chat is fine. Bring the result in by pasting it into
`/spec` (it becomes a spec) or `/plan-stories` (it becomes stories). One source of truth:
once it is in `design/`, edit it there.

## Specs are working documents

`docs.specs` is gitignored by default so the repository stays clean. When a story is
done, `/done` folds anything durable from the spec into the brief or the decisions
log. To track specs in git, remove the `design/specs/` line from `.gitignore`.
