// Browser checks against the built site (_site/). Needs a local Chrome.
//   npm run build && npm run ui-check [-- outDir]
// For every route at 360/768/1280px: full-page screenshot, horizontal-overflow
// check, axe-core WCAG 2.2 AA scan, console errors and failed requests.
// Then keyboard checks: skip link, mobile menu, dropdown, tabs.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import puppeteer from "puppeteer-core";
import { ROOT } from "../lib/load-data.js";

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const OUT = path.resolve(process.argv[2] || path.join(ROOT, ".ui-check"));
const SITE = path.join(ROOT, "_site");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const VIEWPORTS = [360, 768, 1280];
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(SITE, p);
  if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || (p.endsWith("webmanifest") ? TYPES[".webmanifest"] : "application/octet-stream") });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

const routes = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name === "index.html") routes.push("/" + path.relative(SITE, dir).replace(/\\/g, "/") + (dir === SITE ? "" : "/"));
  }
})(SITE);
routes.sort();

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const report = { failures: [], notes: [] };
const fail = (m) => report.failures.push(m);

for (const route of routes) {
  for (const width of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900 });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("requestfailed", (r) => errors.push(`request failed ${r.url()}`));
    page.on("response", (r) => r.status() >= 400 && r.url().startsWith(BASE) && errors.push(`${r.status()} ${r.url()}`));
    await page.goto(BASE + route, { waitUntil: "networkidle0" });
    // Trigger reveal-on-scroll, then return to top.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
    await new Promise((r) => setTimeout(r, 700));

    const overflow = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll("body *")].filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.right > w + 1; })
        .slice(0, 5).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} right=${Math.round(el.getBoundingClientRect().right)}`);
      return { scroll: document.documentElement.scrollWidth > w, wide };
    });
    if (overflow.scroll || overflow.wide.length) fail(`${route} @${width}: horizontal overflow ${overflow.wide.join(", ")}`);
    errors.forEach((e) => fail(`${route} @${width}: ${e}`));

    if (width !== 768) {
      await page.addScriptTag({ content: AXE });
      const axe = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
        return { violations: r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`), incomplete: r.incomplete.filter((v) => v.id === "color-contrast").map((v) => v.nodes.length) };
      });
      axe.violations.forEach((v) => fail(`${route} @${width} axe: ${v}`));
    }
    const name = (route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\//g, "_")) + `-${width}.png`;
    await page.screenshot({ path: path.join(OUT, name), fullPage: true });
    await page.close();
  }
}

// ---- Keyboard checks --------------------------------------------------------
async function keyboard(width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  const active = () => page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { text: (el.innerText || el.getAttribute("aria-label") || el.alt || el.querySelector("img")?.alt || "").trim().slice(0, 40), tag: el.tagName, outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 };
  });

  await page.keyboard.press("Tab");
  const skip = await active();
  if (!/skip/i.test(skip.text)) fail(`@${width} first Tab is not the skip link (got "${skip.text}")`);
  await page.keyboard.press("Enter");
  const afterSkip = await page.evaluate(() => document.activeElement.id);
  if (afterSkip !== "main") fail(`@${width} skip link did not move focus to <main> (got "${afterSkip}")`);

  // Walk the whole page by Tab; every stop must show a visible focus ring.
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  const stops = [];
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press("Tab");
    const a = await active();
    if (a.tag === "BODY") break;
    stops.push(a);
    const pseudoRing = await page.evaluate(() => getComputedStyle(document.activeElement, "::after").outlineStyle !== "none");
    if (!a.outline && !pseudoRing) fail(`@${width} focus not visible on <${a.tag}> "${a.text}"`);
  }
  report.notes.push(`@${width} tab order (${stops.length} stops): ${stops.slice(0, 14).map((s) => s.text || s.tag).join(" → ")} …`);

  if (width < 1024) {
    await page.goto(BASE + "/", { waitUntil: "networkidle0" });
    await page.focus(".nav-toggle");
    await page.keyboard.press("Enter");
    const open = await page.evaluate(() => document.querySelector(".nav-toggle").getAttribute("aria-expanded") === "true" && getComputedStyle(document.getElementById("nav-menu")).display !== "none");
    if (!open) fail(`@${width} mobile menu did not open with Enter`);
    await page.keyboard.press("Tab");
    const first = await active();
    if (first.text !== "Projects") fail(`@${width} first item after menu toggle is "${first.text}", expected "Projects"`);
    await page.keyboard.press("Escape");
    const closed = await page.evaluate(() => document.querySelector(".nav-toggle").getAttribute("aria-expanded") === "false" && document.activeElement.classList.contains("nav-toggle"));
    if (!closed) fail(`@${width} Escape did not close the menu and return focus to the toggle`);
  }

  // Dropdown: open with Enter, Escape closes and returns focus.
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  if (width < 1024) { await page.click(".nav-toggle"); }
  await page.focus(".nav-group__toggle");
  await page.keyboard.press("Enter");
  const subOpen = await page.evaluate(() => getComputedStyle(document.getElementById("nav-who")).display !== "none");
  if (!subOpen) fail(`@${width} "Who We Are" did not open with Enter`);
  await page.keyboard.press("Tab");
  if ((await active()).text !== "About") fail(`@${width} first dropdown item is not "About"`);
  await page.keyboard.press("Escape");
  const subClosed = await page.evaluate(() => document.activeElement.classList.contains("nav-group__toggle") && document.querySelector(".nav-group__toggle").getAttribute("aria-expanded") === "false");
  if (!subClosed) fail(`@${width} Escape did not close "Who We Are" and return focus`);

  // Tabs: arrow keys move selection and focus; only one tab stop.
  await page.focus("[role=tab][aria-selected=true]");
  await page.keyboard.press("ArrowRight");
  const tabState = await page.evaluate(() => ({
    focused: document.activeElement.textContent.trim(),
    selected: document.querySelector("[role=tab][aria-selected=true]").textContent.trim(),
    visiblePanels: [...document.querySelectorAll("[role=tabpanel]")].filter((p) => !p.hidden).length,
    tabStops: [...document.querySelectorAll("[role=tab]")].filter((t) => t.tabIndex === 0).length,
  }));
  if (tabState.focused !== tabState.selected || tabState.visiblePanels !== 1 || tabState.tabStops !== 1) fail(`@${width} tabs: ${JSON.stringify(tabState)}`);
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowRight");
  const wrapped = await page.evaluate(() => document.activeElement.textContent.trim());
  report.notes.push(`@${width} tabs: ArrowRight → "${tabState.selected}", End+ArrowRight wraps to "${wrapped}"`);
  await page.close();
}
for (const w of VIEWPORTS) await keyboard(w);

// No-JS: all tracks visible and nav reachable.
{
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 360, height: 900 });
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  const s = await page.evaluate(() => ({
    panels: [...document.querySelectorAll(".tracks__panel")].filter((p) => p.offsetHeight > 0).length,
    navVisible: document.querySelector('.nav-menu a[href="/projects/"]').offsetHeight > 0,
  }));
  if (s.panels !== 4 || !s.navVisible) fail(`no-JS @360: ${JSON.stringify(s)}`);
  await page.screenshot({ path: path.join(OUT, "home-nojs-360.png"), fullPage: true });
  await page.close();
}

await browser.close();
server.close();
console.log(report.notes.map((n) => `  · ${n}`).join("\n"));
if (report.failures.length) {
  console.error(`\n[ui-check] ${report.failures.length} failure(s):\n  - ${report.failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(`\n[ui-check] OK: ${routes.length} routes × ${VIEWPORTS.length} widths, axe clean, keyboard checks passed. Screenshots in ${OUT}`);
