// Inner-page banner images (components/page-banner.njk), from data/site.json → page_banners.
// Runs as part of `npm run assets` (so `npm run dev` / `npm run build`), or alone:
//   npm run banners
//
// For each page entry { source, band, focal, windows?, tint }:
// - source: a file path, or a bare name such as "aboutimage" that is looked up anywhere under
//   assets/ (case-insensitive, any image extension). No file found → the page shows the
//   gradient banner instead (no photo), so a photo dropped in later is picked up automatically.
// - band: 1-4, a quarter of the photo's height from the top (1 = 0-25% … 4 = 75-100%).
// - Crops (full width; the original is never modified), written to assets/banners/:
//     desktop (≥1024px) and tablet (768-1023px): the band itself (or windows.desktop / tablet);
//     mobile (<768px): the band expanded evenly up and down to a 16:9 window, clamped to the
//     photo (or windows.mobile).
//   windows.{desktop,tablet,mobile} = [top%, bottom%] override a crop (used when a band
//   would cut off faces; see DECISIONS.md).
// - Output: WebP + JPEG, desktop 1920/1280px wide, tablet 1536px, mobile 1080/720px, quality
//   stepped down until each file is under 220KB. Never upscaled.
// Writes assets/banners/banners.json, which the build reads.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, readJson } from "../lib/load-data.js";

const OUT = path.join(ROOT, "assets/banners");
const LIMIT = 220 * 1024;
const IMAGE = /\.(jpe?g|png|webp|avif|tiff?)$/i;
const site = readJson("site.json");
const entries = Object.entries(site.page_banners || {}).filter(([k, v]) => !k.startsWith("_") && v && typeof v === "object");

// Find a bare name anywhere under assets/ (skips generated output folders).
function findAsset(name) {
  if (/[\\/]/.test(name) && fs.existsSync(path.join(ROOT, name))) return name;
  const want = name.toLowerCase().replace(IMAGE, "");
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (!["generated", "banners", "placeholders"].includes(e.name)) walk(full); }
      else if (IMAGE.test(e.name) && e.name.toLowerCase().replace(IMAGE, "") === want) hits.push(path.relative(ROOT, full));
    }
  })(path.join(ROOT, "assets"));
  return hits.sort()[0] || null;
}

async function encode(pipeline, fmt) {
  let q = fmt === "webp" ? 78 : 80, buf;
  do {
    const img = pipeline();
    buf = await (fmt === "webp" ? img.webp({ quality: q, effort: 5 }) : img.jpeg({ quality: q, mozjpeg: true, progressive: true })).toBuffer();
    q -= 4;
  } while (buf.length > LIMIT && q > 30);
  return buf;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const [pageUrl, cfg] of entries) {
  const rel = cfg.source ? findAsset(cfg.source) : null;
  if (!rel) { manifest[pageUrl] = { photo: false, source: cfg.source || null, tint: cfg.tint ?? 0.78 }; continue; }
  const src = path.join(ROOT, rel);
  const meta = await sharp(src).rotate().metadata();
  const W = meta.width, H = meta.height;
  const band = Math.min(4, Math.max(1, Number(cfg.band) || 2));
  const bandWin = [(band - 1) * 25, band * 25];
  const center = (bandWin[0] + bandWin[1]) / 2;
  // Mobile: expand the band evenly to 16:9 (clamped to the photo; shifted if it hits an edge).
  const mobileH = Math.min(100, ((W * 9) / 16 / H) * 100);
  let mTop = center - mobileH / 2;
  mTop = Math.max(0, Math.min(100 - mobileH, mTop));
  const windows = {
    desktop: cfg.windows?.desktop || bandWin,
    tablet: cfg.windows?.tablet || cfg.windows?.desktop || bandWin,
    mobile: cfg.windows?.mobile || [mTop, mTop + mobileH],
  };
  const slug = pageUrl.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home";
  const entry = { photo: true, source: rel, band, focal: cfg.focal || "50% 50%", tint: cfg.tint ?? 0.78, windows, files: {} };
  // Desktop banners are 360-400px tall, so the strip needs ≥400px of height: a 6:1 band needs
  // 2400px of width, a 9:1 panorama band 3600px (capped by the photo's own width).
  const aspect = (win) => W / ((H * (win[1] - win[0])) / 100);
  const desktopW = Math.min(W, Math.max(2000, Math.ceil((400 * aspect(windows.desktop)) / 100) * 100));
  const sizes = { desktop: [desktopW, 1280], tablet: [Math.min(W, Math.max(1536, Math.ceil((320 * aspect(windows.tablet)) / 100) * 100))], mobile: [1080, 720] };
  const report = [];
  for (const [kind, [t, b]] of Object.entries(windows)) {
    // Tablet shares the desktop files when both use the same window.
    if (kind === "tablet" && t === windows.desktop[0] && b === windows.desktop[1]) { entry.files.tablet = entry.files.desktop; continue; }
    const crop = { left: 0, top: Math.round((H * t) / 100), width: W, height: Math.max(1, Math.round((H * (b - t)) / 100)) };
    const set = { webp: [], jpg: [] };
    const winAspect = aspect([t, b]);
    // Skip sizes whose strip would be too short to fill the banner height (they would only blur).
    const minH = { desktop: 300, tablet: 260, mobile: 200 }[kind];
    for (const w of sizes[kind]) {
      if ((w > W && set.jpg.length) || (set.jpg.length && w / winAspect < minH)) continue;
      for (const fmt of ["webp", "jpg"]) {
        const buf = await encode(() => sharp(src).rotate().extract(crop).resize({ width: Math.min(w, W), withoutEnlargement: true }), fmt);
        const info = await sharp(buf).metadata();
        const name = `${slug}-${kind}-${info.width}.${fmt}`;
        fs.writeFileSync(path.join(OUT, name), buf);
        set[fmt].push({ src: `/assets/banners/${name}`, w: info.width, h: info.height });
        report.push(`${kind} ${info.width}x${info.height} ${fmt} ${Math.round(buf.length / 1024)}KB`);
      }
    }
    entry.files[kind] = {
      webp: set.webp.map((v) => `${v.src} ${v.w}w`).join(", "),
      jpg: set.jpg.map((v) => `${v.src} ${v.w}w`).join(", "),
      fallback: set.jpg[0].src, width: set.jpg[0].w, height: set.jpg[0].h,
      // object-fit: cover scales the strip to the banner height when the strip is wider than
      // the banner, so the rendered width is max(viewport, banner height × strip aspect).
      sizes: `max(100vw, ${Math.round({ desktop: 400, tablet: 320, mobile: 280 }[kind] * winAspect)}px)`,
      window: `${t.toFixed(1)}-${b.toFixed(1)}%`,
    };
  }
  manifest[pageUrl] = entry;
  console.log(`  ${pageUrl.padEnd(16)} ${rel} band ${band} → desktop ${windows.desktop.map((v) => v.toFixed(1)).join("-")}%, tablet ${windows.tablet.map((v) => v.toFixed(1)).join("-")}%, mobile ${windows.mobile.map((v) => v.toFixed(1)).join("-")}%  [${report.join("; ")}]`);
}
fs.writeFileSync(path.join(OUT, "banners.json"), JSON.stringify(manifest, null, 2));
const photo = Object.entries(manifest).filter(([, v]) => v.photo).map(([k]) => k);
const plain = Object.entries(manifest).filter(([, v]) => !v.photo).map(([k]) => k);
console.log(`[banners] photo: ${photo.join(", ") || "none"}; gradient (no photo yet): ${plain.join(", ") || "none"}`);
