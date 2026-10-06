// Contact sheet for checking headshot framing by eye:
//   npm run headshots:sheet  →  scratch/reports/headshot-contact-sheet.png (git-ignored)
// Every person's square card crop and 4:5 portrait crop (from npm run assets), with a centre
// crosshair (red) and the face-centre line (gold, dashed, at FACE_Y). Detection failures and hand
// overrides are marked in the label.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, readJson } from "../lib/load-data.js";
import { FACE_Y } from "../lib/headshots.mjs";

const GEN = path.join(ROOT, "assets/generated/people");
const OUT = path.join(ROOT, "scratch/reports");
fs.mkdirSync(OUT, { recursive: true });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const people = [...(readJson("team.json").members || []), ...(readJson("alumni.json").alumni || [])]
  .filter((p) => fs.existsSync(path.join(GEN, `${p.id}.webp`)));

const SQ = 200, PW = 160, PH = 200, GAP = 8, LABEL = 34, COLS = 6;
const cellW = SQ + GAP + PW, cellH = SQ + LABEL;
const rows = Math.ceil(people.length / COLS);
const W = COLS * cellW + (COLS + 1) * 16, H = rows * cellH + (rows + 1) * 16;
const guides = (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h}" stroke="#AE1218" stroke-width="1.5"/>
  <line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="#AE1218" stroke-width="1.5"/>
  <line x1="0" y1="${h * FACE_Y}" x2="${w}" y2="${h * FACE_Y}" stroke="#F8A81E" stroke-width="1.5" stroke-dasharray="5 4"/>
</svg>`);
const layers = [];
for (const [i, p] of people.entries()) {
  const x = 16 + (i % COLS) * (cellW + 16), y = 16 + Math.floor(i / COLS) * (cellH + 16);
  const sq = await sharp(path.join(GEN, `${p.id}.webp`)).resize(SQ, SQ).composite([{ input: guides(SQ, SQ) }]).png().toBuffer();
  const pt = await sharp(path.join(GEN, `${p.id}-portrait.webp`)).resize(PW, PH).composite([{ input: guides(PW, PH) }]).png().toBuffer();
  const flag = p.photo?.focal_override ? " (override)" : p.photo?.detect_failed ? " (NO FACE)" : "";
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="${LABEL}"><text x="0" y="22" font-family="Helvetica, Arial" font-size="15" font-weight="700" fill="${flag.includes("NO") ? "#AE1218" : "#141414"}">${esc(p.name + flag)}</text></svg>`);
  layers.push({ input: sq, left: x, top: y }, { input: pt, left: x + SQ + GAP, top: y }, { input: label, left: x, top: y + SQ });
}
const file = path.join(OUT, "headshot-contact-sheet.png");
await sharp({ create: { width: W, height: H, channels: 3, background: "#FFFFFF" } }).composite(layers).png().toFile(file);
console.log(`[contact-sheet] ${people.length} people → ${path.relative(ROOT, file)}`);
