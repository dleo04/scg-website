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

## Stage 1g (hero rework: maroon tint, reversed logo, header hand-off)

- **Reversed logo not in the repo yet.** `assets/scg-logo-reversed.png` was not present when this stage was built. It was **not** created by the build team, because recoloring the logo is what the hard rule forbids, and the approval covers the officers' file. Everything is wired to pick it up with no code changes:
  - The loader reads its size from the PNG header.
  - The hero renders it at the specified widths.
  - The header hand-off turns on.
  - `npm run contrast` and `npm run hero-contrast` measure it.
  - Until it exists, dev builds show a labeled placeholder (listed in `TODO-CONTENT.md`) and the header logo stays visible, so the page always has exactly one logo.
- **The mechanics were verified with a temporary test block.** A plain white-and-gold rectangle labeled "TEST BLOCK / NOT A LOGO" was saved under the logo's filename, then deleted in the same run; it was never committed or deployed. Results:
  - Widths were 260/340/400/440px at 360/768/1280/1440 (height from the 668×184 ratio), with gaps to the H1 of 20px (mobile) and 28px (desktop).
  - At the top of the page the header logo was hidden, `aria-hidden="true"` and `tabindex="-1"` (Tab skipped it); after scrolling it was visible with both attributes removed.
  - With JS off it was always visible. Reduced motion made the fade effectively instant (0.01ms).
  - On a 360×740 phone the hero content ends at 471px, with no horizontal scroll.
- **Header hand-off trigger.** The header logo fades in when the bottom of the hero logo passes under the header (not at the bottom of the whole hero). This way two logos are never visible together and the solid header is never empty for long; the header still turns solid at 8px of scroll as before. The deferred state is rendered server-side (`data-logo-deferred`, hidden only under `.js`), so there is no flash of the header logo at load and no-JS users always see it.
- **Tint.** `--hero-tint: rgba(38, 8, 10, 0.72)` replaces the 62% ink overlay. White text against the photo's brightest pixel: 7.76:1 worst case. Measured behind each element in the browser: H1 7.80–8.12:1, subhead 7.80:1, EY line 7.80–8.13:1 at all four widths. The bottom fade into the stat strip is a separate element and was kept, so the stat strip looks unchanged (same CSS, same tile heights).
- **Logo contrast tooling.** Logo colors are grouped as near-white (all channels > 225) or near brand gold (within 45 of #F8A81E). Anti-aliased blend pixels are reported but not judged; an earlier, looser grouping wrongly counted blends as gold. Expected values for the real file: brand gold against this tint's worst-case pixel is about 3.9:1 (the test block measured 3.08:1 in the token check and 4.33–4.38:1 behind the logo in the browser) and white is above 7.7:1. Both need to be re-run once the officers' file is added.
- **CLAUDE.md** now allows the reversed variant on dark/photo backgrounds only. The original `scg-logo.png` is unchanged and still used in the header and footer.

## Stage 1h (real reversed logo, taller hero)

- **Reversed logo supplied by the officers** (`assets/scg-logo-reversed.png`, 1336×368 RGBA, white "SCG/SNIDER", gold "CONSULTING GROUP" and Maryland mark) and used as provided. The stage 1g placeholder and its CSS were removed. The file is now required: the loader stops the build with a clear message if it is missing or not a PNG, rather than recreating it. The image loads with `loading="eager"` and `fetchpriority="high"`.
- **Taller hero.**
  - Mobile is `max(620px, 85svh)` (with an `85vh` fallback), tablet (768+) `80vh`, desktop (1024+) `clamp(760px, 92vh, 960px)`.
  - The content block is centered. Top padding is header + 1px border + 96px, so the gap from the header to the logo box is at least 96px; it measured 96px on a 360×640 phone and 115–226px elsewhere.
  - Bottom padding `clamp(112px, 14vh, 168px)` keeps all text clear of the fade into the stat strip.
  - Measured heights: 663 (360×780), 819 (768×1024), 760 (1280×800), 828 (1440×900) and 960 (1920×1080, the cap).
- **Spacing is measured as visible gaps,** from the logo artwork to the text. The PNG has a 21.5% transparent margin above and below the artwork (0.0592 × its width), so the logo's bottom margin is `32px − 0.0592 × width`. Measured gaps at every width: 32px logo→H1, 20px H1→subhead, 28px subhead→EY.
- **Stat strip visibility.** At 1440×900 the top 72px of the strip (the numbers) shows without scrolling. At 1280×800 only the top 40px shows, since the 760px desktop floor takes most of the 800px viewport. At 360×780 it is 117px and at 768×1024 the whole strip.
- **The photo is centered** (`object-position: center`, was `center 45%`). The flat `--hero-tint` covers the whole taller hero.
- **Stand-in badge removed from the hero entirely,** in dev builds too. `TODO-CONTENT.md` still lists "images.hero is a stand-in" under the data facts. The community photo's dev-only badge is unchanged, since that block was out of scope.
- **Contrast, re-measured on the taller hero** with `npm run hero-contrast` (brightest pixel behind each element):

  | Viewport | H1 | Subhead | EY line | Logo white | Logo gold |
  |---|---|---|---|---|---|
  | 360×780 | 7.80 | 7.80 | 8.22 | 7.95 | 4.19 |
  | 768×1024 | 7.81 | 7.80 | 8.03 | 7.99 | 4.21 |
  | 1280×800 | 7.80 | 7.80 | 8.12 | 7.91 | 4.17 |
  | 1440×900 | 7.80 | 7.80 | 8.12 | 7.91 | 4.17 |

  The whole-photo worst case from `npm run contrast` is white text 7.76:1, logo white 7.60:1 and logo gold 3.80:1. Required minimums: text 4.5:1, logo 3:1.

## Stage 1i (solid sticky header site-wide)

- **This supersedes stages 1b, 1d and 1g** wherever they made the header transparent over the hero or hid its logo. The header is now sticky and solid white on every page at every scroll position, from first paint. The transparent-header CSS, the `is-solid`/`logo-in` scroll JavaScript, the `data-logo-deferred` markup and the `has-hero` body class were all removed. `site.js` no longer listens to scroll at all.
- **Size and style.**
  - The header is 60px tall on mobile and 72px from 1024px (`--header-h`), plus a 1px `--line` border, with a `0 1px 8px rgba(0,0,0,.08)` shadow.
  - The original logo has no plate: 36px tall on mobile, 44px on desktop. The required clear space (the height of the "S", 0.5 × logo height) comes from the header padding plus the PNG's built-in margin: about 20px against 18px needed on mobile, about 23px against 22px on desktop. The white plate is still used in the dark footer.
- **Join SCG** is now gold with ink text (9.31:1). It hovers to a new token, `--scg-gold-dark: #D98F0C` (ink on it 6.92:1). It was red over white before.
- **Nav links** are ink (18.42:1). Hover and the current page use red text with a 2px red underline (7.24:1). The focus indicator is the global 3px red ring (7.24:1 against the white bar). Social icons are outlined in ink, and the menu button has a 2px ink outline.
- **Without JS on small screens** the header is `position: relative`, because the link list is shown expanded and a tall sticky bar would cover the page. From 1024px it is sticky without JS too.
- **The hero starts below the header.** Its heights subtract `--header-h`: mobile `max(560px, 85svh − 60px)`, tablet `80vh − 60px`, desktop `clamp(688px, 92vh − 72px, 888px)`. Header plus hero together occupy the same space as before, so the stat strip still starts at about 829px at 1440×900 and the top 71px of it is visible. Top padding is `clamp(56px, 9vh, 96px)`. Measured gap from the header to the hero logo: 111px (360×780), 83px (360×640), 188px (768×1024), 143px (1280×800) and 168px (1440×900). The browser check fails if the logo or headline comes within 32px of the header.
- **Anchors.** `[id] { scroll-margin-top: var(--header-h) }` replaces the old `scroll-padding-top`, so `/#places-title` lands right below the bar; ui-check verifies this. Project deep links (`/#alliom`) open the modal dialog in the top layer above the header, so they are unaffected.
- **Hero contrast** re-measured with the new layout: text 7.80–8.61:1, logo white 7.91–10.37:1, logo gold 4.17–5.47:1.

## Stage 1j (hero copy, nav spacing, reversed footer logo)

- **Hero copy is data-driven.** It now lives in `site.json → hero` (`title`, `subhead`, `partner_line`).
  - The H1 is "Welcome to SCG", sized `clamp(2rem, 10vw, 5.5rem)` with `white-space: nowrap`. Measured on one line at every width: 32px at 320 (274 of 288px available), 36px at 360 (308 of 328px), 76.8px at 768, and 88px from about 880px up.
  - The subhead "UMD's student-run consulting group, solving real problems since 2020." is `nowrap` from 1024px. It is one line from 768px and two lines on phones.
  - The logo, its alt text and vertical spacing, the EY line and the hero height are unchanged.
- **Full name kept for SEO.** The home `<title>`, `og:title`, `og:site_name` and the JSON-LD `name` already carried "Snider Consulting Group". The home meta description (and therefore `og:description`) did not, so it now starts "Snider Consulting Group (SCG) is UMD's student-run consulting group…".
- **Nav spacing.** The desktop gap went from 2px to 10px, so there are 38px between link labels. Measured: one row and centered at 1024–1920px, with at least 33px of clearance before the social icons and Join SCG (at 1024px). The mobile menu is unchanged.
- **Footer logo.** The reversed logo now sits directly on black, with no plate, box, border or shadow: 200px wide on mobile and 240px from 768px. It links home with alt text "Snider Consulting Group" (the old alt was "…home"; the link destination is clear from context, and this matches the requested wording). A small negative margin lines its artwork up with the footer text column, since the PNG has about 5.9% empty space at each side. The `.logo-plate` style is no longer used anywhere and was removed. The header keeps the original red logo.
- **Footer contrast** (checked by `npm run contrast`): links and affiliation 18.42:1, tagline, note and copyright 11.30:1, link hover gold 9.31:1, logo white 17.00:1 and logo gold 9.05:1 on `--ink`. No footer colors needed changing.
- **Hero contrast** re-measured: H1 7.82–9.06:1, subhead 7.80–8.12:1, EY line 7.80–7.89:1, logo white 7.91–8.80:1, logo gold 4.17–4.63:1.
- **CLAUDE.md** notes that the reversed logo is used on the hero photo and in the black footer only.

## Stage 1k (logo leads the hero; seam above the stat strip removed)

- **Proportions.**
  - The reversed logo is now 280/400/480/540px wide at 360/768/1280/1440 (piecewise `clamp()`, `max-width: 82vw`, so 262px at 320).
  - The H1 is `min(clamp(2.5rem, 4.2vw, 4rem), 10.4vw)`: 40px up to 768, 53.8px at 1280, 60.5px at 1440, 64px cap.
  - The logo artwork measures 77–105% of the headline's width (92% at 1440; at least 70% was requested).
- **H1 at 360px (spec conflict).** "Welcome to SCG" at 40px is about 342px wide, but a 360px screen has 328px inside the gutters, so 40px and one line cannot both hold there. The `10.4vw` cap gives 37.4px at 360 (320px wide) and the full 40px from about 385px. Measured on one line from 320 to 1920px.
- **Visible gaps** (artwork to text, compensating the PNG's 21.5% built-in margin): logo→H1 56px from 1024, 44px from 768, 32px below; H1→subhead 20px; subhead→EY 28px. All measured exact at every width.
- **Hero height not increased.** The content already had comfortable room, so the stage 1i heights were kept. The request made 96vh conditional on running out of room, and it would also push the stat strip fully below the fold at 1440×900, which stage 1h asked to keep visible (it shows 71px).
- **Centering.** Top and bottom padding are now equal, `clamp(136px, 17vh, 180px)`, so the block is exactly centered: equal space above the logo and below the EY line at every width (for example 208/208 at 1440×900). The header-to-logo gap is 151–271px (at least 96px required). The EY line ends 57–144px above the start of the fade.
- **Cause of the line above the stat strip.** The photo sat behind both the hero and the strip. The hero ended in 86% white over the **tinted** photo, while the strip began with 86% white over the **untinted** photo, so brightness stepped up at the boundary (measured row averages 0.733 → 0.792). At 90%/110% zoom the boundary also fell on a fractional pixel that neither semi-transparent layer fully covered, leaving a dark row (0.685 / 0.635).
- **Fix** (removed at the source, not covered up):
  - The hero fade (`.hero::after`) is one smooth gradient that reaches opaque `--paper` 8px before its end and extends 2px past the hero edge.
  - The strip background is solid `--paper`, exactly the fade's final colour.
  - Measured afterwards: every pixel row within ±4px of the boundary is pure white (1.000) at 1x and 2x, at 90% and 110% zoom, and at 360, 768, 1280 and 1440px.
  - Unchanged: the stat dividers (`border-left` on items), the numbers, the labels and the spacing.
- **Contrast** re-measured on the actual pixels: H1 7.89–9.36:1, subhead and EY line 7.80:1, logo white 7.29–7.97:1, logo gold 3.84–4.20:1. Stat numbers are now red on solid white (7.24:1, up from 5.25:1 worst case on the wash).

## Stage 1l (Our Work cards: client logos, roomier body)

- **"Case Study N" badges removed.** The `work-card` component is the only place they existed; the project dialog and `/projects/<id>/` use `project-detail`, which never had them.
- **Client logos.** The supplied files `assets/logos/alliomlogo.jpeg` (200×200), `schoolharborlogo.png` (1534×512) and `productspacelogo.png` (939×266) are used unaltered. `projects.json` gains `logo` and `logo_bg` (documented in SPEC §6):
  - Alliom `#EA6F50` and School Harbor `#1E3557` are sampled from the logos' own edge pixels.
  - Product Space is transparent, so it gets the site's off-white `#F7F4EF`. Its brand purple would hide its purple lettering.
- **Generated copies** (in `assets/generated/projects/`) are lossless WebP plus PNG, proportionally resized to at most 1200×600 and never enlarged. Lossless matters here: lossy WebP shifted School Harbor's navy by one unit ((30,53,87) → (29,53,88)) and showed a faint box around the wordmark. With lossless output, the colour difference across every logo's box edge measures 0 at 1x and 2x.
- **Logo sizing.**
  - The image area is 16/11 rather than the suggested 16/10: at the desktop card width (390–406px), 16/10 gives about 245px, below the requested 260–300px. 16/11 gives 268–279px.
  - Logos are sized with container units of the tile, since percentage heights did not resolve reliably inside the grid tile.
  - Wide logos are 60% of the tile width. Square logos are sized by height, capped at half their file's pixel height so they stay crisp on 2x screens.
  - **The Alliom file is only 200px**, so it renders at 100px (25–45% of the tile height instead of about 55%). It grows to the target automatically when a larger file is supplied (≥ 400px, ideally SVG) and `logo` is updated.
- **Card body.**
  - Padding is 24px on mobile and 32px from 768px. There are 24px from the title to the first row and 26px between rows.
  - Labels are 17px (18px from 1024px), semibold. Body text is 16px (16.5px from 1024px) with line-height 1.6.
  - Icons are 28px on mobile and 32px from 768px, with 16px glyphs and a 16px gap. Each icon is vertically centered on its label's first line (measured offset 0px in every card at every width).
  - The section's content width grew to 1280px (28px gaps), so the text column is 278px at 1280 and 294px at 1440 (was about 261–273px), despite the larger padding.
  - Objective is still clamped to 3 lines and scope to 2; the full text is in the dialog.
- **Title underline.** It shows only on hover (pointer devices only, via `@media (hover: hover)`, so a tap no longer leaves a sticky underline) or keyboard focus. The stray underline on one title came from hover state during capture.
- **Focus ring bug fixed.** The stretched link's ring was drawn on its `::after` outside the card, and the card's `overflow: hidden` clipped it, so keyboard users saw only the underline (true since stage 1d). The ring is now drawn on the card itself (`.work-card:has(.card__link:focus-visible)`): 3px gold on the dark band, 9.3:1. ui-check now treats a `::after` ring inside a clipping card as invisible.
- **Equal height.** Cards are equal height with "Read more" at the same position on desktop (measured equal at 1280 and 1440).
- **Removed CSS.** The unused `.ph-inline` and `.chips--sm` rules were removed while rewriting this block; nothing has used them since stage 1d.

## Stage 1m (compact Our Work cards with banner tiles)

- **Banner tile.** The tile is 8/3. The desktop cards are 390–408px wide (not 590px), so it is 146–152px tall there, which is 30–31% of the card height, the requested "about a third". At 360px, 8/3 alone would give only 123px, so below 1024px the tile is clamped to 180–190px (measured: 180 at 360, 190 at 768).
  - **Bug found and fixed in the process:** the 180px minimum height made the browser derive a 480px minimum *width* through the aspect ratio, so mobile tiles overflowed the card and logos sat off-centre. Pinning the tile to `width: 100%; min-width: 0` fixed it; logos measure 0px off-centre at every width.
- **Logo sizing.** Wide logos are 55% of the tile width (School Harbor, Product Space); square logos are sized by height, all at most 55% of the tile height and 60% of its width.
  - Alliom is 79–83px tall on desktop rather than the suggested 90–100px. The 55%-of-height cap on a ~150px tile allows at most about 83px, and the cap takes priority. It is 98–100px on mobile and tablet.
  - Logos are still capped at half the file's pixel height, so they stay crisp at 2x.
- **Compact body** (all measured):
  - Padding 20px on mobile, 24px from 768px. The title is 22px with "(Fall 2025)" at 15px, then 16px to the first row.
  - Rows are 14px apart. Labels are 15px semibold with 2px below; body text is 15px at line-height 1.5.
  - Icons are 28px with a 14px glyph and a 12px gap, centred on the label's first line.
  - Objective and scope are both clamped to 2 lines.
  - "Read more" is pinned to the bottom with at least 16px above it. Cards measure 489×392 at 1280 and 495×408 at 1440 (was about 737×392), all three equal, with "Read more" at the same y.
- **"Alliom sits higher".** At rest all three cards measure at the identical top (1930.7px at 1440). The offset was the 4px hover lift with the cursor over that card. The lift is now limited to pointer devices with `prefers-reduced-motion: no-preference`. Before this change, reduced motion only removed the transition and the card still jumped 4px; it now stays still (verified).

## Stage 1n (card logo centring, icon centring, title spacing)

- **Why the logos sat low.** The tile was a grid with `<picture>` set to `display: contents`, so `<picture>`'s `<source>` child (which Chrome renders as `display: block`) became a second grid item. The grid then had an empty 34px row plus the logo's row, and the logo was centred in the lower row, 16–32px below the tile centre.
  - The tile is now a flex container (`align-items: center; justify-content: center`), `<source>` is `display: none`, and the image is `display: block`.
  - The dashed divider is a `border-bottom`, so it is outside the centring box.
  - ui-check now fails if a card logo's box is more than 3px off the tile centre.
- **Uneven margins inside the files** (artwork margins top/bottom/left/right in pixels):
  - Alliom 30/21/21/30 and School Harbor 125/149/256/255. These margins are opaque logo background, not transparency, so they are compensated with `logo_offset` in `projects.json`, as a fraction of the rendered logo size: Alliom `{x: 0.0225, y: -0.0225}`, School Harbor `{y: 0.0234}`.
  - Product Space 22/43/78/89, transparent. It now uses `assets/logos/productspacelogo-trimmed.png`, cropped 21px at the bottom and 11px at the right to symmetric 22/22/78/78. Its pixels are byte-for-byte identical to that region of the original, which is unchanged.
- **Measured** (artwork bounding box from 2x screenshots, excluding the rounded corners and the divider; offset of the artwork centre from the tile centre):

  | Width | Alliom Δy / Δx | School Harbor Δy / Δx | Product Space Δy / Δx |
  |---|---|---|---|
  | 360 | 0.0 / 0.0 | 0.0 / 0.3 | 0.5 / 0.0 |
  | 768 | 0.0 / 0.0 | −0.5 / 0.3 | −0.8 / 0.0 |
  | 1280 | −0.6 / 0.0 | −0.1 / 0.0 | −0.1 / 0.0 |
  | 1440 | −0.1 / 0.0 | −0.1 / 0.0 | −0.6 / 0.0 |

  The worst case is 0.8px (target ≤ 2px).
- **Icons centred against the whole row.** Each icon is vertically centred on the full row (label + body; measured 0px offset with one- and two-line bodies), sits in one left column per card, and has a 14px gap to the text. The request suggested moving the icon into a separate grid column. That would put a `<span>` directly inside the `<dl>`'s row `<div>`, which is invalid HTML (only `<dt>`/`<dd>` are allowed there), so the icon stays inside `<dt>` and is positioned against the row (`top: 50%` + `translateY(-50%)`). The visual result is the same.
- **Title spacing.** The gap from the title to the Objective row is 28px on desktop and 22px on mobile; the gaps between rows stay at 14px.
- **Cards at rest.** All three measure at the identical top at every width (for example 1930.7px at 1440). The offset you saw is the 4px hover lift under the cursor; it is not a layout issue.
