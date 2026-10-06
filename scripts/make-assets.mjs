// Generates image files the site needs. Run automatically by `npm run dev` / `npm run build`.
//
// 1. assets/placeholders/  Neutral labeled gray blocks for every image slot in
//    assets/PLACEHOLDERS.md, including one per project/track found in data/.
//    Existing files are never overwritten, so a real photo dropped in stays put.
// 2. assets/generated/     Derived files rebuilt every time (git-ignored):
//    Open Graph image, square app icons, responsive hero sizes.
//    The logo is only placed on a canvas, never recolored, cropped or stretched.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, readJson } from "../lib/load-data.js";
import { resolveLogo } from "../lib/projects.js";
import { edgeColor } from "../lib/logo-tools.js";

const PH_DIR = path.join(ROOT, "assets/placeholders");
const GEN_DIR = path.join(ROOT, "assets/generated");
const LOGO = path.join(ROOT, "assets/scg-logo.png");
const PAPER_2 = "#F7F4EF";
fs.mkdirSync(PH_DIR, { recursive: true });
fs.mkdirSync(GEN_DIR, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function placeholderSvg(w, h, label, { transparent = false } = {}) {
  const font = Math.round(Math.max(18, Math.min(w, h) / 14));
  const inset = Math.round(Math.min(w, h) * 0.03) + 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    ${transparent ? "" : `<rect width="100%" height="100%" fill="#ECE9E4"/>`}
    <rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" rx="12"
      fill="none" stroke="#8C877F" stroke-width="3" stroke-dasharray="14 10"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Helvetica, Arial, sans-serif" font-size="${font}" font-weight="700" fill="#3B3B3B">${esc(label)}</text>
  </svg>`);
}

const created = [];
async function placeholder(relPath, w, h, label, opts) {
  const file = path.join(ROOT, relPath);
  if (fs.existsSync(file)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const img = sharp(placeholderSvg(w, h, label, opts));
  await (relPath.endsWith(".png") ? img.png() : img.jpeg({ quality: 70 })).toFile(file);
  created.push(relPath);
}

// ---- 1. Placeholders --------------------------------------------------------
const site = readJson("site.json");
const { projects } = readJson("projects.json");
const { tracks } = readJson("tracks.json");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

for (const p of projects) {
  if (p.image?.startsWith("assets/placeholders/")) {
    await placeholder(p.image, 1280, 720, `PHOTO: ${p.title} team (16:9)`);
  }
}
for (const t of tracks) {
  if (t.illustration?.startsWith("assets/placeholders/")) {
    await placeholder(t.illustration, 800, 800, `ILLUSTRATION: ${t.name} (1:1)`);
  }
}
await placeholder("assets/placeholders/team-headshot.jpg", 800, 1000, "PHOTO: Team headshot (4:5)");
await placeholder("assets/placeholders/alumni-photo.jpg", 800, 1000, "PHOTO: Alumni photo (4:5)");
for (const partner of site.partners || []) {
  await placeholder(`assets/placeholders/partner-logo-${slug(partner.name)}.png`, 720, 240, `LOGO: ${partner.name}`, { transparent: true });
}
await placeholder("assets/placeholders/client-logo.png", 720, 240, "LOGO: Past client", { transparent: true });
await placeholder("assets/placeholders/og-image.jpg", 1200, 630, "OPEN GRAPH IMAGE (1200x630)");

// ---- 2. Generated -----------------------------------------------------------
const manifest = {};
const logoMeta = await sharp(LOGO).metadata();

// Open Graph default: logo at native size on a --paper-2 canvas.
await sharp({ create: { width: 1200, height: 630, channels: 4, background: PAPER_2 } })
  .composite([{ input: LOGO, left: Math.round((1200 - logoMeta.width) / 2), top: Math.round((630 - logoMeta.height) / 2) }])
  .png()
  .toFile(path.join(GEN_DIR, "og-default.png"));
manifest.og = { src: "/assets/generated/og-default.png", width: 1200, height: 630 };

// Square icons: the supplied icon is 698x192, so it is centered on a white
// square with clear space. A dedicated square mark from officers would be better.
for (const size of [180, 192, 512]) {
  const logoWidth = Math.round(size * 0.86);
  const logo = await sharp(LOGO).resize({ width: logoWidth, kernel: "lanczos3" }).toBuffer();
  const { height } = await sharp(logo).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#FFFFFF" } })
    .composite([{ input: logo, left: Math.round((size - logoWidth) / 2), top: Math.round((size - height) / 2) }])
    .png()
    .toFile(path.join(GEN_DIR, size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`));
}

// Photos named in site.json → images: responsive WebP + JPEG sizes.
async function responsive(key, widths) {
  const src = site.images?.[key];
  if (!src || src.startsWith("assets/placeholders/") || !fs.existsSync(path.join(ROOT, src))) return;
  const meta = await sharp(path.join(ROOT, src)).metadata();
  const sizes = widths.filter((w) => w <= meta.width);
  const variants = [];
  for (const w of sizes) {
    const h = Math.round((meta.height / meta.width) * w);
    for (const fmt of ["webp", "jpg"]) {
      const name = `${key}-${w}.${fmt}`;
      const img = sharp(path.join(ROOT, src)).resize({ width: w });
      await (fmt === "webp" ? img.webp({ quality: 70 }) : img.jpeg({ quality: 74, mozjpeg: true })).toFile(path.join(GEN_DIR, name));
      variants.push({ w, h, fmt, src: `/assets/generated/${name}` });
    }
  }
  const largest = variants.filter((v) => v.fmt === "jpg").at(-1);
  manifest[key] = {
    width: largest.w,
    height: largest.h,
    src: largest.src,
    webpSrcset: variants.filter((v) => v.fmt === "webp").map((v) => `${v.src} ${v.w}w`).join(", "),
    jpgSrcset: variants.filter((v) => v.fmt === "jpg").map((v) => `${v.src} ${v.w}w`).join(", "),
  };
}
await responsive("hero", [640, 1024, 1600, 2000]);
await responsive("community", [480, 800, 1200]);

// SCG photos (data/photos.json → assets/photos/<id>.jpg, made by npm run old-photos):
// WebP + JPEG thumbnails at 480 and 960px wide for grids; the 1600px JPEG itself is the
// full-size image (lightbox, no-JS link). Never upscaled.
manifest.photos = {};
const photoList = fs.existsSync(path.join(ROOT, "data/photos.json")) ? readJson("photos.json").photos || [] : [];
fs.mkdirSync(path.join(GEN_DIR, "photos"), { recursive: true });
for (const photo of photoList) {
  const src = path.join(ROOT, "assets/photos", `${photo.id}.jpg`);
  if (!fs.existsSync(src)) continue;
  const meta = await sharp(src).metadata();
  const variants = [];
  for (const w of [480, 960].filter((w) => w < meta.width)) {
    for (const fmt of ["webp", "jpg"]) {
      const name = `${photo.id}-${w}.${fmt}`;
      const img = sharp(src).resize({ width: w });
      await (fmt === "webp" ? img.webp({ quality: 72 }) : img.jpeg({ quality: 76, mozjpeg: true })).toFile(path.join(GEN_DIR, "photos", name));
      variants.push({ w, fmt, src: `/assets/generated/photos/${name}` });
    }
  }
  const full = `/assets/photos/${photo.id}.jpg`;
  manifest.photos[photo.id] = {
    full, width: meta.width, height: meta.height,
    src: variants.filter((v) => v.fmt === "jpg").at(-1)?.src || full,
    webpSrcset: variants.filter((v) => v.fmt === "webp").map((v) => `${v.src} ${v.w}w`).join(", "),
    jpgSrcset: [...variants.filter((v) => v.fmt === "jpg").map((v) => `${v.src} ${v.w}w`), `${full} ${meta.width}w`].join(", "),
  };
}

// "What you get" cards (site.json → benefits): each photo cut to 16:10 around its focal point
// (x% y%), 600 and 1000px wide, WebP + JPEG under 120KB. Never upscaled.
manifest.benefits = {};
fs.mkdirSync(path.join(GEN_DIR, "benefits"), { recursive: true });
for (const b of site.benefits || []) {
  const src = b.image && path.join(ROOT, "assets/photos", `${b.image}.jpg`);
  if (!src || !fs.existsSync(src)) continue;
  const meta = await sharp(src).metadata();
  let w = meta.width, h = Math.round((meta.width * 10) / 16);
  if (h > meta.height) { h = meta.height; w = Math.round((h * 16) / 10); }
  const [fx, fy] = (b.focal || "50% 50%").split(/\s+/).map((v) => parseFloat(v) / 100);
  const crop = { left: Math.round((meta.width - w) * fx), top: Math.round((meta.height - h) * fy), width: w, height: h };
  const set = { webp: [], jpg: [] };
  for (const size of [600, 1000].filter((s) => s <= w)) {
    for (const fmt of ["webp", "jpg"]) {
      let q = fmt === "webp" ? 76 : 78, buf;
      do {
        const img = sharp(src).extract(crop).resize({ width: size });
        buf = await (fmt === "webp" ? img.webp({ quality: q }) : img.jpeg({ quality: q, mozjpeg: true, progressive: true })).toBuffer();
        q -= 5;
      } while (buf.length > 120 * 1024 && q > 40);
      const name = `${b.image}-${size}.${fmt}`;
      fs.writeFileSync(path.join(GEN_DIR, "benefits", name), buf);
      set[fmt].push({ src: `/assets/generated/benefits/${name}`, w: size, kb: Math.round(buf.length / 1024) });
    }
  }
  manifest.benefits[b.image] = {
    src: set.jpg.at(-1).src, width: set.jpg.at(-1).w, height: Math.round((set.jpg.at(-1).w * 10) / 16),
    webpSrcset: set.webp.map((v) => `${v.src} ${v.w}w`).join(", "), jpgSrcset: set.jpg.map((v) => `${v.src} ${v.w}w`).join(", "),
    sizesKB: [...set.webp, ...set.jpg].map((v) => `${v.w}${v.src.endsWith("webp") ? "w" : "j"}:${v.kb}`).join(" "),
  };
}

// Work With Us cost cards (site.json → work_with_us.fee_cards): 16:9 crops around each focal
// point, 600 and 1000px wide (or the source width, never upscaled), WebP + JPEG under 120KB.
// 'image' is a file name in assets/photos/ with any extension.
manifest.feeCards = {};
fs.mkdirSync(path.join(GEN_DIR, "fee-cards"), { recursive: true });
for (const card of site.work_with_us?.fee_cards || []) {
  const file = card.image && fs.readdirSync(path.join(ROOT, "assets/photos")).find((f) => path.basename(f, path.extname(f)) === card.image && /\.(jpe?g|png|webp)$/i.test(f));
  if (!file) continue;
  const src = path.join(ROOT, "assets/photos", file);
  const meta = await sharp(src).rotate().metadata();
  let w = meta.width, h = Math.round((meta.width * 9) / 16);
  if (h > meta.height) { h = meta.height; w = Math.round((h * 16) / 9); }
  const [fx, fy] = (card.focal || "50% 50%").split(/\s+/).map((v) => parseFloat(v) / 100);
  const crop = { left: Math.round((meta.width - w) * fx), top: Math.round((meta.height - h) * fy), width: w, height: h };
  const set = { webp: [], jpg: [] };
  for (const size of [...new Set([600, 1000].map((s) => Math.min(s, w)))]) {
    for (const fmt of ["webp", "jpg"]) {
      let q = fmt === "webp" ? 78 : 80, buf;
      do {
        const img = sharp(src).rotate().extract(crop).resize({ width: size });
        buf = await (fmt === "webp" ? img.webp({ quality: q }) : img.jpeg({ quality: q, mozjpeg: true, progressive: true })).toBuffer();
        q -= 5;
      } while (buf.length > 120 * 1024 && q > 40);
      const name = `${card.image}-${size}.${fmt}`;
      fs.writeFileSync(path.join(GEN_DIR, "fee-cards", name), buf);
      set[fmt].push({ src: `/assets/generated/fee-cards/${name}`, w: size, kb: Math.round(buf.length / 1024) });
    }
  }
  const last = set.jpg.at(-1);
  manifest.feeCards[card.image] = {
    src: last.src, width: last.w, height: Math.round((last.w * 9) / 16),
    webpSrcset: set.webp.map((v) => `${v.src} ${v.w}w`).join(", "), jpgSrcset: set.jpg.map((v) => `${v.src} ${v.w}w`).join(", "),
    sizesKB: [...set.webp, ...set.jpg].map((v) => `${v.w}${v.src.endsWith("webp") ? "w" : "j"}:${v.kb}`).join(" "),
  };
}

// About timeline photos (site.json → story_photos): 4:3 (desktop/tablet) and 16:9 (phones)
// crops around each focal point, 800px wide (and 480px), WebP + JPEG under 100KB; smaller
// sources are used at their own width (never upscaled). 'image' may have any extension.
manifest.story = {};
fs.mkdirSync(path.join(GEN_DIR, "story"), { recursive: true });
for (const f of fs.readdirSync(path.join(GEN_DIR, "story"))) fs.rmSync(path.join(GEN_DIR, "story", f));
for (const [key, sp] of Object.entries(site.story_photos || {})) {
  const file = sp.image && fs.readdirSync(path.join(ROOT, "assets/photos")).find((f) => path.basename(f, path.extname(f)).toLowerCase() === sp.image.toLowerCase() && /\.(jpe?g|png|webp)$/i.test(f));
  if (!file) continue;
  const src = path.join(ROOT, "assets/photos", file);
  const meta = await sharp(src).rotate().metadata();
  const [fx, fy] = (sp.focal || "50% 50%").split(/\s+/).map((v) => parseFloat(v) / 100);
  const entry = {};
  for (const [kind, ar] of [["wide", 4 / 3], ["mobile", 16 / 9]]) {
    let w = meta.width, h = Math.round(meta.width / ar);
    if (h > meta.height) { h = meta.height; w = Math.round(h * ar); }
    const crop = { left: Math.round((meta.width - w) * fx), top: Math.round((meta.height - h) * fy), width: w, height: h };
    const sizes = [480, 800].filter((s) => s <= w);
    if (!sizes.length) sizes.push(w);
    const set = { webp: [], jpg: [] };
    for (const size of sizes) {
      for (const fmt of ["webp", "jpg"]) {
        let q = fmt === "webp" ? 76 : 78, buf;
        do {
          const img = sharp(src).rotate().extract(crop).resize({ width: size });
          buf = await (fmt === "webp" ? img.webp({ quality: q }) : img.jpeg({ quality: q, mozjpeg: true, progressive: true })).toBuffer();
          q -= 5;
        } while (buf.length > 100 * 1024 && q > 40);
        const name = `${key}-${kind}-${size}.${fmt}`;
        fs.writeFileSync(path.join(GEN_DIR, "story", name), buf);
        set[fmt].push(`/assets/generated/story/${name} ${size}w`);
        if (fmt === "jpg") entry[kind] = { src: `/assets/generated/story/${name}`, width: size, height: Math.round(size / ar), kb: Math.round(buf.length / 1024) };
      }
    }
    entry[kind].webpSrcset = set.webp.join(", ");
    entry[kind].jpgSrcset = set.jpg.join(", ");
  }
  manifest.story[key] = entry;
}

// Generic focal-point crops: each kind is [name, aspect]; 480 and 800px wide, WebP + JPEG
// under 100KB. Used for the /about/ pillar cards (16:10) and step visuals (4:3 + 16:9).
async function focalCrops(dir, key, image, focal, kinds) {
  // 'image' is a file name in assets/photos/ without extension (any of jpg/jpeg/png/webp).
  const file = image && fs.readdirSync(path.join(ROOT, "assets/photos")).find((f) => path.basename(f, path.extname(f)).toLowerCase() === image.toLowerCase() && /\.(jpe?g|png|webp)$/i.test(f));
  const src = file && path.join(ROOT, "assets/photos", file);
  if (!src) return null;
  fs.mkdirSync(path.join(GEN_DIR, dir), { recursive: true });
  const meta = await sharp(src).rotate().metadata();
  const [fx, fy] = (focal || "50% 50%").split(/\s+/).map((v) => parseFloat(v) / 100);
  const entry = {};
  for (const [kind, ar] of kinds) {
    let w = meta.width, h = Math.round(meta.width / ar);
    if (h > meta.height) { h = meta.height; w = Math.round(h * ar); }
    const crop = { left: Math.round((meta.width - w) * fx), top: Math.round((meta.height - h) * fy), width: w, height: h };
    const set = { webp: [], jpg: [] };
    const sizes = [480, 800].filter((s) => s <= w);
    if (w < 800) sizes.push(w);   // small sources: also their full width (never upscaled)
    for (const size of [...new Set(sizes)]) {
      for (const fmt of ["webp", "jpg"]) {
        let q = fmt === "webp" ? 76 : 78, buf;
        do {
          const img = sharp(src).rotate().extract(crop).resize({ width: size });
          buf = await (fmt === "webp" ? img.webp({ quality: q }) : img.jpeg({ quality: q, mozjpeg: true, progressive: true })).toBuffer();
          q -= 5;
        } while (buf.length > 100 * 1024 && q > 40);
        const name = `${key}-${kind}-${size}.${fmt}`;
        fs.writeFileSync(path.join(GEN_DIR, dir, name), buf);
        set[fmt].push(`/assets/generated/${dir}/${name} ${size}w`);
        if (fmt === "jpg") entry[kind] = { src: `/assets/generated/${dir}/${name}`, width: size, height: Math.round(size / ar), kb: Math.round(buf.length / 1024) };
      }
    }
    entry[kind].webpSrcset = set.webp.join(", ");
    entry[kind].jpgSrcset = set.jpg.join(", ");
  }
  return entry;
}
manifest.pillars = {};
for (const [i, p] of (site.pillars || []).entries()) {
  const e = await focalCrops("pillars", `pillar-${i + 1}`, p.image, p.focal, [["card", 16 / 10]]);
  if (e) manifest.pillars[i + 1] = e;
}
manifest.steps = {};
for (const s of readJson("process.json").steps || []) {
  const v = s.visual;
  if (!v?.image) continue;
  const key = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const e = await focalCrops("steps", key, v.image, v.focal, [["wide", 4 / 3], ["mobile", 16 / 9]]);
  if (e) manifest.steps[key] = e;
}

// "SCG elsewhere" card photos (site.json → press): 16:10 crops.
manifest.press = {};
for (const [i, pr] of (site.press || []).entries()) {
  const e = await focalCrops("press", `press-${i + 1}`, pr.image, pr.focal, [["card", 16 / 10]]);
  if (e) manifest.press[i + 1] = e;
}

// "Life in SCG" gallery (data/gallery.json): a 640px thumbnail (WebP, < 60KB) and a 1600px
// lightbox copy (WebP, < 250KB) per photo, aspect ratio kept (nothing cropped). Missing
// width/height in the data are read from the file.
manifest.gallery = {};
fs.mkdirSync(path.join(GEN_DIR, "gallery"), { recursive: true });
const galleryFile = path.join(ROOT, "data/gallery.json");
for (const g of fs.existsSync(galleryFile) ? JSON.parse(fs.readFileSync(galleryFile, "utf8")).photos || [] : []) {
  const src = path.join(ROOT, g.file || "");
  if (!g.file || !fs.existsSync(src)) continue;
  const meta = await sharp(src).rotate().metadata();
  const key = path.basename(g.file, path.extname(g.file));
  const out = { width: meta.width, height: meta.height };
  for (const [kind, w, limit] of [["thumb", 640, 60], ["full", 1600, 250]]) {
    // Step quality down to 50; if still too large, step the width down by 10% (keeps detail).
    let q = 78, width = Math.min(w, meta.width), buf;
    for (;;) {
      buf = await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: q }).toBuffer();
      if (buf.length <= limit * 1024) break;
      if (q > 50) q -= 5; else if (width > w * 0.6) width = Math.round(width * 0.9); else break;
    }
    const info = await sharp(buf).metadata();
    fs.writeFileSync(path.join(GEN_DIR, "gallery", `${key}-${kind}.webp`), buf);
    out[kind] = { src: `/assets/generated/gallery/${key}-${kind}.webp`, width: info.width, height: info.height, kb: Math.round(buf.length / 1024) };
  }
  manifest.gallery[g.file] = out;
}

// Team and alumni headshots: assets/photos/people/<id>.* → a square card image (600px, as on
// /team/ and /alumni/ cards) and a 4:5 portrait (600×750, alumni drawer and page), WebP < 60KB,
// framed on the detected face (lib/faces.mjs, lib/headshots.mjs). Detection runs here only for
// photos without a stored face box (or whose file changed); results are written back to the
// data files so framing is reproducible and can be overridden by hand (photo.focal_override).
manifest.people = {};
fs.mkdirSync(path.join(GEN_DIR, "people"), { recursive: true });
{
  const { sourceFor, frame, renderCrop } = await import("../lib/headshots.mjs");
  const round1 = (v) => Math.round(v * 1000) / 10;
  const files = [["team.json", "members"], ["alumni.json", "alumni"]];
  const noFace = [], clampedList = [];
  for (const [name, key] of files) {
    const file = path.join(ROOT, "data", name);
    const raw = fs.readFileSync(file, "utf8");
    const doc = JSON.parse(raw);
    for (const person of doc[key] || []) {
      const src = person.id && sourceFor(person.id);
      if (!src) continue;
      const meta = await sharp(src).rotate().metadata();
      const W = meta.autoOrient?.width ?? meta.width, H = meta.autoOrient?.height ?? meta.height;
      const photo = (person.photo = person.photo && typeof person.photo === "object" ? person.photo : {});
      delete photo.focal_legacy;
      if (typeof photo.focal === "string") delete photo.focal;   // old-site crop hint, superseded
      const sourceInfo = { file: path.basename(src), width: W, height: H };
      const stale = !photo.source || photo.source.file !== sourceInfo.file || photo.source.width !== W || photo.source.height !== H;
      if (stale || (!photo.face && !photo.detect_failed) || process.env.REDETECT) {
        const { detectFace } = await import("../lib/faces.mjs");
        const f = await detectFace(src);
        photo.source = sourceInfo;
        if (f) {
          photo.face = { x: round1(f.x), y: round1(f.y), w: round1(f.w), h: round1(f.h) };
          photo.focal = { x: round1(f.x + f.w / 2), y: round1(f.y + f.h / 2) };
          delete photo.detect_failed;
        } else {
          delete photo.face; delete photo.focal;
          photo.detect_failed = true;
        }
      }
      if (photo.detect_failed && !photo.focal_override) noFace.push(person.name);
      const out = { };
      for (const [kind, aspect, w] of [["card", 1, 600], ["portrait", 4 / 5, 600]]) {
        const rect = frame(photo, W, H, aspect);
        if (rect.clamped && kind === "card") clampedList.push(person.name);
        const { buf, width, height } = await renderCrop(src, rect, w, aspect, 60);
        const fileName = kind === "card" ? `${person.id}.webp` : `${person.id}-portrait.webp`;
        fs.writeFileSync(path.join(GEN_DIR, "people", fileName), buf);
        out[kind] = { src: `/assets/generated/people/${fileName}`, width, height, kb: Math.round(buf.length / 1024) };
      }
      // Open Graph image for /alumni/<id>/: the portrait beside the logo on --paper-2.
      if (key === "alumni") {
        const portrait = await sharp(path.join(GEN_DIR, "people", `${person.id}-portrait.webp`)).resize(504, 630, { fit: "cover" }).toBuffer();
        const logo = await sharp(LOGO).resize({ width: 520 }).toBuffer();
        const lh = (await sharp(logo).metadata()).height;
        await sharp({ create: { width: 1200, height: 630, channels: 4, background: PAPER_2 } })
          .composite([{ input: logo, left: Math.round((696 - 520) / 2), top: Math.round((630 - lh) / 2) }, { input: portrait, left: 696, top: 0 }])
          .flatten({ background: PAPER_2 }).jpeg({ quality: 82, mozjpeg: true })
          .toFile(path.join(GEN_DIR, "people", `${person.id}-og.jpg`));
        out.og = { src: `/assets/generated/people/${person.id}-og.jpg`, width: 1200, height: 630 };
      }
      manifest.people[person.id] = { ...out.card, portrait: out.portrait, og: out.og };
    }
    const next = JSON.stringify(doc, null, 2) + "\n";
    if (next !== raw) fs.writeFileSync(file, next);
  }
  if (noFace.length) console.warn(`[assets] headshots: no face found for ${noFace.join(", ")}; default framing used (set photo.focal_override).`);
  if (clampedList.length) console.log(`[assets] headshots: tight source, face larger than ${Math.round(55)}% or off-centre: ${clampedList.join(", ")}`);
}

// Employer logos (downloaded once by `npm run logos`): small WebP + PNG copies,
// resized proportionally to at most 360x120 (3x the largest display size). No recoloring.
const logoManifest = path.join(ROOT, "assets/logos/logos.json");
if (fs.existsSync(logoManifest)) {
  fs.mkdirSync(path.join(GEN_DIR, "logos"), { recursive: true });
  manifest.logos = {};
  for (const logo of JSON.parse(fs.readFileSync(logoManifest, "utf8")).filter((l) => l.ok)) {
    const src = path.join(ROOT, logo.file);
    if (!fs.existsSync(src)) continue;
    const resized = sharp(src).resize({ width: 360, height: 120, fit: "inside", withoutEnlargement: true });
    const webp = await resized.clone().webp({ quality: 88 }).toBuffer({ resolveWithObject: true });
    fs.writeFileSync(path.join(GEN_DIR, "logos", `${logo.slug}.webp`), webp.data);
    await resized.clone().png({ compressionLevel: 9 }).toFile(path.join(GEN_DIR, "logos", `${logo.slug}.png`));
    manifest.logos[logo.slug] = {
      name: logo.name,
      webp: `/assets/generated/logos/${logo.slug}.webp`,
      png: `/assets/generated/logos/${logo.slug}.png`,
      width: webp.info.width,
      height: webp.info.height,
    };
  }
}

// Project (client) logos for the home cards: WebP + PNG copies at up to 1200x600,
// proportional, never enlarged, colors untouched. The original files stay in assets/logos/.
manifest.projectLogos = {};
fs.mkdirSync(path.join(GEN_DIR, "projects"), { recursive: true });
for (const p of projects) {
  const logoPath = resolveLogo(ROOT, p.logo);
  if (!logoPath) continue;
  const src = path.join(ROOT, logoPath);
  const base = sharp(src).resize({ width: 1200, height: 600, fit: "inside", withoutEnlargement: true });
  // Lossless: flat brand colours must match logo_bg exactly (lossy WebP shifted navy by 1 unit and showed a box).
  const webp = await base.clone().webp({ lossless: true }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(path.join(GEN_DIR, "projects", `${p.id}.webp`), webp.data);
  await base.clone().png({ compressionLevel: 9 }).toFile(path.join(GEN_DIR, "projects", `${p.id}.png`));
  // Background colour sampled from the logo's edge (used when logo_bg is not set): the
  // dominant colour of the outer 2px ring; transparent → a light neutral (--paper-2).
  const edge = await edgeColor(src);
  const sampledBg = edge.transparent ? PAPER_2 : edge.hex;
  manifest.projectLogos[p.id] = {
    sampledBg,
    webp: `/assets/generated/projects/${p.id}.webp`,
    png: `/assets/generated/projects/${p.id}.png`,
    width: webp.info.width,
    height: webp.info.height,
  };
}

// Partnership band logo (site.json → partners[].band.logo): lossless WebP + PNG, at most
// 288px tall (4x the 72px display height), proportional, never enlarged.
for (const partner of site.partners || []) {
  const logo = partner.band?.logo;
  if (!logo || !fs.existsSync(path.join(ROOT, logo))) continue;
  const slugName = partner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  fs.mkdirSync(path.join(GEN_DIR, "partners"), { recursive: true });
  const base = sharp(path.join(ROOT, logo)).resize({ height: 288, withoutEnlargement: true });
  const webp = await base.clone().webp({ lossless: true }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(path.join(GEN_DIR, "partners", `${slugName}-band.webp`), webp.data);
  await base.clone().png({ compressionLevel: 9 }).toFile(path.join(GEN_DIR, "partners", `${slugName}-band.png`));
  (manifest.partnerBands ??= {})[partner.name] = {
    webp: `/assets/generated/partners/${slugName}-band.webp`, png: `/assets/generated/partners/${slugName}-band.png`,
    width: webp.info.width, height: webp.info.height,
  };
}

fs.writeFileSync(path.join(GEN_DIR, "images.json"), JSON.stringify(manifest, null, 2));
console.log(`[assets] generated OG image, icons, photo sizes: ${Object.keys(manifest).filter((k) => k !== "og").join(", ") || "none"}` +
  (created.length ? `; new placeholders: ${created.join(", ")}` : ""));
