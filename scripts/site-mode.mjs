// Builds the site in one of two modes. This is the ONE launch switch: the GitHub Pages workflow
// (.github/workflows/pages.yml → SITE_MODE) and local builds both call it, so the settings for
// each mode live only here.
//
//   node scripts/site-mode.mjs preview      # GitHub Pages preview (default in the workflow)
//   node scripts/site-mode.mjs production   # sniderconsultinggroup.com
//
// preview:    served from https://dleo04.github.io/scg-website/ → every internal URL gets the
//             /scg-website/ prefix, absolute URLs use the github.io address, every page has
//             <meta name="robots" content="noindex"> and robots.txt disallows crawling.
// production: served from the domain root → no prefix, absolute URLs (canonical, Open Graph,
//             JSON-LD, sitemap, robots.txt) use https://sniderconsultinggroup.com, no noindex,
//             robots.txt allows crawling, check:notes must pass (SCG_ENV=production also drops
//             every dev-only marker), and _site/CNAME is written so GitHub Pages keeps the custom
//             domain on every deploy.
// Both run the full `npm run build` (images, Eleventy, privacy check, check:notes, redirects
// check, contrast check). Variables a mode does not use are cleared, so a stray value in the
// shell can never leak into the other mode.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const MODES = {
  preview: {
    env: {
      PATH_PREFIX: "/scg-website/",
      SITE_URL: "https://dleo04.github.io/scg-website",
      PREVIEW_NOINDEX: "1",
      // Keep "0": the preview fails on dev notes exactly like production. "1" would let a
      // preview deploy with notes (printed as warnings); production ignores it.
      SKIP_CHECK_NOTES: "0",
      SCG_ENV: "",
    },
    cname: null,
  },
  production: {
    env: {
      PATH_PREFIX: "",
      SITE_URL: "https://sniderconsultinggroup.com",
      PREVIEW_NOINDEX: "",
      SKIP_CHECK_NOTES: "",
      SCG_ENV: "production",
    },
    cname: "sniderconsultinggroup.com",
  },
};

const mode = process.argv[2];
if (!MODES[mode]) {
  console.error(`Usage: node scripts/site-mode.mjs <${Object.keys(MODES).join("|")}>  (got "${mode ?? ""}")`);
  process.exit(1);
}
const { env, cname } = MODES[mode];
console.log(`[site-mode] ${mode}: ${Object.entries(env).map(([k, v]) => `${k}=${v || "(unset)"}`).join(" ")}`);

const childEnv = { ...process.env };
for (const [k, v] of Object.entries(env)) {
  if (v) childEnv[k] = v;
  else delete childEnv[k];
}
const run = spawnSync("npm", ["run", "build"], { cwd: ROOT, env: childEnv, stdio: "inherit", shell: process.platform === "win32" });
if (run.status !== 0) process.exit(run.status ?? 1);

const cnameFile = path.join(ROOT, "_site", "CNAME");
if (cname) {
  fs.writeFileSync(cnameFile, `${cname}\n`);
  console.log(`[site-mode] wrote _site/CNAME (${cname})`);
} else if (fs.existsSync(cnameFile)) {
  fs.rmSync(cnameFile);
}
