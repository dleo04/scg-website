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

const C = Object.fromEntries(["scg-red", "scg-red-dark", "scg-gold", "scg-gold-soft", "ink", "ink-2", "paper", "paper-2", "line", "on-ink", "on-ink-2", "ph-bg", "ph-border", "line-ink"].map((n) => [n, hex(token(n))]));

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
  ["ink", "scg-gold-soft", 4.5, "gold button hover, [TBD] highlight, gold chips"],
  ["scg-gold", "ink", 4.5, "accent word 'Work', eyebrows on dark"],
  ["on-ink", "ink", 4.5, "text on dark bands"],
  ["on-ink-2", "ink", 4.5, "secondary text on dark bands / footer"],
  ["ink", "ph-bg", 4.5, "placeholder labels"],
  ["ink-2", "ph-bg", 4.5, "placeholder image labels"],
  ["ph-border", "ink", 3, "carousel dots (non-text)"],
  ["scg-gold", "ink", 3, "focus ring on dark (non-text)"],
  ["scg-red", "paper", 3, "focus ring on light (non-text)"],
];

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

// Hero: white text over the photo + ink overlay, worst pixel of the real image.
const overlay = parseFloat(token("hero-overlay"));
const heroSrc = readJson("site.json").images?.hero;
if (heroSrc && fs.existsSync(path.join(ROOT, heroSrc))) {
  const { data, info } = await sharp(path.join(ROOT, heroSrc)).resize(600).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let worst = Infinity;
  for (let i = 0; i < data.length; i += info.channels) {
    worst = Math.min(worst, ratio(C["on-ink"], mix(C.ink, overlay, [data[i], data[i + 1], data[i + 2]])));
  }
  rows.push(`${worst.toFixed(2).padStart(6)}:1  white on hero photo + ${overlay} ink overlay (brightest pixel of ${heroSrc})`);
  if (worst < 4.5) failures.push(`hero overlay ${overlay}: white text only ${worst.toFixed(2)}:1 on the brightest pixel. Raise --hero-overlay.`);
}

console.log(rows.join("\n"));
if (failures.length) {
  console.error(`\n[contrast] FAILED:\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(`\n[contrast] OK: ${rows.length} pairings meet WCAG 2.2 AA.`);
