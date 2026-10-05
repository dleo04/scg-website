# SCG website handoff package

This folder is a ready-to-use starting repo for Claude Code. It contains the spec, the project data, brand assets and staged prompts. It does not contain the site code; Claude Code builds that.

## How to use
1. Create an empty folder on your computer, copy everything from this package into it, and open it with Claude Code.
2. Paste `prompts/00-kickoff.md` first. It makes Claude Code read everything and propose a plan without building.
3. After you approve the plan, paste `prompts/01-foundation.md`, review the result, then `02`, `03` and `04` in order. Each prompt stops for your review.
   - If the first home page feels cluttered or cliche, paste `prompts/01b-home-rebuild.md` (it rebuilds the home page from `docs/HOME-LAYOUT.md`).
   - Do NOT put the UConsulting zip in the repo; the blueprint plus one screenshot (`docs/reference/`) is all Claude Code needs.
4. The rules that must hold the whole time live in `CLAUDE.md`, which Claude Code reads automatically. That is why you do not need to paste one giant prompt.

## What is in here
- `CLAUDE.md`: standing rules and goals.
- `docs/SPEC.md`: pages, components, design tokens, interaction spec, SEO/accessibility targets, definition of done.
- `data/`: `projects.json` (client projects from Spring 2025, Fall 2025 and Spring 2026), `faq.json`, `site.json`, `past-clients.json`, `alumni.json`, `team.json`.
- `assets/`: logo, icon, favicon, a stand-in group photo, and `PLACEHOLDERS.md`.
- `prompts/`: five prompts for Claude Code.

## What you still need to supply (officers)
See the "Open decisions and content needed" list in the chat message that came with this package. In short: project outcomes/approach/team info, team and alumni consent and majors, recruitment dates and links, real photos, and a few policy decisions (the 5% claim, the five-semester rule).

## Privacy note
Your project spreadsheet contained individual contact names and emails. I deliberately left those out of `projects.json` so they cannot end up on a public site.

## Development notes and the "no notes" check
The live site never shows team notes (placeholder labels, `[TBD]` text, "Stand-in photo" badges). They are hidden by default and only appear when you ask for them:

| Command | What you get |
|---|---|
| `npm run dev` | Local preview at http://localhost:8080, exactly as visitors see it (no notes). |
| `npm run dev:notes` | Local preview **with** every note visible (labels, `[TBD]` markers, stand-in badges), so you can see what content is still missing. Development only. |
| `npm run build` | Production-style build in `_site/`. Fails if any page contains a dev note (see below). `SCG_ENV=production` ignores `SHOW_PLACEHOLDERS` entirely. |
| `npm run check:notes` | Re-checks the last build: fails if any page's HTML contains `TBD`, `TODO`, `placeholder`, `PHOTO:`, `not supplied`, `Stand-in`, `lorem ipsum` or `data/` (case-insensitive), and lists page + context for each hit. |
| `npm run todo` | Rebuilds a notes-on copy in `.notes-site/` and writes `TODO-CONTENT.md`: every missing item by page, plus facts still to supply in `data/`. |

When content is missing, the public site shows a finished fallback instead of a note (for example, "Results coming soon." on projects, no contact line in the footer until a club address exists). Fill in the item in `data/*.json` and it appears automatically.

## How to add a project
Projects live in `data/projects.json`, one object per **client tile**; the card, the dialog and the page `/projects/<id>/` are generated from it.
1. Copy an existing project object and give it a new `id` (lowercase letters, digits and dashes, e.g. `campus-food-pantry`). The `id` becomes the URL.
2. Fill in `title`, `client` and `client_type` (use one of the existing types). Add `disciplines` (from the list at the bottom of the file) and `fits` when you have them.
3. Add one engagement under `"engagements"`: `semester` (e.g. "Spring 2026"), `tagline` (one sentence, shown as the card's Objective), `challenge`, `scope` (a list of deliverables), `skills`, and `"outcome": null` until there is a result. Leave `approach`, `team` and `links` empty if unknown: the site hides those parts until they are filled (the card shows "Results coming soon" for a missing outcome).
4. Logo (optional): put the client's logo file in `assets/logos/` unedited and set `"logo": "assets/logos/<name>"` (the extension may be left off; png, jpg, webp, avif and svg work). `logo_bg` is the tile color behind it; leave it out to use the dominant color of the logo's edge, or set a hex color. Without a logo the card shows the client's name on a neutral tile.
   - If the file has wide empty margins, run `npm run trim-logos -- assets/logos/<file>`. It writes `<name>-trimmed.png` next to the original (the original is not changed) and prints the `logo_bg` to use; point `logo` at the trimmed copy. For a textured background add `:60` after the file name to raise the color tolerance.
   - If the visible artwork still looks off-centre (for example white details on a light tile), set `"logo_offset": {"x": 0, "y": -0.03}` (fractions of the logo's size).
5. Set `"featured": true` to put it on the Home page (Home shows the first three featured projects, in file order). On `/projects/` tiles are sorted newest semester first.
6. Run `npm run build`. It checks the data (a duplicate `id`, a malformed semester, an unknown discipline) and the "no notes" rule. Never add individual contact names, emails, fees or payment terms.

### A returning client (a second semester)
Do not create a new tile. Add another object to that client's `"engagements"` list with its own `semester`, optional `title` (e.g. "Colorado school data API"), `tagline`, `challenge`, `scope`, `skills` and `outcome`. The card switches to the newest engagement, the title reads e.g. "(Spring & Fall 2025)", the dialog and page show one section per semester (newest first), and the Semester filter finds the tile under every semester. Two separate projects for the same client in the **same** semester are separate tiles instead; they link to each other automatically.

## How to update the recruiting status and calendar
Everything on `/join/` that changes each semester lives in `data/site.json`:
- `recruiting.banner_label` / `banner_text` / `closed_text`: the status card at the top of `/join/` (for example "Spring 2027 recruitment · Interest form is open. · Fall 2026 applications are closed.").
- `recruiting.interest_form_url`, `recruiting.application_url`, `recruiting.open`: the button. While `open` is true **and** `application_url` is set, it says **Apply**; otherwise, if `interest_form_url` is set, **Join the interest list**. The same button sits in the mobile sticky bar.
- `recruiting.current_step`: the name of the calendar step that is happening now (it is highlighted and opens first).
- `timeline.steps`: the recruiting calendar. Give a step a `date` (`"2027-01-20"`) and it shows the date and an **Add to calendar** (.ics) download; add `time` (`"18:00"`, Eastern), `duration_minutes` and `location` for a timed event. Steps without a date show no date text. `optional: true` adds an "Optional" pill. `description: null` shows no text.
- `links.resume_guide`: the Resume guide link under Resources.

## How to change the photos (About and Join)
Photos are listed in `data/photos.json` (`id`, `source`, `alt`, `caption`, `pages`). To add one, put the original in `reference/old-site/_photo-candidates/` (or name an image from the old site in `source`), add an entry with honest alt text, and run `npm run old-photos`; it writes `assets/photos/<id>.jpg` (max 1600px, about 250KB, location data removed). `npm run old-photos -- --scan` downloads every candidate photo from the old site for review (logos, screenshots and individual portraits are skipped). Group, event and activity photos only; never individual portraits without consent.

## Interview prep downloads and About figures
- `site.json → downloads`: the PDFs on `/join/prepare/` (files in `assets/downloads/`). Remove an entry to hide it; an entry whose file is missing is skipped automatically.
- `site.json → member_stats`: the "Leaders across campus" numbers on `/about/` (count-up). Update the values when they change.
- `site.json → mission`, `pillars`, `benefits`, `press`: About text, the three pillars, the five "What you get" cards on `/join/` and the four "SCG elsewhere" links.
- `data/process.json`: "How a project works" on `/about/`. A step with `"text": null` is hidden on the live site; `example` links a step to a project (it opens that project's dialog) or a page.
- `data/tracks.json`: the four tracks in the `/join/` matcher. The matcher searches each track's `fits` and `skills`; every "What you'd do" item must name a real project.

## How to change a page's banner photo
The photo behind the header of `/join/`, `/join/prepare/`, `/about/`, `/team/`, `/alumni/`, `/work-with-us/` and `/partners/` is set in `data/site.json → page_banners`, keyed by the page's URL (pages not listed use `"default"`):
```json
"/team/": { "image": "assets/photos/group-campus-lawn.jpg", "position": "50% 12%", "position_mobile": "50% 20%", "tint": 0.78 }
```
- `image`: any photo in the repo (calm area where the text sits, no legible text or logos). For a new photo, add it to `assets/photos/` (or `data/photos.json` + `npm run old-photos`) and list its source in `assets/PHOTO-CREDITS.md`.
- `position`: which part of the photo shows (x% y%; `50% 0%` = top centre). `position_mobile` (optional) for phones.
- `tint`: the maroon-black overlay, 0.78 to 0.8. Lower values make the small gold label fail contrast over bright skies.
- Then run `npm run build` (it makes the 800/1600px WebP and JPEG files under 200KB) and `npm run banner-contrast`, which must say OK.
