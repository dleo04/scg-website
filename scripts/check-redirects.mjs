// Verifies the redirect stubs for the old site (data/redirects.json → src/redirects.njk) in the
// built output (_site, or SITE_DIR=<folder>):
//   - every stub exists at <from>/index.html and is a stub (never a real page: a real route at
//     an old path would mean the redirect overwrote it, or Eleventy refused to build),
//   - every target resolves to a built page (<to>index.html),
//   - no stub is listed in sitemap.xml.
// Run by `npm run build`. Exits non-zero on any problem.
import fs from "node:fs";
import path from "node:path";
import { loadData, ROOT } from "../lib/load-data.js";

const SITE = path.join(ROOT, process.env.SITE_DIR || "_site");
const { redirects = [] } = loadData();
const sitemap = fs.existsSync(path.join(SITE, "sitemap.xml")) ? fs.readFileSync(path.join(SITE, "sitemap.xml"), "utf8") : "";
// Sitemap URLs as site paths (path prefix removed), e.g. "/about/".
const prefix = (process.env.PATH_PREFIX || "").replace(/\/+$/, "");
const sitemapPaths = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
  const p = new URL(m[1]).pathname;
  return prefix && p.startsWith(prefix + "/") ? p.slice(prefix.length) : p;
}));
const problems = [];
for (const r of redirects) {
  const stub = path.join(SITE, r.from, "index.html");
  if (!fs.existsSync(stub)) problems.push(`${r.from}: no stub was built`);
  else if (!fs.readFileSync(stub, "utf8").includes("This page has moved")) problems.push(`${r.from}: collides with a real page (the stub is missing)`);
  if (!fs.existsSync(path.join(SITE, r.to, "index.html"))) problems.push(`${r.from} → ${r.to}: target page does not exist`);
  if (sitemapPaths.has(`${r.from}/`)) problems.push(`${r.from}: listed in sitemap.xml`);
}
if (problems.length) {
  console.error(`[check:redirects] FAILED:\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
console.log(`[check:redirects] OK: ${redirects.length} redirects, every target exists, none in the sitemap.`);
