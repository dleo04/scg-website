// Post-build guard. Fails the build (exit 1) if the generated site contains:
//  - the name of anyone in data/team.json or data/alumni.json without consent_to_publish: true
//  - an email address (other than site.json → links.contact_email) or a phone number
//  - GoDaddy builder leftovers
//  - with HIDE_PLACEHOLDERS=1: any visible placeholder or [TBD] marker
import fs from "node:fs";
import path from "node:path";
import { ROOT, DATA_DIR, readJson, unpublishedNames, getEnv } from "../lib/load-data.js";

const OUT = path.join(ROOT, "_site");
const TEXT_EXT = new Set([".html", ".xml", ".txt", ".json", ".webmanifest", ".js", ".css"]);
const site = readJson("site.json");
const env = getEnv();

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (TEXT_EXT.has(path.extname(entry.name)) || entry.name === "site.webmanifest") files.push(full);
  }
})(OUT);

// Unconsented testimonial text (anything real, i.e. not a [TBD] stub) must never ship.
const testimonialsFile = fs.existsSync(path.join(DATA_DIR, "testimonials.json")) ? readJson("testimonials.json") : { testimonials: [] };
const unpublishedQuotes = (testimonialsFile.testimonials || [])
  .filter((t) => t.consent_to_publish !== true && t.quote && !/\[TBD/i.test(t.quote))
  .map((t) => t.quote.slice(0, 60));

const allowedEmail = site.links?.contact_email?.toLowerCase();
const names = unpublishedNames();
const surname = (n) => n.trim().split(/\s+/).at(-1);
const problems = [];

for (const file of files) {
  const rel = path.relative(OUT, file);
  const text = fs.readFileSync(file, "utf8");
  const lower = text.toLowerCase();

  for (const name of names) {
    const hits = [name, surname(name).length >= 5 ? surname(name) : null].filter(Boolean);
    for (const h of hits) {
      if (new RegExp(`\\b${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) {
        problems.push(`${rel}: contains "${h}", who has not consented to publish (consent_to_publish is not true).`);
      }
    }
  }
  for (const m of text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    if (m[0].toLowerCase() !== allowedEmail && !/\.(png|jpe?g|webp|svg|woff2?)$/i.test(m[0])) {
      problems.push(`${rel}: contains an email address "${m[0]}".`);
    }
  }
  if (rel.endsWith(".html")) {
    const visible = text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
    const phone = visible.match(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/);
    if (phone) problems.push(`${rel}: contains what looks like a phone number "${phone[0]}".`);
  }
  for (const q of unpublishedQuotes) {
    if (text.includes(q)) problems.push(`${rel}: contains a testimonial without consent_to_publish: true.`);
  }
  if (/uconsulting/i.test(text)) problems.push(`${rel}: mentions the layout reference site; it must not ship.`);
  for (const marker of ["godaddy", "powered by", "filler@", "img1.wsimg.com", "websitebuilder"]) {
    if (lower.includes(marker)) problems.push(`${rel}: contains builder leftover "${marker}".`);
  }
  if (env.hidePlaceholders && rel.endsWith(".html") && /data-placeholder="true"|\[TBD/i.test(text)) {
    problems.push(`${rel}: still shows a placeholder although HIDE_PLACEHOLDERS=1.`);
  }
}

// The layout reference screenshot must never be in the build output.
for (const f of fs.readdirSync(OUT, { recursive: true })) {
  if (/layout-reference|docs[\\/]reference/i.test(String(f))) problems.push(`${f}: reference material must not be published.`);
}

if (problems.length) {
  console.error(`\n[check] FAILED: ${problems.length} problem(s) in _site/:\n  - ${problems.join("\n  - ")}\n`);
  process.exit(1);
}
console.log(`[check] OK: ${files.length} files scanned; no unconsented names, contact details or builder leftovers.`);
