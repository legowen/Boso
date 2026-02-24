# CLAUDE.md - Boso RPG Project Guide

## Project Overview
Boso is a 2D pixel RPG game built with Phaser 3 + Vite. MapleStory-inspired gameplay with platforms, ropes, portals, and combat.

## Tech Stack
- **Engine**: Phaser 3 (via npm)
- **Build**: Vite
- **Language**: Vanilla JavaScript (ES modules)
- **Deploy target**: Vercel (free)

## Commands
```bash
npm run dev     # Start dev server (localhost:5173)
npm run build   # Production build to /dist
npm run preview # Preview production build
```

## Project Structure
```
boso-rpg/
├── public/
│   └── assets/images/        # Static assets (title_bg.png etc)
├── src/
│   ├── main.js               # Entry point, registers scenes
│   ├── config.js             # Phaser config (RESIZE mode, pixelArt: true)
│   ├── data/
│   │   ├── map_haven.js      # Haven Village map data
│   │   └── map_outskirts.js  # Village Outskirts map data
│   ├── entities/
│   │   └── Player.js         # Player class (movement, rope climbing, combat)
│   ├── scenes/
│   │   ├── TitleScene.js     # Title screen (background image, PRESS START)
│   │   ├── CharacterSelectScene.js  # Character selection (Bomi/Seoli)
│   │   └── GameScene.js      # Main game scene (multi-map support)
│   ├── ui/
│   │   └── HUD.js            # HP/MP bars (bottom-center, responsive)
│   └── utils/
│       └── constants.js      # All game constants (PLAYER, MONSTER, SCENES, etc)
├── index.html
├── package.json
└── CLAUDE.md
```

## Architecture

### Scene Flow
TitleScene (MENU) → CharacterSelectScene → GameScene
- ESC in GameScene opens pause menu (Continue / Character Select / Main Menu)
- Death → Space to respawn at Haven Village

### Map System
- Maps defined in `src/data/map_*.js` as plain objects
- Registered in GameScene's `MAPS` object
- Portal transitions: `changeMap(targetMapKey, spawnX, spawnY)`
- Map data includes: platforms, ropes, portals, npcs, monsters, bgColors

### Character System
- 2 characters: Bomi (Warrior) and Seoli (Mage)
- Character data passed through scene transitions via `characterData`
- Player.js creates character-specific textures (`player_bomi`, `player_seoli`)
- Stats: hp, mp, atk, spd (applied from characterData)

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
| Pause menu | ESC |
| Respawn after death | SPACE |

### Rope System
- Player grabs rope when within GRAB_RANGE (20px horizontal)
- Climbing disables gravity and platform collision
- Auto-release at rope top (lands on platform above)
- Auto-release at rope bottom
- Rope data: { x, topY, bottomY }

### Platform Rules
- Ground (isGround: true): Cannot drop through
- Floating platforms: Drop through with ↓ + ALT
- Rope climbing bypasses platform collision

## Current Maps

### Haven Village (haven)
- Size: 3200 x 800
- Starting town with NPC (Village Elder)
- 4 monsters, 10 platforms, 10 ropes
- Portal to Village Outskirts (right side)

### Village Outskirts (outskirts)
- Size: 3200 x 800
- Monster hunting field, no NPCs
- 20 monsters across 3 platform layers
- Layer 1 (y:580-620): 6 monsters HP:60
- Layer 2 (y:420-480): 5 monsters HP:80
- Layer 3 (y:280-340): 3 monsters HP:100
- Ground: 6 monsters HP:50
- Portal back to Haven Village (left), portal to Deep Forest (right, not yet implemented)

## Code Conventions
- **All code comments in English**
- **All in-game text in English**
- Constants in UPPER_CASE in constants.js
- Scene keys defined in SCENES object
- Depth ordering via DEPTH constants
- Map data separated from scene logic

## Key Implementation Details

### Responsive Design
- Scale mode: Phaser.Scale.RESIZE
- HUD repositions on resize via `this.scene.scale.on('resize')`
- Background images use cover-style scaling via `coverBackground()`
- Minimap in top-left corner

### Death System
- Camera postFX grayscale effect on death
- "You Died" text with fade overlay
- SPACE to respawn at Haven Village with character preserved

### Adding New Maps
1. Create `src/data/map_newmap.js` with map data object
2. Import in GameScene.js
3. Add to MAPS registry: `newmap: MAP_NEWMAP`
4. Add portal in existing map pointing to new map key
5. Map data structure:
```js
{
  name: 'Map Name',
  width: 3200, height: 800,
  spawnX: 80, spawnY: 680,
  bgColors: { top: [0x..., 0x...], bottom: [0x..., 0x...], mountain: 0x... },
  platforms: [{ x, y, w, h, isGround }],
  portals: [{ x, y, label, targetMap, spawnX, spawnY }],
  ropes: [{ x, topY, bottomY }],
  npcs: [{ x, y, name }],
  monsters: [{ x, y, hp }],
}
```

### Adding New Characters
1. Add to CHARACTERS array in CharacterSelectScene.js
2. Add texture drawing in Player.js `createTexture()` with charId check
3. Character data: { id, name, className, color, desc, stats: { hp, mp, atk, spd } }

## Planned Features (Phase 2+)
- Deep Forest map (3rd map)
- Monster respawn system
- EXP and leveling
- Inventory system
- NPC dialogue system
- Seoli's ranged magic attack
- Pet system (photo upload → pixel art conversion)
