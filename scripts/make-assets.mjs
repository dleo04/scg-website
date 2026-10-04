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
  if (!p.logo || !fs.existsSync(path.join(ROOT, p.logo))) continue;
  const src = path.join(ROOT, p.logo);
  const base = sharp(src).resize({ width: 1200, height: 600, fit: "inside", withoutEnlargement: true });
  // Lossless: flat brand colours must match logo_bg exactly (lossy WebP shifted navy by 1 unit and showed a box).
  const webp = await base.clone().webp({ lossless: true }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(path.join(GEN_DIR, "projects", `${p.id}.webp`), webp.data);
  await base.clone().png({ compressionLevel: 9 }).toFile(path.join(GEN_DIR, "projects", `${p.id}.png`));
  manifest.projectLogos[p.id] = {
    webp: `/assets/generated/projects/${p.id}.webp`,
    png: `/assets/generated/projects/${p.id}.png`,
    width: webp.info.width,
    height: webp.info.height,
  };
}

fs.writeFileSync(path.join(GEN_DIR, "images.json"), JSON.stringify(manifest, null, 2));
console.log(`[assets] generated OG image, icons, photo sizes: ${Object.keys(manifest).filter((k) => k !== "og").join(", ") || "none"}` +
  (created.length ? `; new placeholders: ${created.join(", ")}` : ""));
