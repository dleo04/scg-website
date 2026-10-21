// Removes copied source images that no built page uses, so they are never published:
//   _site/assets/photos/*          the old site's photos (each page uses generated variants;
//                                  a photo is kept only where a page links its full size)
//   _site/assets/placeholders/**   placeholder images (dev builds only)
//   _site/assets/placeholder-*.jpg stand-in photos (dev builds only)
// A file is kept if any built HTML, CSS, JS, JSON, XML or manifest file mentions its path, so
// nothing referenced can disappear. Runs after Eleventy in `npm run build` (SITE_DIR=<folder>
// to prune another output folder). Headshot originals (assets/photos/people/) are never copied
// in the first place.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../lib/load-data.js";

const SITE = path.join(ROOT, process.env.SITE_DIR || "_site");
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])) : []);

let text = "";
for (const f of walk(SITE)) {
  if (/\.(html|css|js|mjs|json|xml|webmanifest|txt)$/i.test(f)) text += fs.readFileSync(f, "utf8");
}
const candidates = [
  ...walk(path.join(SITE, "assets/photos")),
  ...walk(path.join(SITE, "assets/placeholders")),
  ...fs.readdirSync(path.join(SITE, "assets")).filter((f) => /^placeholder-.*\.(jpe?g|png|webp)$/i.test(f)).map((f) => path.join(SITE, "assets", f)),
];
let removed = 0, bytes = 0;
for (const f of candidates) {
  const url = "/" + path.relative(SITE, f).split(path.sep).join("/");
  if (text.includes(url)) continue;
  bytes += fs.statSync(f).size;
  fs.rmSync(f);
  removed++;
}
for (const dir of ["assets/photos", "assets/placeholders"].map((d) => path.join(SITE, d))) {
  // drop folders left empty
  for (const d of walk(dir).length ? [] : [dir]) if (fs.existsSync(d)) fs.rmSync(d, { recursive: true });
}
console.log(`[prune] removed ${removed} unreferenced source images (${(bytes / 1048576).toFixed(1)} MB) from ${path.relative(ROOT, SITE)}/assets.`);
