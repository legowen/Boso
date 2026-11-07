### Web game — Phaser + Vite (pack: web-phaser)
- Engine: Phaser (major version from `package.json`), bundled by Vite; JS or TS as the project uses.
- Run `npm run dev` · build `npm run build` → `dist/` · deploy as a static site (e.g. Vercel).
- Specialist: **phaser-specialist**. Path rules: `.claude/rules/web-phaser.*.md`.
- Data layer: plain JSON/JS modules under `paths.data` with **no Phaser imports**, so `checks.validate` can load them in Node.
- Assets under `paths.assets` are served as-is; sprites are texture atlases or fixed-grid spritesheets. Pixel art: `pixelArt: true`, integer zoom.
- Maps: Tiled JSON (embedded tilesets, object layers for spawns/portals) or plain data modules, whichever the project uses; validate portals and spawns either way.
- Playtest: dev server + `node .claude/scripts/capture-web.mjs` (Playwright). Jump to scenes with a dev-only URL param or `window` debug hook.
