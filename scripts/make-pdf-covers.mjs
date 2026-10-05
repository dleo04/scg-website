// Cover thumbnails for the PDFs on /join/prepare/ (site.json → downloads).
// Runs as part of `npm run assets` (so dev and build), or alone: npm run pdf-covers
// For each listed PDF that exists: renders page 1 with PDF.js (pdfjs-dist + @napi-rs/canvas,
// no system installs), keeps the TOP of the page at 16:10, and writes a WebP about 640px
// wide (quality stepped down until it is under 60KB) to assets/pdf-covers/<slug>.webp, plus
// the page count to assets/pdf-covers/covers.json. The PDFs themselves are only read.
// A cover is regenerated only when its PDF changed (size + modified time).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ROOT, readJson } from "../lib/load-data.js";

const OUT = path.join(ROOT, "assets/pdf-covers");
const WIDTH = 640;
const LIMIT = 60 * 1024;
export const slugOf = (file) => path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

fs.mkdirSync(OUT, { recursive: true });
const manifestFile = path.join(OUT, "covers.json");
const old = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : {};
const manifest = {};
const site = readJson("site.json");

for (const d of site.downloads || []) {
  if (!d.file || !d.file.toLowerCase().endsWith(".pdf") || d.published === false) continue; // unpublished: no cover
  const src = path.join(ROOT, d.file);
  if (!fs.existsSync(src)) { console.warn(`  ! ${d.file} not found; no cover`); continue; }
  const slug = slugOf(d.file);
  const stat = fs.statSync(src);
  const stamp = `${stat.size}-${Math.round(stat.mtimeMs)}`;
  const outFile = path.join(OUT, `${slug}.webp`);
  if (old[d.file]?.stamp === stamp && fs.existsSync(outFile)) { manifest[d.file] = old[d.file]; continue; }

  const data = new Uint8Array(fs.readFileSync(src));
  const task = getDocument({ data, verbosity: 0, isEvalSupported: false, useSystemFonts: false });
  const pdf = await task.promise;
  const page = await pdf.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const scale = (WIDTH * 2) / base.width; // render at 2x, then downscale for crisp text
  const viewport = page.getViewport({ scale });
  const canvasAndContext = pdf.canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const { canvas, context } = canvasAndContext;
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, canvas, viewport }).promise;
  const png = canvas.toBuffer("image/png");
  const cropH = Math.min(canvas.height, Math.round((canvas.width * 10) / 16));
  let q = 80, buf;
  do {
    buf = await sharp(png).extract({ left: 0, top: 0, width: canvas.width, height: cropH }).resize({ width: WIDTH }).webp({ quality: q }).toBuffer();
    q -= 6;
  } while (buf.length > LIMIT && q > 30);
  fs.writeFileSync(outFile, buf);
  manifest[d.file] = { slug, src: `/assets/pdf-covers/${slug}.webp`, width: WIDTH, height: Math.round((WIDTH * 10) / 16), pages: pdf.numPages, kb: Math.round(buf.length / 1024), stamp };
  console.log(`  ${d.file} → assets/pdf-covers/${slug}.webp ${Math.round(buf.length / 1024)}KB, ${pdf.numPages} pages`);
  canvasAndContext.canvas.width = 0;
  await task.destroy();
}
// Remove covers of PDFs that are no longer listed.
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith(".webp") && !Object.values(manifest).some((m) => m.src.endsWith(`/${f}`))) fs.rmSync(path.join(OUT, f));
}
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log(`[pdf-covers] ${Object.keys(manifest).length} covers in assets/pdf-covers/`);
