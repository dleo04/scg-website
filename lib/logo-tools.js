// Logo analysis shared by scripts/trim-logos.mjs and scripts/make-assets.mjs.
// Pixels are only read here; nothing is recolored.
import sharp from "sharp";

const hex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

// The logo's background, read from its outer 2px ring (not a single corner pixel):
//   { transparent: true } when most of the ring is transparent, otherwise
//   { transparent: false, hex, share } with the dominant colour (pixels grouped in 8-level
//   buckets, then the exact average of the winning bucket, so JPEG noise does not matter).
export async function edgeColor(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const buckets = new Map();
  let total = 0, clear = 0;
  const visit = (x, y) => {
    const i = (y * w + x) * 4;
    total++;
    if (data[i + 3] < 128) { clear++; return; }
    const key = (data[i] >> 3) + "," + (data[i + 1] >> 3) + "," + (data[i + 2] >> 3);
    const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2];
    buckets.set(key, b);
  };
  for (let x = 0; x < w; x++) for (const y of [0, 1, h - 2, h - 1]) visit(x, y);
  for (let y = 2; y < h - 2; y++) for (const x of [0, 1, w - 2, w - 1]) visit(x, y);
  if (clear / total > 0.5) return { transparent: true, share: clear / total };
  const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  return { transparent: false, hex: hex([top.r / top.n, top.g / top.n, top.b / top.n]), share: top.n / total };
}

// Bounding box of the artwork: pixels that are opaque and differ from the background by
// more than `tolerance` on any channel. A row/column counts only if at least `minRun` pixels
// in it are artwork, so stray JPEG noise does not widen the box. Thin frame lines from an
// export (an edge row/column, up to 4px in, that is >90% "artwork") are ignored.
export async function artworkBox(file, bg, { tolerance = 40, minRun = 2 } = {}) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const ref = bg.transparent ? null : [1, 3, 5].map((o) => parseInt(bg.hex.slice(o, o + 2), 16));
  const rows = new Uint32Array(h), cols = new Uint32Array(w);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const ink = ref
      ? data[i + 3] >= 128 && Math.max(Math.abs(data[i] - ref[0]), Math.abs(data[i + 1] - ref[1]), Math.abs(data[i + 2] - ref[2])) > tolerance
      : data[i + 3] >= 16;
    if (ink) { rows[y]++; cols[x]++; }
  }
  // Peel frame lines: recount without them (the box is then computed inside the frame).
  let fx0 = 0, fx1 = w - 1, fy0 = 0, fy1 = h - 1;
  const isLine = (n, len) => n > 0.9 * len;
  while (fx0 < 4 && isLine(cols[fx0], h)) fx0++;
  while (w - 1 - fx1 < 4 && isLine(cols[fx1], h)) fx1--;
  while (fy0 < 4 && isLine(rows[fy0], w)) fy0++;
  while (h - 1 - fy1 < 4 && isLine(rows[fy1], w)) fy1--;
  if (fx0 || fy0 || fx1 < w - 1 || fy1 < h - 1) {
    rows.fill(0); cols.fill(0);
    for (let y = fy0; y <= fy1; y++) for (let x = fx0; x <= fx1; x++) {
      const i = (y * w + x) * 4;
      const ink = ref
        ? data[i + 3] >= 128 && Math.max(Math.abs(data[i] - ref[0]), Math.abs(data[i + 1] - ref[1]), Math.abs(data[i + 2] - ref[2])) > tolerance
        : data[i + 3] >= 16;
      if (ink) { rows[y]++; cols[x]++; }
    }
  }
  const first = (a) => a.findIndex((n) => n >= minRun);
  const last = (a) => a.length - 1 - [...a].reverse().findIndex((n) => n >= minRun);
  const top = first(rows), left = first(cols);
  if (top < 0 || left < 0) return { left: 0, top: 0, width: w, height: h, imageWidth: w, imageHeight: h };
  return { left, top, width: last(cols) - left + 1, height: last(rows) - top + 1, imageWidth: w, imageHeight: h };
}
