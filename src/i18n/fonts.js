// src/i18n/fonts.js
// Galmuri pixel fonts (SIL OFL 1.1, see public/assets/fonts/). Hangul and
// Latin both come from these files, so text never falls back to a system
// font and Korean never shows tofu.
//
// Each family has its own design grid (9 / 11 / 14 px). Pixel fonts only
// stay crisp at integer multiples of that grid, so pixelFont() snaps a
// requested size to the nearest legal (family, size) pair.

const FALLBACK = "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif";

export const FONT_FACES = [
  { family: 'Galmuri9', grid: 9, file: 'Galmuri9.woff2' },
  { family: 'Galmuri11', grid: 11, file: 'Galmuri11.woff2' },
  { family: 'Galmuri14', grid: 14, file: 'Galmuri14.woff2' },
];

// Every legal size, up to the 72px title: grid * 1..8 for the 9px grid,
// grid * 1..7 for the others. Sizes below 11 are skipped on purpose - Hangul
// is hard to read at 9px, so small text rounds up to 11.
const SIZES = [];
FONT_FACES.forEach(({ family, grid }) => {
  for (let step = 1; step <= 8; step += 1) {
    const size = grid * step;
    if (size >= 11 && size <= 80) SIZES.push({ size, family });
  }
});
SIZES.sort((a, b) => a.size - b.size);

// Nearest legal size wins; on a tie the smaller one does (keeps text inside
// boxes that were sized for narrower glyphs).
export function snapFont(px) {
  const target = typeof px === 'number' ? px : parseFloat(px);
  let best = SIZES[0];
  for (const candidate of SIZES) {
    if (Math.abs(candidate.size - target) < Math.abs(best.size - target)) best = candidate;
  }
  return best;
}

// Spread into a Phaser text style: { ...pixelFont(13), color: '#fff' }
// (px may be a number or a '13px' string).
export function pixelFont(px) {
  const { size, family } = snapFont(px);
  return { fontFamily: `${family}, ${FALLBACK}`, fontSize: `${size}px` };
}

// Same, for DOM/CSS use.
export function cssFont(px) {
  const { size, family } = snapFont(px);
  return `${size}px ${family}, ${FALLBACK}`;
}

// Resolve once every face is ready (or after a timeout, so a blocked font
// request can never keep the game from starting - the fallback stack covers
// the gap). Hangul sample text forces the glyph data to be fetched too.
export function loadFonts(timeoutMs = 5000) {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  const loading = Promise.all(
    FONT_FACES.map(({ family, grid }) => document.fonts.load(`${grid}px ${family}`, `Aa${String.fromCharCode(0xAC00, 0xD7A3)}`)),
  );
  const timeout = new Promise((resolve) => { setTimeout(resolve, timeoutMs); });
  return Promise.race([loading, timeout]).catch(() => {});
}
