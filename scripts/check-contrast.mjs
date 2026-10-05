// Verifies every text/background color pairing used on the site against WCAG 2.2 AA,
// and measures the hero overlay against the actual hero photo (worst pixel).
// Colors are read from src/css/main.css tokens, so a token change is re-checked.
//   npm run contrast
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, readJson } from "../lib/load-data.js";

const css = fs.readFileSync(path.join(ROOT, "src/css/main.css"), "utf8");
const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`token --${name} not found`);
  return m[1].trim();
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (top, alpha, under) => top.map((c, i) => alpha * c + (1 - alpha) * under[i]);

const C = Object.fromEntries(["scg-red", "scg-red-dark", "scg-gold", "scg-gold-dark", "scg-gold-soft", "ink", "ink-2", "paper", "paper-2", "line", "on-ink", "on-ink-2", "ph-bg", "ph-border", "line-ink"].map((n) => [n, hex(token(n))]));

// [foreground, background, minimum, where]
const pairs = [
  ["ink", "paper", 4.5, "body text"],
  ["ink-2", "paper", 4.5, "secondary text"],
  ["ink-2", "paper-2", 4.5, "secondary text on warm sections / employer card"],
  ["scg-red", "paper", 4.5, "links, accent words, stat numbers, card titles"],
  ["scg-red", "paper-2", 4.5, "employer card title"],
  ["scg-red-dark", "paper", 4.5, "link hover"],
  ["paper", "scg-red", 4.5, "primary button / icon circles"],
  ["paper", "scg-red-dark", 4.5, "primary button hover"],
  ["ink", "scg-gold", 4.5, "gold button / header Join SCG over hero"],
  ["ink", "scg-gold-soft", 4.5, "[TBD] highlight, gold chips, gold button hover on dark bands"],
  ["ink", "scg-gold-dark", 4.5, "header Join SCG hover"],
  ["ink", "paper", 4.5, "header nav links, menu button, social icons"],
  ["scg-red", "paper", 4.5, "header nav hover / current page"],
  ["scg-gold", "ink", 4.5, "accent word 'Work', eyebrows on dark"],
  ["on-ink", "ink", 4.5, "text on dark bands"],
  ["on-ink-2", "ink", 4.5, "secondary text on dark bands / footer tagline, note, copyright"],
  ["on-ink", "ink", 4.5, "footer links and affiliation line"],
  ["scg-gold", "ink", 4.5, "footer link hover"],
  ["ink", "ph-bg", 4.5, "placeholder labels"],
  ["ink-2", "ph-bg", 4.5, "placeholder image labels"],
  ["ph-border", "ink", 3, "carousel dots (non-text)"],
  ["scg-gold", "ink", 3, "focus ring on dark (non-text)"],
  ["scg-red", "paper", 3, "focus ring on light (non-text)"],
  // Stage 3A (About, Join, Prepare)
  ["scg-red", "paper-2", 4.5, "story years, FAQ group titles, resource kinds on warm sections"],
  ["on-ink-2", "ink", 4.5, "pillar details, status card notes, timer hint"],
  ["on-ink-2", "panel-dark", 4.5, "recruiting calendar step text (#1E1E1E panel)"],
  ["scg-gold", "panel-dark", 4.5, "recruiting calendar step count"],
  ["on-ink", "panel-dark", 4.5, "recruiting calendar step title"],
  ["ink", "scg-gold", 4.5, "'Happening now' pill, timer and status buttons, selected calendar step"],
  ["placeholder-text", "paper", 4.5, "matcher input placeholder"],
  ["on-ink", "caption-wash", 4.5, "photo caption chip (78% ink over a white pixel, worst case)"],
  ["ph-border", "ink", 3, "calendar step circle borders (non-text)"],
  ["ink-2", "paper", 3, "matcher field, chip and search borders (non-text)"],
];
C["panel-dark"] = hex("#1E1E1E");
C["placeholder-text"] = hex("#6B6760");
C["caption-wash"] = mix(C.ink, 0.78, [255, 255, 255]);

const failures = [];
const rows = [];
for (const [fg, bg, min, where] of pairs) {
  const r = ratio(C[fg], C[bg]);
  rows.push(`${r.toFixed(2).padStart(6)}:1  ${fg} on ${bg}  (${where})`);
  if (r < min) failures.push(`${fg} on ${bg}: ${r.toFixed(2)}:1 < ${min}:1 (${where})`);
}

// Stat numbers sit on a white wash (86% white) over the photo; worst case is a black pixel.
const wash = mix(C.paper, 0.86, [0, 0, 0]);
const washRatio = ratio(C["scg-red"], wash);
rows.push(`${washRatio.toFixed(2).padStart(6)}:1  scg-red on 86% white wash over black (stat strip, worst case)`);
if (washRatio < 4.5) failures.push(`stat numbers on wash: ${washRatio.toFixed(2)}:1`);

// Hero: white text over the photo + flat --hero-tint, worst (brightest) pixel of the real image.
const tintMatch = token("hero-tint").match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)[\s,/]+([\d.]+)\s*\)/);
if (!tintMatch) throw new Error("--hero-tint must be an rgba() color");
const tint = tintMatch.slice(1, 4).map(Number);
const tintA = parseFloat(tintMatch[4]);
const heroSrc = readJson("site.json").images?.hero;
let brightestBg = null;
if (heroSrc && fs.existsSync(path.join(ROOT, heroSrc))) {
  const { data, info } = await sharp(path.join(ROOT, heroSrc)).resize(600).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let worst = Infinity;
  for (let i = 0; i < data.length; i += info.channels) {
    const bg = mix(tint, tintA, [data[i], data[i + 1], data[i + 2]]);
    const r = ratio(C["on-ink"], bg);
    if (r < worst) { worst = r; brightestBg = bg; }
  }
  rows.push(`${worst.toFixed(2).padStart(6)}:1  white text on hero photo + tint ${token("hero-tint")} (brightest pixel of ${heroSrc})`);
  if (worst < 4.5) failures.push(`hero tint: white text only ${worst.toFixed(2)}:1 on the brightest pixel. Darken --hero-tint.`);
}

// Reversed logo (if supplied): its white and gold parts against that same worst-case background.
const reversed = path.join(ROOT, "assets/scg-logo-reversed.png");
if (brightestBg && fs.existsSync(reversed)) {
  const { data, info } = await sharp(reversed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const groups = { white: [], gold: [], other: [] };
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue; // ignore anti-aliased edges and transparency
    const px = [data[i], data[i + 1], data[i + 2]];
// White = near pure white; gold = within 45 of brand gold #F8A81E. Blended edge pixels are "other" (reported, not judged).
    const near = (c, t) => Math.hypot(c[0] - t[0], c[1] - t[1], c[2] - t[2]) < 45;
    const group = px.every((c) => c > 225) ? "white" : near(px, [248, 168, 30]) ? "gold" : "other";
    groups[group].push(px);
  }
  for (const [name, pxs] of Object.entries(groups)) {
    if (!pxs.length) continue;
    const worst = Math.min(...pxs.filter((_, i) => i % 7 === 0).map((px) => ratio(px, brightestBg)));
    if (name === "other") { rows.push(`     –    reversed logo: ${pxs.length} blended/edge px not judged`); continue; }
    rows.push(`${worst.toFixed(2).padStart(6)}:1  reversed logo ${name} parts (${pxs.length} px) on brightest tinted pixel`);
    if (worst < 3) failures.push(`reversed logo ${name} parts: ${worst.toFixed(2)}:1 < 3:1`);
  }
}
// Footer: the reversed logo sits directly on --ink.
if (fs.existsSync(reversed)) {
  const { data } = await sharp(reversed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const worst = { white: Infinity, gold: Infinity };
  for (let i = 0; i < data.length; i += 4 * 5) {
    if (data[i + 3] < 200) continue;
    const px = [data[i], data[i + 1], data[i + 2]];
    const near = (c, t) => Math.hypot(c[0] - t[0], c[1] - t[1], c[2] - t[2]) < 45;
    const g = px.every((c) => c > 225) ? "white" : near(px, [248, 168, 30]) ? "gold" : null;
    if (g) worst[g] = Math.min(worst[g], ratio(px, C.ink));
  }
  for (const [g, r] of Object.entries(worst)) {
    if (r === Infinity) continue;
    rows.push(`${r.toFixed(2).padStart(6)}:1  footer reversed logo ${g} parts on ink`);
    if (r < 3) failures.push(`footer logo ${g} on ink: ${r.toFixed(2)}:1 < 3:1`);
  }
}

console.log(rows.join("\n"));
if (failures.length) {
  console.error(`\n[contrast] FAILED:\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(`\n[contrast] OK: ${rows.length} pairings meet WCAG 2.2 AA.`);
