// Downloads employer logos listed in data/logo-sources.json (one-time step; the
// files are committed so builds never depend on the old host).
//   npm run logos
// For each logo:
//  - checks the response is an image (content type + the bytes decode),
//  - keeps the untouched download in assets/logos/originals/,
//  - trims blank margins (transparent or near-white only; logos on a colored
//    tile are left as is) and saves assets/logos/<slug>.png,
//  - records sizes in assets/logos/logos.json, which the build reads.
// Failures are reported and that company stays a text chip on the site.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, readJson } from "../lib/load-data.js";

const OUT = path.join(ROOT, "assets/logos");
const ORIG = path.join(OUT, "originals");
// Only clear what this script manages (originals/, its <slug>.png files and logos.json);
// other files in assets/logos/ (e.g. the project/client logos) are left alone.
fs.mkdirSync(ORIG, { recursive: true });
const previous = fs.existsSync(path.join(OUT, "logos.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "logos.json"), "utf8")) : [];
for (const old of previous) {
  for (const f of [old.file, old.original].filter(Boolean)) fs.rmSync(path.join(ROOT, f), { force: true });
}

const { base, logos } = readJson("logo-sources.json");
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

// Trim only margins that are transparent or near-white (judged from the corner pixel).
async function trimBlank(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [r, g, b, a] = data.subarray(0, 4);
  const transparent = a < 16;
  const nearWhite = r > 235 && g > 235 && b > 235;
  if (!transparent && !nearWhite) return { buf: await sharp(buf).png().toBuffer(), trimmed: false, margin: "colored (not trimmed)" };
  const out = await sharp(buf)
    .trim({ background: transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : "#ffffff", threshold: transparent ? 1 : 64 })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { buf: out.data, trimmed: true, margin: transparent ? "transparent" : "white", from: `${info.width}x${info.height}` };
}

const results = [];
for (const logo of logos) {
  const url = base + logo.file;
  const entry = { name: logo.name, slug: slug(logo.name), source: url, ok: false };
  try {
    const res = await fetch(url, { redirect: "follow" });
    const type = (res.headers.get("content-type") || "").split(";")[0].trim();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!type.startsWith("image/")) throw new Error(`not an image (content-type: ${type || "none"})`);
    const raw = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(raw).metadata(); // throws if the bytes are not a real image
    const original = `originals/${entry.slug}.${EXT[type] || meta.format}`;
    fs.writeFileSync(path.join(OUT, original), raw);
    const t = await trimBlank(raw);
    const file = `${entry.slug}.png`;
    fs.writeFileSync(path.join(OUT, file), t.buf);
    const tm = await sharp(t.buf).metadata();
    Object.assign(entry, {
      ok: true,
      file: `assets/logos/${file}`,
      original: `assets/logos/${original}`,
      width: tm.width,
      height: tm.height,
      originalSize: `${meta.width}x${meta.height}`,
      margin: t.margin,
      type,
    });
  } catch (err) {
    entry.error = err.message;
  }
  results.push(entry);
}

fs.writeFileSync(path.join(OUT, "logos.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(r.ok
    ? `  ok    ${r.name.padEnd(26)} ${r.originalSize.padStart(9)} → ${`${r.width}x${r.height}`.padEnd(9)} margin: ${r.margin}`
    : `  FAIL  ${r.name.padEnd(26)} ${r.error}  (${r.source})`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n[logos] ${results.length - failed.length}/${results.length} downloaded${failed.length ? `; failed (shown as text chips): ${failed.map((f) => f.name).join(", ")}` : ""}.`);
