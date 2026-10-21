# Seoli & Bomi pixel-art integration

Boso is the game name. Its playable characters are the two cats Seoli and
Bomi. Artwork is generated; the refreshed guide depicts Remy by user request.
Boots is an original orange feline fencer with a black feathered hat hiding
both ears, black cape, belt and boots, bare fur torso and silver rapier.
No MapleStory assets are bundled.

## Character identity and tuning

| Character | Appearance | HP / MP / ATK / speed | Combat |
|---|---|---|---|
| Seoli | White, charcoal-gray forehead/eye patches and back markings, gray tail; deep emerald eyes; pink ears, nose and pads | 100 / 80 / 14 / 250 | Wind claws advance from 28 to 105px; X gust up to 280px |
| Bomi | Black with a small white upper-chest tuft; emerald eyes; pink inner ears; black nose and pads | 160 / 40 / 24 / 190 | Strong close-range paw strike, center 34px ahead |

Tune stats, reach, speed and timing in `src/data/characters.js`. Attack reach
is the hitbox center distance; hitbox width extends beyond that center.
CTRL cycles strikes at 1x, 1.15x, 1.5x base ATK (plus existing damage variance).
After an 850ms break, the next attack starts at strike one. A target can be
hit only once per swing. Damage or grabbing a rope cancels the active swing.

The PNG sheets are 384×384 with sixteen 96×96 cells, row-major. Sprite feet
align at source y=88. Display scale is 1.125 (50% larger than the first pass);
the origin keeps the existing world foot anchor 30px below the sprite position,
so movement, rope alignment and attack coordinates stay unchanged. The standing physics body is
32×56 world pixels and crouching height is 28. Do not use full image bounds
for damage: padding and raised tails are intentionally outside the hurt body.

| Frame | Pose |
|---|---|
| 0–1 | Idle and blink |
| 2–5 | Run cycle |
| 6–7 | Jump ascent and descent |
| 8 | Crouch |
| 9–11 | Three attack stages |
| 12–13 | Climbing |
| 14 | Hurt |
| 15 | Front-facing selection portrait |

The attack stages currently use one distinct pose each, timed with traveling
wind/paw effects. These are a first playable animation pass, not interpolated
multi-frame attack animations. Monsters keep their existing movement, squash,
rotation and boss patterns with new single-pose sprites.

## World art

`src/data/worldArt.js` assigns every existing map to a theme. Themes cover the
shelter, garden, living room, kitchen, library, workshop, attic laboratory,
bedroom/rooftop and cellar/closet. `WorldArt.js` places the scenery and terrain
over existing collision geometry. Ledge highlights distinguish walkable
surfaces from decorative background objects.

Portals are displayed at 72×96, with their base anchored to the nearest
supporting platform below the map's portal point. Labels and interaction hints
follow the displayed height. Alpha pulsing replaces the old squash/stretch,
so the white/icy-blue light pillar and yellow hidden vortex stay on the ground.
The normal portal has vertical light streaks and a base flare, without a ring.

Travel keeps the three existing routes and timings. A right-facing navy/yellow
flying submarine has one capsule body, observation cabin, tail propeller and
top grab handle. Navy/gold platforms align with its cabin. Actors
stay in front of the cabin with scrolling scenery and the original ambush
rules. NPC art includes Owen, Remy, a human Vet Assistant, Boots, the plush
artisan, Old Bell and Haku. Shared generic NPCs display Remy; shared gear NPCs
display Boots in both languages. Internal IDs remain stable for saves/quests.
All fourteen monster types, four bosses, two travel ambushers, drops, portals
and attack/projectile textures are included at their configured sizes.

Boss and NPC display heights use the original configured height multiplied
by the same 1.5 enlargement applied to the cats. `systems/EntityArt.js` measures
the visible height using `data/entityArtBounds.js`, so wide poses and transparent
padding cannot shrink a character. NPCs appear 78px tall; Dr. Embrace 180px,
Biggie 195px, Vacuum King 225px and Hug Guardian 240px. Source aspect ratios stay
intact. Boss art is anchored to the physics feet, with the original movement,
platform body and combat bounds retained. NPC names, quest markers and talk
hints sit above the art; dialogue still uses the original map coordinates.
Boss squash/stretch and Biggie's pounce/befriend resets retain the display scale.
The art rebuild refreshes the bounds metadata alongside the PNGs.

All fourteen regular monsters and both ship ambushers use the same visible
height rule (configured height × 1.5). Ground enemies anchor to their physics
feet; flying enemies and the rotating Yarn Roller keep a centered origin.
HP bars follow the enlarged art. Squash/stretch, death and respawn preserve
the display scale, while `entityCombatBounds()` retains the original damage
ranges, including rotation. No source PNG enlargement is required.

## Mobile controls

Touch-capable devices automatically show a pad and action buttons in both
GameScene and TravelScene. Landscape is recommended; portrait also works.
Desktop keyboard controls remain available, including on hybrid touch laptops.

| Touch control | Action |
|---|---|
| Left / right | Move while held |
| Up / down | Climb ropes; up enters portals; down crouches |
| HIT | Hold for the three-hit combo |
| JUMP | Jump; down + JUMP drops through a platform |
| WIND | Seoli's ranged gust |
| TALK / NEXT | Open/advance dialogue and board the ship |
| CONTINUE | Respawn or return from the ending |
| ••• | HP/MP items; on maps, BAG, MAP and MENU |

`ControlState.js` merges real keys with per-pointer touch state. Short taps
survive until the next frame; simultaneous fingers can move, jump and attack.
Controls release on cancellation, focus loss, rotation, pause and scene exit.
`TouchControls.js` owns and removes its DOM listeners/buttons per scene.
Mobile HUD placement and camera floor padding keep the play area above the pad.
Map/quest details remain available through MAP/BAG; the desktop minimap and
quest tracker are hidden on touch screens to keep the top HUD readable.

Phone acceptance check: tap through title/selection/story, move + jump + HIT,
climb a rope, enter a portal, talk/board, use an item, die and CONTINUE, then
rotate and switch away/back while holding a direction. Confirm no stuck input
or duplicate controls after map changes and ship travel.

## Editing and rebuilding

1. Install dependencies with `npm ci` (Node 20.19+ or 22.12+).
2. Replace the corresponding retained source PNG in `art/source/`.
3. Run `npm run art:build` to extract alpha-connected characters, scale with
   nearest-neighbor sampling and pack the runtime assets. Source sheet order
   is part of the contract; keep cells separate on a transparent background.
4. Run `npm test`, `npm run validate`, and `npm run build`.

Runtime files are committed, so deploying/building does not generate art or
require an image-generation account. `art/prompts.json` records the prompts.
The seven carrier/NPC/portal replacements live in `art/source/refresh/` and
override the original atlas during `art:build`. Their final built-in imagegen
prompts are in `art/asset-refresh-prompts.json`. To repack just these seven,
run `node scripts/prepare-asset-refresh.mjs`; it also refreshes visible NPC
bounds. Packing preserves aspect ratio and alpha, uses nearest-neighbor
sampling, and places portal bottoms on the final row to meet the ground.
The palette emphasizes blue and yellow with luminance contrast; it is a
design direction, not a simulation or validation of feline vision.

## Saves and verification

Save version 3 retains all old records and flags. `boso_swift` progress is
copied to Seoli. `boso_brave` progress is copied to Bomi when more advanced;
the displaced Bomi record is archived in `legacy_bomi`.

Automated checks cover combo sequencing/reset, one hit per target, range and
direction, crouch anchor, damage/rope cancellation, animation selection, save
migration, map coverage and texture dimensions. The data validator also checks
world connectivity and spawn/platform/portal/rope consistency.
Entity proportion tests exercise the installed Phaser Arcade Body to compare
physics geometry before and after display scaling, including squash/stretch.

Browser play verification is still pending: the managed preview ran, but the
available browser blocked its URL with `ERR_BLOCKED_BY_CLIENT`. Before merging,
check the character selection screen, both cats' movement and attacks, one
vertical map, each boss, and a ship trip in a normal browser. Check background
readability and hit alignment at the player's viewport size.
