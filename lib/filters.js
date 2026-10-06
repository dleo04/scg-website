import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT, getEnv } from "./load-data.js";

const TBD_INLINE = /\[TBD[^\]]*\]/gi;

export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// True when a value is missing or still a placeholder.
export function isTbd(value) {
  if (value == null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return typeof value === "string" && /\[TBD/i.test(value);
}

// Escape text and turn every "[TBD: ...]" into a highlighted, scannable span.
// Use as {{ text | tbd | safe }}. With HIDE_PLACEHOLDERS=1 the markers are removed.
export function tbd(value) {
  if (value == null) return "";
  const escaped = escapeHtml(value);
  if (getEnv().hidePlaceholders) return escaped.replace(TBD_INLINE, "").replace(/\s{2,}/g, " ").trim();
  return escaped.replace(
    TBD_INLINE,
    (m) => `<span class="tbd" data-placeholder="true" data-todo="${m.replace(/"/g, "&quot;")}">${m}</span>`
  );
}

// Images under assets/placeholders/ (or missing) are drawn as labeled blocks.
export function isPlaceholderImage(src) {
  return !src || String(src).startsWith("assets/placeholders/");
}

// Which call to action to show, per SPEC 5.4.
export function ctaState(recruiting = {}) {
  if (recruiting.open && recruiting.application_url) {
    return { kind: "apply", label: "Apply", short: "Apply", href: recruiting.application_url, external: true };
  }
  if (recruiting.interest_form_url) {
    return { kind: "interest", label: "Join the interest list", short: "Interest list", href: recruiting.interest_form_url, external: true };
  }
  return { kind: "tbd", label: "Apply", short: "Apply", href: "/join/", external: false };
}

export function absoluteUrl(url, base) {
  return new URL(url, base).href;
}

// JSON for <script type="application/ld+json">, safe against "</script>".
export function jsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}

// Cache-busting query string from file contents, e.g. /css/main.css?v=1a2b3c4d
const hashCache = new Map();
export function versioned(urlPath) {
  const map = { "/css/": "src/css/", "/js/": "src/js/" };
  const prefix = Object.keys(map).find((p) => urlPath.startsWith(p));
  if (!prefix) return urlPath;
  const file = path.join(ROOT, map[prefix], urlPath.slice(prefix.length));
  try {
    const stat = fs.statSync(file);
    const key = `${file}:${stat.mtimeMs}`;
    if (!hashCache.has(key)) {
      hashCache.set(key, crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex").slice(0, 8));
    }
    return `${urlPath}?v=${hashCache.get(key)}`;
  } catch {
    return urlPath;
  }
}

// One-line scope for project cards: joins the first `count` scope items,
// e.g. "Viability assessment and data sourcing, model refinement and benchmarking".
// Later items are lowercased only if their first word never appears capitalized
// mid-sentence in the project's own text (so "Google SQL ..." keeps its capital).
// An explicit project.scope_summary always wins.
export function scopeLine(project, count = 2) {
  if (project.scope_summary) return project.scope_summary;
  const items = (project.scope || []).slice(0, count);
  const engagementText = (project.engagements || []).flatMap((e) => [e.challenge, e.scope_detail, e.tagline, ...(e.scope || [])]);
  const text = [project.summary, project.challenge, project.scope_detail, project.tagline, ...(project.scope || []), ...engagementText].filter(Boolean).join(". ");
  const isProper = (word) => new RegExp(`[a-z,;:]\\s+${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text);
  return items
    .map((item, i) => {
      if (i === 0) return item;
      const first = item.split(/\s+/)[0];
      const keep = /^[A-Z0-9]{2,}$/.test(first) || isProper(first);
      return keep ? item : item.charAt(0).toLowerCase() + item.slice(1);
    })
    .join(", ");
}

// Logo size for even visual weight: every logo gets about the same area,
// capped to the tile (maxW x maxH). Returns CSS pixel width/height.
export function logoBox(logo, area = 3300, maxW = 124, maxH = 40) {
  if (!logo?.width || !logo?.height) return null;
  const ratio = logo.width / logo.height;
  let h = Math.sqrt(area / ratio);
  let w = h * ratio;
  const scale = Math.min(1, maxW / w, maxH / h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

// Splits a stat value such as "50+", "1,200+" or "$3M" into its parts so the count-up can
// animate only the digits. Returns { prefix, target, suffix, chars } or null if no number.
export function parseStat(value) {
  const m = String(value ?? "").match(/^(\D*?)(\d[\d,]*)(.*)$/);
  if (!m) return null;
  const target = parseInt(m[2].replace(/,/g, ""), 10);
  if (!Number.isFinite(target)) return null;
  const formatted = target.toLocaleString("en-US");
  return { prefix: m[1], target, suffix: m[3], formatted, chars: formatted.length };
}

// Distinct, sorted values of a field across a list (array fields are flattened). Used to
// decide which explorer filter groups to show (only when there are at least two values).
export function distinct(list, key) {
  const values = (list || []).flatMap((item) => (Array.isArray(item?.[key]) ? item[key] : [item?.[key]]));
  return [...new Set(values.filter((v) => v != null && v !== "" && !/\[TBD/i.test(String(v))))].sort((a, b) => String(a).localeCompare(String(b)));
}

// "2027-01-20" → "Wednesday, January 20, 2027" (dates in data/ are calendar dates, no timezone).
export function longDate(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// "18:00" → "6:00 PM"
export function clockTime(hhmm) {
  const m = String(hhmm || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm;
  const h = +m[1];
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

// iCalendar (RFC 5545) text escaping.
export function icsText(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// First item whose `key` equals `value` (Nunjucks' selectattr cannot compare values).
export function findBy(list, key, value) {
  return (list || []).find((item) => item?.[key] === value) || null;
}

// Google Slides link → its /embed URL (null for anything else).
export function slidesEmbed(url) {
  const m = String(url || "").match(/^https:\/\/docs\.google\.com\/presentation\/d\/([A-Za-z0-9_-]+)/);
  return m ? `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false&delayms=60000` : null;
}

// Shallow-merges objects (Nunjucks has no object spread), e.g. to add optional JSON-LD fields.
export function merge(a, b) {
  return { ...a, ...b };
}
