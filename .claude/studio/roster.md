# Roster

Core agents are always installed (`.claude/agents/`). Pack agents are copied in when
a pack is activated (`bash .claude/scripts/pack.sh activate <pack>`).

## Core

| Agent | Model | Writes? | Use for |
|---|---|---|---|
| producer | inherit | design docs | turning a brief or spec into stories, scope cuts, ordering, branch plan |
| creative-director | inherit | design docs | vision, pillars, tone; does this feature belong in this game/app? |
| technical-director | inherit | design docs | architecture, data ownership, feasibility, performance budgets, decisions log |
| game-designer | sonnet | design docs | mechanics, systems, levels, progression, economy, balance |
| narrative-designer | sonnet | design docs, text data | story, characters, dialogue, every player-facing string |
| ux-designer | sonnet | design docs | HUD, menus, onboarding, input, accessibility, app screens and flows |
| art-director | sonnet | design docs | art bible, asset specs, image-generation prompts, sprite/atlas conventions |
| audio-designer | sonnet | design docs | music and SFX lists, specs, licensing, audio registry |
| developer | sonnet | code | implementing a story when no pack specialist fits |
| backend-engineer | sonnet | code | saves, sync, auth, leaderboards, APIs, Supabase/Firebase |
| qa-validator | sonnet | **no** | adversarial verification: tries to break the change |
| code-reviewer | haiku | **no** | diff review: one concern, conventions, conflict risk |
| playtester | sonnet | evidence only | launches the build, captures screenshots, compares to the ACs |
| release-manager | sonnet | release notes | versioning, changelog, build and store/deploy checklists |

## Pack specialists

| Pack | Agent | Stack |
|---|---|---|
| web-phaser | phaser-specialist | Phaser 3, Vite, JavaScript/TypeScript, Tiled, texture atlases, Vercel |
| unity | unity-specialist | Unity 6, C#, ScriptableObjects, Input System, UI Toolkit, Addressables |
| godot | godot-specialist | Godot 4, GDScript, scenes/signals/resources, export presets |
| mobile-expo | mobile-specialist | React Native, Expo, TypeScript, expo-router, EAS build/submit |

Make a new one with `/new-pack <name>` (Flutter, Unreal, Defold, Next.js, ...).

## Who builds

`/build` picks the implementer in this order: the specialist of the pack that owns
the files the story touches → `backend-engineer` for server/data-sync work →
`developer`.

## Saving usage

- `model:` in each agent's frontmatter is the knob. `inherit` follows your session
  model; `sonnet` and `haiku` are cheaper.
- To force every subagent onto one model for a session, set the environment variable
  `CLAUDE_CODE_SUBAGENT_MODEL` (e.g. `sonnet`) before starting Claude Code.
- Fewer, larger handoffs are cheaper than many small ones: each subagent starts with
  an empty context and re-reads what it needs.
