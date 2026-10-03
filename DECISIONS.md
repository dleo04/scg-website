# Decisions

Choices made where the spec was ambiguous, newest stage last. Each says what was decided and why.

## Stage 0 (kickoff, approved)

- **No unconsented names in any build, dev included.** A dev build can be deployed by mistake. `lib/load-data.js` drops anyone without `consent_to_publish: true` before templates run, and `scripts/check-output.mjs` fails the build if any unconsented name, email or phone number appears in `_site/`.
- **Git initialized** with the handoff package as the first commit, so each stage is a reviewable diff.

## Stage 1

- **Data stays in `data/` at the repo root**, not Eleventy's `src/_data/`. Officers get one obvious folder. The config loads it through `lib/load-data.js`, which validates it and explains errors in plain language (for example a duplicate project id or an unknown discipline).
- **New data files `data/tracks.json` and `data/process.json`.** The "Find your seat" and "How a project works" copy is content officers will edit, so it lives in JSON. Every "What you'd do" line names the project it comes from, and the projects listed under each track come automatically from `projects.json → disciplines`.
- **"Product & Design" track is described honestly.** Its only source project (Product Space) was outreach, benchmarking and process work for a product-design org, not design work. The track says that and has a visible `[TBD]` asking officers to add design-focused work if it exists.
- **"Good fit if you study" is labeled "(suggested)"** and copied from the inferred `fits` in `projects.json`. It never says members of a major did the work.
- **`site.json` additions:** `recruiting.closed_text` (closed-state copy comes from data, not hard-coded), `images.hero` / `hero_alt` / `hero_is_standin`, and `forms.client_request_endpoint` (null, used in stage 4).
- **Hero uses the old group photo as a stand-in**, as the spec allows, with a visible "Stand-in photo" tag until `hero_is_standin` is false. It is served as responsive WebP/JPEG (640/1024/1600w), generated from the 2558px original.
- **Placeholder rule:** any image path under `assets/placeholders/` is drawn as a labeled CSS block (no network request). The labeled placeholder image files exist too, so nothing 404s. Officers add a real photo by putting it elsewhere (for example `assets/photos/`) and updating the path. `scripts/make-assets.mjs` never overwrites an existing file.
- **CTA logic** (SPEC 5.4) lives in one filter. With no links set, the header button reads "Apply" and points to `/join/`, so the persistent button stays useful. In-page CTAs show a visible `[TBD link]` placeholder.
- **Build switches:** `SCG_ENV=production` (drops `needs_decision` FAQ items, and later dev-only markers) and `HIDE_PLACEHOLDERS=1` (removes placeholder blocks and `[TBD]` text, and collapses sections with nothing real to show). They are independent. With `HIDE_PLACEHOLDERS=1` the output check also fails if any placeholder remains.
- **Fonts are self-hosted** (`@fontsource` WOFF2, Latin subset, `font-display: swap`, two preloaded). No third-party request blocks rendering.
- **Logo clear space:** the PNG already has transparent margin of about 0.22× its height, and the "S" is 0.5× its height. The header and footer add 0.28× the logo height of padding to reach a full "S" of clear space. On dark backgrounds the logo sits on a white plate.
- **Square icons:** the supplied icon is 698×192, not square. The 180/192/512 icons place the full logo on a white square. It is legible but small, and a dedicated square mark from officers would be better.
- **Contrast:** every text pairing is annotated in `src/css/main.css`. Lowest text pairs: red on paper-2 6.58:1, red on gold-soft 6.3:1. Gold is only used on ink (9.3:1) or as fill. axe-core reports no violations on any route at 360 and 1280px.
- **Stub pages** exist for every nav route and every project (`noindex`, clearly marked "built in stage N") so navigation and card links work during the build. Later stages replace them.
- **Track illustrations** (1:1 slot from `PLACEHOLDERS.md`) are shown small inside each track panel: 140px on mobile, 240px on desktop.
