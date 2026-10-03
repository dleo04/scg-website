// Downloads employer logos listed in data/logo-sources.json into assets/logos/
// (one-time step; the files are committed so builds never depend on the old host).
//   npm run logos
// Each file is named by slug (e.g. ey.png), checked to be an image, and measured.
// Failures are reported and that company stays a text chip on the site.
// assets/logos/logos.json records the result and is read by the build.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, readJson } from "../lib/load-data.js";

const OUT = path.join(ROOT, "assets/logos");
fs.mkdirSync(OUT, { recursive: true });
const { base, logos } = readJson("logo-sources.json");
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "image/gif": "gif" };

const results = [];
for (const logo of logos) {
  const url = base + logo.file;
  const entry = { name: logo.name, slug: slug(logo.name), source: url, ok: false };
  try {
    const res = await fetch(url, { redirect: "follow" });
    const type = (res.headers.get("content-type") || "").split(";")[0].trim();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!type.startsWith("image/")) throw new Error(`not an image (content-type: ${type || "none"})`);
    const buf = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buf).metadata(); // also proves the bytes are a real image
    const ext = EXT[type] || meta.format;
    const file = `${entry.slug}.${ext}`;
    fs.writeFileSync(path.join(OUT, file), buf);
    Object.assign(entry, { ok: true, file: `assets/logos/${file}`, width: meta.width, height: meta.height, type, bytes: buf.length });
  } catch (err) {
    entry.error = err.message;
  }
  results.push(entry);
}

fs.writeFileSync(path.join(OUT, "logos.json"), JSON.stringify(results, null, 2) + "\n");
for (const r of results) {
  console.log(r.ok
    ? `  ok    ${r.name.padEnd(26)} ${r.file}  ${r.width}x${r.height}  ${(r.bytes / 1024).toFixed(1)} KB`
    : `  FAIL  ${r.name.padEnd(26)} ${r.error}  (${r.source})`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n[logos] ${results.length - failed.length}/${results.length} downloaded${failed.length ? `; failed (shown as text chips): ${failed.map((f) => f.name).join(", ")}` : ""}.`);
