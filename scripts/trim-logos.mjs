// Makes trimmed copies of client logos so every tile scales the artwork, not empty margin.
//   npm run trim-logos -- assets/logos/debatelogo.jpg [more files...]
//   Append :<n> to raise the colour tolerance (default 40) for a textured background,
//   e.g. assets/logos/debatelogo.jpg:90.
// For each file: reads the dominant edge colour (or transparency), crops to the artwork's
// bounding box and writes <name>-trimmed.png next to the original (lossless; pixels are
// copied, never recolored or resized). The original is never modified. Prints the
// suggested logo_bg for projects.json:
//   - opaque background      → the dominant colour on the trimmed copy's edge (what touches
//                              the tile), so the tile has no visible box or seam
//   - transparent background → #F7F4EF (--paper-2) for dark-on-light artwork; light-on-dark
//                              artwork needs its brand colour, chosen by hand.
import path from "node:path";
import sharp from "sharp";
import { ROOT } from "../lib/load-data.js";
import { edgeColor, artworkBox } from "../lib/logo-tools.js";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: npm run trim-logos -- assets/logos/<file> [...]");
  process.exit(1);
}

for (const arg of files) {
  const [rel, tol] = arg.split(":");
  const src = path.join(ROOT, rel);
  const bg = await edgeColor(src);
  const box = await artworkBox(src, bg, tol ? { tolerance: Number(tol) } : {});
  const out = rel.replace(/\.[a-z0-9]+$/i, "") + "-trimmed.png";
  await sharp(src).extract({ left: box.left, top: box.top, width: box.width, height: box.height }).png({ compressionLevel: 9 }).toFile(path.join(ROOT, out));
  const edge = await edgeColor(path.join(ROOT, out)); // what actually touches the tile
  const margins = `${box.top}/${box.imageHeight - box.top - box.height}/${box.left}/${box.imageWidth - box.left - box.width}`;
  console.log(`${out}  ${box.width}x${box.height} (from ${box.imageWidth}x${box.imageHeight}, cut t/b/l/r ${margins})  ` +
    (bg.transparent ? "background: transparent → logo_bg #F7F4EF if the artwork is dark" : `logo_bg ${edge.transparent ? bg.hex : edge.hex} (trimmed edge ${edge.transparent ? "transparent" : Math.round(edge.share * 100) + "%"}; original edge ${bg.hex} ${Math.round(bg.share * 100)}%)`));
}
