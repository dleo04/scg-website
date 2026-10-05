// Measures text contrast on the inner-page photo banners (components/page-banner.njk) in a
// real browser at 360/768/1280/1440px, using the actual pixels behind each element: the
// banner's text (and the /join/ status card's text) is made transparent, the tinted photo is
// screenshotted, and the brightest background pixel inside each element's box is compared
// with the element's colour. Large text (≥24px, or ≥18.66px bold) needs 3:1, the rest 4.5:1.
//   npm run build && npm run banner-contrast
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import sharp from "sharp";
import puppeteer from "puppeteer-core";
import { ROOT } from "../lib/load-data.js";

const SITE = path.join(ROOT, "_site");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(SITE, p);
  if (!f.startsWith(SITE) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Every built page that has a banner.
const routes = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name === "index.html" && fs.readFileSync(full, "utf8").includes('class="page-banner')) routes.push("/" + path.relative(SITE, dir).replace(/\\/g, "/") + "/");
  }
})(SITE);
routes.sort();

const SELECTORS = [
  [".page-banner .breadcrumbs a", "breadcrumb link"],
  [".page-banner .breadcrumbs li[aria-current]", "breadcrumb"],
  [".page-banner__eyebrow", "eyebrow"],
  [".page-banner__title", "title"],
  [".page-banner__lede", "intro"],
  [".page-banner .status-card__label", "card label"],
  [".page-banner .status-card__text", "card status"],
  [".page-banner .status-card__note", "card note"],
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const rows = [];
let worstFail = null;
for (const route of routes) {
  for (const width of [360, 768, 1280, 1440]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE + route, { waitUntil: "networkidle0" });
    await page.evaluateHandle("document.fonts.ready");
    const info = await page.evaluate((sels) => {
      const rgb = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
      return sels.flatMap(([sel, label]) => [...document.querySelectorAll(sel)].map((el) => {
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
        return { label, color: rgb(cs.color), size, large: size >= 24 || (bold && size >= 18.66), box: { x: Math.max(0, r.left), y: r.top + scrollY, w: Math.min(r.width, innerWidth - r.left), h: r.height } };
      }));
    }, SELECTORS);
    // Hide all banner text (and the gold CTA, which is not text over the photo) and capture.
    await page.addStyleTag({ content: ".page-banner, .page-banner *, .page-banner *::before, .page-banner *::after { color: transparent !important; text-decoration-color: transparent !important; } .page-banner .btn, .page-banner .status-dot { visibility: hidden !important; }" });
    const banner = await page.$(".page-banner");
    const bb = await banner.boundingBox();
    const shot = await page.screenshot({ clip: { x: 0, y: bb.y, width, height: bb.height } });
    const { data, info: im } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const el of info) {
      let brightest = null, bl = -1;
      const y0 = Math.max(0, Math.floor(el.box.y - bb.y)), y1 = Math.min(im.height, Math.ceil(el.box.y - bb.y + el.box.h));
      const x0 = Math.floor(el.box.x), x1 = Math.min(im.width, Math.ceil(el.box.x + el.box.w));
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * im.width + x) * 3; const px = [data[i], data[i + 1], data[i + 2]]; const l = lum(px);
        if (l > bl) { bl = l; brightest = px; }
      }
      if (!brightest) continue;
      const r = ratio(el.color, brightest), min = el.large ? 3 : 4.5;
      rows.push({ route, width, label: el.label, r, min });
      if (r < min && (!worstFail || r < worstFail.r)) worstFail = { route, width, label: el.label, r, min };
    }
    await page.close();
  }
}
await browser.close();
server.close();

// Report: worst ratio per page and element across the four widths.
const byKey = new Map();
for (const row of rows) {
  const k = `${row.route}|${row.label}`;
  const prev = byKey.get(k);
  if (!prev || row.r < prev.r) byKey.set(k, row);
}
for (const row of byKey.values()) {
  const all = rows.filter((x) => x.route === row.route && x.label === row.label).map((x) => `${x.width}:${x.r.toFixed(2)}`).join("  ");
  console.log(`${row.r >= row.min ? "ok  " : "FAIL"} ${row.route.padEnd(16)} ${row.label.padEnd(16)} worst ${row.r.toFixed(2)}:1 (needs ${row.min}:1)   ${all}`);
}
if (worstFail) {
  console.error(`[banner-contrast] FAILED: ${worstFail.route} ${worstFail.label} @${worstFail.width}px ${worstFail.r.toFixed(2)}:1 < ${worstFail.min}:1`);
  process.exit(1);
}
console.log(`[banner-contrast] OK: ${routes.length} pages × 4 widths, every banner text element meets WCAG 2.2 AA over its brightest background pixel.`);
