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
