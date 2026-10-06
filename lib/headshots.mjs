// Headshot framing shared by scripts/make-assets.mjs and scripts/people-contact-sheet.mjs.
//
// Data (data/team.json, data/alumni.json → photo), all in % of the source image:
//   face:           detected face box {x, y, w, h} (top-left corner + size), written by the build
//   focal:          the face centre {x, y} that the crop is centred on (derived from face)
//   focal_override: {x, y} set by hand; wins over focal (e.g. when detection picked the wrong face)
//   source:         {file, width, height} the detection ran on; a new photo is re-detected
//   detect_failed:  true when no face was found (default framing; listed by the build)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT } from "./load-data.js";

export const PEOPLE_DIR = path.join(ROOT, "assets/photos/people");
export const FACE_WIDTH = 0.38;      // face width (landmark box) as a share of the frame width (target 38–45%)
export const FACE_MAX = 0.55;        // when the source is too tight, allow the face up to this share
export const FACE_Y = 0.5;           // face centre (nose) at 50% of the frame height
export const HEADROOM = 0.75;        // room above the brow, in face heights: hair plus a margin
const FALLBACK = { x: 50, y: 33, frame: 0.72 };   // no face found: upper-middle, 72% of the short side

export const sourceFor = (id) => {
  if (!fs.existsSync(PEOPLE_DIR)) return null;
  const f = fs.readdirSync(PEOPLE_DIR).find((n) => path.basename(n, path.extname(n)) === id && /\.(jpe?g|png|webp)$/i.test(n));
  return f ? path.join(PEOPLE_DIR, f) : null;
};

// Crop rectangle {left, top, width, height} in source pixels for aspect = width / height.
// Face centred horizontally and at FACE_Y vertically, face ≈ FACE_WIDTH of the frame width; the
// frame shrinks (face up to FACE_MAX) before it is shifted, so the face stays centred when the
// photo is tight; only past that is the frame clamped to the image (reported as `clamped`).
export function frame(photo, W, H, aspect) {
  const face = photo?.face;
  const focal = photo?.focal_override || photo?.focal || (face ? { x: face.x + face.w / 2, y: face.y + face.h / 2 } : null);
  const cx = ((focal?.x ?? FALLBACK.x) / 100) * W;
  const cy = ((focal?.y ?? FALLBACK.y) / 100) * H;
  const fw = face ? (face.w / 100) * W : null;
  let w = fw ? fw / FACE_WIDTH : Math.min(W, H * aspect) * FALLBACK.frame;
  // The landmark box stops at the brow, so make sure the frame leaves room for the hair above it:
  // brow at (FACE_Y·h − fh/2) from the top must be ≥ HEADROOM·fh (the face shrinks if needed).
  const fh = face ? (face.h / 100) * H : null;
  if (fh) w = Math.max(w, ((fh / 2 + HEADROOM * fh) / FACE_Y) * aspect);
  // Largest frame that fits the image and keeps the face centred.
  const fitCentred = Math.min(W, H * aspect, 2 * cx, 2 * (W - cx), (cy / FACE_Y) * aspect, ((H - cy) / (1 - FACE_Y)) * aspect);
  const minW = fw ? fw / FACE_MAX : 0;
  let clamped = false;
  if (w > fitCentred) {
    if (fitCentred >= minW) w = fitCentred;
    else { w = Math.min(minW, W, H * aspect); clamped = true; }
  }
  const h = w / aspect;
  const left = Math.round(Math.max(0, Math.min(W - w, cx - w / 2)));
  const top = Math.round(Math.max(0, Math.min(H - h, cy - FACE_Y * h)));
  return { left, top, width: Math.round(Math.min(w, W - left)), height: Math.round(Math.min(h, H - top)), clamped, faceShare: fw ? fw / w : null };
}

// Cropped, resized (never upscaled), white-flattened WebP under maxKB.
export async function renderCrop(src, rect, outW, aspect, maxKB) {
  const width = Math.min(outW, rect.width);
  const height = Math.round(width / aspect);
  let q = 82, buf;
  do {
    buf = await sharp(src).rotate().extract(rect).resize(width, height, { fit: "fill" })
      .flatten({ background: "#FFFFFF" }).webp({ quality: q }).toBuffer();
    q -= 5;
  } while (buf.length > maxKB * 1024 && q > 35);
  return { buf, width, height };
}
