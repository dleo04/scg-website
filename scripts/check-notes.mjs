// Fails if any built page still contains a development note.
//   npm run check:notes        (also runs as part of npm run build / build:prod)
// Scans every _site/**/*.html (the full source a visitor receives: text, attributes, alt
// text and inline scripts) for these case-insensitive patterns. With SHOW_PLACEHOLDERS=1
// (npm run dev:notes) the notes are expected, so the check is skipped with a message.
import fs from "node:fs";
import path from "node:path";
import { ROOT, getEnv } from "../lib/load-data.js";

const OUT = path.join(ROOT, process.env.SITE_DIR || "_site");
const PATTERNS = ["TBD", "TODO", "placeholder", "PHOTO:", "not supplied", "Stand-in", "lorem ipsum", "data/"];

if (getEnv().showPlaceholders) {
  console.log("[check:notes] skipped: SHOW_PLACEHOLDERS=1 renders dev notes on purpose (never used for production).");
  process.exit(0);
}

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith(".html")) pages.push(full);
  }
})(OUT);

const hits = [];
for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const route = "/" + path.relative(OUT, file).replace(/index\.html$/, "").replace(/\\/g, "/");
  for (const pat of PATTERNS) {
    const re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"), "gi");
    let m;
    while ((m = re.exec(html))) {
      const context = html.slice(Math.max(0, m.index - 40), m.index + pat.length + 40).replace(/\s+/g, " ");
      hits.push(`${route}  "${pat}"  …${context}…`);
    }
  }
}

if (hits.length) {
  console.error(`[check:notes] FAILED: ${hits.length} development note(s) in ${pages.length} pages:\n  - ${hits.join("\n  - ")}`);
  process.exit(1);
}
console.log(`[check:notes] OK: ${pages.length} pages, none of ${PATTERNS.map((p) => `"${p}"`).join(", ")}.`);
