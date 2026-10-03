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

## Stage 1b (home rebuild per `docs/HOME-LAYOUT.md`)

- **Restored files removed by the package update.** Copying the updated handoff package over the repo deleted `data/tracks.json`, `data/process.json` and the generated placeholders, and reset `data/site.json`. The rebuild prompt says to keep those components and their data for `/join/`, `/about/` and `/partners/`, so they were restored from git, and the stage 1 `site.json` fields were re-applied on top of the new file.
- **Project dialog built now, not in stage 2.** "Our Work" cards must open the dialog, so the dialog and the shared `project-detail` component exist now with the full SPEC 6 behavior: focus trap, focus return, Escape/backdrop/close button, prev/next buttons and arrow keys, deep links, Back closes it, scroll lock, and the reduced-motion-safe animation. `/projects/<id>/` pages render the same component as the no-JS fallback. Stage 2 adds the explorer, filters and per-project SEO.
- **Prev/next on Home cycles through the three featured projects**, the ones visible on the page.
- **One header everywhere.** The blueprint's nav (Projects, Join SCG, Team, Alumni, Work With Us, plus Instagram, LinkedIn and Join SCG) replaces the "Who We Are" dropdown on every page, because different navigation per page fails WCAG 3.2.3 (Consistent Navigation). About, Partners and Interview prep are linked in the footer. The header is transparent only on pages with a hero (`bodyClass: has-hero`) and turns solid after 8px of scroll. Without JS it is a solid dark bar in the page flow.
- **Header "Join SCG"** links to the application while `recruiting.open` and `application_url` are set, otherwise to `/join/`. The label stays "Join SCG" as the blueprint specifies.
- **Hero overlay is 62% ink** (`--hero-overlay` in CSS). Measured against the brightest pixel of the actual quad photo, white text is at least 5.15:1 (55% would fail at 4.07:1). `npm run contrast` re-measures this whenever the hero photo or token changes, and the build runs it.
- **The H1 stays white.** A gold accent word over the photo would only reach about 2.6:1, so the accent-word treatment is used on the H2s instead: red on white, gold on ink.
- **Card title hover stays red with an underline.** The blueprint allows gold on hover, but gold text on a white card fails contrast (1.98:1).
- **Stat strip** shows only `verified: true` stats (max 4). Below 560px it stacks in one column, which the blueprint allows, because "4+ years" does not fit three columns at 360px.
- **Testimonials:** loaded through the consent filter. A consented entry still containing `[TBD]` fails the build, and `check-output` fails if any unconsented quote text appears. No autoplay, so WCAG 2.2.2 needs no pause control. The dots are 44px buttons with `aria-current`, and arrow keys move between them. In dev, with no consented entries, a small placeholder shows. In production nothing renders.
- **Member employers** (EY, Deloitte, Capital One, KPMG, Bain & Company, BCG, Booz Allen Hamilton, Johnson & Johnson) moved into `site.json → member_employers` with their source noted, as text tiles until logos are supplied. The optional 3-stat row under them is omitted, since no verified alumni figures exist.
- **Copy rule applied site-wide:**
  - `site.tagline` is now the blueprint's draft "Student-run consulting at the University of Maryland" (used in the footer).
  - `site.description` drops "students from every major" (it feeds meta descriptions, Open Graph and the manifest).
  - The home `<title>` drops "for Every Major", replacing SPEC 9's title pattern.
  - `recruiting.banner_text` drops "All UMD majors welcome".
  - Two stub descriptions were reworded.
- **Recruiting banner** is hidden on Home (`hideBanner: true`) and still appears on other pages while recruiting is open.
- **Stand-in photo tags** (hero quad and community group photo) show in dev builds only. `SCG_ENV=production` drops them; the TODO list still tracks both.
- **The reference screenshot never ships.** It lives in `docs/`, outside the Eleventy input and passthrough globs, and `check-output` fails the build if any `layout-reference` file or "UConsulting" text appears in `_site/`.
- **`[hidden]` is forced to `display: none !important`** site-wide, after a component's own `display: flex` was found to override it.
- **Breakpoints:** two-column blocks start at 768px. The employer grid uses 4 columns when the card is wide (520–767px single-column, and 1100px+) and 2 otherwise. "Our Work" cards stack, max 600px wide, until 1024px, then sit three across.

## Stage 1c (hero and stat strip refinement)

- **Hero has no buttons.** "See our projects" and "Join SCG" were removed; the header already carries Projects and the Join SCG button. The H1, subhead and EY line are vertically centered, with similar space above (about 205-230px including the header) and below (about 200-215px including the fade), measured at 360-1920px.
- **One-line subhead on desktop.** The font is `clamp(1rem, 1.6vw, 1.5rem)`, max-width is `min(1200px, 100%)`, and `white-space: nowrap` applies from 1100px up. Measured: one line from 1024px (it already fits there), 994px wide at 1280 and 1118px at 1440, always inside the container. It wraps to 2 lines at 768 and 3 balanced lines at 360. No horizontal scroll from 320 to 1920px.
- **Stat strip = 50+ Alumni, 40+ Client projects, 15+ Placements each year,** all `verified: true`. These figures were supplied by SCG leadership in the stage 1c request (2026-10-03), as recorded in `site.json → stats_readme`. They were not derived by the build team.
- **Old strip facts moved, not deleted.** Founded 2020, Free to join and EY partnership 4+ years now live in `site.json → facts` for /about/ and /join/. The unverified "Majors represented" item moved there too, so it stays on the TODO list.
- **Three columns on mobile.** The three stats fit as compact columns at 320-360px: labels drop to 11px with tighter tracking and may wrap to two lines, and items are top-aligned so the numbers line up. This replaces the earlier stacked layout.
- **No stat row in "Where SCG Takes You",** so the same figures do not appear twice on the page.
- **Stand-in hero badge** was already limited to dev builds and is confirmed absent from the `SCG_ENV=production` output.
- `docs/HOME-LAYOUT.md` wireframe and block notes updated to match.

## Stage 1d (home refinements: community copy, shorter cards, hero logo, employer logos)

- **Community copy** replaced with the final text supplied by SCG. The "[TBD: signature tradition]" placeholder is gone, since the semesterly hikes cover it.
- **Shorter project cards.**
  - The image is now 2.2:1 (`aspect-ratio: 11 / 5`). The title is 24px, row labels 17px semibold, body 16px at 1.5 line height, and the icon circles 44px.
  - Rows are 10px apart. "Read more →" (15px, red) replaces "View project". Skill chips moved off the card; they remain in the dialog and on project pages.
  - Objective is clamped to 3 lines, Scope to 2, Impact to 2. A missing outcome shows a muted, italic one-line "Results coming soon" that is still tracked as a placeholder.
  - Measured at 1280–1440px: all three cards are 376×529 (height/width 1.41, against about 1.37 in the reference) and equal in height.
- **Scope line.** The `scopeLine` filter joins the first two scope items and lowercases the second item's first letter only if that word never appears capitalized mid-sentence in the project's own text, so "Google SQL…" keeps its capital. An optional `scope_summary` field in `projects.json` overrides it.
- **Hero logo.** The unaltered logo sits on a white plate (18px radius, soft shadow), 300px wide on desktop and 220px on mobile. The plate padding gives full "S"-height clear space. The hero's min-height grew to `clamp(600px, 90vh, 780px)` to fit it. The stack stays centered, with about 180–220px above (including the header) and 190–210px below (including the fade), and nothing overflows at 320–1920px.
- **One logo at a time.** The header turns solid and shows its logo when the bottom of the hero logo passes under the header, rather than at 8px of scroll. Until then the header logo has `visibility: hidden` (so it is not focusable) and `aria-hidden="true"`. Without JS the header logo stays hidden on the home page, where the hero logo is the visible one. The browser check verifies both states.
- **Employer logos.**
  - `data/logo-sources.json` lists the 8 files from the old site. `npm run logos` downloads them once, checks the content type and decodes each file to confirm it is a real image, and records width and height in `assets/logos/logos.json`. All 8 downloaded.
  - The originals (11–280 KB) are committed but not published. The build makes proportional WebP and PNG copies (at most 360×120, 3–15 KB each) without recoloring or trimming.
  - Each logo is sized for equal visual area, capped at 40px tall and the tile width, so the 9:1 Bain wordmark and the square Booz Allen tile read with similar weight.
  - Logos show at 80% opacity and 100% on hover. They are not links, so there is no focus state.
- **"Where SCG Takes You" stays one column until 1024px.** That gives the 4×2 logo grid room at tablet widths. The grid uses 2 columns below 520px so the logos stay legible.
- **Trademark footnote** added to the site footer, worded as requested.
- **Asset copying narrowed** so only the published files reach `_site/`; the logo originals and `logos.json`, which holds the old host's URLs, stay in the repo.

## Stage 1e (logo card: third row, single white card)

- **Four logos added** (JPMorgan Chase, Strategy&, Morgan Stanley, Accenture) to `data/logo-sources.json` and `site.json → member_employers`, as row 3 in that order. All 12 downloaded. Each new file was opened and checked:
  - **JPMorgan Chase:** the Chase octagon with a "J.P.Morgan" wordmark.
  - **Strategy&:** the "pwc strategy&" mark.
  - **Morgan Stanley:** the official navy square with white lettering, not a logo on white (the file's corner pixel is navy).
  - **Accenture:** the Accenture wordmark.
- **Auto-trim in `fetch-logos.mjs`.**
  - The untouched downloads go to `assets/logos/originals/`; trimmed PNGs go to `assets/logos/<slug>.png`.
  - A margin is trimmed only if the corner pixel is transparent (tolerance 1) or near-white (tolerance 64). The near-white tolerance is high enough to also remove a faint gray edge line in the Strategy& file.
  - Logos that sit on a colored tile (Booz Allen, Morgan Stanley) are left untrimmed, so the tile itself is never cut.
  - Every trimmed logo was compared with its original; no part of any mark was removed.
- **Even grid.**
  - Every tile is the same box (76px tall) at every width: 124–125px wide at 1280–1440, 155 at 768, 135 at 360.
  - Logos are contained (`object-fit: contain`) and capped at 40px tall and 80% of the tile wide; `logoBox` gives each about the same area.
  - 80% instead of the suggested 70%: at 70% the very wide Bain and Johnson & Johnson wordmarks would drop to about 9px tall. Even at 80%, Bain is about 10px tall at desktop, which is inherent to its 9:1 shape.
- **One white card.** The card background is #FFFFFF (it was `--paper-2`), keeping its 1px `--line` outline, 16px radius and soft shadow. Tiles lost their background and border but keep the same size and gaps, so the layout is unchanged. The heading stays red (now 7.24:1 on white, up from 6.6:1 on `--paper-2`).
- **No hover effect.** The tiles are not links, so the earlier reduced-opacity-until-hover treatment was removed and logos show at full color. The white JPG backgrounds of the JPMorgan and Strategy& files blend into the white card.

## Stage 1f (hero logo reverted)

- **The stage 1d hero logo is removed,** as requested. The hero is back to the H1, the one-line subhead and the EY line, with the pre-logo sizing (`min-height: clamp(520px, 80vh, 660px)`, top padding = header + 48px).
- **The header logo plate is visible at all times again,** including over the hero. The hide-until-scrolled logic and the `aria-hidden` toggling were removed, and the header turns solid after 8px of scroll as before. The hero/header CSS, `site.js` and the header markup now match the stage 1c version exactly; this was checked with `git diff`.
- **The stage 1d "one logo at a time" entry no longer applies.** The browser check now asserts the reverse: the header logo is visible and exposed to screen readers both before and after scrolling, and the header plus `<main>` contain exactly one SCG logo image.
- Everything else from stages 1c–1e is unchanged.
