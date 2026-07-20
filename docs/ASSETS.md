# Boso Asset Guide — drop-in images & BGM (no code changes needed)

All visuals are procedurally generated placeholders. Every texture has a
**fixed key**. If you drop a PNG at the override path, `PreloadScene` loads it
under that key and the procedural placeholder is skipped automatically.

## Texture overrides

Put PNG files here: `public/assets/images/tex/<key>.png`

| Key | Recommended size (px) | What it is |
|---|---|---|
| `player_boso_brave` | 40 x 56 | Boso (Brave Paw) — brown pup, red collar |
| `player_boso_swift` | 40 x 56 | Boso (Swift Paw) — cream pup, blue collar |
| `player_bomi` | 40 x 56 | Bomi (Tiny Whisker) — white shelter kitten, bell collar |
| `npc` | 36 x 52 | Generic NPC (cats, hounds, guild members) |
| `npc_owen` | 36 x 52 | Owen — the Owner (human, blue shirt) |
| `cage` | 96 x 76 | Travel cage prop (departure/arrival point) |
| `portal` | 48 x 64 | Normal portal |
| `portal_hidden` | 48 x 64 | Golden secret portal |
| `monster_bangul` | 34 x 30 | Bangul — soap bubble (snail movement) |
| `monster_gong` | 34 x 32 | Gong — rubber ball (slime hops) |
| `monster_laser` | 26 x 26 | Laser — laser-pointer dot (free flyer) |
| `monster_nabi` | 38 x 32 | Nabi — butterfly (sine glider) |
| `monster_pari` | 24 x 22 | Pari — fly (erratic jitter) |
| `monster_robo` | 32 x 38 | Robo — wind-up robot (wild-boar charge) |
| `monster_dustmote` | 26 x 24 | Dust Mote — floating dust speck (rise/sink bob) |
| `monster_lonesome` | 30 x 34 | Lonesome — shy translucent ghost (rendered at 0.6 alpha) |
| `monster_straykitten` | 32 x 30 | Stray Kitten — chained hops + pounce |
| `monster_sockslinker` | 44 x 22 | Sock Slinker — inchworm sock |
| `monster_yarnroller` | 34 x 34 | Yarn Roller — rolling yarn ball (spins at runtime) |
| `monster_crumbhopper` | 20 x 18 | Crumb Hopper — tiny multi-hop crumb |
| `monster_mothcircler` | 34 x 30 | Moth Circler — lamp-orbiting moth |
| `monster_rcracer` | 42 x 24 | RC Racer — toy race car (drift telegraph tilts it) |
| `boss_hug_guardian` | 140 x 160 | Hug Guardian — toy golem field boss |
| `boss_vacuum_king` | 120 x 150 | Vacuum King — hidden special boss |
| `boss_dr_embrace` | 90 x 120 | Dr. Embrace — tutorial boss (white coat doctor) |
| `boss_biggie` | 150 x 130 | Biggie — the big dog of Buddy House |
| `proj_arm` | 120 x 50 | Hug Guardian's sweeping plush arm |
| `proj_arm_dr` | 110 x 44 | Dr. Embrace's sweeping coat sleeve |
| `proj_dust` | 20 x 20 | Vacuum King's dust ball projectile |
| `proj_bark` | 26 x 18 | Swift Paw's sonic bark projectile |
| `ambush_vroom` | 96 x 40 | Vroom — travel ambush car streak (TravelScene) |
| `ambush_rumble` | 76 x 64 | Rumble — travel ambush engine tanker (TravelScene) |
| `drop_treat` | 16 x 16 | Treat currency drop (golden bone) |
| `drop_cookie` | 16 x 16 | Cookie item drop (+40 HP) |
| `drop_milk` | 14 x 18 | Milk item drop (+30 MP) |

Notes:
- Sprites face RIGHT by default (the game flips them with `flipX`).
- Sizes other than recommended work, but physics bodies are tuned to these.
- `public/assets/images/title_bg.png` is the title screen background (already present).

## BGM

Put audio files here: `public/assets/bgm/<key>.mp3` (or `.ogg`)

| Key | Plays in |
|---|---|
| `bgm_title` | Title screen |
| `bgm_shelter` | Shelter Isle: Recovery Ward, Clinic Hallway, Shelter Yard |
| `bgm_buddy` | Buddy House: village + field maps |
| `bgm_travel` | Cage rides (TravelScene, all routes) |
| `bgm_home` | Sunny Backyard, Living Room, Kitchen |
| `bgm_toybox` | Hallway & Stairs, Toy Workshop |
| `bgm_boss` | Attic Laboratory (Hug Guardian), Backyard Gate (Biggie) |
| `bgm_hidden` | Vacuum Closet (Vacuum King) |

Missing files are fine — the game stays silent for that key (graceful fallback).
Volume/loop settings per key live in `src/data/audio.js`; the new-region keys
are registered there with `url: null` (placeholder) — set a string to point at
a custom path, or just drop files at the default path above.

Prefer `.mp3`: browsers pick the first playable format from the candidate list
(mp3 first), so an `.ogg`-only drop may stay silent in Chrome/Safari.
