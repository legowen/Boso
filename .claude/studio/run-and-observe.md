# Run and Observe

A story with `Visible: yes` is not done until the change has been launched and looked
at. Compiling proves the code loads; tests prove the logic; only a look proves the
text fits the box and the sprite faces the right way. The `Read` tool renders PNGs,
so an agent can look.

## Procedure

1. **Launch** with `checks.run` (or the pack method below) at a fixed size:
   1280×720 for games, 390×844 for phone apps, unless the project says otherwise.
   Never a headless/no-graphics flag: those skip rendering.
2. **Go straight to what changed.** Use a dev-only deep link (URL param, scene
   argument, debug key). If the change is only reachable through menus, add the
   deep link as part of the story or script the inputs.
3. **Wait, capture, stop.** Let real frames render (about 1–3 s), capture, then stop
   any server you started.
4. **Look.** `Read` each PNG. Compare it with every `AC:` line. Clipped text, wrong
   facing, missing sprite, wrong layer, unreadable contrast: these are defects.
5. **Keep** captures in `.claude/state/evidence/<story-id>-<slug>/NN-what-it-shows.png`.
6. **Report** one line: `Run result: OBSERVED (n shots, ACs met)`,
   `OBSERVED-DEFECT (<what>)`, `NOT RUN (<why>)`, or
   `MANUAL NEEDED (<exactly what the user should look at>)`.

## Methods by stack

| Stack | Launch | Capture |
|---|---|---|
| Web (Phaser/Vite) | `npm run dev -- --port 5173 --strictPort` in the background | `node .claude/scripts/capture-web.mjs --url "http://localhost:5173/?scene=<Key>" --out <png> [--keys "ArrowRight:800,Space"]` (needs `playwright` or `playwright-core` as a devDependency plus a browser: `npx playwright install chromium`; ask before installing) |
| Godot 4 | `godot --path . --windowed --resolution 1280x720 <scene.tscn>` | add `--write-movie <out>.png --quit-after 90` (writes numbered PNGs) |
| Unity 6 | a PlayMode test or development build **with graphics** | `ScreenCapture.CaptureScreenshot(<absolute path>)` from a small bootstrap the specialist adds on first need |
| Expo (web target) | `npx expo start --web --port 8081` in the background | same capture script with `--viewport 390x844` |
| Expo (Android emulator) | `npx expo run:android` or Expo Go | `adb exec-out screencap -p > <png>` |

If the method needs something not installed, report `NOT RUN (<missing tool>)` with
the one command that would fix it. Do not install it without asking.

## When a look is impossible here

Some checks need a human: feel, timing, audio, a device you do not have. Then the
result is `MANUAL NEEDED` with a short checklist the user can do in under two
minutes. The story stays `[~]` until the user confirms.
