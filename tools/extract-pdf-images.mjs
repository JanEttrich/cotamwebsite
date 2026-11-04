// One-off helper: extracts embedded images (incl. alpha masks) from the Canva menu PDF as PNGs.
// Usage: node tools/extract-pdf-images.mjs <pdf> <outDir> [minWidth]
// Only uses Node built-ins.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const [, , pdfPath, outDir, minW = '500'] = process.argv;
if (!pdfPath || !outDir) { console.error('usage: node extract-pdf-images.mjs <pdf> <outDir> [minWidth]'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const buf = fs.readFileSync(pdfPath);
const txt = buf.toString('latin1');

// index objects
const objs = new Map();
const re = /(?:^|\n)(\d+) 0 obj([\s\S]*?)(stream\r?\n|endobj)/g;
let m;
while ((m = re.exec(txt))) {
  const n = +m[1];
  const dict = m[2];
  let data = null;
  if (m[3].startsWith('stream')) {
    const lenM = dict.match(/\/Length (\d+)(?! 0 R)/);
    const start = m.index + m[0].length;
    if (lenM) data = buf.subarray(start, start + +lenM[1]);
  }
  objs.set(n, { dict, data });
}

const num = (d, k) => { const r = d.match(new RegExp('/' + k + '\\s+(\\d+)')); return r ? +r[1] : null; };

function unpredict(raw, width, colors, bpc = 8) {
  const bpp = Math.max(1, (colors * bpc) >> 3);
  const rowLen = Math.ceil((width * colors * bpc) / 8);
  const rows = raw.length / (rowLen + 1);
  const out = Buffer.alloc(rows * rowLen);
  for (let y = 0; y < rows; y++) {
    const f = raw[y * (rowLen + 1)];
    const src = y * (rowLen + 1) + 1, dst = y * rowLen, prev = dst - rowLen;
    for (let x = 0; x < rowLen; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0;
      const b = y > 0 ? out[prev + x] : 0;
      const c = x >= bpp && y > 0 ? out[prev + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[dst + x] = v & 255;
    }
  }
  return out;
}

function decode(o) {
  let raw = zlib.inflateSync(o.data);
  if (/\/Predictor\s+1[0-5]/.test(o.dict)) {
    const cols = num(o.dict, 'Columns') || num(o.dict, 'Width');
    const colors = num(o.dict, 'Colors') || 1;
    raw = unpredict(raw, cols, colors, num(o.dict, 'BitsPerComponent') || 8);
  }
  return raw;
}

const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (b) => { let c = -1; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const rows = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) rgba.copy(rows, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

let count = 0;
for (const [n, o] of objs) {
  if (!o.data || !/\/Subtype\s*\/Image/.test(o.dict) || !/\/Filter\s*\/FlateDecode/.test(o.dict)) continue;
  const w = num(o.dict, 'Width'), h = num(o.dict, 'Height');
  if (w < +minW) continue;
  try {
    const px = decode(o);
    const comps = px.length / (w * h);
    if (comps !== 3 && comps !== 1) { console.warn(`skip ${n}: ${comps} comps`); continue; }
    let alpha = null;
    const sm = o.dict.match(/\/SMask (\d+) 0 R/);
    if (sm) { const so = objs.get(+sm[1]); if (so && num(so.dict, 'Width') === w) alpha = decode(so); }
    const rgba = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      if (comps === 3) { rgba[i * 4] = px[i * 3]; rgba[i * 4 + 1] = px[i * 3 + 1]; rgba[i * 4 + 2] = px[i * 3 + 2]; }
      else { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = px[i]; }
      rgba[i * 4 + 3] = alpha ? alpha[i] : 255;
    }
    fs.writeFileSync(path.join(outDir, `img-${n}-${w}x${h}.png`), png(w, h, rgba));
    count++;
  } catch (e) { console.warn(`skip ${n}: ${e.message}`); }
}
console.log(`extracted ${count} images to ${outDir}`);
