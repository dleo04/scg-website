// Builds assets/logos/ey-reversed.png from the EY lockup in assets/logos/ey.png, for use on
// dark/photo backgrounds only (the home page EY band). The original file is never modified;
// it is still used on light backgrounds (the employer logo grid).
//   node scripts/make-ey-reversed.mjs
//
// What it does, per pixel:
//  - Background: if the source has an opaque white/near-white background, alpha is derived
//    from luminance (soft edges, no white halo). The current source is already transparent,
//    so its own anti-aliased alpha is kept as is.
//  - The grey lettering ("EY" and "Building a better working world") becomes pure white,
//    keeping each pixel's alpha.
//  - The yellow beam keeps its original colour and alpha.
// No resizing (the source is 2558×1276, far above any display size), no stretching or effects.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT } from "../lib/load-data.js";

const SRC = path.join(ROOT, "assets/logos/ey.png");
const OUT = path.join(ROOT, "assets/logos/ey-reversed.png");
const GREY = 128;                 // the lockup's lettering grey (#808080)
const YELLOW = [255, 229, 23];    // the beam (#FFE517)

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(data.length);
let yellowPx = 0, letterPx = 0, bgPx = 0;

for (let i = 0; i < data.length; i += 4) {
  let [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];

  // Opaque light pixels from a white-background source: convert "how far from white" into alpha.
  if (a > 250 && r > 200 && g > 200 && b > 200 && !(b < 150)) {
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    a = Math.round(Math.max(0, Math.min(1, (255 - lum) / (255 - GREY))) * 255);
    if (a === 0) { out.writeUInt32BE(0, i); bgPx++; continue; }
  }
  if (a === 0) { out.writeUInt32BE(0, i); bgPx++; continue; }

  // Yellow beam: strongly yellow (blue channel far below red/green). Keep its colour.
  const isYellow = b < (r + g) / 2 - 60;
  if (isYellow) {
    out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
    yellowPx++;
  } else {
    // Lettering (grey and its anti-aliased edges): white, same alpha.
    out[i] = 255; out[i + 1] = 255; out[i + 2] = 255; out[i + 3] = a;
    letterPx++;
  }
}

await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(OUT);
console.log(`[ey-reversed] ${path.relative(ROOT, OUT)} ${info.width}x${info.height}: ${letterPx} lettering px → white, ${yellowPx} beam px kept yellow, ${bgPx} transparent.`);
