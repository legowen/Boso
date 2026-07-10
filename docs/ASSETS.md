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
| `npc` | 36 x 52 | Generic NPC (cats, hounds, guild members) |
| `portal` | 48 x 64 | Normal portal |
| `portal_hidden` | 48 x 64 | Golden secret portal |
| `monster_bangul` | 34 x 30 | Bangul — soap bubble (snail movement) |
| `monster_gong` | 34 x 32 | Gong — rubber ball (slime hops) |
| `monster_laser` | 26 x 26 | Laser — laser-pointer dot (free flyer) |
| `monster_nabi` | 38 x 32 | Nabi — butterfly (sine glider) |
| `monster_pari` | 24 x 22 | Pari — fly (erratic jitter) |
| `monster_robo` | 32 x 38 | Robo — wind-up robot (wild-boar charge) |
| `boss_hug_guardian` | 140 x 160 | Hug Guardian — toy golem field boss |
| `boss_vacuum_king` | 120 x 150 | Vacuum King — hidden special boss |
| `proj_arm` | 120 x 50 | Hug Guardian's sweeping plush arm |
| `proj_dust` | 20 x 20 | Vacuum King's dust ball projectile |

Notes:
- Sprites face RIGHT by default (the game flips them with `flipX`).
- Sizes other than recommended work, but physics bodies are tuned to these.
- `public/assets/images/title_bg.png` is the title screen background (already present).

## BGM

Put audio files here: `public/assets/bgm/<key>.mp3` (or `.ogg`)

| Key | Plays in |
|---|---|
| `bgm_title` | Title screen |
| `bgm_home` | Sunny Backyard, Living Room, Kitchen |
| `bgm_toybox` | Hallway & Stairs, Toy Workshop |
| `bgm_boss` | Attic Laboratory (Hug Guardian) |
| `bgm_hidden` | Vacuum Closet (Vacuum King) |

Missing files are fine — the game stays silent for that key (graceful fallback).
Volume/loop settings per key live in `src/data/audio.js`.

Prefer `.mp3`: browsers pick the first playable format from the candidate list
(mp3 first), so an `.ogg`-only drop may stay silent in Chrome/Safari.
