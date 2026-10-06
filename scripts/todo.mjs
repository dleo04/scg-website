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
// Stage 3A: About / Join / Prepare.
data.push(`site.json → member_stats: ${(site.member_stats || []).map((m) => `${m.value} ${m.label}`).join(", ")} come from the old About page; confirm the figures are current and set member_stats_as_of.`);
data.push("site.json → recruiting: interest_form_url and the status ('Spring 2027 recruitment · Interest form is open', 'Fall 2026 applications are closed') come from the old Recruitment page; confirm the form is the current one. links.resume_guide is a Google Slides link: confirm it is shared publicly.");
(site.timeline?.steps || []).forEach((st) => { if (!st.description) data.push(`site.json → timeline: "${st.name}" has no description (none is shown); add what applicants do at this step.`); });
data.push("site.json → timeline: confirm the five steps (Interest form, Application, Interviews, Decision, Onboarding), mark any optional ones (optional: true), and add dates for the 'Add to calendar' downloads.");
data.push("/join/ interview process: number of rounds, format and length of each interview (not shown until supplied).");
const processFile = readJson("process.json");
for (const st of processFile.steps || []) if (st.todo) data.push(`process.json → "${st.name}": ${st.todo}${st.text ? "" : " (step hidden on the live site until text is added)"}.`);
data.push("Photos (data/photos.json): 14 group, event and activity photos imported from the old site; confirm SCG may keep using them and that the captions are right (for example 'EY site visit', 'Semester hike').");
data.push("Downloads (site.json → downloads): the three SCG case guides credit their student authors by name and photo on page 1, as originally published on the old site; confirm the authors are happy for them to stay public (or supply versions without photos). The guided case also links to sniderconsultinggroup.com/case-prep, which the new site does not have.");
data.push("assets/logos/snider-center-smith.jpg (About partnership band) is the 576x178 lockup from the old site; a larger or vector version from the Snider Center would be sharper.");
data.push("faq.json → 'What makes SCG different…' is from the old Recruitment page with the 2021 Vault ranking removed; confirm the wording.");
data.push("Banners waiting for a photo (gradient until then): /partners/ (partnersimage). /join/prepare/ shares the /join/ banner (same_as). Drop a file with that name anywhere under assets/ and rebuild (see README → How to change a page banner).");
data.push("assets/PHOTO-CREDITS.md: record the photographer and license of the five supplied banner photos (projectsimage, joinscgimage, alumniimage, aboutimage, workwithusimage) and of the starter-package photos (placeholder-hero-quad.jpg, placeholder-group-photo.jpg).");
data.push("tracks.json: confirm the one-line 'short' descriptions, the three 'panel: true' What-you'd-do items per track, and the order of 'skills' and 'fits' (the first 5 of each are shown on /join/). Product & Design has only two projects (SpeechPundit, Product Space).");
data.push("Hidden for now: the SICC December 2023 case prompt (site.json → downloads, \"published\": false). The PDF and entry stay in the repo; remove the flag and rebuild to show it on /join/prepare/ again.");
data.push("Confirm the year the EY partnership started so the label can be 'Since 20XX' instead of '4+ years' (which goes stale each year) (site.json → facts → EY partnership; shown on /about/ and /join/).");
data.push("/about/ timeline: the Smith Impact Case Competition card has no photo (no case competition photo exists on the old site); add one to data/photos.json and site.json → story_photos → competition if you have one.");
data.push("Confirm members in gallery photos are OK with being shown on the site; remove any photo on request (data/gallery.json).");
data.push("Semester labels: confirm 'SCG Internal Project' (Spring 2025 + Fall 2025) and 'Business Beyond Borders' (Fall 2025) are listed in the right semesters.");
for (const g of faq.groups) for (const item of g.items) {
  if (item.needs_decision) data.push(`faq.json → "${item.q}" NEEDS DECISION (hidden in production): ${item.decision}`);
  else if (item.needs_review) data.push(`faq.json → "${item.q}" is a draft; officers to review.`);
}
const people = [...(team.board || []), ...(team.members || []), ...alumni];
const noConsent = people.filter((p) => p.consent_to_publish !== true);
if (noConsent.length) data.push(`team.json / alumni.json: ${noConsent.length} entr${noConsent.length === 1 ? "y has" : "ies have"} no consent_to_publish yet and are not shown.`);
if (site.forms?.client_request_fallback_email) data.push(`site.json → forms.client_request_fallback_email (${site.forms.client_request_fallback_email}): confirm this inbox is monitored for client requests (the old Contact Us page listed it for applicants; client requests went to a personal address, which is not used).`);
if (!site.forms?.client_request_endpoint) data.push("site.json → forms.client_request_endpoint: supply a form endpoint (e.g. a Formspree form URL) so /work-with-us/contact/ shows the real request form instead of the 'Request by email' composer. No code change needed.");
data.push("Launch: redirect the old URLs /services → /work-with-us/ and /contact-us → /work-with-us/contact/ (there is no redirect map in the repo yet; see DECISIONS.md → Work With Us dropdown).");
data.push("Officers: confirm each listed member and alumnus is OK with their name, photo and details being shown; set consent_to_publish to false (or delete the entry) on request.");
for (const p of people.filter((p) => p.review_note)) data.push(`${p.level ? "team.json" : "alumni.json"} → ${p.name}: ${p.review_note}`);
const noMajors = (team.members || []).filter((p) => !p.majors).length;
if (noMajors) data.push(`team.json: ${noMajors} members have no majors (the old site did not list them); the major filter on /team/ appears once at least 3 members have one. "worked_on" (project ids) is empty for everyone.`);
if (!site.alumni_report?.file) data.push("site.json → alumni_report.file: add the 2026 Alumni Report PDF to show the download on /alumni/ (the old site only showed it as an image carousel; no file was found).");
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
