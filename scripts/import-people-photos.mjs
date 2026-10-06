// One-time import of team and alumni photos from the old GoDaddy site.
//   npm run people-photos
// Reads the old About (team cards) and Our Alumni pages in reference/old-site/, finds each
// person's photo on the old image host (img1.wsimg.com) and downloads the ORIGINAL file to
// assets/photos/people/<id>.<ext>, where <id> matches data/team.json / data/alumni.json.
// Existing files are kept (so a photo replaced by an officer is never overwritten).
// Original file names are not kept (one of them contained a personal email address).
// Headshots (400px square WebP) are made from these files by npm run assets.
import fs from "node:fs";
import path from "node:path";
import { ROOT, readJson } from "../lib/load-data.js";

const OLD = path.join(ROOT, "reference/old-site");
const OUT = path.join(ROOT, "assets/photos/people");
if (!fs.existsSync(OLD)) {
  console.error("[people-photos] reference/old-site/ is missing; nothing to import.");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const text = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ").trim();

// Pairs every content card's image (data-srclazy) with the heading that follows it.
function cards(file) {
  const html = fs.readFileSync(path.join(OLD, file), "utf8").replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, "");
  const out = [];
  let img = null;
  for (const m of html.matchAll(/data-srclazy="([^"]+)"|data-aid="ABOUT_HEADLINE_RENDERED\d+"[^>]*>([\s\S]*?)<\/h4>/g)) {
    if (m[1]) img = m[1];
    else if (img) { out.push({ name: text(m[2]), img }); img = null; }
  }
  return out;
}

const people = new Map();
for (const p of readJson("team.json").members || []) people.set(slug(p.name), p.id);
for (const p of readJson("alumni.json").alumni || []) people.set(slug(p.name), p.id);

const found = [...cards("about-us/sniderconsultinggroup.com/about-us.html"), ...cards("alumni/sniderconsultinggroup.com/our-alumni.html")];
let saved = 0, kept = 0;
const missing = [];
for (const { name, img } of found) {
  const id = people.get(slug(name));
  if (!id) continue;
  const m = img.match(/^\/\/img1\.wsimg\.com\/isteam\/ip\/([0-9a-f-]{36})\/([^/]+)/);
  if (!m) { missing.push(name); continue; }
  const ext = (path.extname(decodeURIComponent(m[2])) || ".jpg").toLowerCase().replace(".jpeg", ".jpg");
  const existing = fs.readdirSync(OUT).find((f) => path.basename(f, path.extname(f)) === id);
  if (existing) { kept++; continue; }
  const url = `https://img1.wsimg.com/isteam/ip/${m[1]}/${m[2]}`;   // original, no resize/crop
  const res = await fetch(url);
  if (!res.ok) { missing.push(`${name} (HTTP ${res.status})`); continue; }
  fs.writeFileSync(path.join(OUT, `${id}${ext}`), Buffer.from(await res.arrayBuffer()));
  saved++;
}
const withPhoto = new Set(fs.readdirSync(OUT).map((f) => path.basename(f, path.extname(f))));
const noPhoto = [...people.values()].filter((id) => !withPhoto.has(id));
console.log(`[people-photos] ${saved} downloaded, ${kept} already present; no photo for: ${noPhoto.join(", ") || "none"}${missing.length ? `; failed: ${missing.join(", ")}` : ""}`);
