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

## Stage 1o (stat count-up)

- **Implementation.** Vanilla JS in `site.js` and CSS, no libraries. An IntersectionObserver (threshold 0.4) fires once and then disconnects. If its first callback already reports the strip in view, the count starts after 300ms. Each number animates from 0 to its target in 1600ms (easeOutCubic, requestAnimationFrame), staggered 120ms left to right.
- **Data-driven.** The `parseStat` filter splits each `site.json → stats` value into prefix, number and suffix ("50+", "1,200+", "$3M" all work). Numbers are formatted with `toLocaleString("en-US")` at build time and `Intl.NumberFormat("en-US")` in the browser. Verified with a scratch data copy ("45+", "1,200+"): it counted 102, 269 … 1,083 … 1,200 and screen readers got "1,200+".
- **Accessibility.**
  - The final values are rendered in the HTML.
  - Each `<dd>` has a visually hidden static copy for screen readers, and the animated digits are `aria-hidden`. This is used instead of an `aria-label` on the stat: `aria-label` on a `<div>`/`<dd>` is not announced reliably and axe flags it on generic elements. No `aria-live`.
  - Reduced motion and no-JS both show the final numbers (verified; values never change).
- **No layout shift.** Digits use tabular figures and a `ch`-based `min-width` for the final length. The script locks each number's measured final width before resetting to 0 and releases it when finished. Digits are right-aligned inside that box, so the "+" never moves.
- **Verified in Chrome:**
  - In view on load at 1440×900 and 360×780; scrolled into view at 1440×640, 768×600 and 360×560.
  - Fires once (still final after scrolling away and back). Labels never move and the "+" positions are constant during the count.
  - Layout shift attributed to the stat strip is 0.0000 in every case. The page's tiny total (0.0001–0.0004) is a single shift about 27ms after load in the nav links and the hero EY line during the web-font swap. It existed before this change and is far below the 0.1 "good" threshold.
- **Frame sequences** (not committed): `.ui-check/countup-frames-360.png` and `countup-frames-1440.png`.

## Stage 1p (no testimonial placeholder; EY partnership band)

- **Testimonial placeholder removed.** "Client testimonials appear here" and its `[TBD]` note are gone from the home page in every build (it previously showed in dev). `data/testimonials.json` and the carousel partial are kept; the carousel renders only when an entry has `consent_to_publish: true`. `TODO-CONTENT.md` now reads "Client testimonials: add quotes with written permission to data/testimonials.json to enable the section."
- **Space below "View all projects".** The "Our Work" band now has `padding-bottom: clamp(72px, 7vw, 96px)`. Measured below the button: 72px at 360/768, 90px at 1280, 96px at 1440.
- **EY band.** It sits between "Our Work" and "Where SCG Takes You" and is data-driven from `site.json → partners[EY].band` (`text`, `logo`, `logo_alt`, `url`).
  - **Background:** the same hero photo with a bottom crop (`object-position: 50% 92%`) under the same flat `--hero-tint`, with no borders. Edges are flush: 0px gaps above and below.
  - **Logo:** the existing `assets/logos/ey.png` (fetched earlier for the employer grid; no new download) via its generated copy, unaltered, on a white plate (padding 10px 16px, radius 12px), 36px tall from 768px and 30px on mobile.
  - **Text:** 20px from 768px, 15px on mobile, white Montserrat 600, uppercase, letter-spacing .12em, with balanced wrapping on mobile ("IN PARTNERSHIP WITH / ERNST & YOUNG").
  - **Layout:** logo to the right from 768px, below on mobile.
  - **Height:** 160px from 768px. On mobile it is about 145px rather than 120px, because at 360px the phrase needs two lines and the plate stacks below it; padding and gap were already trimmed for mobile.
  - **Contrast**, measured against the brightest photo pixel behind the text: 7.83:1 (360), 9.14:1 (768), 8.80:1 (1280), 9.44:1 (1440). `npm run hero-contrast` now includes the band.
- **Link.** The phrase and logo link to https://www.ey.com/en_us in a new tab (`rel="noopener noreferrer"`), with a visually hidden "(opens in a new tab)" and a 3px gold focus ring. Linking a named corporate partner's public site from a partnership band is appropriate, and `site.json` already listed EY's URL. Setting `band.url` to `null` renders the band unlinked.
- **Docs.** The section order is now hero, stats, community, our work, EY band, where SCG takes you, footer. `docs/HOME-LAYOUT.md` and the CLAUDE.md "six blocks only" rule were updated to that order, so a future session does not remove the band as an extra block.

## Stage 1q (EY band: reversed logo, bigger type)

- **No white box.** The source `assets/logos/ey.png` was already transparent (grey #808080 lettering, yellow #FFE700 beam). The white box came from the plate this band used, which is now removed.
- **`assets/logos/ey-reversed.png`** is generated by `scripts/make-ey-reversed.mjs` (committed) from the unmodified `ey.png`:
  - The grey lettering ("EY" and the tagline) becomes pure white with each pixel's original alpha kept, so the soft edges carry over and there are no halos.
  - The beam keeps its exact colours and alpha. Verified: all 126,843 beam pixels and the alpha of all 712,138 visible pixels are identical to the source.
  - A luminance-to-alpha step for opaque white backgrounds is included for future source files, but this source did not need it.
  - **No 2x upscale** (spec deviation): the source is 2558×1276, about 17× the 72px display height, so upscaling would only grow the file. The build makes a lossless WebP/PNG copy at most 288px tall.
  - `ey.png` is unchanged and still used in the employer grid on white. CLAUDE.md records the reversed EY logo as an approved variant for dark/photo backgrounds only, and TODO-CONTENT.md asks for EY's official reversed logo.
- **Tagline legibility.** At 1440 (logo 72px) "Building a better working world" renders at about 9–10px and is clean and readable on 2x screens. At 360 (52px) it is about 7px: small but readable on 2x, with no halos. An official vector reversed logo would be crisper at small sizes.
- **Sizes.**
  - The phrase uses `clamp(1.375rem, calc(1.078rem + 1.4vw), 2.5rem)` instead of the literal `clamp(1.375rem, 2.6vw, 2.5rem)`. The literal formula gives 22px at 768, not the stated 28px; this one hits the stated targets: 22.3px at 360, 28px at 768, 35.2px at 1280, 37.4px at 1440.
  - Logo heights are 52/56/64/72px with a 28px gap in a row and 16px when stacked.
- **Layout.** One row from 1024px, with phrase and logo vertically centred on each other (measured 0px). Stacked below 1024px: at 768 the phrase at 28px plus the logo need about 817px side by side, but only 720px is available.
- **Band heights.** 220px at 1280/1440 (74–78px above and below the content); 227px at 768 and 244px at 360, slightly over the ~200/~220 targets because the stacked content plus the required 56px above and below needs that much. Content is exactly centred (60/60px when stacked).
- **Contrast** (`npm run hero-contrast`, brightest photo pixel behind each element, stable across runs): text 7.80 / 8.54 / 8.76 / 9.21:1, EY lettering 7.81 / 11.61 / 9.48 / 9.58:1, beam 6.21 / 9.22 / 7.53 / 7.61:1 at 360 / 768 / 1280 / 1440. The tint did not need darkening.
  - The check now takes one capture of the whole band and retries if it shows only flat ink. A first version read 18.78:1 at 1280 because one capture caught a frame before the photo had repainted.

## Stage 1r (EY band: tighter tracking, EY letters aligned with the phrase)

- **Letter-spacing.** The phrase goes from .1em to .04em, at the same size, weight and colour. Phrase plus logo now take 950px at 1280 and 1016px at 1440 of the 1248px container: one row, comfortably inside it.
- **No trim needed.** `ey-reversed.png` already had 0px transparent margin on every side (the source was trimmed when first fetched), so no trimmed copy was saved. A copy written during the check was byte-identical and was removed.
- **Alignment (measured, not guessed).**
  - From the file's pixels: the beam spans rows 0–420, the "EY" letters 608–1275 and the tagline 885–1232 of 1276. The EY letters' centre therefore sits at 73.82% of the image height, 0.2382 × height below the image-box centre.
  - In the browser: the phrase's capitals are centred within 0–0.02 × font-size of the text-box centre.
  - Both boxes are centred on the same flex line, so `--ey-logo-offset: calc(-0.2382 * var(--ey-logo-h) - 0.01 * var(--ey-phrase-fs))` is applied as `transform: translateY(...)`. It is row layout only (≥ 1024px), visual only, and keeps working as both sizes scale.
- **Proof.** Two independent methods measured the EY-letter centre minus the caps centre, in CSS px:
  - *Pixel scan* (photo blacked out, white pixels located at 2x) and *bounding rect* (`getBoundingClientRect` × the file geometry):

    | Width | Before | Pixel scan | Bounding rect |
    |---|---|---|---|
    | 1024 | n/a | −0.30 | −0.32 |
    | 1280 | +15.75 (EY too low) | +0.20 | +0.15 |
    | 1366 | n/a | +0.50 | +0.38 |
    | 1440 | +17.50 (EY too low) | −0.01 | −0.12 |
    | 1920 | n/a | −0.28 | −0.40 |

  - A third, coarser check on the zoomed 1440 crop reads −1.38px, because it includes the "&" and the overshoot of the round letters. All are within the 2px target.
- **Unchanged:** logo size (52/56/64/72px), the 28px row gap and 16px stacked gap, centring on mobile, contrast (text 7.80–9.21:1, EY lettering 7.81–11.61:1, beam 6.21–9.22:1), and no horizontal scroll. In the row, the raised beam sits 56px from the band's top edge at 1440 (the minimum), with 87px below the content.

## Stage 1s (dev notes off the public site)

- **Default flipped.** Dev notes were shown by default and hidden with `HIDE_PLACEHOLDERS=1`. They are now hidden by default and shown only with `SHOW_PLACEHOLDERS=1` (`npm run dev:notes`). `getEnv()` forces them off when `SCG_ENV=production`, even if the flag is set (verified). `HIDE_PLACEHOLDERS` is gone.
- **Removed from the default and production build** (found by scanning `_site` and the templates; before: 142 "TBD", 58 `data-todo`, 58 `data-placeholder`, 16 "PHOTO:", 1 "Stand-in" across 14 pages):
  - **Home `/`:**
    - The Community "Stand-in photo" badge (`src/index.njk`). The hero badge was already removed in stage 1h.
    - In the project dialog templates (`components/project-detail.njk`): the "PHOTO: <project> team (16:9)" tiles and the "Approach / Outcome / Team details coming soon" blocks with `[TBD: …]`.
    - The `data-todo` / `data-placeholder` attributes on the cards' "Results coming soon" (`components/work-card.njk`).
  - **Every page:** footer `[TBD: shared club contact email or contact form]` (`partials/footer.njk`). The line is now omitted until `site.links.contact_email` exists; no contact details are invented.
  - **`/projects/<id>/`** (5 pages, `components/project-detail.njk`): the PHOTO tile and the Approach/Outcome/Team note blocks.
  - **Stub pages** `/projects/`, `/join/`, `/join/prepare/`, `/about/`, `/team/`, `/alumni/`, `/partners/`, `/work-with-us/` (`layouts/stub.njk`): "This page is built in stage N of the site build." and `[TBD: page content, stage N]`.
  - **Not currently visible but gated the same way:** the recruiting banner's `[TBD link]` (`partials/banner.njk`), the placeholder Apply button and the generic placeholder blocks (`components/ui.njk`), and the `tbd` filter's `[TBD …]` spans (`lib/filters.js`, which strips the markers in public mode).
- **What replaces them** (finished, no empty boxes or headings):
  - **Project dialog and pages:**
    - Outcome shows "Results coming soon." (the same public copy as the cards).
    - Approach and Team are omitted until they have content; Team shows only the fields that exist.
    - Challenge and Scope are omitted if ever empty.
    - No image block until a real project image exists.
  - **Stub pages:** "This page is being prepared and will be available soon." plus a "Back to the home page" link. This is new public copy, flagged for review.
  - **Footer:** the contact item is simply absent.
- **Kept on purpose:**
  - "Results coming soon" on the cards and "Results coming soon." on project pages: intentional public copy.
  - The new stub sentence (please confirm the wording).
  - "(suggested)" after "Good fit if you study": public copy explaining inferred fits.
  - Alt text is all visitor-facing (logos named, the group photo described, decorative backgrounds `alt=""`), and aria-labels read naturally. No HTML comments (Nunjucks `{# #}` comments never reach the output) and no `console.*` calls in `src/js`.
- **Guard.** `scripts/check-notes.mjs` (`npm run check:notes`) runs in `npm run build` / `build:prod`. It fails on any of "TBD", "TODO", "placeholder", "PHOTO:", "not supplied", "Stand-in", "lorem ipsum" or "data/" in any built HTML.
  - Current build: OK, 14 pages, 0 hits. Production build: OK.
  - Proven to catch leaks: run against a notes-on build it reports 275 hits.
  - It skips (with a message) when `SHOW_PLACEHOLDERS=1`.
- **TODO-CONTENT.md.** `npm run todo` now renders a notes-on copy into `.notes-site/` (git-ignored) and lists every note by page from that copy, so the list stays complete while the real site stays clean. It now includes "Hero and community photos are stand-ins; replace with real photos and confirm photo license", alongside contact email, testimonials, outcomes, approach and team details.
- **Verified** on all 14 routes at 360 and 1440px: no visible placeholder elements, no heading-only sections, no empty paragraphs or list items, no horizontal scroll; ui-check (axe, keyboard, 4 widths) and contrast pass.

## Stage 2 (Projects explorer)

- **One card, one detail, one tile.**
  - `/projects/` renders the Home card (`components/work-card.njk`) unchanged. Its tile is now the shared `components/logo-tile.njk`, also used for the dialog/page banner.
  - The dialog and `/projects/<id>/` share `components/project-detail.njk`.
  - Home measured pixel-identical before and after (0 differing pixels, full page, at 360 and 1440).
- **Projects without a logo.**
  - The live tile shows the client's name typeset on a neutral background. That is real content, not an invented logo or a placeholder.
  - `npm run dev:notes` shows a labeled "LOGO: …" placeholder instead.
  - SCG Internal Project's client is SCG itself, so it uses the original `scg-logo.png` on white (`logo_bg: #FFFFFF`). UMD Dynamic Dance has no logo yet (listed in TODO-CONTENT.md).
- **Missing sections are omitted on the live site.** This applies to Challenge, Scope, Approach, Outcome, Team and Links. Team shows only its filled fields.
  - Read literally, the stage 2 request keeps "Results coming soon" only on the cards' Impact row, so the dialog and page no longer show an Outcome section until there is an outcome. This changes stage 1s, where project pages showed "Results coming soon." It is a one-line switch if you prefer the earlier behaviour.
  - `dev:notes` shows the missing sections as labeled placeholders, and TODO-CONTENT.md lists the omitted fields per project.
- **Dialog header and sections.** The logo banner (3/1, 150–210px tall) comes first. The title is in the card style with "(semester)": red, 26px. Sections are compact (15px labels, 15px/1.6 body, hairline dividers), in the SPEC §6 order plus a **Disciplines** chip section after Skills.
  - The title takes programmatic focus (announced by screen readers) but shows no ring, since it is not interactive. The dialog's buttons and links keep their rings. This also changes the shared detail used on Home's dialog: the earlier red ring on the title is gone.
- **Filters.**
  - Search covers title, client, summary, tagline and skills. Semester and Client type are selects. "Good fit for" is multi-select with its own search box and closes with Escape. Track is multi-select chips.
  - A group renders only when the data has at least two distinct values. With the current data Semester is hidden; the sixth-project test showed it appearing automatically.
  - State goes in the query string via `replaceState`, and closing the dialog keeps it. The count is `aria-live="polite"`. "Clear all filters" appears when anything is active and returns focus to Search. The empty state has its own Clear button.
  - The bar is progressive enhancement: hidden until the script runs, so no-JS shows all cards as links.
  - On mobile everything but Search sits behind a "Filters (n)" toggle. The fit panel is right-anchored and capped to the viewport.
  - The search field uses a visible label and no `placeholder` attribute, which keeps it accessible and keeps check:notes clean.
- **Dialog prev/next follow the visible (filtered) cards.** A cold deep link like `/projects/?track=Data+%26+Engineering#school-harbor` opens at "2 of 2"; the filter script now loads before the dialog script so the first label is right.
- **Project pages.**
  - Now indexable (`noindex` removed). Each has its title "<Project> (<semester>) | Snider Consulting Group", tagline as description, canonical and OG tags.
  - Visible breadcrumbs plus `BreadcrumbList` JSON-LD, whose first item is "Snider Consulting Group".
  - Previous/Next project links (file order, no wrap; stacked on mobile) and "Back to all projects".
- **Verified:**
  - An explorer end-to-end test, all passing: keyboard-only filters (type-ahead select, fit panel, chips, clear), URL sync, live count, empty state, card → dialog → Escape focus return, cold filtered deep link, prev/next within the filter, Back keeping the filter, Home deep link, accessible names, and no-JS.
  - ui-check: 14 routes × 360/768/1280/1440, axe clean, no horizontal scroll (after the fit-panel fix).
  - Contrast: 30 pairings pass. JS is 6.0KB gzipped in total (budget 60KB). `check:notes`: 0 hits.
  - **Sixth-project test:** temporary entry added at the top of projects.json, featured, no logo, new semester. It appeared on Home (card plus dialog), on /projects/ (6 cards; the Semester filter appeared; filtering to its semester showed 1 of 6), in the dialog, and on its own page with title and JSON-LD, all with zero code changes. The file was then restored byte-for-byte.

## Stage 2b (Spring 2025 relabel, engagements, 12 more projects)

- **Semester fix.** Alliom, School Harbor, Product Space, UMD Dynamic Dance and SCG Internal were Spring 2025, not Fall 2025. They are relabelled everywhere (data, cards, dialogs, pages, filters, titles/OG/JSON-LD, docs). Older DECISIONS entries keep their historical wording.
- **Repeat-client rule.** A client that returns in a different semester keeps ONE tile with several `engagements`. Parallel projects for the same client in the same semester stay separate tiles and link to each other ("Also for DefenX: …"). The five existing projects were migrated to one engagement each; old flat projects are still read as one engagement (`lib/projects.js`), so nothing broke.
- **Card.** The card shows the latest engagement's Objective, Scope (first two items) and Impact. The semester label follows the requested pattern: "(Fall 2025)", "(Spring & Fall 2025)", "(Fall 2025 – Spring 2026)" (unit-checked, including three semesters in one year and duplicates). Skills and disciplines are merged across engagements for the dialog/page chips.
- **Dialog and page.** One section per engagement, newest first, headed with its semester in red small caps plus the title when present. Each section has Challenge / Scope / Approach / Outcome, omitted when empty. The engagement's tagline appears inside its section for multi-engagement tiles; single-engagement tiles keep the tagline under the title.
- **Order and filters.**
  - `/projects/` sorts newest latest engagement first, then A–Z. Home keeps file order, so its three featured cards stay Alliom, School Harbor, Product Space; School Harbor's card now shows its Fall 2025 objective and "(Spring & Fall 2025)".
  - The Semester filter (Spring 2026 / Fall 2025 / Spring 2025) matches a tile if any engagement is in that semester.
  - Search also covers `short_name` (MPDS, ULR, SER) and every engagement's title and tagline.
- **Count: 15 tiles, not 14.** That is 5 existing plus 10 new (Hy-Swap, Wind Terpines, BBB, SpeechPundit, DefenX ×2, MPDS, ULR, SER, FBLA). School Harbor's and SCG Internal's Fall 2025 work are engagements on their existing tiles, and the two DefenX projects are parallel, so they are separate tiles. There are 17 engagements in total.
- **Client types (no new categories).**
  - Existing names reused: Startup (SpeechPundit, both DefenX), UMD student organization (Wind Terpines, BBB, MPDS, ULR, SER, FBLA), Internal (SCG).
  - **Hy-Swap has no client type.** It is a local community nonprofit, and none of the existing types (Startup, Education organization, UMD student organization, Internal) describe it truthfully, so the field is left empty: it simply does not appear in the client-type filter or meta row. Recommendation: add "Nonprofit / community organization" if you agree. This is flagged in TODO-CONTENT.md.
- **Tracks** use the existing four values. DefenX Financial Management is Strategy & Research only, because the existing Data & Engineering tags are used for ML/SQL/dashboards, not financial modelling. SCG Internal gains Strategy & Research for its Fall 2025 strategy work.
- **Good fit (`fits`).** Filled only from what each scope implies, reusing existing values (Marketing, Communication, Management, Business, Finance, Economics, Design, Information Science, Pre-law interest), all `fit_inferred: true`. TODO-CONTENT.md lists each project's inferred fits and disciplines for review.
- **Logos.**
  - None of the nine new logo files (hyswaplogo, windterpineslogo, bbblogo, speechpunditlogo, defenxlogo, mpdslogo, ulrlogo, serlogo, fblalogo) are in the repo.
  - `logo` now accepts a name without an extension: dropping e.g. `assets/logos/hyswaplogo.png` into the folder switches that tile from the client-name tile to the logo on the next build. `logo_bg` is sampled from the logo if not set (neutral `#F7F4EF` for transparent files). Both DefenX tiles point to the same `defenxlogo`.
  - Until then, the client name is set in Montserrat bold on `--paper-2`, the existing name-tile treatment.
  - SCG Internal now uses the approved reversed logo on `#141414`, an approved dark-background use recorded in CLAUDE.md.
  - Logos measure within 0.5px of the tile centre (768 and 1440).
- **Bug fixed.** Project page `<title>`/`og:title`/description were double-escaped ("&amp;amp;", "UMD&amp;#39;s"): the computed title was escaped once by the template and again by the head. It is now escaped once.
- **Privacy.** Only the supplied text was used. There are no individual names, emails, phone numbers, fees, payment terms, scoping notes or video links; the build's contact-detail check passes.
- **Verified:**
  - Explorer test, all passing: semester filter for each semester (School Harbor and SCG Internal under both 2025 semesters), client type, track, short-name search, older-engagement search, DefenX cross-link inside the dialog, cold filtered deep link, prev/next within the filter, Back, and no-JS (15 cards, pages render).
  - ui-check: 24 routes × 360/768/1280/1440, axe clean, no horizontal scroll.
  - Equal-height rows (535/507px at 1440).
  - Contrast: 30 pairings plus the hero pass. `check:notes`: 0 hits on 24 pages.

## Stage 2c (client logos on the project tiles)

- **Files matched** (case-insensitive, any extension), all in `assets/logos/`. Originals are unchanged (checksums compared before and after).

  | Project | File used | `logo_bg` | Why that colour |
  |---|---|---|---|
  | DefenX Financial Management, DefenX Client Outreach | `defenxlogo-trimmed.png` (from `defenxlogo.png`) | `#F7F4EF` | transparent, dark artwork → `--paper-2` |
  | FBLA at UMD | `fblalogo-trimmed.png` (from `.jpg`) | `#F3AB19` | the file's own gold edge |
  | MPDS | `debatelogo-trimmed.png` (from `.jpg`, tolerance 60) | `#D8213F` | the shell-panel red around the cropped artwork |
  | Smith Equity Research | `smithequitylogo.png` (untrimmed) | `#5A5A5A` | dominant edge grey of its gradient |
  | Undergraduate Law Review | `undergraduatelawlogo-trimmed.png` (from `.jpg`) | `#980B2D` | the file's own maroon edge |
  | Business Beyond Borders | `businessbeyondborderslogo-trimmed.png` (from `.jpg`; nothing to trim) | `#9C0C0C` | the red corners around the white circle |
  | Hy-Swap | `hyswaplogo-trimmed.png` (from `.avif`) | `#FDFEFE` | the exact near-white of the file's border |
  | SpeechPundit | `speechpunditlogo-trimmed.png` (from `.jpg`) | `#FFFFFF` | the file's white background |
  | UMD Dynamic Dance | `dynamicdancelogo-trimmed.png` (from `.jpg`) | `#000000` | the file's black background |
  | Wind Terpines | `windterpineslogo-trimmed.png` (from `.png`) | `#F7F4EF` | transparent, dark artwork → `--paper-2` |

- **Wind Terpines.** The brief said it had no logo yet, but `windterpineslogo.png` is in `assets/logos/` (added with the other files), and the brief's own rule is "logo if the file exists". It is therefore shown. To go back to the client-name tile, delete `logo` and `logo_bg` from that project.
- **Trimming.** `npm run trim-logos` (`scripts/trim-logos.mjs` + `lib/logo-tools.js`):
  - Reads the dominant colour of the outer 2px ring (or detects transparency) and crops to the artwork's bounding box.
  - Ignores a stray 1px export frame line (the Debate file has one down its right edge).
  - Writes `<name>-trimmed.png` losslessly; pixels are copied, never recoloured or resized.
  - It also prints the dominant colour of the trimmed copy's own edge (what actually touches the tile), which is the `logo_bg` used.
  - `make-assets` now samples `logo_bg` the same way (dominant edge colour instead of one corner pixel) whenever `logo_bg` is omitted.
- **Smith Equity Research is untrimmed.** Its background is a grey radial gradient (lighter towards the left/bottom-left, #5A at the top/right). Cropping cut into the light part and made a hard-edged box, so the full file is used on its dominant edge grey and the visible artwork is centred with `logo_offset {x: 0.0518, y: -0.0695}`. A lighter box is still visible on the left side; no flat fill can match a gradient. **Needs a transparent or flat-background version from SER.**
- **MPDS.** The artwork sits on a textured shell pattern. The crop around the text and flag keeps faint fragments of the shell lines, which end at the crop edge. Barely visible at card size; a flat-background version would remove them.
- **Wind Terpines offset.** The turbine blades have white outlines that are invisible on the light tile, so the visible artwork sat ~3px low; `logo_offset {y: -0.0289}` centres the visible part.
- **Sizing (CSS only; no card/dialog/page layout change).** Square/tall logos are now 50% of the tile height (was 55%); wide logos stay at 55% of the width, max 55% of the height. The cap is now 1x the file's pixel height (was ½ for 2x crispness); no logo is enlarged past its own size.
- **Resolution.** On the dialog/page banner (210px tall), SpeechPundit (451×172 after trimming) shows at 303×116, so 1.5 device pixels per CSS pixel. That is sharp on standard screens and slightly soft on 2x/retina screens. Alliom (200×200) shows at 1.9x. All other logos have 2x or more everywhere. A larger SpeechPundit file would help.
- **Measured centring** of the visible artwork (pixels > 40 levels from `logo_bg`, from 2x captures) for all 15 tiles on the /projects/ cards, the dialog banner and the project page banner at 768, 1280 and 1440: worst offset 0.88px (requirement: 2px). The measurement script reads the dialog from viewport crops; element screenshots of the top-layer dialog are unreliable.

## Stage 3A (header, About, Join, Prepare)

- **Old site export.** The six archives in `reference/old-site/` (names without `.zip`) are unzipped into `about-us/`, `alumni/`, `home/`, `interviews/`, `partners/` and `recruitment/`, with no `__MACOSX` folders. One alumni-page screenshot whose file name has an invalid byte could not be extracted; it is a screenshot, so it would have been skipped anyway. `reference/` is git-ignored, ignored by Eleventy (input is `src/`, plus an explicit ignore), never copied and never linked.
- **Header.** The order is Projects, Join SCG, About, Team, Alumni, Work With Us. This supersedes SPEC's "Who We Are ▾" dropdown; Partners and Interview prep live in the footer sitemap.
  - At 1024px six links left only 8px before the icons, so between 1024 and 1279px the link padding is 9px with a 2px gap: 39px of clearance on each side.
  - At 1280px and up the spacing is unchanged (101px clearance). Measured as one row at 1024, 1280 and 1440, and the mobile menu has six 48px links.
- **Photos** (`npm run old-photos`, `scripts/fetch-old-photos.mjs`).
  - `--scan` parses the old HTML for `img1.wsimg.com` images and downloads the **original** (largest) file of each candidate into the git-ignored `reference/old-site/_photo-candidates/`.
  - It skips logos, screenshots, `blob-*`, favicons, PNG/WebP graphics, files named "headshot" and alumni-page-only images. About 20 of the 54 candidates were still individual team headshots from the old About page; they stay out of the repo and the site.
  - I reviewed every candidate and chose **14 group, event and activity photos** (`data/photos.json`, with old filenames). They are optimized to at most 1600px on the long edge, JPEG of about 250KB or less (river-social is 279KB at the quality floor), with EXIF and GPS removed, plus 480/960px WebP and JPEG thumbnails.
  - Alt text describes what is visible. Captions use only what the photo or the old filename shows ("EY site visit", "Semester hike"). None is used as the home hero.
- **About.**
  - The story timeline uses only `site.json`: established and established_at, the EY partner blurb with "4+ years" from facts, the CSVC/SICC blurb ("Every year"), and today's verified stats. No years were invented for the EY partnership.
  - The pillars are tightened from the old text (`site.json → pillars`) as expandable cards. The face and the details share one grid cell, so opening never changes the height. Hover reveals the details on pointer devices; the button works by keyboard and touch; without JS all text is visible.
  - "How a project works" is an interactive stepper (`data/process.json`). It shows the five grounded steps; "Handoff" is hidden until officers describe it, and "Team forms" keeps a TODO for team size and roles. The Deliverables step opens School Harbor's dialog (both engagements' Scope); Client request links to Work With Us.
  - The dark band shows EY (reversed logo, now also approved for this band in CLAUDE.md) and the Smith/Ed Snider Center lockup from the old site, unaltered on a white plate. The text is the partner blurbs.
  - The photo mosaic has an accessible lightbox: native modal, Tab loop, Esc, Left/Right arrows, swipe, caption plus "n of N", and focus returns to the tile. Without JS, each tile links to the 1600px JPEG.
  - Member statistics come from the old About page (2 / 7 / 13 / 9 / 4 / 11) in `site.json → member_stats`, with the Home count-up (now supports several strips per page). "Confirm figures are current" is in TODO.
  - The four learn-more links have no ranking or superlative language.
- **Join.**
  - **Status card.** From the old Recruitment page: "Spring 2027 recruitment", "Interest form is open.", "Fall 2026 applications are closed." The Spring 2027 interest form URL is now `recruiting.interest_form_url`, so the CTA follows SPEC 5.4: "Join the interest list". The Resume guide link comes from the same page. `recruiting.current_step: "Interest form"` drives the calendar highlight.
  - **Matcher.**
    - It is a combobox with type-ahead (WAI-ARIA 1.2), a maximum of three picks, quick chips, and an "I'm not sure yet: show all four tracks" path.
    - Vocabulary is each track's own `fits` (from projects' inferred fits) and `skills`. Matching tracks show best first, with the matched chips highlighted and a polite status line. Without JS it is the four tracks as a static list.
    - Wording is "Good fit if you study or enjoy… (suggested)"; no major is said to have done a track. Each track links to `/projects/?track=<name>`.
    - `tracks.json` gained what-you-do items from the new projects (School Harbor's API, DefenX FM and Outreach, SpeechPundit's UX brief, BBB's transition guide). The Product & Design `[TBD]` item was removed (noted in `_readme`).
  - **What you get.** A bento of the five old benefits, reworded. The EY years come from the verified fact. "Semester hikes" matches the approved Home copy. One photo (painting social) fills the bento.
  - **Recruiting calendar.**
    - The steps are Interest form, Application, Interviews, Decision and Onboarding. It uses the same stepper as About, on the dark band, opening on the current step.
    - No dates are known, so no date text and no .ics files appear. Adding `date` (plus optional `time`, `duration_minutes` and `location`) generates `/join/calendar/<step>.ics` and an "Add to calendar" button.
    - No step is marked optional, because nothing on the old site says which are; that is in TODO.
    - Application and Decision have no description (none is shown).
  - **Interview process.** One factual paragraph, since the old material covers behavioral and case interviews, plus a link to Prepare. Rounds and format are in TODO.
  - **Eligibility sentence.** "SCG recruits new analysts at the start of each fall and spring semester from University of Maryland undergraduates in good academic standing." The five-semester rule stays flagged (`needs_decision`).
  - **FAQ.**
    - A `needs_decision` item, or any answer still containing `[TBD`, now renders only with `npm run dev:notes`, not in a normal or production build (previously only production hid needs_decision).
    - Added the old "What makes SCG different…?" answer without the 2021 Vault ranking.
    - Live search matches from the start of words ("EY" no longer matches "they").
    - FAQPage JSON-LD covers published items only (8).
  - **Sticky CTA.** Below 768px, a `position: sticky` bar at the end of `<main>`: it sticks to the bottom while reading and rests above the footer, so it never covers it.
- **Prepare.**
  - The deck has the three questions from the old Interview Resources page; that page has no others. It shows one card at a time with Previous/Next, Left/Right, Shuffle and "Show answer structure".
  - The hints are general interview structure (present-past-future, STAR), not claims about SCG. Question 3 links to `/projects/`.
  - The timer is 2:00 with Start/Pause/Resume/Reset and no sound. Screen readers hear start, pause and "time's up" only.
  - STAR explainer.
- **Downloads.** The old site linked real files, all reachable. The three interview PDFs were in the export, and the SICC December 2023 prompt (linked from the old Partners page) was downloaded. They are copied unaltered to `assets/downloads/` and listed in `site.json → downloads` with type, description and size.
  - I read all four. No emails or phone numbers.
  - The three SCG guides show student author names and headshots on page 1, as SCG originally published them; that is flagged in TODO for confirmation.
- **Shared fixes.**
  - Nunjucks' `selectattr(attr, "equalto", v)` silently ignores the test, so About first showed EY three times. There is a new `findBy` filter, and Home's EY lookup uses it (same result there, since EY was first).
  - List items used as panels or cards are exempt from the global 70ch cap.
  - The stepper shows numbered buttons only below 560px (names stay in the accessible name), so five steps fit at 360px.
  - Step panels are a `role=list` div (axe flagged `role=tabpanel` on `<li>`).
- **Verified.**
  - Interaction test, all passing: header at three widths, mobile menu, pillar toggle by keyboard, stepper arrows, the Deliverables step opening and closing the dialog with focus returned, and the lightbox (opens on photo 3, arrow to next, Tab trapped, Esc returns focus). Also member stats counting up to final values, and the matcher at 360/768/1440 (Psychology + SQL gives Data & Engineering and Operations & People).
  - It also covers "I'm not sure" (all four), the Finance quick chip (Strategy & Research), the track link, FAQ search, JSON-LD, the calendar opening on the current step, the deck, timer and shuffle, and the four PDFs served.
  - No-JS: all steps, tracks, cards, hints, pillar texts and photo links are visible.
  - ui-check: 24 routes × 4 widths, axe clean. Contrast: 40 pairings (10 new). check:notes passes. No horizontal scroll at 360, 768 or 1440.

## Inner-page banners and the Join SCG sub-menu

- **Banner component** (`components/page-banner.njk`). It is used by /join/, /join/prepare/, /about/ and `layouts/stub.njk`, so /team/, /alumni/, /work-with-us/ and /partners/ (and any future page on that layout) get it automatically. /projects/, project pages and the Home hero are unchanged.
  - Photo, crop and tint are per page in `site.json → page_banners`, keyed by URL, with a `"default"`.
  - `npm run assets` builds, per page, a 2.4:1 strip cut at the page's focus (800/1600px) for ≥768px and the full photo (800/1200px) for phones, as WebP and JPEG, quality stepped down to stay under 200KB. Largest files: 200KB for the plaza aerial and 196KB for the hike.
  - The image is decorative (`alt=""`) and above the fold, so it is eager with `fetchpriority=high`, not lazy. No parallax.
- **Tint 0.78, not 0.72.** At 0.72 the 13px gold eyebrow measured 3.9 to 4.2:1 over sky and bright foliage on every page. 0.78 is the lowest opacity that keeps gold at 4.5:1 even over pure white (4.93:1 computed).
  - Measured with the new `npm run banner-contrast` (text hidden, brightest pixel inside each element's box, 360/768/1280/1440). Worst values over all seven pages:
    - eyebrow 4.92:1
    - breadcrumb link 4.92:1
    - intro 9.73:1
    - title 9.73:1
    - /join/ card: label 8.59, status 17.0, notes 10.43
  - Full table in the run output.
- **Heights (measured).**

  | Page | 360 | 768 | 1280 | 1440 |
  |---|---|---|---|---|
  | /join/ (status card) | 560 | 524 | 391 | 393 |
  | /join/prepare/ (breadcrumb + intro) | 358 | 319 | 360 | 360 |
  | /about/ (intro) | 307 | 300 | 360 | 360 |
  | title-only pages (team, alumni, work-with-us, partners) | 260 | 300 | 360 | 360 |

  - On /join/ the status card stacks under the text below 900px, so the banner grows to fit it.
  - Text sits bottom-left. Text column max 900px, so "Prepare for your interview" stays on one line from 1280px.
- **Photos.** All from the repo, none external (`assets/PHOTO-CREDITS.md`). I chose crops with calm areas behind the text:
  - /join/: lakeside group, sky and treeline
  - /join/prepare/: EY site visit ceiling
  - /about/: hike treeline
  - /team/: campus lawn group, trees and sky
  - /alumni/: graduates, building facade
  - /work-with-us/: top of the plaza aerial
  - /partners/: left/lower trees of the aerial, so no two pages share a desktop crop
  - Skipped: whiteboard, workshop and Smith entrance photos (legible text or signage) and the old site's "UMD 1/4/8" campus images (UMD marketing photography).
  - On phones the two aerial crops look alike, because a 4:3 photo in a roughly 1.4:1 banner shows almost the whole frame. That is two pages with the same crop, within the limit, and listed in TODO.
- **Join status card on the photo.** Surface `rgb(26 26 26 / .94)`, a 1px `rgba(255,255,255,.14)` border and a soft shadow. Text contrast is measured above.
- **Join SCG sub-menu.** Disclosure pattern: link plus a separate caret button (`aria-expanded`, `aria-controls`, "Show Join SCG menu"), not role=menu. Entries: Overview, Find your seat (`#find-your-seat`), Recruiting timeline (`#timeline`, renamed from `#calendar`), FAQ (`#faq`, new id) and Interview prep. The anchors land exactly under the 72px header (global `scroll-margin-top`).
  - **Desktop.**
    - Opens on hover with a 200ms close delay and an invisible bridge, and when keyboard focus enters the item. Esc closes and returns focus to the caret; that refocus does not reopen it.
    - A click outside closes. Up/Down/Home/End move between entries, and Tab walks link → caret → entries.
    - A caret click on a panel that hover just opened keeps it open (no open-then-close).
    - The panel sits at z-index 60 inside the sticky header, so it layers over the banners and is never clipped.
  - **Mobile.** An accordion with 44px rows; picking a same-page anchor closes the menu.
  - **Current state.** On /join/, "Join SCG" has `aria-current=page` and Overview is marked. On /join/prepare/, "Join SCG" has `aria-current=true`, styled the same, and Interview prep is marked.
  - **Spacing.** Unchanged: 27px clear at 1024 (was 39) and 91px at 1280/1440. Header height and actions are unchanged.
  - **No JS.** The caret is hidden, the list is not shown, and "Join SCG" is a plain link. The footer still lists Join SCG and Interview prep.
  - The old unused `.nav-group` dropdown script was removed, and ui-check now tests the new sub-menu.
- **Verified.**
  - Dropdown test, all passing: hover, pointer into the panel, panel above the banner and in view, no flicker, close delay, caret click, click outside, Tab order, Enter/Space, arrows, Esc with focus return, and a visible 3px focus ring.
  - Also: current states, the three anchors, header at 1024/1280/1440, touch accordion at 360 and 768, no-JS, and banner seams on all 7 pages at 4 widths (no border, shadow or gap, no horizontal scroll).
  - ui-check: 24 routes × 4 widths, axe clean. Contrast 40 pairings. banner-contrast OK. check:notes OK.

## Banners from supplied photos, gradient banners, shorter Join SCG menu

- **Join SCG sub-menu.** Now three entries: Recruiting timeline, FAQ and Interview prep. Overview and Find your seat were removed, since "Join SCG" itself links to /join/. Behaviour, accordion, highlighting and the `#find-your-seat` / `#timeline` / `#faq` anchors are unchanged. ui-check and the dropdown test now expect "Recruiting timeline" first.
- **Supplied photos** were found by name under `assets/photos/`: `projectsimage.jpeg` → /projects/, `joinscgimage.jpeg` → /join/, `alumniimage.jpeg` → /alumni/. The /team/ banner uses the Home "Our Community" photo, `assets/placeholder-group-photo.jpg`. The originals are untouched and never copied to `_site`. /projects/ now uses the shared banner in place of its old plain header; the filter bar and everything below are unchanged, and project detail pages are unchanged.
- **`scripts/make-banners.mjs`** runs in `npm run assets`, so in dev and build. It replaces the earlier per-page crops in `make-assets.mjs`; the old generated banner files are deleted. The 14 old-site photos and the plaza aerial stay, because they are used elsewhere (About photo wall, Join bento, Home).
  - Bands are quarters of the height, full width.
  - Phones (<768px) get the band widened evenly to 16:9, clamped to the photo. The Join photo (1.78:1) and the Alumni panorama (2.27:1) are shorter than 16:9 at full height, so their phone crop is the whole photo.
  - `<picture>` serves desktop (≥1024), tablet (768–1023) and mobile crops.
  - **Sizes.** You suggested 1600–2000px wide, but a 6:1 to 9:1 band at 2000px is only 220–330px tall, and the banner is 360–400px tall with `object-fit: cover` scaling by height. Desktop strips are therefore sized to at least 400px tall: Projects 2400×400, Join 2900×406, Alumni 3700×407 (Team 2000×620). All files are under 220KB; the largest is Join's JPEG at 182KB.
  - **`sizes`.** Each `<source>` declares `sizes="max(100vw, banner height × strip aspect)"` so the browser never picks a strip that is too short.
- **Team: band 3 widened, as requested.**
  - Faces span 46–64% of the height (back-row hair to front-row chins) and 7–93% of the width, so the exact band 3 (50–75%) cuts the back row's heads.
  - Because cover also crops the sides as banners get narrower, each breakpoint has its own window, all centred on band 3 (62.5%), with focal point `50% 30%`:
    - desktop 39.3–85.8%
    - tablet 36.7–88.3%
    - mobile 0–100% (the whole photo; a 16:9 window would cut the people at both ends at 360px)
  - Checked at 360, 600, 768, 1024, 1280, 1440 and 1920px: every face is visible.
  - On phones the whole photo includes the "Robert H. Smith School of Business" lettering above the door (under the tint).
- **Gradient banners** on /about/, /join/prepare/, /work-with-us/ and /partners/: #26080A → #2E0B0E → #3D1418 at 115°, with a 1.8%-white diagonal line pattern. They have the same min heights and text, and switch to a photo automatically when `aboutimage`, `prepareimage`, `workwithusimage` or `partnersimage` appears under `assets/` (default band 2, tint 0.78).
- **Contrast** (`npm run banner-contrast`, brightest background pixel, 360/768/1280/1440), worst values:
  - /projects/: eyebrow 5.98, title 9.79, intro 9.80
  - /join/: eyebrow 4.93, title 9.77, intro 9.90; card label 8.66, status 17.13, note 10.43
  - /team/: eyebrow 4.92, title 9.73
  - /alumni/: eyebrow 4.93, title 9.73
  - Gradient pages: eyebrow ≥ 7.95, title and intro ≥ 15.38, breadcrumb link 8.94
  - All pass at tint 0.78; no page needed 0.8.
- **Build quirk seen once.** One full build rendered the photo pages as gradients even though the data was correct; it has not reproduced since. `scripts/check-output.mjs` (part of `npm run build`) now fails the build if a page that has a banner photo renders without it, or a gradient page references one.
- **Size of the originals.** The three supplied originals total about 39MB in the repo; the 28MB Alumni panorama is the biggest. They are kept because the crop script needs them. A 6000px copy would be enough if repo size matters.

## About and Work With Us photos; Alumni band 3

- **Sources.** `assets/photos/aboutimage.jpeg` (6912×2752) → /about/ band 2, and `assets/photos/workwithusimage.jpeg` (8160×3264) → /work-with-us/ band 2, both found by name. /alumni/ keeps `alumniimage.jpeg`, now band 3 (50–75%). Set in `site.json → page_banners`; the originals are untouched.
- **No window expanded.**
  - The people in both new photos are motion-blurred, so there are no recognisable faces. Their heads sit inside band 2: about 33–39% of the height on About and 42–47% on Work With Us.
  - Alumni band 3 is buildings only.
  - Both new photos are about 2.5:1, wider than 16:9, so phones get the whole photo, as for Join and Alumni.
- **Files.** `make-banners.mjs` rebuilds `assets/banners/` from scratch on every run, so the old Alumni band-2 crops are gone and no unused crops remain.
  - Desktop strips: About 4100×408, Work With Us 4000×400, Alumni 3700×407.
  - Every file is under 220KB; the largest is Work With Us's WebP at 218KB.
- **Contrast** (`npm run banner-contrast`, brightest background pixel, 360/768/1280/1440), worst values. All pass at tint 0.78; none needed 0.8.
  - /about/: eyebrow 4.92, title 9.80, intro 9.73
  - /work-with-us/: eyebrow 4.94, title 9.73
  - /alumni/: eyebrow 4.92, title 9.73
- **Checked** at 360/768/1280/1440: finished look, no seam (no border, shadow or gap under the banner) and no horizontal scroll. Heights at 360 / 1440: /about/ 307 / 360, /work-with-us/ 260 / 360, /alumni/ 260 / 360.
- **Still on the gradient:** /join/prepare/ and /partners/.

## Work With Us band 3, Alumni back to band 2

- **/alumni/:** `alumniimage.jpeg` is back on band 2 (25–50%), the skyline with the Empire State Building. Desktop strip 3700×407; phones get the whole photo.
- **/work-with-us/:** `workwithusimage.jpeg` is now band 3, **widened to 40–85% of the height** on desktop and tablet.
  - The exact band 3 (50–75%) cuts through the walkers' heads. They are motion-blurred, but still heads: the tallest reaches about 40.5% of the height, the rest about 46–50%.
  - The window keeps band 3's centre (62.5%) and is just tall enough to include every head (`page_banners → windows.desktop`, with a note).
  - Phones get the whole photo, since it is wider than 16:9.
  - Desktop strip 2300×414 (the taller window needs less width to reach 400px of height); largest file 126KB.
- **Unused files.** The previous Work With Us band-2 strip (4000px) and the Alumni band-3 strip were deleted when `assets/banners/` was rebuilt. The originals are untouched.
- **Contrast** at tint 0.78 (worst over 360/768/1280/1440, brightest background pixel). Neither page needed 0.8.
  - /work-with-us/: eyebrow 4.92, title 9.73
  - /alumni/: eyebrow 4.93, title 9.73
- **Checked** at 360/768/1280/1440: no seam, no horizontal scroll, every head visible. Heights 260px at 360 and 360px at 1440 on both pages.

## Find your seat redesign (/join/)

- **Structure.** One search bar, four equal selector tiles and ONE detail panel replace the earlier combobox, the "Try" chip row, the "I'm not sure" button and the four tall track cards. The rest of /join/ is unchanged.
- **Data kept intact.** `tracks.json` only gained `short` (one line per track) and `"panel": true` on three `what_you_do` items per track. `skills` were reordered so the five shown first are the most representative; none were removed. Full lists stay and are all used for matching.
- **Panel picks:**
  - Data & Engineering: benchmark forecasting models, configure Cloud SQL + Looker Studio, Python ETL + REST API.
  - Strategy & Research: monetization strategy, benchmarking, five-year financial plan.
  - Product & Design: client-outreach process, timeline and process flow, UX opportunity brief.
  - Operations & People: E-Board role delegation, knowledge management, leadership/transition guide.
- **Project-name pills** were removed from the bullets. The projects appear as up to three /projects/ cards per track, opening the project dialog, with prev/next limited to the visible track.
- **Projects per track.** Projects are the newest per track, one per client, skipping projects an earlier track already shows, so the four tiles show different logos. Without that rule, MPDS and SER would appear on both Strategy and Operations.
  - Data & Engineering: School Harbor, Alliom
  - Strategy & Research: DefenX Client Outreach, MPDS, SER
  - Product & Design: SpeechPundit, Product Space
  - Operations & People: FBLA, ULR, BBB
- **Tiles.**
  - Line icons (1.75 stroke, red): database + bars, magnifier with a trend line, layout + pencil, person + gear.
  - One accent: the selected tile gets a red border, a 3px red top bar, a 2px lift (pointer devices, motion allowed) and a notch to the panel.
  - At 1280/1440 the tiles are 288px wide, not 260–270: that is the 1200px container minus three 16px gaps. A narrower row would no longer line up with the panel's edges.
  - Below 768px: 2×2, icon and name only, at least 108px tall.
- **Stable height.** All four panels share one grid cell; hidden ones are `visibility: hidden` and `inert`. The section is therefore always as tall as the tallest panel, and switching never moves anything below it: measured equal at all four widths.
  - Below 1024px the project cards scroll sideways inside the panel (scroll snap), so a track with two projects is not followed by an empty gap. The page itself never scrolls sideways.
  - ui-check's overflow test now ignores content clipped by a scrolling or clipping ancestor that itself fits the viewport. Previously the off-screen cards in the swipe row counted as page overflow.
- **Matching** (`src/js/seat-matcher.js`).
  - Up to three terms (comma, "and" or ";"). Per track: 3 points for an exact match with the track's name, fits or skills, 2 for a partial match there, 1 for a match with its projects' fits or skills.
  - Partial means a word starts with the term ("ux" → "UX evaluation") or either contains the other (3+ characters).
  - Results: "Best match" plus auto-select, "Also relevant" on other matches, highlighted skill and fit text, and a debounced `role=status` announcement. Clear (or Esc) resets to Data & Engineering.
  - Wording stays "Good fit if you study or enjoy", taken from projects' inferred fits.
- **Accessibility.** Tabs pattern (role=tablist/tab/tabpanel, aria-selected, aria-controls, roving tabindex, Left/Right/Home/End). Tab moves from the selected tile into its panel. 3px focus ring. Chips and Clear are at least 44px tall. Reduced motion: no fade or lift.
- **Deep links.** `/join/#track=<slug>` selects the track and scrolls to the section; `#find-your-seat` still lands under the header. Selecting a tile updates the hash with `replaceState`, so no history entries are added.
- **Removed.** The old matcher and track-card CSS (`seat__*`, `seat-track*`), plus the unused `find-your-seat.njk` and `how-it-works.njk` components and their `tracks__*` and `timeline__*` styles.
- **Height at 1440** (section): **2298 → 1884px** (−414). Page 6790 → 6376px. Other widths:
  - 1280: 2294 → 1873
  - 768: 3334 → 2026
  - 360: 4968 → 2335
- **Verified** (new seat test, all passing):
  - tiles equal and one row (two rows below 768) at 360/768/1280/1440; panel height constant across tracks; no horizontal scroll
  - keyboard, ARIA and roving tabindex; Tab into the panel; deep links; no history spam
  - matcher states: empty, one match (Computer Science), skill (SQL), track name, multi-term ("finance, ux, psych"), no match ("astronomy"), Clear
  - live region; mobile tiles; card → dialog; sticky CTA; reduced motion; no-JS (four stacked sections with 3 bullets, 5 skills, fit line, cards and link)
  - the Join dropdown still works
  - ui-check: 24 routes × 4 widths, axe clean. Contrast and banner contrast OK; check:notes OK.

## Find your seat: tile logos removed

- **What changed.** The row of small project logos at the bottom of the four selector tiles is gone, along with its markup in `seat-matcher.njk` and its CSS (`.seat-tile__logos`, `.seat-logo*`). The tile icon, name, one-line description, selected state, notch, hover, focus and keyboard behaviour are unchanged. The panel's "Work from this track" cards are unchanged. No data was touched: `showcase` in `load-data.js` still feeds the panel cards.
- **Padding.** From 768px, the tile bottom padding is 24px (top and sides stay 20px), so the text block doesn't sit on the bottom edge. The phone 2×2 layout is unchanged.
- **Measured.** All four tiles are equal and in one row from 768px, at 288×149 (1280/1440, was 288×193) and 168×207 (768). On phones they are 158×108 in a 2×2 grid. There is no horizontal scroll, and the panel height is stable across tracks.
- **Section height at 1440:** 1884 → 1840px.
- **Checks.** Seat test (tabs, matcher, deep links, no-JS, dialog), ui-check, build and check:notes all pass.

## "What you get" on /join/: five photo cards

- **Layout.** Five identical cards replace the bento (dark featured tile, mixed sizes, captioned side photo). Each card has a 16:10 photo, a 40px red rounded-square icon overlapping the photo's bottom-left edge (with a 4px white ring), the title and the description. White surface, 1px `--line` border, `--shadow`, `--radius` corners like the project cards, 28px padding, and a 4px hover lift (pointer devices, motion allowed only).
- **Text is unchanged:** eyebrow, heading, the five titles and descriptions. It already lived in `site.json → benefits`. Icons are the same five SVGs.
- **Grid.** Flex-wrap with a fixed card basis, so a short last row is centred at the same card width:
  - 3 + 2 from 1024px
  - 2 + 2 + 1 from 640px
  - 1 column below 640px
  - Gaps are 20–30px (`clamp`). Cards in a row are equal height. Between 1024 and 1279px titles reserve two lines, so every description in a row starts at the same height.
- **Photos** follow the old site's own pairing in its Recruitment "Membership Benefits" section. They match your suggestions, and none is in the /join/ banner (`joinscgimage`).

  | Benefit | Photo | Old-site file | Focal |
  |---|---|---|---|
  | Career readiness program | five members in business attire outdoors | IMG_6911.JPG | 50% 35% |
  | Alumni network | large group in an office | IMG-1013.jpg | 50% 35% |
  | Projects with real clients | members at a whiteboard | IMG_5159.jpeg | 50% 50% |
  | EY partnership | the EY site visit | EY Site Visit.jpg | 50% 55% |
  | Community | painting at a table | IMG_6909.jpg | 50% 25% |

  - IMG_6911 and IMG_6909 were newly imported (`data/photos.json` → `five-members-outdoors`, `painting-table`; pages: join).
  - `focal` and `alt` are stored per benefit in `site.json`. Alt text describes only what is visible; "EY site visit" comes from the file name.
  - Every visible face stays in frame. In the painting photo, people standing at the top edge are already cut off in the original.
- **Images.** `npm run assets` cuts each photo to 16:10 around its focal point at 600 and 1000px wide, WebP and JPEG, each under 120KB (largest 107KB). They are lazy-loaded with width/height set; none load before the section is scrolled near. No captions.
- **Accessibility.** The cards are not links, so there are no focus stops in the section. Text is `--ink` on white (18.4:1) and `--ink-2` on white (10.9:1). No horizontal scroll at 360/768/1024/1280/1440.
- **Removed:** the bento markup and CSS (`.bento*`) and the "Painting social" caption chip.
- **Section height** (it grows because every card now has a photo):

  | Width | Before | After |
  |---|---|---|
  | 1440 | 1244 | 1365 |
  | 1280 | 1234 | 1355 |
  | 768 | 1197 | 1698 |
  | 360 | 1954 | 2634 |

- **Checks.** Build, check:notes, ui-check (24 routes × 4 widths, axe clean), contrast, and the Find-your-seat test pass.

## /join/prepare/: Join banner, practice room polish

- **Banner.** `page_banners["/join/prepare/"]` is now `{ "same_as": "/join/" }`. That is a new option in `make-banners.mjs`: the page gets exactly the Join banner entry (`joinscgimage`, band 2, focal 50% 50%, tint 0.78, the same desktop, tablet and mobile crops) and reuses its files. No new image is made; `assets/banners/` has no `join-prepare-*` files.
  - The banner component now omits the eyebrow when none is passed, so the gold "RECRUITMENT" label is gone from this page only. The breadcrumb, headline and subhead are unchanged.
  - Contrast (brightest pixel; 360 / 768 / 1280 / 1440):
    - breadcrumb link 5.08 / 5.28 / 5.25 / 5.25
    - breadcrumb 9.81+
    - title 10.20+
    - intro 10.23 / 10.27 / 10.31 / 10.31
  - The `srcset`s match /join/ at every width (tested).
  - /partners/ is now the only page waiting for a banner photo.
- **Equal heights.** From 900px the practice room is one grid. Row 1 holds "Question n of 3" + Shuffle above the card; row 2 holds the card and the timer, stretched to the same height. `.deck` becomes `display: contents`, so its bar and card list are grid items.
  - Measured equal: 321 / 321 at 1024, 323 / 323 at 1440, and 577 / 577 with the answer structure open.
  - Below 900px they stack.
- **Card footer.** "Show answer structure" (and the Projects link on question 3) sits on the left. The previous/next arrows sit on the right: JS moves the one arrow pair into the visible card's footer, and focus stays on the pressed arrow.
  - The 320px minimum height is gone; the footer sits at the bottom of the card. On desktop the card is as tall as the timer, so some space remains under short questions, as the equal-height rule requires.
  - At 360px the button and two 44px arrows don't fit on one line, so the arrows wrap to a right-aligned line just below.
- **Timer.**
  - The dial is 136px (was 168) with a thin 4px gold ring that fills as time elapses. With `prefers-reduced-motion` the ring stays static and only the time text changes.
  - The dial is `aria-hidden`. Announcements stay in the existing `role=status` ("Timer started", "Paused with …", "Time's up."), not every second.
  - Dark panel, Start/Reset unchanged; no sound.
- **STAR section width.** Already in the same container as the practice room. Measured: left edges match (120 at 1440, 24 at 768/1024), and the fourth card's right edge equals the timer's right edge (1320 at 1440, 1000 at 1024).
- **Questions: still 3.** The old site lists exactly three sample behavioural questions, all on the Interview Resources page and all already used. The other old pages have none. The linked PDFs are case-interview material (frameworks and case questions), not behavioural questions, so nothing was added.
- **Verified** at 360/768/1024/1440:
  - no horizontal scroll, no console errors, banner = Join, eyebrow absent
  - deck: Next/Prev by mouse and keyboard, ArrowLeft, focus kept
  - timer runs; ring static under reduced motion
- **Checks.** ui-check (24 routes × 4 widths, axe clean), banner-contrast, build and check:notes pass.

## /join/prepare/: PDF covers and viewer, resume guide, "More ways to prepare"

- **Covers** (`scripts/make-pdf-covers.mjs`, run by `npm run assets`).
  - Renders page 1 of every PDF in `site.json → downloads` with `pdfjs-dist` (legacy build) and `@napi-rs/canvas`. Both are dev dependencies with prebuilt binaries, so nothing is installed system-wide.
  - Renders at 2x, keeps the top of the page at 16:10 and writes a 640×400 WebP: 12–16KB each, under the 60KB cap. It also records the page count (19, 15, 12, 4).
  - A cover is rebuilt only when its PDF changes; covers of removed PDFs are deleted. The PDFs are only read.
- **Cards.** Same text as before (kind, title, description, "PDF, size"), plus the page count. On top is the cover as a sheet of paper on a warm surface (`--line` border, soft shadow; alt "First page of <title>"; lazy, width and height set). At the bottom are **Preview** (primary) and **Download PDF** (secondary, `download`). The grid is the resource grid: 3 columns with the 4th card on row 2 at the same width, 2 on tablet, 1 on mobile. Covers are equal height at every width.
- **Viewer** (`src/js/pdf-viewer.js`, 3KB gzip on page load).
  - PDF.js is self-hosted (`/js/vendor/pdfjs/`, copied from node_modules at build) and dynamically imported on the first Preview. That adds **129KB gzip (`pdf.min.mjs`) + 368KB gzip (worker)**, loaded only then; tested, none of it loads with the page.
  - Native `<dialog>` with the project-dialog pattern: Tab loop, Esc / backdrop / X close, focus returns to the Preview link, page inert, scroll lock. A side sheet (960px) on desktop, full screen on phones.
  - Controls:
    - title and "Page n of N"
    - Previous/Next plus Left/Right keys
    - fit-to-width default, zoom 50–300%
    - Download PDF, a loading state, and an error message with a download link
  - Rendering: one page on a canvas at the device pixel ratio (1856px for 928 CSS px at 2x), with the next page prefetched.
  - The **text layer works**: PDF.js `TextLayer` with its CSS flattened into main.css, so text is selectable and readable by screen readers.
  - Page and zoom changes are announced in a polite `role=status`. Labelled buttons; reduced motion drops the slide-in.
  - Deep link `#preview=<slug>`.
  - Without JS, Preview is a plain link to the PDF (the browser's own viewer).
  - Links inside the PDFs are not clickable in the preview (no annotation layer); Download PDF keeps them.
- **Test servers** now serve `.mjs` as JavaScript (`ui-check`), as static hosts do.
- **Resume guide.** Same URL as the /join/ card (`site.json → links.resume_guide`), a Google Slides deck. A new `slidesEmbed` filter turns it into the `/embed` URL, shown in a 16:9 rounded, bordered frame with a `title`, `loading="lazy"`, a sandbox (scripts, same-origin, popups) and an "Open in a new tab" link. Copy is the /join/ wording.
  - Google serves the embed without a sign-in ("[2026] SCG Resume Resource"), so the deck is already shared publicly. It must stay "Anyone with the link can view".
  - The iframe makes a failing `chrome-extension://` probe request inside Google's own player. ui-check now ignores failed requests from child frames (only the main frame's count).
- **More ways to prepare.** Two cards in the /join/ resource-card style:
  - **Past projects:** the /join/ description, linking to /projects/.
  - **Recruiting timeline and FAQ:** "How recruiting works, step by step, and answers to frequently asked questions.", built from the /join/ section headings, linking to /join/#timeline.
  - No Interview prep card.
- **/join/ "Get ready to apply"** is unchanged (tested).
- **Privacy note.** The covers show page 1 of SCG's guides, which includes student authors' names and headshots, as originally published. The PDFs were already public downloads, but the faces are now visible on the page. This remains flagged in TODO-CONTENT.md for the authors' confirmation.
- **Verified** (pdf test, all real checks passing):
  - no PDF.js on initial load; Enter on Preview opens it with focus on the title
  - arrows and buttons page through and are announced; zoom; Tab trapped; Esc, X and backdrop close with focus return
  - error path; deep link on mobile, full screen with no sideways scroll
  - 2x canvas; text layer present
  - layouts at 360/768/1024/1440 with equal cards and covers and no horizontal scroll; no-JS links; console clean
  - ui-check (24 routes × 4 widths, axe clean), build and check:notes pass

## SICC case prompt hidden ("published": false)

- `site.json → downloads` has `"published": false` on the SICC December 2023 case prompt. The entry and `assets/downloads/sicc-december-2023-case-prompt.pdf` stay in the repo. Everything that renders or processes downloads respects the flag:
  - the loader (`downloads`): no card, no Preview, no viewer entry, no `#preview=` deep link
  - `make-pdf-covers.mjs`: no cover (it is regenerated when the flag is removed)
  - Eleventy passthrough: only published PDFs are copied, so `/assets/downloads/sicc-…pdf` is a 404 on the built site
  - The site has no sitemap, search index or structured data for downloads.
- The guides intro now reads "SCG's own guides and practice cases. Free to download."
- **Grid.** CSS grid, so cards in a row are equal height (the flex-wrap version left them at 542/518/575px).
  - 1440: three equal cards (384×575) in one row
  - 768: 2 + 1, the third centred at the same width (348px)
  - 360: one column
  - The tablet and desktop rules also centre a lone or paired last row if more PDFs are published later.
- **Restore:** delete `"published": false` (or set it to true) and run `npm run build` (README and TODO-CONTENT.md).
- **Build note.** A long-running `npm run dev` (started 2026-10-03) kept rewriting `_site` with its old in-memory config, putting the hidden PDF and card back after my builds. This also explains the one-off "banner photo missing" build seen earlier. Restart `npm run dev` after config or `lib/` changes. Verification here used a separate output folder plus a clean `_site` build.
