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

## How to add a team member or alumnus
People live in `data/team.json` (`members`) and `data/alumni.json` (`alumni`). Copy an existing entry and edit it:

- `id`: lower-case name with hyphens (`jane-doe`). It names the photo file too.
- Team: `name`, `level` (one of `levels` at the top of the file), `title` (e.g. "Vice Chair"), `cohort`, `experience` (one short line), `majors` (a list, or `null` if unknown; never guess), `worked_on` (project ids from `projects.json`, shown as chips), `linkedin` (full URL or `null`).
- Alumni: `name`, `graduation_year`, `majors`, `current_role`, `current_org`, `industry` (only if stated; otherwise `null`), `summary` (one sentence), `bio` (a list of paragraphs), `linkedin`.
- `consent_to_publish`: must be `true` or the person is not shown. Set it to `false` (or delete the entry) when someone asks to be removed. Never add emails or phone numbers; the build fails if it finds any.
- **Photo:** put the original as `assets/photos/people/<id>.jpg` (or .png/.webp) and run `npm run assets` (or `npm run build`). The face is found automatically and the photo is cropped around it (see "Headshot framing" below). No photo shows the person's initials instead.
- **Alumni pages:** every alumnus with more than a one-sentence bio gets a "Read bio" link, a drawer on `/alumni/` and their own page `/alumni/<id>/` (also in the sitemap). Nothing to set up; it follows `bio`.
- The major filter on `/team/` appears once at least three members have majors; the alumni industry filter lists whatever industries are filled in.
- The Alumni Report download appears on `/alumni/` when `site.json → alumni_report.file` points to a PDF.

## Headshot framing (team and alumni photos)
`npm run assets` (part of `dev` and `build`) finds the face in each photo in `assets/photos/people/` and writes what it found into the person's `photo` entry in `data/team.json` / `data/alumni.json`:

```json
"photo": {
  "source": { "file": "jane-doe.jpg", "width": 2560, "height": 1708 },
  "face":   { "x": 44.5, "y": 24.7, "w": 15.2, "h": 27.2 },
  "focal":  { "x": 52.1, "y": 38.4 }
}
```

All numbers are percentages of the original photo: `face` is the box around the face (left, top, width, height) and `focal` is its centre. From these it makes a square card image (600px, `/team/` and `/alumni/` cards) and a 4:5 portrait (600×750, the alumni bio), with the face centred left to right, its centre at half the height and about 38% of the frame width, leaving room for hair above and shoulders below. A photo that is already tight is cropped as close to that as it allows (never enlarged).

- **Override:** if a crop looks wrong, add `"focal_override": { "x": 50, "y": 35 }` to that `photo` (the point, in % of the original, that should be the centre of the face) and run `npm run assets`. The override always wins and is never overwritten.
- **New or replaced photo:** detection runs again by itself when the file name or size changes. `npm run faces` re-detects every photo.
- **No face found:** the build prints the name and uses a default crop (upper middle); add a `focal_override`.
- **Check by eye:** `npm run headshots:sheet` writes `scratch/reports/headshot-contact-sheet.png` (all crops with a centre crosshair; git-ignored).
- Face detection uses `@vladmandic/human` on the TensorFlow.js WebAssembly backend (installed with `npm install`; no system software needed).

## How to update the recruiting status and calendar
Everything on `/join/` that changes each semester lives in `data/site.json`:
- `recruiting.banner_label` / `banner_text` / `closed_text`: the status card at the top of `/join/` (for example "Spring 2027 recruitment · Interest form is open. · Fall 2026 applications are closed.").
- `recruiting.interest_form_url`, `recruiting.application_url`, `recruiting.open`: the button. While `open` is true **and** `application_url` is set, it says **Apply**; otherwise, if `interest_form_url` is set, **Join the interest list**. The same button sits in the mobile sticky bar.
- `recruiting.current_step`: the name of the calendar step that is happening now (it is highlighted and opens first).
- `timeline.steps`: the recruiting calendar. Give a step a `date` (`"2027-01-20"`) and it shows the date and an **Add to calendar** (.ics) download; add `time` (`"18:00"`, Eastern), `duration_minutes` and `location` for a timed event. Steps without a date show no date text. `optional: true` adds an "Optional" pill. `description: null` shows no text.
- `links.resume_guide`: the Resume guide link under Resources.

## How to change the photos (About and Join)
Photos are listed in `data/photos.json` (`id`, `source`, `alt`, `caption`, `pages`). To add one, put the original in `reference/old-site/_photo-candidates/` (or name an image from the old site in `source`), add an entry with honest alt text, and run `npm run old-photos`; it writes `assets/photos/<id>.jpg` (max 1600px, about 250KB, location data removed). `npm run old-photos -- --scan` downloads every candidate photo from the old site for review (logos, screenshots and individual portraits are skipped). Group, event and activity photos only; never individual portraits without consent.

## The "Life in SCG" gallery (/about/)
Photos are listed in `data/gallery.json`: `file` (an image under `assets/`, usually `assets/photos/`), `width`, `height` (pixels; filled in by the build if left out), `alt` (what is visible) and optional `order`. To add one, put the file in `assets/photos/` and add an entry; `npm run build` makes the 640px thumbnail and the 1600px lightbox copy. Remove an entry to take a photo down. The rows are laid out automatically.

## Interview prep downloads and About figures
- `site.json → downloads`: the PDFs on `/join/prepare/` (files in `assets/downloads/`). Remove an entry to hide it; an entry whose file is missing is skipped automatically.
  - **Hiding a PDF:** add `"published": false` to its entry. It disappears from the cards and the viewer, gets no cover and is not copied to the site, but the file and entry stay in the repo. The SICC December 2023 case prompt is hidden this way; delete its `"published": false` and run `npm run build` to bring it back.
  - **Adding a PDF:** put the file in `assets/downloads/`, then add `{ "title", "file": "assets/downloads/<name>.pdf", "kind", "description" }` to `downloads` and run `npm run build`. The build (`scripts/make-pdf-covers.mjs`) renders page 1 into a cover (`assets/pdf-covers/<name>.webp`) and counts the pages. The card then gets the cover, a **Preview** button (in-page viewer, deep link `/join/prepare/#preview=<name>`) and **Download PDF**. The PDF itself is never changed.
- `site.json → links.resume_guide`: shown as the "Resume guide" card on `/join/` and embedded on `/join/prepare/`. A Google Slides link is embedded automatically (`/embed` form) and must be shared as "Anyone with the link can view"; any other link becomes a plain card.
- `site.json → member_stats`: the "Leaders across campus" numbers on `/about/` (count-up). Update the values when they change.
- `site.json → mission`, `pillars`, `benefits`, `press`: About text, the three pillars, the five "What you get" cards on `/join/` and the four "SCG elsewhere" links.
- Each `benefits` entry has `image` (a photo id from `data/photos.json`, i.e. `assets/photos/<id>.jpg`), `focal` (`"50% 35%"`: the point kept when the photo is cut to 16:10, so faces stay in frame) and `alt` (what the photo shows). Change them and run `npm run build`; the 16:10 crops are made automatically.
- `data/process.json`: "How a project works" on `/about/`. A step with `"text": null` is hidden on the live site; `example` links a step to a project (it opens that project's dialog) or a page.
- `data/tracks.json`: the four tracks in **Find your seat** on `/join/`.
  - Tile: icon, `name`, `short` (one line) and logos of up to three recent projects tagged with that discipline in `projects.json`. The logos are picked automatically, avoiding repeats across tracks.
  - Panel: the three `what_you_do` items marked `"panel": true`, the first 5 `skills`, the first 5 `fits` (so order both lists by importance), and the same projects as cards. Keep the longer lists; they are still used for matching.
  - Every `what_you_do` item must name a real project (`project`).
  - Matching: what a visitor types is compared (partial, case-insensitive, up to three comma-separated terms) with each track's name, `fits` and `skills`, and more weakly with the fits and skills of its projects. To make a word find a track, add it to that track's `fits` or `skills`.
  - The five suggestion chips are set in `src/join/index.njk`.

## Work With Us: Services and Contact us
"Work With Us" in the header is a dropdown (Services → `/work-with-us/`, Contact us → `/work-with-us/contact/`); the header's `nav` list in `src/_includes/partials/header.njk` defines it, like Join SCG.
- **Connect the request form:** set `site.json → forms.client_request_endpoint` to your form service's URL (for example a Formspree form URL) and rebuild. The real form then replaces the "Request by email" composer automatically. It posts `name`, `organization`, `need`, `timeline`, `email` and the hidden spam trap `_gotcha`; without JavaScript it is a normal form post.
- **Until then** (`null`), the Contact page shows the composer: the same fields, and a "Write the email" button that opens the visitor's email app with a message to `forms.client_request_fallback_email` (now `scgumd@gmail.com`, the club address from the old Contact page). Never put a personal email there; the build fails on any other address.
- **Services text:** `site.json → work_with_us` (intro, the five "How an engagement works" points, the closing line) is the old Services page's own wording. The two cost cards are the FAQ answer "How much do SCG services cost?", one sentence each, so edit it in `faq.json`.
- **Service cards:** `work_with_us.help` (title, one line, icon, a `/projects/` link with `q=` or `track=`, and `examples` that picks up to three client logo chips from matching project skills or tracks).
- **Contact page text:** `site.json → contact` (intro, checklist, "What happens next", photo id). "Questions from clients" lists the FAQ's "For clients" group (drafts and open decisions left out).
- **Banner:** the Contact page uses the Services banner until a photo named `contactimage` is added under `assets/` (`page_banners → fallback_same_as`).

## Faded page backdrop (every page)
A faint, fixed photo of McKeldin Mall sits behind every page; light sections are transparent so content sits directly on it, while cards, form fields, dialogs, banners, dark bands, header and footer stay solid.
- **Turn it off for one page:** in `site.json → page_backdrops.pages` add `"/that-page/": false` (`"default": true` covers every page not listed, including project and alumni pages).
- **Strength:** `page_backdrops.visibility` (`"23%"`), the photo's opacity over the page colour. 23% is the highest strength at which every text colour keeps 4.5:1 over the darkest part of the photo; `npm run contrast` re-checks it on every build.
- **Picking a strength by eye:** `npm run dev:notes` shows a small panel (bottom left) with an on/off switch and a 0–30% slider (starts at 23%). It never appears in the live site.
- **Photo:** `page_backdrops.image` is a file name anywhere under `assets/` (now `assets/pictures/mckeldinbackground.jpg`; keep sources in `assets/pictures/`, which is not published). `npm run assets` (or `npm run backdrop`) makes the processed files in `assets/backdrop/`.
- Without JavaScript, if the image fails, in print, in high-contrast (forced colours) mode or with reduced data, pages keep their solid white/beige colours.

## How to change a page banner
The header of `/projects/`, `/join/`, `/join/prepare/`, `/about/`, `/team/`, `/alumni/`, `/work-with-us/` and `/partners/` is a banner: a photo under a maroon-black tint, or, while a page has no photo, a plain maroon-black gradient. Settings live in `data/site.json → page_banners`, keyed by the page's URL:
```json
"/about/": { "source": "aboutimage", "band": 2, "focal": "50% 50%", "tint": 0.78 }
```
- **Add a photo to a page that has none yet:** save it anywhere under `assets/` (for example `assets/photos/`) named `partnersimage` (or `prepareimage` once the Prepare entry no longer uses `same_as`) (any extension, any capitalisation) and run `npm run build`. It is picked up automatically.
- **Replace a photo:** drop in a new file with the same name (`projectsimage`, `joinscgimage`, `alumniimage`), or point `source` at another file name or path.
- `band`: which quarter of the photo's height becomes the banner: 1 = top (0–25%), 2 = 25–50%, 3 = 50–75%, 4 = bottom (75–100%). Phones get the same band widened evenly to 16:9.
- `focal`: which part of that strip stays visible when the screen crops it (`"50% 30%"` = centre, a bit above the middle).
- `windows` (optional, used on `/team/`): exact `[top%, bottom%]` crops for `desktop`, `tablet` and `mobile` when a band would cut off people's faces.
- `tint`: keep it between 0.78 and 0.8.
- `same_as` (used by `/join/prepare/`): `{ "same_as": "/join/" }` shows exactly the same banner as that page, reusing its image files. To give Prepare its own photo again, replace the entry with `{ "source": "prepareimage", "band": 2, "focal": "50% 50%", "tint": 0.78 }`.
- `npm run build` runs `scripts/make-banners.mjs`, which crops the original (it is never changed) into `assets/banners/` as WebP and JPEG under 220KB. Then run `npm run banner-contrast`; it must say OK.
- Record where every photo comes from in `assets/PHOTO-CREDITS.md`.
