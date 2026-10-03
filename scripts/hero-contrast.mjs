// Measures hero contrast in a real browser at 360/768/1280/1440px, using the actual
// pixels behind each element: the hero text and logo are hidden, the tinted photo
// is screenshotted, and the brightest background pixel inside each element's box is
// compared with the element's color (white text; white/gold logo parts).
//   npm run build && npm run hero-contrast
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import sharp from "sharp";
import puppeteer from "puppeteer-core";
import { ROOT } from "../lib/load-data.js";

const SITE = path.join(ROOT, "_site");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(SITE, p);
  if (!f.startsWith(SITE) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Logo part colors (white / gold) from the supplied file, if any.
const logoFile = path.join(ROOT, "assets/scg-logo-reversed.png");
const logoParts = {};
if (fs.existsSync(logoFile)) {
  const { data } = await sharp(logoFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const px = [data[i], data[i + 1], data[i + 2]];
// White = near pure white; gold = within 45 of brand gold #F8A81E. Blended edge pixels are "other" (reported, not judged).
    const near = (c, t) => Math.hypot(c[0] - t[0], c[1] - t[1], c[2] - t[2]) < 45;
    const g = px.every((c) => c > 225) ? "white" : near(px, [248, 168, 30]) ? "gold" : "other";
    // keep the lowest-luminance color of each group (worst case against a light background)
    if (!logoParts[g] || lum(px) < lum(logoParts[g])) logoParts[g] = px;
  }
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const failures = [];
const lines = [];
for (const [width, height] of [[360, 780], [768, 1024], [1280, 800], [1440, 900]]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${server.address().port}/`, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  const boxes = await page.evaluate(() => {
    const pick = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    return { h1: pick(".hero__title"), subhead: pick(".hero__lede"), ey: pick(".hero__partner"), logo: pick("img[data-hero-logo]") };
  });
  await page.addStyleTag({ content: ".hero__inner, .standin-tag, .site-header { visibility: hidden !important; }" });
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width, height } });
  const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const brightest = (b) => {
    let best = null, bestL = -1;
    for (let y = Math.max(0, Math.floor(b.y)); y < Math.min(info.height, Math.ceil(b.y + b.h)); y++) {
      for (let x = Math.max(0, Math.floor(b.x)); x < Math.min(info.width, Math.ceil(b.x + b.w)); x++) {
        const i = (y * info.width + x) * info.channels;
        const px = [data[i], data[i + 1], data[i + 2]];
        const L = lum(px);
        if (L > bestL) { bestL = L; best = px; }
      }
    }
    return best;
  };
  const row = [];
  for (const key of ["h1", "subhead", "ey"]) {
    if (!boxes[key]) continue;
    const r = ratio([255, 255, 255], brightest(boxes[key]));
    row.push(`${key} ${r.toFixed(2)}:1`);
    if (r < 4.5) failures.push(`@${width} ${key}: ${r.toFixed(2)}:1 < 4.5:1`);
  }
  if (boxes.logo && Object.keys(logoParts).length) {
    const bg = brightest(boxes.logo);
    for (const [g, px] of Object.entries(logoParts)) {
      if (g === "other") continue;
      const r = ratio(px, bg);
      row.push(`logo ${g} ${r.toFixed(2)}:1`);
      if (r < 3) failures.push(`@${width} logo ${g}: ${r.toFixed(2)}:1 < 3:1`);
    }
  } else {
    row.push(!fs.existsSync(logoFile) ? "logo: file not supplied" : !boxes.logo ? "logo: no <img data-hero-logo> on page (rebuild?)" : "logo: no white/gold pixels found");
  }
  lines.push(`${`${width}x${height}`.padStart(9)}  ${row.join("   ")}`);
  await page.close();
}
await browser.close();
server.close();
console.log(lines.join("\n"));
if (failures.length) { console.error(`\n[hero-contrast] FAILED:\n  - ${failures.join("\n  - ")}`); process.exit(1); }
console.log("\n[hero-contrast] OK (text ≥ 4.5:1, logo parts ≥ 3:1 against the brightest pixel behind each element).");
