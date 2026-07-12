# CLAUDE.md - Boso RPG Project Guide

## Project Overview
Boso is a 2D pixel RPG built with Phaser 3 + Vite. "Look at me!" — Boso the
dog crosses the house to reach the Owner locked away in the attic laboratory.
MapleStory-inspired gameplay (platforms, ropes, portals, combat) with a
Magatia-homage story: two rival toy-alchemist guilds (Gearists vs Plushists)
whose runaway experiments roam the house.

## Tech Stack
- **Engine**: Phaser 3 (via npm)
- **Build**: Vite
- **Language**: Vanilla JavaScript (ES modules)
- **Deploy target**: Vercel (free)

## Commands
```bash
npm run dev       # Start dev server
npm run build     # Production build to /dist
npm run preview   # Preview production build
npm run validate  # Node data validator (maps/portals/ropes/monsters/bgm)
```

## Project Structure
```
boso-rpg/
├── public/assets/
│   ├── images/               # title_bg.png + optional tex/<key>.png overrides
│   └── bgm/                  # optional BGM files (see docs/ASSETS.md)
├── docs/
│   ├── STORY.md              # Story bible (Korean, design doc)
│   └── ASSETS.md             # Texture/BGM key registry for drop-in assets
├── scripts/
│   └── validate.mjs          # Pure-Node world data validator
├── src/
│   ├── main.js               # Entry point, registers scenes
│   ├── config.js             # Phaser config (RESIZE mode, pixelArt: true)
│   ├── data/                 # PURE DATA (no Phaser imports, Node-validatable)
│   │   ├── maps.js           # MAPS_DATA registry + START_MAP
│   │   ├── map_*.js          # 7 house maps (yard..closet)
│   │   ├── monsters.js       # MONSTER_TYPES (6) + BOSS_TYPES (2) + drop tables
│   │   ├── quests.js         # QUESTS (kill objectives, NPC givers, rewards)
│   │   ├── items.js          # ITEMS (consumables: cookie/milk)
│   │   ├── worldmap.js       # World map screen layout (M key overlay)
│   │   ├── audio.js          # BGM registry (5 keys, graceful fallback)
│   │   ├── story.js          # Intro/ending/warning text
│   │   └── assets.js         # Optional texture override registry
│   ├── entities/
│   │   ├── Player.js         # Player (movement, ropes, combat, knockback)
│   │   ├── HugGuardian.js    # Field boss (Zakum homage)
│   │   └── VacuumKing.js     # Hidden boss (suction + dust projectiles)
│   ├── scenes/
│   │   ├── PreloadScene.js   # Optional-asset loader (texture/bgm overrides)
│   │   ├── TitleScene.js     # Title (key: MenuScene)
│   │   ├── CharacterSelectScene.js  # Choose your pup (Brave/Swift Paw)
│   │   ├── StoryScene.js     # Intro text sequence
│   │   └── GameScene.js      # Main game (multi-map, monster AI, bosses)
│   ├── systems/
│   │   ├── AudioManager.js   # Key-based BGM, silent when files missing
│   │   └── SaveManager.js    # localStorage 'boso_save_v1' (story flags)
│   ├── ui/HUD.js             # HP/MP bars + map name
│   └── utils/constants.js    # Global constants (PLAYER, SCENES, DEPTH...)
├── index.html
└── package.json
```

## Architecture

### Scene Flow
PreloadScene → TitleScene (MENU) → CharacterSelectScene → StoryScene → GameScene
- ESC in GameScene opens pause menu (Continue / Character Select / Main Menu)
- Death → SPACE to respawn at Sunny Backyard
- Vacuum King defeated → ending sequence → title (demoCleared flag)

### World (11 maps, OPEN graph with loops - MapleStory style)
```
garden ─┬─ yard ── livingroom ── kitchen ─┬─ hallway ─┬─ playroom ── attic ─┬─ (hidden) closet
        └───────(back door)───────────────┘     │      ├─ bedroom ── rooftop ┘  (skylight loop)
                                    basement ───┘──────┘  (cellar loop)
```
- Three loops: yard↔garden↔kitchen / kitchen↔basement↔hallway /
  hallway↔bedroom↔rooftop↔attic (skylight = alternate boss route)
- hallway is VERTICAL (1800x1400), climbed via ropes; it is the hub (4 portals)
- attic has the Hug Guardian; defeating it sets flag `hugGuardianDefeated`
  which opens the hidden golden portal to closet (Vacuum King)
- World map UI: M key overlays node/edge graph from src/data/worldmap.js
  (closet node hidden until the flag is set)
- Map data includes: platforms, ropes, portals (optional hidden/requiresFlag),
  npcs ({x, y, name, dialogue[]}), monsters ({x, y, type}),
  optional boss ({id, x, y}), bgm key, bgColors

### Monster System (type-driven AI)
Types defined in `src/data/monsters.js`; AI in GameScene.updateMonsterAI:
| Type | Movement | Reference |
|---|---|---|
| bangul | `snail` — slow patrol, random pauses, turns at walls/ledges | MapleStory snail |
| gong | `bouncer` — hops ignoring terrain, 40% toward player, squash/stretch | slime/mushroom |
| laser | `flyerDash` — gravity-free waypoint wander, dashes at player <280px | Stitch |
| nabi | `sineGlider` — horizontal patrol + sine-wave altitude | butterfly |
| pari | `jitter` — fast erratic retargeting, 50% player bias, leashed | fly |
| robo | `charger` — patrol → windup rattle 0.5s → straight charge (off ledges) | wild boar |
HP/touch damage/EXP come from MONSTER_TYPES (map data holds only x, y, type).

### Bosses
- **HugGuardian** (attic): patrol + 3 patterns — armSweep (proj_arm crosses the
  whole map), slam (telegraphed circle), fieldHug (full-map wipe, one green
  safe zone telegraphed 1.7s; never twice in a row).
- **VacuumKing** (closet): hover+bob, suction cycle (3s on / 2.5s off) that adds
  pull velocity to the player AFTER Player.update (see GameScene.update order),
  dust ball projectiles while off. Boss updates MUST stay after player update.
- Both: die() → scene.onBossDefeated(id) → SaveManager flag; boss never
  respawns once defeated.

### Systems
- **EXP/Leveling**: MONSTER_TYPES/BOSS_TYPES carry `exp`; Player.gainExp →
  levelUp (+12 HP, +6 MP, +2 ATK, full heal); expToNext = 30 + level*25.
  Progress persists per character id (MapleStory-style: survives new games).
  HUD shows Lv + EXP bar + Treats; CharacterSelect shows saved level.
- **Drops**: MONSTER_TYPES.drops = { treatsMin/Max, items: [{key, chance}] };
  killMonster spawns physical pickups (bounce, auto-collect on touch,
  15s despawn with blink). Bosses award drops directly (no physical spawn -
  the vacuumKing ending starts immediately). Treats = currency.
- **Items**: src/data/items.js; hotkeys 1 (Cookie +40 HP), 2 (Milk +30 MP);
  bag overlay on I. MP regenerates +2/2s naturally.
- **Bark (Swift Paw)**: X key fires 'proj_bark' (4 MP, 350ms cd, 360px range,
  0.8x ATK); hits monsters AND bosses via boss.applyDamage().
- **Quests**: src/data/quests.js kill-count quests; NPC markers (! available,
  ? ready); accept/turn-in happens on dialogue open; tracker under minimap;
  progress in save (characters.<id>.quests). Boss quests auto-complete if
  the boss flag is already set.
- **NPC dialogue**: SPACE near an NPC opens a dialogue box (lines from map
  npc data + quest offer/reminder/completion); SPACE advances, auto-closes
  when walking away.
- **SaveManager**: localStorage key `boso_save_v1`, `{ flags: {}, characters:
  { <charId>: { level, exp, treats, items, quests } } }`; Node-safe.
  Flags: hugGuardianDefeated, vacuumKingDefeated, demoCleared.
- **AudioManager**: `play(scene, key)` / `stop()`. Missing audio file = silent
  no-op. Same key keeps playing across map changes.
- **Asset overrides**: PreloadScene tries `assets/images/tex/<key>.png` for all
  keys in `src/data/assets.js`; loaded keys skip procedural generation
  (every generator is guarded by `textures.exists`). See docs/ASSETS.md.

### Controls
| Action | Key |
|--------|-----|
| Move | ← → |
| Jump | ALT |
| Attack | CTRL |
| Drop through platform | ↓ + ALT |
| Grab rope (up) | ↑ near rope |
| Grab rope (down) | ↓ near rope top |
| Climb rope | ↑ / ↓ while on rope |
| Jump off rope | ALT (+ optional ← →) |
| Enter portal | ↑ near portal |
| Talk to NPC | SPACE near NPC |
| Bark (Swift Paw only) | X |
| Use Cookie / Milk | 1 / 2 |
| Bag & quest log | I |
| World map | M |
| Pause menu | ESC |
| Respawn after death | SPACE |

### Platform Rules
- Ground (isGround: true): full collision, cannot drop through
- Floating platforms: ONE-WAY (solid from above only) — jump up through them,
  drop through with ↓ + ALT; Gong monsters hop through them freely
- Flying monsters have no platform colliders at all

### Knockback
- Player: takeDamage(amount, dir) → velocity push + 0.3s input lock (isKnockedBack)
- Monsters: velocity push; flyers re-steer via their AI instead of vy pop

## Code Conventions
- **All code comments in English**
- **All in-game text in English** (docs/ may be Korean)
- No console.log in src/ (validator enforces both rules)
- Constants in UPPER_CASE in constants.js; scene keys in SCENES; DEPTH ordering
- Map/monster/audio/story data is PURE (no Phaser imports) so
  scripts/validate.mjs can import it under Node

## Validation & Verification
- `npm run validate` — 9 check groups: map fields, support rule (spawns/portals/
  NPCs/ground monsters have platforms below), portal targets & bounds,
  reachability BFS from START_MAP, monster types, boss placement, rope
  anchoring, bgm keys, src/ convention scan
- `npm run build` — must pass with zero errors

### Adding New Maps
1. Create `src/data/map_newmap.js` (copy an existing map's shape)
2. Register in `src/data/maps.js` MAPS_DATA
3. Add a portal in an existing map pointing to the new key
4. Run `npm run validate`

### Adding New Monster Types
1. Add entry to MONSTER_TYPES in `src/data/monsters.js` (stats + movement key)
2. Add texture generation in GameScene.createMonsterTextures (guard exists)
3. Add a movement case in GameScene.updateMonsterAI
4. Add the texture key to `src/data/assets.js` for image override support

## Planned Features (next)
- Shop NPC (spend Treats)
- More quest types (fetch/escort), quest chains
- Real BGM files (keys ready — see docs/ASSETS.md)
- Character/monster art replacement via texture overrides
