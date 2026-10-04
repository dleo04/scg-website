// Loads data/*.json, validates it, and returns ONLY what templates may render.
// Templates never receive the raw people arrays: anyone without
// consent_to_publish === true is dropped here, before any page is built.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { engagementsOf, semesterKey, semesterLabel, resolveLogo, unique } from "./projects.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// SCG_DATA_DIR lets tests build against a modified copy of data/.
export const DATA_DIR = process.env.SCG_DATA_DIR ? path.resolve(process.env.SCG_DATA_DIR) : path.join(ROOT, "data");

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/;
const TBD = /\[TBD/i;

export function getEnv() {
  const production = process.env.SCG_ENV === "production";
  // Dev notes (placeholder labels, [TBD] markers, stand-in badges) are hidden by default and
  // only rendered with SHOW_PLACEHOLDERS=1 (npm run dev:notes). Production never shows them.
  const showPlaceholders = process.env.SHOW_PLACEHOLDERS === "1" && !production;
  return {
    production,
    showPlaceholders,
    hidePlaceholders: !showPlaceholders,
    year: new Date().getFullYear(),
  };
}

export function readJson(name) {
  const file = path.join(DATA_DIR, name);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`data/${name} could not be read: ${err.message}`);
  }
}

// Scan every string in an object for emails or phone numbers.
function findContactDetails(value, where, errors, allowKeys = []) {
  const walk = (v, keyPath) => {
    if (typeof v === "string") {
      if (EMAIL.test(v) || PHONE.test(v)) {
        errors.push(`${where} → ${keyPath}: looks like an email or phone number. Personal contact details must not be published.`);
      }
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${keyPath}[${i}]`));
    } else if (v && typeof v === "object") {
      for (const [k, item] of Object.entries(v)) {
        if (!allowKeys.includes(k)) walk(item, keyPath ? `${keyPath}.${k}` : k);
      }
    }
  };
  walk(value, "");
}

export function loadData() {
  const env = getEnv();
  const errors = [];

  const site = readJson("site.json");
  const projectsFile = readJson("projects.json");
  const tracksFile = readJson("tracks.json");
  const processFile = readJson("process.json");
  const faqFile = readJson("faq.json");
  const pastClientsFile = readJson("past-clients.json");
  const teamFile = readJson("team.json");
  const alumniFile = readJson("alumni.json");

  // ---- Projects -----------------------------------------------------------
  // One object per client tile, with one or more engagements (lib/projects.js). The card and
  // the top-level fields used by older templates come from the LATEST engagement.
  const disciplines = projectsFile.disciplines || [];
  const ids = new Set();
  const projects = (projectsFile.projects || []).map((p, i) => {
    const where = `data/projects.json → projects[${i}]${p.id ? ` ("${p.id}")` : ""}`;
    if (!p.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) {
      errors.push(`${where}: "id" is required and may only use lowercase letters, numbers and dashes (it becomes the page URL).`);
    } else if (ids.has(p.id)) {
      errors.push(`${where}: "id" is used by another project. Each id must be unique.`);
    }
    ids.add(p.id);
    for (const key of ["title", "client"]) {
      if (!p[key]) errors.push(`${where}: "${key}" is required.`);
    }
    const engagements = engagementsOf(p);
    engagements.forEach((e, j) => {
      if (e.key == null) errors.push(`${where} → engagement ${j + 1}: "semester" must look like "Spring 2025" or "Fall 2025".`);
      if (!e.tagline) errors.push(`${where} → engagement ${j + 1}: "tagline" (the card's Objective) is required.`);
    });
    const allDisciplines = unique([...(p.disciplines || []), ...engagements.flatMap((e) => e.disciplines || [])]);
    for (const d of allDisciplines) {
      if (!disciplines.includes(d)) errors.push(`${where}: discipline "${d}" is not in the "disciplines" list at the bottom of projects.json.`);
    }
    const logo = resolveLogo(ROOT, p.logo);
    if (p.logo_bg && !/^#[0-9a-f]{6}$/i.test(p.logo_bg)) errors.push(`${where}: "logo_bg" must be a hex color like #1E3557.`);
    findContactDetails(p, where, errors);
    const latest = engagements[0] || {};
    const semesters = unique(engagements.map((e) => e.semester));
    return {
      ...p,
      engagements,
      semesters,
      semester: semesterLabel(semesters),
      latestKey: latest.key ?? 0,
      tagline: latest.tagline,
      challenge: latest.challenge,
      scope: latest.scope,
      scope_detail: latest.scope_detail,
      approach: latest.approach,
      outcome: latest.outcome,
      skills: unique([...engagements.flatMap((e) => e.skills || []), ...(p.skills || [])]),
      disciplines: allDisciplines,
      summary: p.summary || latest.challenge || latest.tagline,
      logo: logo || null,
      logoMissing: p.logo && !logo ? p.logo : null,
      url: `/projects/${p.id}/`,
    };
  });
  // Separate tiles for the same client (parallel projects) link to each other.
  for (const p of projects) {
    p.related = projects.filter((o) => o.id !== p.id && o.client === p.client).map((o) => ({ id: o.id, title: o.title, url: o.url }));
  }
  // /projects/ order: newest latest engagement first, then alphabetical. Home keeps file order.
  const projectsSorted = [...projects].sort((a, b) => b.latestKey - a.latestKey || a.title.localeCompare(b.title));
  const allSemesters = unique(projectsSorted.flatMap((p) => p.semesters)).sort((a, b) => semesterKey(b) - semesterKey(a));
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));

  // ---- Tracks -------------------------------------------------------------
  const tracks = (tracksFile.tracks || []).map((t, i) => {
    const where = `data/tracks.json → tracks[${i}] ("${t.name}")`;
    if (!disciplines.includes(t.name)) {
      errors.push(`${where}: "name" must match one of the disciplines in projects.json.`);
    }
    for (const item of t.what_you_do || []) {
      if (item.project && !projectById[item.project]) {
        errors.push(`${where}: what_you_do refers to unknown project id "${item.project}".`);
      }
    }
    return {
      ...t,
      what_you_do: (t.what_you_do || []).map((item) => ({ ...item, projectData: projectById[item.project] || null })),
      projects: projects.filter((p) => (p.disciplines || []).includes(t.name)),
    };
  });

  // ---- People (consent enforced here) -------------------------------------
  const publish = (list, file, group) =>
    (list || []).filter((person, i) => {
      const where = `data/${file} → ${group}[${i}]`;
      findContactDetails(person, where, errors, ["linkedin"]);
      if (person.consent_to_publish !== true) return false;
      if (!person.name || TBD.test(person.name)) {
        errors.push(`${where}: has consent_to_publish: true but the name is missing or still "[TBD]".`);
      }
      for (const id of person.worked_on || []) {
        if (!projectById[id]) errors.push(`${where}: worked_on refers to unknown project id "${id}".`);
      }
      return true;
    });

  const team = {
    levels: teamFile.levels || [],
    board: publish(teamFile.board, "team.json", "board"),
    members: publish(teamFile.members, "team.json", "members"),
  };
  const alumni = publish(alumniFile.alumni, "alumni.json", "alumni");

  const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const peopleMajors = [
    ...new Set(
      [...team.board, ...team.members, ...alumni]
        .flatMap((person) => asList(person.majors))
        .filter((m) => m && !TBD.test(m))
    ),
  ].sort();

  // ---- Testimonials (consent enforced; quotes are never invented) ----------
  const testimonialsFile = fs.existsSync(path.join(DATA_DIR, "testimonials.json")) ? readJson("testimonials.json") : { testimonials: [] };
  const testimonials = (testimonialsFile.testimonials || []).filter((t, i) => {
    const where = `data/testimonials.json → testimonials[${i}]`;
    findContactDetails(t, where, errors);
    if (t.consent_to_publish !== true) return false;
    if (!t.quote || TBD.test(t.quote) || !t.client || TBD.test(t.client)) {
      errors.push(`${where}: has consent_to_publish: true but the quote or client is missing or still "[TBD]".`);
    }
    if (t.project_id && !projectById[t.project_id]) errors.push(`${where}: unknown project_id "${t.project_id}".`);
    return true;
  });

  // ---- FAQ ----------------------------------------------------------------
  // needs_decision items never reach a production build.
  const faq = (faqFile.groups || [])
    .map((g) => ({
      title: g.title,
      items: (g.items || []).filter((item) => !(env.production && item.needs_decision)),
    }))
    .filter((g) => g.items.length);

  // ---- Generated images (written by scripts/make-assets.mjs) --------------
  let generatedImages = {};
  const manifest = path.join(ROOT, "assets/generated/images.json");
  if (fs.existsSync(manifest)) generatedImages = JSON.parse(fs.readFileSync(manifest, "utf8"));

  findContactDetails(pastClientsFile, "data/past-clients.json", errors);

  // Card logos (generated copies + display hints). Square-ish logos are sized by height,
  // wide ones by width. maxH = the file's pixel height, so a logo is never enlarged past 1x.
  for (const p of projects) {
    const img = generatedImages.projectLogos?.[p.id];
    if (!p.logo || !img) continue;
    const ratio = img.width / img.height;
    p.logoImg = { ...img, alt: `${p.client} logo`, shape: ratio < 1.6 ? "square" : "wide", maxH: img.height };
    // No logo_bg in the data: use the colour sampled from the logo's own background.
    if (!p.logo_bg) { p.logo_bg = img.sampledBg; p.logoBgSampled = true; }
  }

  // Officer-approved reversed logo (dark/photo backgrounds only). Supplied as a file,
  // never generated. Width/height are read from the PNG header so markup can set them.
  // The home hero requires it: a missing or non-PNG file stops the build.
  const reversedPath = path.join(ROOT, "assets/scg-logo-reversed.png");
  let reversedLogo = null;
  const head = fs.existsSync(reversedPath) ? fs.readFileSync(reversedPath).subarray(0, 24) : null;
  if (head && head.toString("ascii", 1, 4) === "PNG") {
    reversedLogo = { src: "/assets/scg-logo-reversed.png", width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  } else {
    errors.push("assets/scg-logo-reversed.png is missing or not a PNG. The home hero needs the officer-approved reversed logo; do not recreate it, ask the officers for the file.");
  }

  // Employers for "Where SCG Takes You": logo when downloaded, otherwise a text chip.
  const logoBySlug = generatedImages.logos || {};
  const slugify = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const employers = (site.member_employers?.names || []).map((name) => ({ name, logo: logoBySlug[slugify(name)] || null }));

  if (errors.length) {
    throw new Error(`Content check failed. Fix these in data/ and rebuild:\n  - ${errors.join("\n  - ")}`);
  }

  return {
    env,
    site,
    projects,
    projectsSorted,
    allSemesters,
    disciplines,
    featuredProjects: projects.filter((p) => p.featured),
    tracks,
    processSteps: processFile.steps || [],
    faq,
    pastClients: pastClientsFile.clients || [],
    team,
    alumni,
    peopleMajors,
    testimonials,
    employers,
    brand: { reversedLogo },
    generatedImages,
  };
}

// Names of everyone who has NOT consented. Used only by scripts/check-output.mjs
// to prove none of them leaked into the built site.
export function unpublishedNames() {
  const teamFile = readJson("team.json");
  const alumniFile = readJson("alumni.json");
  return [...(teamFile.board || []), ...(teamFile.members || []), ...(alumniFile.alumni || [])]
    .filter((p) => p.consent_to_publish !== true && p.name && !TBD.test(p.name))
    .map((p) => p.name);
}
