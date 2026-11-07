---
paths:
  - "public/assets/**"
  - "assets/**"
---

# Asset rules (web)

- File names: lowercase, digits, `-` or `_`; no spaces. Paths are case-sensitive on
  the host.
- Sprites: texture atlases (PNG + JSON) or fixed-grid spritesheets, whichever the
  project already uses; frame size, grid and counts as in the project's asset docs.
  Pixel art has no anti-aliasing and a transparent background.
- Characters face right; left is a flip in code.
- Texture pages ≤ 4096×4096. Prefer one atlas/sheet per character or scene group over many small images.
- Audio: OGG with an M4A/MP3 fallback when Safari support matters; record the source
  and licence of every external file in `design/assets.md`.
