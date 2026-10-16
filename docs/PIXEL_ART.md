# Seoli & Bomi pixel-art integration

Boso is the game name. Its playable characters are the two cats Seoli and
Bomi. All art is original generated game art; no MapleStory assets are bundled.

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
so stone frames stay planted on the ground.

Travel keeps the three existing routes and timings. An open-deck airship
replaces the cage interior, with scrolling voyage scenery and the original
ambush rules. NPC art includes Owen, cats, nurse, gear/plush artisans, Old Bell
the dog, and Haku the hedgehog. Several NPCs share an appropriate art family.
All fourteen monster types, four bosses, two travel ambushers, drops, portals
and attack/projectile textures are included at their configured sizes.

## Editing and rebuilding

1. Install dependencies with `npm ci` (Node 20.19+ or 22.12+).
2. Replace the corresponding retained source PNG in `art/source/`.
3. Run `npm run art:build` to extract alpha-connected characters, scale with
   nearest-neighbor sampling and pack the runtime assets. Source sheet order
   is part of the contract; keep cells separate on a transparent background.
4. Run `npm test`, `npm run validate`, and `npm run build`.

Runtime files are committed, so deploying/building does not generate art or
require an image-generation account. `art/prompts.json` records the prompts.
Replacing a specific `public/assets/images/tex/<key>.png` also works, but the
next art rebuild overwrites that derived file; retain edits in the source too.

## Saves and verification

Save version 3 retains all old records and flags. `boso_swift` progress is
copied to Seoli. `boso_brave` progress is copied to Bomi when more advanced;
the displaced Bomi record is archived in `legacy_bomi`.

Automated checks cover combo sequencing/reset, one hit per target, range and
direction, crouch anchor, damage/rope cancellation, animation selection, save
migration, map coverage and texture dimensions. The data validator also checks
world connectivity and spawn/platform/portal/rope consistency.

Browser play verification is still pending: the managed preview ran, but the
available browser blocked its URL with `ERR_BLOCKED_BY_CLIENT`. Before merging,
check the character selection screen, both cats' movement and attacks, one
vertical map, each boss, and a ship trip in a normal browser. Check background
readability and hit alignment at the player's viewport size.
