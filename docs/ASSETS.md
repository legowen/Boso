# Boso Asset Guide — drop-in images & BGM (no code changes needed)

Generated pixel art is now bundled for both cats and the world. Every entity texture has a
**fixed key**. If you drop a PNG at the override path, `PreloadScene` loads it
under that key and the procedural placeholder is skipped automatically.

## Texture overrides

Animated players use `cats/seoli.png` and `cats/bomi.png`, each a 4×4 sheet
of 96×96 cells. Their exact frame order, identity, combat tuning and rebuild
workflow are documented in [PIXEL_ART.md](PIXEL_ART.md). The static player
keys below are retained for compatibility; they do not animate the player.

World textures live in `public/assets/images/world/`: nine `bg_*` themes,
eight `tile_*` terrain textures, `travel_ship.png`, and `bg_voyage.png`.
Every map has an explicit theme in `src/data/worldArt.js`.

Put PNG files here: `public/assets/images/tex/<key>.png`

| Key | Recommended size (px) | What it is |
|---|---|---|
| `player_seoli` | 40 x 56 | Static fallback for white/gray Seoli |
| `player_bomi` | 40 x 56 | Static fallback for black Bomi |
| `npc` | 36 x 52 | Generic NPC (cats, hounds, guild members) |
| `npc_owen` | 36 x 52 | Owen — the Owner (human, blue shirt) |
| `npc_nurse` | 36 x 52 | Nurse Mimsy |
| `npc_gear` | 36 x 52 | Gearist Tinkerer / Apprentice Bolt |
| `npc_plush` | 36 x 52 | Plushist Sewmaster |
| `npc_hound` | 36 x 52 | Old Bell, the elderly dog |
| `npc_hedgehog` | 36 x 52 | Haku the Hedgehog |
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
| `proj_bark` | 26 x 18 | Seoli's wind gust (legacy texture key) projectile |
| `ambush_vroom` | 96 x 40 | Vroom — travel ambush car streak (TravelScene) |
| `ambush_rumble` | 76 x 64 | Rumble — travel ambush engine tanker (TravelScene) |
| `drop_treat` | 16 x 16 | Treat currency drop (golden fish) |
| `drop_cookie` | 16 x 16 | Cookie item drop (+40 HP) |
| `drop_milk` | 14 x 18 | Milk item drop (+30 MP) |
| `fx_wind` | 88 x 52 | Seoli wind-claw effect |
| `fx_paw` | 64 x 52 | Bomi heavy-paw effect |
| `fx_hit` | 28 x 28 | Impact sparkle |

Notes:
- Sprites face RIGHT by default (the game flips them with `flipX`).
- Sizes other than recommended work, but physics bodies are tuned to these.
- The title screen now uses `world/bg_garden.png`; the legacy title image is retained but not loaded.

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


## Fonts

All text (Hangul and Latin) is drawn with the Galmuri pixel fonts in
`public/assets/fonts/` — `Galmuri9`, `Galmuri11`, `Galmuri14`, v2.40.3 by Lee
Minseo, SIL Open Font License 1.1 (`Galmuri-OFL.txt` ships beside them). The
`.woff2` files are the unmodified upstream release files from the `galmuri` npm
package: the license reserves the name "Galmuri" for unmodified versions, so do
not subset or edit them.

- Never set `fontFamily` / `fontSize` by hand in Phaser text. Spread
  `pixelFont(px)` from `src/i18n/fonts.js`; it snaps to an integer multiple of
  a font's design grid (9 / 11 / 14 px) so pixels stay crisp.
- `index.html` declares the `@font-face` rules; `loadFonts()` waits for them
  before the first scene is created.
- `npm run validate` fails if any character in `en.js` / `ko.js` is missing from
  one of the three fonts (that would render as tofu).
