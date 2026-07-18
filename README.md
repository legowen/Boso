# Boso — "Look at me!"

A 2D pixel action RPG built with **Phaser 3 + Vite**, inspired by MapleStory.
Start as a shelter kitten (or pup), ride the travel cage between worlds, and
work your way home to the Owner locked away in the attic laboratory.

## World

| Region | Maps | Notes |
|---|---|---|
| Shelter Isle | `shelter_ward`, `shelter_hall`, `shelter_yard` | Tutorial (Maple Island homage), boss **Dr. Embrace** |
| Buddy House | `high_table` (town), `sofa_ridge`, `kitchen_floor`, `hallway_run`, `bookshelf_cliffs`, `backyard_gate` | Second world, boss **Biggie** (befriend him!) |
| Home | `yard` … `attic`, `closet` (11 maps) | The original house world, bosses **Hug Guardian** & **Vacuum King** |

Regions are connected by **cage rides** (TravelScene): a 15s tutorial voyage
(Shelter → Buddy House) and 60s main routes (Buddy House ⇄ Home) with random
**Vroom**/**Rumble** ambushes en route. Talk to **Owen** near a cage to board.

## Commands

```bash
npm install
npm run dev       # Start dev server
npm run build     # Production build to /dist
npm run preview   # Preview production build
npm run validate  # Node data validator (maps/portals/ropes/monsters/travel/bgm)
```

## Replacing placeholder art (texture keys)

All visuals are procedurally generated placeholders. Drop a PNG at
`public/assets/images/tex/<key>.png` and it replaces the placeholder
automatically (no code changes). Sprites face RIGHT by default.

### Players & NPCs

| Key | Size (px) | What it is |
|---|---|---|
| `player_boso_brave` | 40 x 56 | Boso (Brave Paw) — brown pup |
| `player_boso_swift` | 40 x 56 | Boso (Swift Paw) — cream pup |
| `player_bomi` | 40 x 56 | Bomi (Tiny Whisker) — shelter kitten |
| `npc` | 36 x 52 | Generic NPC (cats, hounds, guild members) |
| `npc_owen` | 36 x 52 | Owen — the Owner (human) |
| `cage` | 96 x 76 | Travel cage prop (departure/arrival point) |
| `portal` | 48 x 64 | Normal portal |
| `portal_hidden` | 48 x 64 | Golden secret portal |

### Monsters

| Key | Size (px) | What it is (movement) |
|---|---|---|
| `monster_bangul` | 34 x 30 | Bangul — soap bubble (snail patrol) |
| `monster_gong` | 34 x 32 | Gong — rubber ball (slime hops) |
| `monster_laser` | 26 x 26 | Laser — laser-pointer dot (free flyer + dash) |
| `monster_nabi` | 38 x 32 | Nabi — butterfly (sine glider) |
| `monster_pari` | 24 x 22 | Pari — fly (erratic jitter) |
| `monster_robo` | 32 x 38 | Robo — wind-up robot (wild-boar charge) |
| `monster_dustmote` | 26 x 24 | Dust Mote — floating dust (rise/sink bobbing) |
| `monster_lonesome` | 30 x 34 | Lonesome — shy ghost (follows, flinches away up close) |
| `monster_straykitten` | 32 x 30 | Stray Kitten — chained hops + pounce |
| `monster_sockslinker` | 44 x 22 | Sock Slinker — inchworm contract/extend |
| `monster_yarnroller` | 34 x 34 | Yarn Roller — accelerating roll, wall-bounce boost |
| `monster_crumbhopper` | 20 x 18 | Crumb Hopper — 2-3 quick low hops, then rest |
| `monster_mothcircler` | 34 x 30 | Moth Circler — lamp orbit + break-off dash |
| `monster_rcracer` | 42 x 24 | RC Racer — high-speed runs, drift-skid turns |

### Bosses & projectiles

| Key | Size (px) | What it is |
|---|---|---|
| `boss_hug_guardian` | 140 x 160 | Hug Guardian — toy golem field boss (attic) |
| `boss_vacuum_king` | 120 x 150 | Vacuum King — hidden boss (closet) |
| `boss_dr_embrace` | 90 x 120 | Dr. Embrace — tutorial boss (shelter yard) |
| `boss_biggie` | 150 x 130 | Biggie — the big dog of Buddy House |
| `proj_arm` | 120 x 50 | Hug Guardian's sweeping plush arm |
| `proj_arm_dr` | 110 x 44 | Dr. Embrace's sweeping coat sleeve |
| `proj_dust` | 20 x 20 | Vacuum King's dust ball |
| `proj_bark` | 26 x 18 | Swift Paw's sonic bark |
| `ambush_vroom` | 96 x 40 | Vroom — travel ambush car streak |
| `ambush_rumble` | 76 x 64 | Rumble — travel ambush engine tanker |

### Drops

| Key | Size (px) | What it is |
|---|---|---|
| `drop_treat` | 16 x 16 | Treat currency (golden bone) |
| `drop_cookie` | 16 x 16 | Cookie item (+40 HP) |
| `drop_milk` | 14 x 18 | Milk item (+30 MP) |

## BGM keys

Drop audio at `public/assets/bgm/<key>.mp3` (mp3 preferred). Missing files are
silent no-ops. New-region keys are registered with `url: null` placeholders in
`src/data/audio.js`.

| Key | Plays in |
|---|---|
| `bgm_title` | Title screen |
| `bgm_shelter` | Shelter Isle (tutorial) |
| `bgm_buddy` | Buddy House maps |
| `bgm_travel` | Cage rides (TravelScene) |
| `bgm_home` | Sunny Backyard, Living Room, Kitchen |
| `bgm_toybox` | Hallway & Stairs, Toy Workshop |
| `bgm_boss` | Attic Laboratory, Backyard Gate |
| `bgm_hidden` | Vacuum Closet |

See `docs/ASSETS.md` for the full asset guide and `CLAUDE.md` for
architecture/conventions.
