# CLAUDE.md - Boso RPG Project Guide

## Project Overview
Boso is a 2D pixel RPG built with Phaser 3 + Vite. "Look at me!" — start as a
shelter cat (Seoli or Bomi), ride the travel airship between worlds, and
come home to the Owner locked away in the attic laboratory.
MapleStory-inspired gameplay (platforms, ropes, portals, combat, ship-style
cage voyages) with a Magatia-homage story: two rival toy-alchemist guilds
(Gearists vs Plushists) whose runaway experiments roam the house.

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
npm run validate  # Node data validator (maps/portals/ropes/monsters/travel/bgm)
npm test          # Combat, animation, save migration and asset regression checks
npm run art:build # Repack the retained generated sources (requires dev dependencies)
```

## Project Structure
```
boso-rpg/
├── public/assets/
│   ├── images/               # cats/ animation sheets + tex/ sprites + world/ scenery
│   └── bgm/                  # optional BGM files (see docs/ASSETS.md)
├── docs/
│   ├── STORY.md              # Story bible (Korean, design doc)
│   ├── ASSETS.md             # Texture/BGM key registry for drop-in assets
│   └── VERIFICATION.md       # Scenario checklist + adversarial review log
├── scripts/
│   └── validate.mjs          # Pure-Node world data validator
├── src/
│   ├── main.js               # Entry point, registers scenes
│   ├── config.js             # Phaser config (RESIZE mode, pixelArt: true)
│   ├── data/                 # PURE DATA (no Phaser imports, Node-validatable)
│   │   ├── maps.js           # MAPS_DATA registry + START_MAP + REGION_HOME/respawnMapFor
│   │   ├── map_*.js          # 20 maps across 3 regions (shelter/buddy/house)
│   │   ├── spawns.js         # Named entry spawns ('default', 'from:<map>') for save slots
│   │   ├── travel.js         # TRAVEL_ROUTES (cage rides) + AMBUSH_TYPES
│   │   ├── monsters.js       # MONSTER_TYPES (14) + BOSS_TYPES (4, with respawnSec) + drop tables
│   │   ├── bossRespawn.js    # isBossAlive(bossDef, bossSave, now) + BOSS_RESPAWN timing constants
│   │   ├── quests.js         # QUESTS (kill objectives, NPC givers, rewards)
│   │   ├── items.js          # ITEMS (consumables: cookie/milk)
│   │   ├── worldmap.js       # Region-scoped world map layout + REGION_TITLES
│   │   ├── audio.js          # BGM registry (8 keys, url:null placeholders, graceful fallback)
│   │   ├── story.js          # Intro/ending/warning/befriend text ({player} placeholders)
│   │   └── assets.js         # Optional texture override registry
│   ├── entities/
│   │   ├── Player.js         # Player (movement, ropes, combat, knockback; animated Seoli + Bomi)
│   │   ├── HugBossBase.js    # Shared hug-pattern boss logic (armSweep/slam/fieldHug)
│   │   ├── HugGuardian.js    # Field boss (Zakum homage) - HugBossBase subclass
│   │   ├── DrEmbrace.js      # Tutorial boss - scaled-down HugBossBase subclass
│   │   ├── Biggie.js         # Buddy House boss (bark wave / pounce / zoomies, befriend)
│   │   └── VacuumKing.js     # Hidden boss (suction + dust projectiles)
│   ├── scenes/
│   │   ├── PreloadScene.js   # Optional-asset loader (texture/bgm overrides)
│   │   ├── TitleScene.js     # Title (key: MenuScene): Start | Continue / New Game
│   │   ├── SaveSlotScene.js  # 3-slot list for Continue / New Game (+ overwrite confirm)
│   │   ├── CharacterSelectScene.js  # Choose Seoli (speed) or Bomi (power)
│   │   ├── StoryScene.js     # Intro text sequence ({player} substitution)
│   │   ├── GameScene.js      # Main game (multi-map, monster AI, bosses, travel boarding)
│   │   └── TravelScene.js    # Cage rides (scrolling world, countdown, ambushes)
│   ├── systems/
│   │   ├── AudioManager.js   # Key-based BGM, silent when files missing
│   │   └── SaveManager.js    # localStorage save slots (boso.save.slot1-3), autosave, legacy migration
│   ├── ui/HUD.js             # HP/MP bars + map name
│   ├── ui/Menu.js            # MenuButton + MenuNav (keyboard/pointer menus)
│   └── utils/
│       ├── constants.js      # Global constants (PLAYER, SCENES, DEPTH...)
│       └── format.js         # Pure play-time / saved-at formatters
├── index.html
└── package.json
```

## Architecture

### Scene Flow
PreloadScene → TitleScene (MENU) → [SaveSlotScene] → CharacterSelectScene → StoryScene → GameScene
- Title: no save in any slot → START (slot 1). Otherwise CONTINUE / NEW GAME,
  both open SaveSlotScene. CONTINUE loads a slot straight into GameScene at
  its saved map + entry spawn. NEW GAME on an empty slot starts at once; a
  filled/corrupted slot asks "Overwrite this save?" (default focus: No).
  The slot is only written when StoryScene finishes, so backing out of
  character select never touches an existing save.
- GameScene ⇄ TravelScene: talk to Owen near a cage → boarding page → ride →
  arrival map (HP/MP carried over both ways)
- ESC in GameScene opens pause menu (Continue / Character Select / Main Menu);
  Character Select swaps the active slot's companion in place (same map, the
  other cat's own progress, no intro replay)
- Death → SPACE to respawn at the current region's home map; dying mid-ride
  returns to the departure map
- Vacuum King defeated → ending sequence → title (demoCleared flag)

### World (20 maps, 3 regions, cage routes as inter-region edges)
```
[Shelter Isle]  shelter_ward ── shelter_hall ── shelter_yard ═(cage 15s)═╗
[Buddy House]   sofa_ridge ── high_table(town) ── kitchen_floor          ║
                    └──── hallway_run ────┘   ⇄ (cage 60s, ambushes) ⇄ [Home]
                          │
                    bookshelf_cliffs ── backyard_gate ──(hidden)── high_table
[Home]          garden ─┬─ yard ── livingroom ── kitchen ─┬─ hallway ─┬─ playroom ── attic ─┬─ closet
                        └───────(back door)───────────────┘     │      ├─ bedroom ── rooftop ┘
                                                  basement ─────┴──────┘
```
- `START_MAP = 'shelter_ward'` (every new game runs the tutorial, Maple
  Island style; Shelter Isle is one-way — no route back)
- Regions: `shelter` / `buddy` / `house` (`map.region`); death respawn goes to
  `REGION_HOME` via `respawnMapFor()` (shelter_ward / high_table / yard)
- hallway (house) and bookshelf_cliffs (buddy) are VERTICAL climbing maps
- attic boss sets `hugGuardianDefeated` → opens hidden golden portal to closet
  (Vacuum King); backyard_gate boss sets `biggieDefeated` → opens hidden
  shortcut portal to high_table AND unlocks Owen's route home
- World map UI: M key overlays the CURRENT REGION's node/edge graph
  (src/data/worldmap.js + REGION_TITLES; closet node hidden until its flag)
- Map data includes: region, platforms, ropes, portals (optional
  hidden/requiresFlag), npcs ({x, y, name, dialogue[], optional texture,
  travelRoute, travelRequiresFlag, travelLockedLines}), monsters
  ({x, y, type}), optional boss ({id, x, y}), optional guides
  ({x, y, text} tutorial signs), optional cage ({x, y} travel prop),
  bgm key, bgColors

### Cage Travel (src/data/travel.js + TravelScene)
- TRAVEL_ROUTES: `{ name, from, to, durationSec, bgm, ambush }`
  - `shelter_to_buddy` (15s, no ambush) — tutorial voyage
  - `buddy_to_home` / `home_to_buddy` (60s, ambush windows)
- Boarding: Owen NPCs carry `travelRoute`; dialogue ends on a boarding page
  (SPACE = board, walk away = stay, 600ms anti-mash lockout).
  `travelRequiresFlag` + `travelLockedLines` gate a route behind a save flag.
- TravelScene: cage interior with free movement/combos/potions/wind gust, scenery
  scroll, countdown text; timer accumulates frame delta (no wall clock).
- AMBUSH_TYPES: `vroom` (dasher: edge telegraph → streak across the player's
  lane, invulnerable) and `rumble` (tanker: slow advance + expanding
  shockwave rings, killable, direct treat/EXP reward).
- Death mid-ride → departure map, full-heal respawn.

### Monster System (type-driven AI)
Types defined in `src/data/monsters.js`; AI in GameScene.updateMonsterAI
(receives frame delta for the integrating movements):
| Type | Movement | Reference |
|---|---|---|
| bangul | `snail` — slow patrol, random pauses, turns at walls/ledges | MapleStory snail |
| gong | `bouncer` — hops ignoring terrain, 40% toward player, squash/stretch | slime/mushroom |
| laser | `flyerDash` — gravity-free waypoint wander, dashes at player <280px | Stitch |
| nabi | `sineGlider` — horizontal patrol + sine-wave altitude | butterfly |
| pari | `jitter` — fast erratic retargeting, 50% player bias, leashed | fly |
| robo | `charger` — patrol → windup rattle 0.5s → straight charge (off ledges) | wild boar |
| dustmote | `floater` — vertical rise/sink bobbing + leashed drift | dust in sunlight |
| lonesome | `shyGhost` — follows slowly, flinches + retreats when close | loneliness itself |
| straykitten | `pouncer` — fast chained hops + occasional pounce at player | kitten |
| sockslinker | `inchworm` — contract (squash) → extend (burst forward) → rest | inchworm sock |
| yarnroller | `roller` — constant roll, accelerates, wall-bounce speed boost | yarn ball |
| crumbhopper | `multiHop` — 2-3 quick low hops in a row, then rest | skittering crumb |
| mothcircler | `lampOrbit` — circles spawn point; break-off dash; returns | moth at a lamp |
| rcracer | `racer` — full-speed runs; drift-skid tilt telegraph before turns | RC car |
HP/touch damage/EXP come from MONSTER_TYPES (map data holds only x, y, type).
Optional `alpha` renders a type translucent (lonesome, dustmote).

### Bosses
- **HugGuardian** (attic) & **DrEmbrace** (shelter_yard): share HugBossBase —
  patrol + 3 patterns: armSweep (arm crosses the whole map), slam
  (telegraphed circle), fieldHug (full-map wipe, one green safe zone
  telegraphed; never twice in a row). Dr. Embrace is the scaled-down
  tutorial version (lower HP/damage, longer telegraphs); beating him sets
  `tutorialCompleted` + `drEmbraceDefeated`.
- **Biggie** (backyard_gate): territorial ground boss — barkWave (expanding
  knockback ring), pounce (telegraphed parabolic leap onto the player),
  zoomies (multi-pass field sprints, extra contact damage). At 0 HP he is
  BEFRIENDED (hearts + banner + trots off), not killed; flag `biggieDefeated`.
- **VacuumKing** (closet): hover+bob, suction cycle (3s on / 2.5s off) that adds
  pull velocity to the player AFTER Player.update (see GameScene.update order),
  dust ball projectiles while off. Boss updates MUST stay after player update.
- All: die() → scene.onBossDefeated(id) → SaveManager.recordBossDefeat (sets
  flag `<id>Defeated`, writes `bosses[id]` first/last defeat times, autosaves,
  returns `{ first }`); hidden portals gated on that flag are revealed
  generically. A fresh New Game starts with every boss alive.
- **Respawn (story progress vs alive state)**: two separate questions.
  *Story progress* ("ever defeated") is permanent: the `<id>Defeated` flag +
  `bosses[id].firstDefeatedAt`; read it with `SaveManager.hasDefeatedBoss(id)`.
  *Alive state* ("in the map now") is derived: `isBossAlive(def, save, now)`
  in `data/bossRespawn.js` — alive if never defeated OR
  `now - lastDefeatedAt >= respawnSec * 1000` (wall-clock `Date.now()`, so it
  keeps running while the game is closed; a defeat stamped in the future,
  i.e. clock set back, counts as alive). `respawnSec` lives on each
  BOSS_TYPES entry (hugGuardian 300, vacuumKing 600, drEmbrace 300,
  biggie 300 — tunable). `SaveManager.isBossAlive(id)` wraps it for the slot.
  - GameScene.initBoss checks alive state on map enter: alive → spawnBoss(),
    away → `this.bossRespawn = { phase: 'waiting' }`. updateBossRespawn(delta)
    (frame-delta driven, so pause/hidden tab never skip a phase) polls every
    `BOSS_RESPAWN.checkIntervalMs`; when due: warning (camera shake +
    `STORY.bossRespawn[id]`) → 2s → wait while the player is within
    `clearRadiusPx` of the boss spawn point (max 5s, then spawn anyway) →
    spawnBoss(). The same watcher is re-armed after every kill.
  - Only the FIRST defeat (`first === true`) runs story: unlock flags
    (`tutorialCompleted`, `demoCleared`), hidden-portal reveal + hint text,
    the Vacuum King ending, Biggie's befriend banner (Biggie.die asks
    `scene.isFirstBossDefeat(id)` before `onBossDefeated` records it). Later
    kills only pay EXP/treats/items and count toward kill quests.
  - Boss HP is never persisted: leaving the map or reloading respawns at full HP.
  - Dev only (`import.meta.env.DEV`, stripped from production): **F9** in a map
    or `window.bosoDev.resetBossTimers()` backdates every `lastDefeatedAt` by
    `respawnSec` (story flags and `firstDefeatedAt` are untouched).

### Systems
- **EXP/Leveling**: MONSTER_TYPES/BOSS_TYPES carry `exp`; Player.gainExp →
  levelUp (+12 HP, +6 MP, +2 ATK, full heal); expToNext = 30 + level*25.
  Progress persists per character id INSIDE each save slot (a New Game resets
  it; slots never share levels, treats, items or quests).
  HUD shows Lv + EXP bar + Treats; CharacterSelect shows saved levels only
  when swapping companions in an existing slot.
- **Characters**: only `seoli` (fast, wind claws + X gust) and `bomi`
  (high HP/ATK, short-range paws). Canonical definitions and animation frames
  live in `src/data/characters.js`. Boso is the game name, never a playable dog.
  Both use 96px frames at 1.125 scale, preserving the original physics footprint
  and foot anchor through a custom origin. Portals are 72x96 and stand on their
  supporting platform; label and interaction positions follow their art.
  Bosses and NPCs use their configured visible heights times the same 1.5
  enlargement, compensating for PNG padding with `EntityArt.js`. Physics and
  boss combat bounds retain their original sizes; use `bossCombatBounds()`
  instead of sprite image bounds. Boss tweens/reset scales must include
  `this.art.scale`. NPC labels and hints follow the visible top edge.
  Regular monsters and ship ambushers use that same visible-height ratio via
  `applyEntityArt()`; use `entityCombatBounds()` for damage, and multiply all
  AI squash/stretch/respawn scales by the entity's `art.scale`.
  Holding CTRL cycles three strikes (1x / 1.15x / 1.5x ATK); each swing hits a
  target once. DOWN crouches and reduces hurt height from 56px to 28px.
  Wind claws travel outward; Bomi's melee stays close. Damage/rope grabs cancel swings.
- **Drops**: MONSTER_TYPES.drops = { treatsMin/Max, items: [{key, chance}] };
  killMonster spawns physical pickups (bounce, auto-collect on touch,
  15s despawn with blink). Bosses and travel ambushes award drops directly.
- **Items**: src/data/items.js; hotkeys 1 (Cookie +40 HP), 2 (Milk +30 MP);
  bag overlay on I. MP regenerates +2/2s naturally. Both work mid-ride.
- **Wind Gust (Seoli)**: X key fires 'proj_bark' (retained internal key; 4 MP, 350ms cd, 280px range,
  0.8x ATK); hits monsters, bosses, and Rumble ambushers.
- **Quests**: src/data/quests.js kill-count quests; NPC markers (! available,
  ? ready); accept/turn-in on dialogue open; per-NPC quests chain in order.
  Boss quests auto-complete if the boss flag is already set.
- **NPC dialogue**: SPACE near an NPC opens a dialogue box; SPACE advances,
  auto-closes when walking away. `{player}` in lines is replaced with the
  character name. Owen NPCs append a travel boarding page.
- **SaveManager (save slots)**: up to 3 slots, one JSON object each in
  localStorage `boso.save.slot1` … `boso.save.slot3` (schema v1):
  `{ version: 1, slot, createdAt, updatedAt, playTimeSec, mapId, spawnId, hp,
  storyFlags, bosses: { <id>: { firstDefeatedAt, lastDefeatedAt } },
  characterId, characters: { <charId>: { level, exp, treats, items, quests } } }`.
  Global settings (not per slot) live in `boso.settings`
  (`getSettings()/updateSettings()`). `getFlag/setFlag/getCharacter/
  setCharacter` read and write the ACTIVE slot (set by `startNewGame(slot, cat)`
  or `continueSlot(slot)`). Node-safe; every storage access is try/catch with
  an in-memory fallback, and the title shows a notice when storage is blocked.
  - Autosave only (no manual save): after every map entry (GameScene.create,
    which also covers portals, death respawn and cage arrival), on boss
    defeat, and on `visibilitychange` → hidden. Position is the entry spawn
    (`spawnId`), never raw x/y: `'default'` (map spawnX/Y) or `'from:<map>'`
    (the landing point of the portal in <map>); both come from
    `src/data/spawns.js`, derived from map data. Unknown spawnId → default.
  - `playTimeSec` accrues only between `beginPlay()/endPlay()` (GameScene and
    TravelScene) while the tab is visible. hp <= 0 is never saved; a loaded hp
    is clamped to 1..maxHp.
  - parseSlot() rejects invalid JSON, unknown version, unknown mapId, wrong
    slot number or malformed fields → the slot lists as "Corrupted" and is
    never auto-deleted. New Game into a slot resets ALL state.
  - Legacy: `boso_save_v1` (version 3 single blob) is converted once, on boot
    (`migrateLegacy()` in main.js), into slot 1 if all slots are empty, then
    removed. Position = `high_table` if `tutorialCompleted` else START_MAP;
    flags and every character record are kept (old swift/brave → Seoli/Bomi
    mapping still applies); bosses already flagged defeated get a record
    stamped at migration time. The legacy key is kept if slot 1 cannot be
    written.
  Flags: tutorialCompleted, drEmbraceDefeated, biggieDefeated,
  hugGuardianDefeated, vacuumKingDefeated, demoCleared. (`<id>Defeated` is
  story progress and never clears; `bosses[id].lastDefeatedAt` drives the
  respawn timer — see Bosses › Respawn.)
- **AudioManager**: `play(scene, key)` / `stop()`. Missing audio file = silent
  no-op. Same key keeps playing across map changes. BGM registry entries may
  carry `url: null` (default path lookup) or a custom path string.
- **Asset overrides**: PreloadScene tries `assets/images/tex/<key>.png` for all
  keys in `src/data/assets.js`; loaded keys skip procedural generation
  (every generator is guarded by `textures.exists`). See docs/ASSETS.md.

### Controls
Touch-capable devices also get `ui/TouchControls.js`: a four-way pad, HIT,
JUMP, Seoli WIND, TALK/NEXT and CONTINUE. The extra-controls button exposes
HP/MP and (on maps) BAG/MAP/MENU. `systems/ControlState.js` merges keyboard
and independent pointer holds; do not synthesize browser key events. Every
scene must destroy its touch UI and clear held pointers on shutdown. Use
`touchControls.waitForContinue()` for death/ending so phones cannot get stuck
at a keyboard-only prompt. Mobile HUD sits at the top; camera padding keeps
the player above the pad, and MAP/BAG provide map/quest details.

| Action | Key |
|--------|-----|
| Move | ← → |
| Jump | ALT |
| Three-hit combo | CTRL (hold or repeat) |
| Crouch | ↓ on ground |
| Drop through platform | ↓ + ALT |
| Grab rope (up) | ↑ near rope |
| Grab rope (down) | ↓ near rope top |
| Climb rope | ↑ / ↓ while on rope |
| Jump off rope | ALT (+ optional ← →) |
| Enter portal | ↑ near portal |
| Talk to NPC / advance dialogue / board cage | SPACE |
| Wind Gust (Seoli only) | X |
| Use Cookie / Milk | 1 / 2 |
| Bag & quest log | I |
| World map (current region) | M |
| Pause menu | ESC |
| Respawn after death | SPACE |

### Platform Rules
- Ground (isGround: true): full collision, cannot drop through
- Floating platforms: ONE-WAY (solid from above only) — jump up through them,
  drop through with ↓ + ALT; hopping monsters pass through them freely
- Flying monsters have no platform colliders at all

### Knockback
- Player: takeDamage(amount, dir) → velocity push + 0.3s input lock (isKnockedBack)
- Monsters: velocity push; flyers re-steer via their AI instead of vy pop

## Code Conventions
- **All code comments in English**
- **All in-game text in English** (docs/ may be Korean)
- No console.log in src/ (validator enforces both rules)
- Constants in UPPER_CASE in constants.js; scene keys in SCENES; DEPTH ordering
- Map/monster/travel/audio/story data is PURE (no Phaser imports) so
  scripts/validate.mjs can import it under Node

## Validation & Verification
- `npm run validate` — check groups: map fields, support rule (spawns/portals/
  NPCs/ground monsters have platforms below), portal targets & bounds,
  reachability BFS from START_MAP (portals + travel routes as edges), town
  reachability for buddy maps, monster types, boss placement (4 required),
  rope anchoring, bgm keys, regions + world map layout coverage, travel route
  integrity (endpoints/duration/bgm/ambush windows), NPC travel references,
  guide/cage placement, texture key registry coverage, quest/drop integrity,
  save slots (default spawn per map, portal → 'from:<map>' spawn ids, slot
  schema create→serialize→parse round-trip, loader rejects wrong version /
  unknown mapId), boss respawn (numeric respawnSec > 0 per boss, STORY.bossRespawn
  text, isBossAlive: never defeated / just defeated / exactly at timer / after
  timer), src/ convention scan
- `npm run build` — must pass with zero errors

### Adding New Maps
1. Create `src/data/map_newmap.js` (copy an existing map's shape, set region)
2. Register in `src/data/maps.js` MAPS_DATA
3. Add a portal in an existing map pointing to the new key (or a travel route)
4. Add a WORLD_MAP_LAYOUT entry for the region's overlay
5. Run `npm run validate`

### Adding New Monster Types
1. Add entry to MONSTER_TYPES in `src/data/monsters.js` (stats + movement key)
2. Add texture generation in GameScene.createMonsterTextures (guard exists)
3. Add a movement case in GameScene.updateMonsterAI (ground movements also go
   into GROUND_MOVEMENTS in validate.mjs; flyers into FLYING_MOVEMENTS in
   GameScene)
4. Add the texture key `monster_<type>` to `src/data/assets.js` (validator
   enforces this)

### Adding New Travel Routes
1. Add entry to TRAVEL_ROUTES in `src/data/travel.js` (from/to/duration/ambush)
2. Give the departure map an Owen-style NPC with `travelRoute` + a `cage` prop
3. Run `npm run validate` (route integrity + NPC reference checks)

## Planned Features (next)
- Shop NPC (spend Treats)
- More quest types (fetch/escort), quest chains across regions
- Real BGM files (keys ready — see docs/ASSETS.md)
- More in-between animation frames and individual NPC variants
- Tutorial skip for players with `tutorialCompleted`
