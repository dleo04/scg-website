// Writes TODO-CONTENT.md: every placeholder on the built site plus the
// unconfirmed facts in data/. Run with `npm run todo` (builds first).
import fs from "node:fs";
import path from "node:path";
import { ROOT, readJson } from "../lib/load-data.js";
import { engagementsOf, resolveLogo } from "../lib/projects.js";

// Scans a notes-on build (npm run todo builds one into .notes-site/ with SHOW_PLACEHOLDERS=1),
// because the normal build no longer renders any dev notes.
const OUT = path.join(ROOT, process.env.SITE_DIR || "_site");
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// 1. Placeholders rendered on each route (data-todo attributes).
const byRoute = new Map();
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) {
      const route = "/" + path.relative(OUT, full).replace(/index\.html$/, "").replace(/\\/g, "/");
      const items = [...fs.readFileSync(full, "utf8").matchAll(/data-todo="([^"]*)"/g)].map((m) => decode(m[1]));
      if (items.length) byRoute.set(route, [...new Set(items)]);
    }
  }
})(OUT);

// 2. Facts in data/ that officers must supply or confirm.
const data = [];
const site = readJson("site.json");
const projects = readJson("projects.json").projects;
const faq = readJson("faq.json");
const team = readJson("team.json");
const alumni = readJson("alumni.json").alumni;
const clients = readJson("past-clients.json").clients;

for (const s of [...site.stats, ...(site.facts || [])]) if (!s.verified) data.push(`site.json → stats/facts: "${s.label}" needs a verified figure.`);
if (!site.recruiting.application_url) data.push("site.json → recruiting.application_url is empty.");
if (!site.recruiting.interest_form_url) data.push("site.json → recruiting.interest_form_url is empty.");
if (!site.links.contact_email) data.push("site.json → links.contact_email: shared club address (never a personal one).");
if (site.images?.hero_is_standin || site.images?.community_is_standin) data.push("Hero and community photos are stand-ins; replace with real photos and confirm photo license (site.json → images.hero, images.community).");
if (fs.existsSync(path.join(ROOT, "assets/logos/ey-reversed.png"))) data.push("assets/logos/ey-reversed.png is a generated white version of the EY lockup; replace it with EY's official reversed logo (ideally SVG) if one can be obtained.");
const testimonials = fs.existsSync(path.join(ROOT, "data/testimonials.json")) ? readJson("testimonials.json").testimonials : [];
if (!testimonials.some((t) => t.consent_to_publish === true)) data.push("Client testimonials: add quotes with written permission to data/testimonials.json to enable the section.");
site.timeline.steps.forEach((s) => { if (!s.date) data.push(`site.json → timeline: date for "${s.name}".`); });
// Per project tile and per engagement: every field the live site OMITS because it is missing
// (shown only with npm run dev:notes), plus facts to confirm.
const tbdOrEmpty = (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0) || /\[TBD/i.test(String(v));
for (const p of projects) {
  const engagements = engagementsOf(p);
  const omitted = [];
  for (const e of engagements) {
    const miss = [];
    if (tbdOrEmpty(e.challenge)) miss.push("Challenge");
    if (tbdOrEmpty(e.scope)) miss.push("Scope");
    if (tbdOrEmpty(e.approach)) miss.push("Approach");
    if (tbdOrEmpty(e.outcome)) miss.push("Outcome (card shows \"Results coming soon\")");
    if (miss.length) omitted.push(`${e.semester}: ${miss.join(", ")}`);
  }
  if (tbdOrEmpty(p.team?.size) && tbdOrEmpty(p.team?.roles) && tbdOrEmpty(p.team?.majors)) omitted.push("Team (size, roles, majors)");
  if (tbdOrEmpty(p.links)) omitted.push("Links");
  if (!resolveLogo(ROOT, p.logo)) omitted.push(p.logo ? `logo file "${p.logo}" not found (add e.g. ${p.logo}.png; the client name is shown on a neutral tile until then)` : "logo + logo_bg (the client name is shown on a neutral tile instead)");
  if (!p.client_type) omitted.push("client type (no existing type fits; see DECISIONS.md)");
  const confirm = [];
  if (p.fit_inferred) confirm.push(`'fits' (inferred: ${(p.fits || []).join(", ")})`);
  confirm.push(`disciplines (${(p.disciplines || []).join(", ")})`);
  if (p.repeat_client_note) confirm.push("repeat client");
  const parts = [];
  if (omitted.length) parts.push(`omitted on the live site: ${omitted.join("; ")}`);
  parts.push(`confirm: ${confirm.join("; ")}`);
  data.push(`projects.json → ${p.id}: ${parts.join(". ")}.`);
}
data.push("Logos: confirm assets/logos/windterpineslogo.png is Wind Terpines' official logo (the brief said none was supplied yet; it is shown because the file is in the folder). Ask Smith Equity Research for a transparent or flat-background logo (the current file's grey gradient shows as a lighter box on its tile). Optional: a flat-background MPDS logo (faint shell-texture fragments around the cropped artwork) and a larger SpeechPundit file (451x172 after trimming; slightly soft on retina in the dialog/page banner).");
data.push("Semester labels: confirm 'SCG Internal Project' (Spring 2025 + Fall 2025) and 'Business Beyond Borders' (Fall 2025) are listed in the right semesters.");
for (const g of faq.groups) for (const item of g.items) {
  if (item.needs_decision) data.push(`faq.json → "${item.q}" NEEDS DECISION (hidden in production): ${item.decision}`);
  else if (item.needs_review) data.push(`faq.json → "${item.q}" is a draft; officers to review.`);
}
const noConsent = [...team.board, ...team.members, ...alumni].filter((p) => p.consent_to_publish !== true);
data.push(`team.json / alumni.json: ${noConsent.length} entr${noConsent.length === 1 ? "y has" : "ies have"} no consent_to_publish yet and are not shown.`);
const noYear = clients.filter((c) => !c.year).length;
if (noYear) data.push(`past-clients.json: ${noYear} clients have no year; "likely_technical" flags are unconfirmed guesses.`);

const lines = [
  "# Content TODO",
  "",
  `Generated by \`npm run todo\` on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand.`,
  "",
  "## Placeholders (only shown with `npm run dev:notes`; never on the live site), by page",
  "",
];
// Items on every page (e.g. footer) are listed once.
const pages = [...byRoute.values()];
const everywhere = pages.length ? pages[0].filter((i) => pages.every((list) => list.includes(i))) : [];
if (everywhere.length) lines.push("### Every page", "", ...everywhere.map((i) => `- ${i}`), "");
for (const [route, items] of [...byRoute].sort()) {
  const own = items.filter((i) => !everywhere.includes(i));
  if (own.length) lines.push(`### \`${route}\``, "", ...own.map((i) => `- ${i}`), "");
}
lines.push("## Facts to supply or confirm in `data/`", "", ...data.map((d) => `- ${d}`), "");
fs.writeFileSync(path.join(ROOT, "TODO-CONTENT.md"), lines.join("\n"));
console.log(`[todo] TODO-CONTENT.md: ${[...byRoute.values()].flat().length} placeholders on ${byRoute.size} pages, ${data.length} data items.`);
