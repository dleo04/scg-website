// Face detection for headshot framing (scripts/make-assets.mjs, scripts/detect-faces.mjs).
// @vladmandic/human (BlazeFace + FaceMesh) on the TensorFlow.js WebAssembly backend: pure
// JS/WASM, models ship inside the npm package, no system installs or native builds.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import sharp from "sharp";
import { ROOT } from "./load-data.js";

const require = createRequire(import.meta.url);
let human = null;

async function load() {
  if (human) return human;
  // The models are loaded with fetch(); Node's fetch has no file:// support, so serve those locally.
  const netFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    const u = String(url?.url ?? url);
    if (!u.startsWith("file://")) return netFetch(url, opts);
    return new Response(fs.readFileSync(fileURLToPath(u)), { headers: { "content-type": u.endsWith(".json") ? "application/json" : "application/octet-stream" } });
  };
  const { Human } = require(path.join(ROOT, "node_modules/@vladmandic/human/dist/human.node-wasm.js"));
  const wasmDir = path.join(ROOT, "node_modules/@tensorflow/tfjs-backend-wasm/dist");
  human = new Human({
    backend: "wasm",
    wasmPath: `${wasmDir}/`,
    modelBasePath: `file://${path.join(ROOT, "node_modules/@vladmandic/human/models")}/`,
    debug: false,
    face: {
      enabled: true,
      detector: { enabled: true, rotation: false, maxDetected: 5, minConfidence: 0.3, return: false },
      mesh: { enabled: true }, iris: { enabled: false }, description: { enabled: false },
      emotion: { enabled: false }, antispoof: { enabled: false }, liveness: { enabled: false }, attention: { enabled: false },
    },
    body: { enabled: false }, hand: { enabled: false }, object: { enabled: false }, gesture: { enabled: false }, segmentation: { enabled: false },
    filter: { enabled: false },
  });
  await human.load();
  await human.warmup();
  return human;
}

// Returns the largest face (landmark bounds) as fractions of the (EXIF-rotated) source: { x, y, w, h, score },
// where x/y is the box's top-left corner; or null when no face is found.
export async function detectFace(file) {
  const h = await load();
  const { data, info } = await sharp(file).rotate().flatten({ background: "#FFFFFF" })
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const tensor = h.tf.tensor4d(new Uint8Array(data), [1, info.height, info.width, 3], "int32");
  const res = await h.detect(tensor);
  h.tf.dispose(tensor);
  const faces = (res.face || []).filter((f) => f.box?.[2] > 0).sort((a, b) => b.box[2] * b.box[3] - a.box[2] * a.box[3]);
  if (!faces.length) return null;
  // Tight box from the 468 FaceMesh landmarks (brow-top to chin, cheek to cheek); the detector
  // box is padded and square, so it would overstate the face width.
  const f = faces[0];
  let [x, y, w, hh] = f.box;
  if (f.mesh?.length > 100) {
    const xs = f.mesh.map((p) => p[0]), ys = f.mesh.map((p) => p[1]);
    x = Math.min(...xs); y = Math.min(...ys); w = Math.max(...xs) - x; hh = Math.max(...ys) - y;
  }
  return { x: x / info.width, y: y / info.height, w: w / info.width, h: hh / info.height, score: f.score ?? f.boxScore };
}
