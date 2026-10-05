// Imports real SCG photos from the old GoDaddy site.
//
//   npm run old-photos -- --scan   Parses reference/old-site/**/*.html for img1.wsimg.com
//                                  photos and downloads the ORIGINAL (largest) file of each
//                                  candidate into reference/old-site/_photo-candidates/
//                                  (git-ignored, never built) so a person can review them.
//   npm run old-photos             Optimizes the photos chosen in data/photos.json (by
//                                  "source", the old filename) into assets/photos/<id>.jpg:
//                                  at most 1600px on the long edge, JPEG, about 250KB or
//                                  less. Downloads the original first if it is not in the
//                                  candidates folder. Metadata (EXIF, including any GPS
//                                  location) is not copied.
//
// Skipped by --scan: logos, screenshots, "blob-*" graphics, favicons, PNG/WebP/SVG files
// (graphics and cut-out headshots on the old site), anything named "headshot", and images
// used only on the old alumni page (individual alumni portraits). Individual portraits are
// not imported here: people appear only through data/team.json and data/alumni.json with
// consent. Pictures that are mostly text are excluded by review, not automatically.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, readJson } from "../lib/load-data.js";

const OLD = path.join(ROOT, "reference/old-site");
const CANDIDATES = path.join(OLD, "_photo-candidates");
const OUT = path.join(ROOT, "assets/photos");
const HOST = "https://img1.wsimg.com/isteam/ip/";
const MAX_W = 1600;
const TARGET_BYTES = 250 * 1024;

if (!fs.existsSync(OLD)) {
  console.error("[old-photos] reference/old-site/ is missing. Unzip the old site export there first.");
  process.exit(1);
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name.startsWith("_") ? [] : htmlFiles(full);
    return e.name.endsWith(".html") && full.includes("sniderconsultinggroup.com") ? [full] : [];
  });
}

// { name → { site, pages:Set } } for every isteam image referenced by the old pages.
function scanReferences() {
  const found = new Map();
  for (const file of htmlFiles(OLD)) {
    const page = path.relative(OLD, file).split(path.sep)[0];
    const html = fs.readFileSync(file, "utf8");
    const re = /img1\.wsimg\.com\/isteam\/ip\/([0-9a-f-]{36})\/(.+?)(?=\/:\/|["'\s]|\)?["'\s,;]|$)/g;
    for (const m of html.matchAll(re)) {
      let name;
      try { name = decodeURIComponent(m[2]); } catch { continue; }
      if (name.includes("/") || !/\.(jpe?g|png|webp|svg)$/i.test(name)) continue;
      const entry = found.get(name) || { site: m[1], pages: new Set() };
      entry.pages.add(page);
      found.set(name, entry);
    }
  }
  return found;
}

const SKIP = /logo|screen ?shot|^blob-|favicon|headshot|lamp post|aerial/i;
function isCandidate(name, pages) {
  if (SKIP.test(name)) return false;
  if (!/\.jpe?g$/i.test(name)) return false;
  if ([...pages].every((p) => p === "alumni")) return false; // alumni profile portraits
  return true;
}

async function download(site, name, dest) {
  const res = await fetch(HOST + site + "/" + encodeURIComponent(name));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

const refs = scanReferences();

if (process.argv.includes("--scan")) {
  fs.mkdirSync(CANDIDATES, { recursive: true });
  let n = 0;
  for (const [name, { site, pages }] of refs) {
    if (!isCandidate(name, pages)) continue;
    const dest = path.join(CANDIDATES, name);
    if (!fs.existsSync(dest)) {
      try { await download(site, name, dest); } catch (e) { console.warn(`  ! ${name}: ${e.message}`); continue; }
    }
    const meta = await sharp(dest).metadata();
    console.log(`  ${name}  ${meta.width}x${meta.height}  (old pages: ${[...pages].join(", ")})`);
    n++;
  }
  console.log(`[old-photos] ${n} candidates in reference/old-site/_photo-candidates/ (review them; choose in data/photos.json).`);
  process.exit(0);
}

// Optimize the chosen photos.
const { photos } = readJson("photos.json");
fs.mkdirSync(OUT, { recursive: true });
for (const p of photos) {
  const ref = refs.get(p.source);
  const src = path.join(CANDIDATES, p.source);
  if (!fs.existsSync(src)) {
    if (!ref) { console.error(`  ! ${p.id}: "${p.source}" is not referenced by the old pages`); process.exitCode = 1; continue; }
    fs.mkdirSync(CANDIDATES, { recursive: true });
    await download(ref.site, p.source, src);
  }
  const dest = path.join(OUT, `${p.id}.jpg`);
  // Rotate per EXIF, cap the width, then step quality down until the file is ≤ ~250KB.
  let quality = 82, info, buf;
  do {
    ({ data: buf, info } = await sharp(src).rotate().resize({ width: MAX_W, height: MAX_W, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer({ resolveWithObject: true }));
    quality -= 6;
  } while (buf.length > TARGET_BYTES && quality >= 50);
  fs.writeFileSync(dest, buf);
  console.log(`  assets/photos/${p.id}.jpg  ${info.width}x${info.height}  ${Math.round(buf.length / 1024)}KB  q${quality + 6}  ← ${p.source}`);
}
console.log(`[old-photos] ${photos.length} photos written to assets/photos/.`);
