// Project helpers shared by lib/load-data.js and scripts/make-assets.mjs.
//
// A project (one tile) is one client. A client that returns in a later semester keeps ONE
// tile with several `engagements`; parallel projects for the same client in the same
// semester are separate tiles. Old flat projects (semester/tagline/... at the top level)
// are still accepted and read as a single engagement.
import fs from "node:fs";
import path from "node:path";

const TERMS = { winter: 0, spring: 1, summer: 2, fall: 3 };
const TERM_NAMES = ["Winter", "Spring", "Summer", "Fall"];

// "Spring 2025" → 20251 (sortable); null if the label is not "<Term> <Year>".
export function semesterKey(label) {
  const m = String(label || "").trim().match(/^(winter|spring|summer|fall)\s+(\d{4})$/i);
  return m ? Number(m[2]) * 10 + TERMS[m[1].toLowerCase()] : null;
}

// Label for a set of semesters:
//   one             → "Fall 2025"
//   same year       → "Spring & Fall 2025" (three: "Spring, Summer & Fall 2025")
//   across years    → "Fall 2025 – Spring 2026" (earliest – latest)
export function semesterLabel(labels) {
  const keys = [...new Set(labels.map(semesterKey).filter((k) => k != null))].sort((a, b) => a - b);
  if (!keys.length) return "";
  const name = (k) => `${TERM_NAMES[k % 10]} ${Math.floor(k / 10)}`;
  if (keys.length === 1) return name(keys[0]);
  const years = new Set(keys.map((k) => Math.floor(k / 10)));
  if (years.size === 1) {
    const terms = keys.map((k) => TERM_NAMES[k % 10]);
    const list = terms.length === 2 ? terms.join(" & ") : `${terms.slice(0, -1).join(", ")} & ${terms.at(-1)}`;
    return `${list} ${[...years][0]}`;
  }
  return `${name(keys[0])} – ${name(keys.at(-1))}`;
}

// Resolves a logo path. "assets/logos/hyswaplogo" (no extension) matches any image with that
// name, case-insensitively, so officers can drop in hyswaplogo.png/.svg/.jpg later.
export function resolveLogo(root, logo) {
  if (!logo) return null;
  const full = path.join(root, logo);
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return logo;
  const dir = path.dirname(full);
  const base = path.basename(logo).toLowerCase();
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext) && path.basename(f, path.extname(f)).toLowerCase() === base;
  });
  return hit ? path.join(path.dirname(logo), hit) : null;
}

const ENGAGEMENT_FIELDS = ["semester", "title", "tagline", "challenge", "scope", "scope_detail", "approach", "outcome", "skills", "disciplines"];

// The project's engagements, newest first (each with a sortable `key`).
export function engagementsOf(p) {
  const list = Array.isArray(p.engagements) && p.engagements.length
    ? p.engagements
    : [Object.fromEntries(ENGAGEMENT_FIELDS.filter((k) => p[k] !== undefined).map((k) => [k, p[k]]))];
  return list
    .map((e) => ({ ...e, key: semesterKey(e.semester) }))
    .sort((a, b) => (b.key ?? 0) - (a.key ?? 0));
}

export const unique = (list) => [...new Set(list.filter((v) => v != null && v !== ""))];
