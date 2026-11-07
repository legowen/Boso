#!/usr/bin/env node
// capture-web.mjs — screenshot a running web build (Phaser/Vite, Expo web, any web app).
//
// Usage:
//   node .claude/scripts/capture-web.mjs --url <url> --out <file.png>
//        [--viewport 1280x720] [--wait 2500] [--keys "ArrowRight:800,Space"]
//        [--shots 1] [--interval 500] [--click]
//
//   --keys      comma-separated key presses run before capturing; "Key:ms" holds the
//               key for ms milliseconds (Playwright key names: ArrowLeft, Space, KeyZ...)
//   --shots     number of captures; files get -01, -02... suffixes when > 1
//   --click     click the page centre first (some games need a click to unlock audio/input)
//
// Needs `playwright` or `playwright-core` resolvable from the project and a browser
// (npx playwright install chromium, or npx playwright-core install chromium). Exit codes: 0 captured, 1 page failed, 3 NOT RUN.
// Prints a JSON summary: files written and page errors seen.

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = Object.create(null);
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith("--")) continue;
  const key = a.slice(2);
  const next = process.argv[i + 1];
  if (next === undefined || next.startsWith("--")) args[key] = true;
  else { args[key] = next; i++; }
}

if (!args.url || !args.out) {
  console.error("usage: capture-web.mjs --url <url> --out <file.png> [--viewport WxH] [--wait ms] [--keys list] [--shots n] [--interval ms] [--click]");
  process.exit(2);
}

let chromium;
for (const pkg of ["playwright", "playwright-core"]) {
  try { ({ chromium } = await import(pkg)); break; } catch { /* try the next package */ }
}
if (!chromium) {
  console.log(JSON.stringify({ result: "NOT RUN", reason: "neither playwright nor playwright-core is installed", fix: "npm i -D playwright && npx playwright install chromium" }));
  process.exit(3);
}

const [width, height] = String(args.viewport || "1280x720").split("x").map(Number);
const wait = Number(args.wait || 2500);
const shots = Math.max(1, Number(args.shots || 1));
const interval = Number(args.interval || 500);
const out = resolve(String(args.out));
mkdirSync(dirname(out), { recursive: true });

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  console.log(JSON.stringify({ result: "NOT RUN", reason: "browser not installed: " + e.message.split("\n")[0], fix: "npx playwright install chromium (or npx playwright-core install chromium)" }));
  process.exit(3);
}

const errors = [];
const files = [];
try {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  await page.goto(String(args.url), { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("canvas, #root, body", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(wait);

  if (args.click) await page.mouse.click(width / 2, height / 2);

  if (typeof args.keys === "string") {
    for (const step of args.keys.split(",").map((s) => s.trim()).filter(Boolean)) {
      const [key, hold] = step.split(":");
      if (hold) {
        await page.keyboard.down(key);
        await page.waitForTimeout(Number(hold));
        await page.keyboard.up(key);
      } else {
        await page.keyboard.press(key);
      }
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(300);
  }

  for (let n = 1; n <= shots; n++) {
    const file = shots === 1 ? out : out.replace(/\.png$/i, "") + "-" + String(n).padStart(2, "0") + ".png";
    await page.screenshot({ path: file });
    files.push(file);
    if (n < shots) await page.waitForTimeout(interval);
  }
  console.log(JSON.stringify({ result: "CAPTURED", files, errors }, null, 2));
} catch (e) {
  console.log(JSON.stringify({ result: "FAILED", reason: e.message.split("\n")[0], files, errors }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
