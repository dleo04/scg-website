// Page backdrop image (site.json → page_backdrops). Run by `npm run assets` (dev and build).
// Source: page_backdrops.image, a file name anywhere under assets/ (any extension; sources live
// in assets/pictures/, which is not published). Never upscaled: resized down to at most 2560px
// (desktop) / 1200px (portrait). Treatment keeps the photo readable: 45% of its saturation, a
// slight warm tint, a small lift (black → about rgb(45,43,40), so shadows are not harsh), most
// of the contrast, and a very light blur (σ 0.7). The fade itself is CSS: the image layer's
// opacity is --backdrop-visibility over the page colour.
//   assets/backdrop/backdrop-desktop.webp   16:9 around focal_y (≤ 2560 wide)
//   assets/backdrop/backdrop-portrait.webp  3:5 centred on portrait_focal_x (≤ 1200 wide)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, readJson } from "../lib/load-data.js";

const cfg = readJson("site.json").page_backdrops;
const OUT = path.join(ROOT, "assets/backdrop");
const find = (name) => {
  let hit = null;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (hit) return;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!["generated", "backdrop", "banners"].includes(e.name)) walk(p); }
      else if (path.basename(e.name, path.extname(e.name)) === name && /\.(jpe?g|png|webp|avif)$/i.test(e.name)) hit = p;
    }
  })(path.join(ROOT, "assets"));
  return hit;
};
const src = cfg?.image && find(cfg.image);
fs.mkdirSync(OUT, { recursive: true });
if (!src) {
  console.log(`[backdrop] no source image "${cfg?.image}" under assets/; pages keep their solid colours.`);
  process.exit(0);
}
const meta = await sharp(src).rotate().metadata();
const W = meta.width, H = meta.height;

async function make(name, maxW, crop, ratio) {
  const outW = Math.min(maxW, crop.width);                 // never upscale
  const outH = Math.round(outW / ratio);
  // Tone: out = 0.82 × in + offset → black lands at about rgb(46,43,38) (warm), white stays
  // white; 82% of the contrast is kept.
  const pipeline = () => sharp(src).rotate().extract(crop)
    .resize(outW, outH, { kernel: sharp.kernel.lanczos3, fit: "fill" })
    .modulate({ saturation: 0.45 })
    .blur(0.7)
    .linear([0.82, 0.82, 0.82], [46, 43, 38]);
  let q = 72, buf;
  const limit = name === "desktop" ? 150 : 100;
  do { buf = await pipeline().webp({ quality: q, smartSubsample: true }).toBuffer(); q -= 4; } while (buf.length > limit * 1024 && q > 40);
  fs.writeFileSync(path.join(OUT, `backdrop-${name}.webp`), buf);
  const st = await sharp(buf).stats();
  return { name, width: outW, height: outH, kb: Math.round(buf.length / 1024), q: q + 4, min: st.channels.slice(0, 3).map((c) => c.min), max: st.channels.slice(0, 3).map((c) => c.max) };
}

// 16:9 desktop crop around focal_y.
const dh = Math.round((W * 9) / 16);
const desk = { left: 0, top: Math.round((H - dh) * (cfg.focal_y ?? 0.5)), width: W, height: dh };
// Portrait 3:5 crop around portrait_focal_x (full height).
const pw = Math.round((H * 3) / 5);
const port = { left: Math.max(0, Math.min(W - pw, Math.round(W * (cfg.portrait_focal_x ?? 0.5) - pw / 2))), top: 0, width: pw, height: H };
const results = [await make("desktop", 2560, desk, 16 / 9), await make("portrait", 1200, port, 3 / 5)];
fs.writeFileSync(path.join(OUT, "backdrop.json"), JSON.stringify({ source: path.relative(ROOT, src), desktop: "/assets/backdrop/backdrop-desktop.webp", portrait: "/assets/backdrop/backdrop-portrait.webp", files: results }, null, 2));
console.log(`[backdrop] ${path.relative(ROOT, src)} (${W}×${H}) → ${results.map((r) => `${r.name} ${r.width}×${r.height} ${r.kb}KB q${r.q}, darkest rgb(${r.min}), lightest rgb(${r.max})`).join("; ")}`);
