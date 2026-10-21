// scripts/fontCoverage.mjs
// Node-only helper: read the set of Unicode code points a .woff2 font can draw.
// Used by validate.mjs and the i18n test to prove no UI string renders as tofu.
//
// WOFF2 stores every table in ONE brotli stream. Only glyf/loca/hmtx may be
// transformed; cmap is stored verbatim, so a small table-directory walk plus a
// cmap parser (formats 4 and 12) is enough.

import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';

// Known-tag table from the WOFF2 spec (index 63 means an explicit tag follows)
const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm',
  'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern',
  'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC',
  'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar',
  'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty',
  'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat',
  'Gloc', 'Feat', 'Sill',
];

function readBase128(buf, pos) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const byte = buf[pos.offset++];
    value = value * 128 + (byte & 0x7f);
    if (!(byte & 0x80)) return value;
  }
  throw new Error('Bad UIntBase128');
}

function parseCmapTable(table) {
  const codePoints = new Set();
  const view = new DataView(table.buffer, table.byteOffset, table.byteLength);
  const numTables = view.getUint16(2);
  for (let i = 0; i < numTables; i++) {
    const offset = view.getUint32(4 + i * 8 + 4);
    const format = view.getUint16(offset);
    if (format === 4) {
      const segX2 = view.getUint16(offset + 6);
      const endBase = offset + 14;
      const startBase = endBase + segX2 + 2;
      const deltaBase = startBase + segX2;
      const rangeBase = deltaBase + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = view.getUint16(endBase + s * 2);
        const start = view.getUint16(startBase + s * 2);
        const idRangeOffset = view.getUint16(rangeBase + s * 2);
        const idDelta = view.getInt16(deltaBase + s * 2);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let glyph;
          if (idRangeOffset === 0) {
            glyph = (c + idDelta) & 0xffff;
          } else {
            const at = rangeBase + s * 2 + idRangeOffset + (c - start) * 2;
            glyph = view.getUint16(at);
            if (glyph !== 0) glyph = (glyph + idDelta) & 0xffff;
          }
          if (glyph !== 0) codePoints.add(c);
        }
      }
    } else if (format === 12) {
      const groups = view.getUint32(offset + 12);
      for (let g = 0; g < groups; g++) {
        const at = offset + 16 + g * 12;
        const start = view.getUint32(at);
        const end = view.getUint32(at + 4);
        const startGlyph = view.getUint32(at + 8);
        for (let c = start; c <= end; c++) {
          if (startGlyph + (c - start) !== 0) codePoints.add(c);
        }
      }
    }
  }
  return codePoints;
}

// Returns the Set of code points that map to a real (non-.notdef) glyph.
export function readWoff2CodePoints(path) {
  const file = readFileSync(path);
  if (file.toString('latin1', 0, 4) !== 'wOF2') throw new Error(`${path}: not a WOFF2 file`);
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const numTables = view.getUint16(12);
  const totalCompressed = view.getUint32(20);
  const pos = { offset: 48 };
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const flags = file[pos.offset++];
    const tagIndex = flags & 0x3f;
    const version = flags >> 6;
    let tag;
    if (tagIndex === 63) {
      tag = file.toString('latin1', pos.offset, pos.offset + 4);
      pos.offset += 4;
    } else {
      tag = KNOWN_TAGS[tagIndex];
    }
    const origLength = readBase128(file, pos);
    // glyf/loca are transformed unless version 3; every other table is only
    // transformed when version != 0. A transformed table adds transformLength.
    const transformed = (tag === 'glyf' || tag === 'loca') ? version !== 3 : version !== 0;
    const storedLength = transformed ? readBase128(file, pos) : origLength;
    tables.push({ tag, storedLength });
  }
  const stream = brotliDecompressSync(file.subarray(pos.offset, pos.offset + totalCompressed));
  let cursor = 0;
  for (const table of tables) {
    if (table.tag === 'cmap') {
      return parseCmapTable(stream.subarray(cursor, cursor + table.storedLength));
    }
    cursor += table.storedLength;
  }
  throw new Error(`${path}: no cmap table`);
}
