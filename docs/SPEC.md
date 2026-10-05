# SCG Website Spec

Status: v1 for build. Audience for this document: the engineer (Claude Code) building the site. Officers will maintain it after launch.

## 1. Goals and audiences

**Primary goal: broaden who applies.** Applicants are strong but mostly Smith School students. A CS, engineering, data science, design or social-science student landing on the site should within 10 seconds understand: (a) SCG is for them, (b) what they would actually do, (c) how to apply.

**Second goal: show real project depth.** Replace the logo-and-name grid with explorable project stories.

**Audiences, in priority order**
1. Prospective members from *any* UMD major (primary).
2. Prospective clients: UMD organizations and nonprofits.
3. Partners, alumni and the Smith/Snider community.

## 2. Keep / add / modify

### Keep (from the current site)
- Logo, red/gold/black/white palette, name and "Heighten your success" spirit.
- EY partnership and Ed Snider Center affiliation, shown clearly as credibility.
- Factual content that is already good: free to join, weekly rhythm (general body meeting/workshop, weekly team meeting, socials), onboarding flow, eligibility, partners (EY, Center for Social Value Creation / Smith Impact Case Competition), alumni profiles, interview resources, press links (Smith News, The Diamondback, Ed Snider Center, Smith Clubs), Instagram and LinkedIn.
- Past-client list (`data/past-clients.json`) as a credibility strip.

### Add
- A calm six-block home page (see `docs/HOME-LAYOUT.md`). Breadth of majors is shown through project skills and team/alumni majors, never announced as a slogan.
- **"Find your seat" role tracks** (Data & Engineering, Strategy & Research, Product & Design, Operations & People) tied to real projects, placed on `/join/`.
- **Interactive Projects explorer** with filters, modal detail and a standalone page per project (Section 6).
- **"How a project works"** timeline so applicants can picture the experience.
- A step-by-step **recruitment timeline** with optional low-pressure events and an always-visible Apply/Interest-form call to action.
- Rewritten **FAQ** that directly answers "do I need to be a business major?" (`data/faq.json`).
- **Team and Alumni by major**, with filters, so non-business students see people like themselves.
- A client-facing **Work With Us** page (what we do, how it works, free for on-campus clients, request form).
- Real SEO, social previews, structured data, accessibility and performance.

### Modify
- Replace "Founded at the Smith School of Business" as the lead identity with "UMD's student-run consulting group," keeping the Smith/Snider affiliation visible but secondary.
- Hero image: current photo is all suits in front of the Smith School sign. Use it only as a placeholder; plan for varied, candid photos (see `assets/PLACEHOLDERS.md`).
- Team presentation: show **major(s), role and projects worked on**, not only the internship employer. Employer logos are optional secondary info.
- Page title `Business, University of Maryland` becomes a title that does not say "Business" (see SEO).
- Acceptance-rate language: do not lead with "~5%." See `data/faq.json` (`needs_decision`).
- Tone: no slogans about majors; from "brightest student minds" prestige to confident and inviting. Prestige can appear as proof (EY, outcomes), not as the opening line.

### Remove
- All GoDaddy artifacts (builder scripts, "Powered by", sign-in/account blocks, boilerplate cookie banner, the `filler@godaddy.com` string).
- Duplicated hidden text (e.g., "Fall 2026 Applications Closed" repeated six times in markup).

## 3. Pages and navigation

Primary nav (as built, see DECISIONS.md): **Projects · Join SCG · About · Team · Alumni · Work With Us**, plus a persistent **Join SCG** button (state driven by `site.json → recruiting`). Partners and Interview prep are in the footer, which lists every page. Footer: logo, affiliation line ("In direct affiliation with the Ed Snider Center for Enterprise and Markets"), nav, social links, contact placeholder, "© year Snider Consulting Group".

| Route | Purpose |
|---|---|
| `/` | Home: hero, find-your-seat, featured projects (interactive), how it works, proof, final CTA |
| `/projects/` | Full interactive explorer (filters + modal) |
| `/projects/<id>/` | Standalone case-study page per project (generated from JSON) |
| `/join/` | Recruitment: who belongs, tracks, timeline, process, benefits, FAQ, resources |
| `/join/prepare/` | Interview prep: sample behavioral questions, case frameworks (download slots), practice cases |
| `/about/` | Mission, three pillars, how a project works, EY + Snider Center |
| `/team/` | Board and members, filter by major/level |
| `/alumni/` | Alumni, filter by major/industry |
| `/partners/` | EY, Center for Social Value Creation (Smith Impact Case Competition), Ed Snider Center |
| `/work-with-us/` | Prospective clients |
| `404` | Friendly page with nav |

Note: the old Services and Contact Us pages were not available when this spec was written. If the officers supply their text, merge it into `/work-with-us/` and the footer. Do not invent service claims; the capability list in 5.8 is derived only from the Fall 2025 projects.

## 4. Design system

### Color tokens (brand-matched; sampled from the logo)
```css
:root {
  --scg-red:        #AE1218;  /* logo red: primary brand, links, key buttons on light bg */
  --scg-red-dark:   #8A0E13;  /* hover/pressed */
  --scg-gold:       #F8A81E;  /* logo gold: accents, highlights, buttons on dark bg */
  --scg-gold-soft:  #FDEBC8;  /* tinted backgrounds, chips */
  --ink:            #141414;  /* near-black: text, dark sections */
  --ink-2:          #3B3B3B;  /* secondary text */
  --paper:          #FFFFFF;
  --paper-2:        #F7F4EF;  /* warm off-white section background */
  --line:           #E3DDD3;  /* hairlines/borders */
}
```
Rules: Gold is **not** used for text on white (fails contrast); use gold on `--ink` or as fills/underlines. Red text on white is fine for large and normal text but verify ≥ 4.5:1. Alternate light sections (`--paper`, `--paper-2`) with dark sections (`--ink`) for rhythm, as the current black-and-white site does. Verify every pairing with a contrast checker.

### Typography
- Headings: **Montserrat** (600/700). Wide-tracked uppercase for small eyebrow labels, echoing the "S N I D E R" lettering in the logo. (Montserrat is a close match for the logo lettering, not a confirmed identification.)
- Body/UI: **Lato** (400/700), already used on the current site.
- Load from Google Fonts with `display=swap`, or self-host. Fluid type scale with `clamp()`; body 17-18px; line-height 1.6; max line length ~70ch.

### Layout and components
- 12-col grid, max width ~1200px, 16-24px gutters at mobile, generous vertical rhythm (80-120px between sections desktop).
- Buttons: primary (red on light / gold on dark), secondary (outline), 44px min touch target.
- Cards with 12-16px radius, subtle border, hover lift (disabled under reduced motion).
- Chips for tags/majors; stat tiles; accordion (native `<details>` is fine) for FAQ; tabs for role tracks; timeline for process.
- Motion: subtle reveal-on-scroll and hover transitions only; respect `prefers-reduced-motion`.

### Logo usage
Use `assets/scg-logo.png` on light backgrounds as supplied. On dark sections, place it on a white or `--paper-2` rounded plate rather than recoloring. Provide a clear-space equal to the height of the "S" on all sides. Do not alter. (If a one-color or reversed logo is later supplied, swap it in.)

## 5. Page content

All copy below is **draft** for officers to review. Where a statement is a claim about SCG, it must be supported by data in `data/` or marked `[TBD]`.

### 5.1 Home `/`
**Superseded by `docs/HOME-LAYOUT.md`.** The home page has exactly six blocks (hero, stat strip, community, our work, where SCG takes you, footer) following the layout blueprint and the reference screenshot. Do not add other sections to the home page. The interactive project cards in "Our Work" use the dialog defined in Section 6.

### 5.2 Find your seat (component; used on `/join/`, not on the home page)
Tabbed or card-based, one per track. Each track shows: who it suits (majors/interests), what you would do (written from real projects), skills you'd build, and links to the matching project cards (filters projects by `disciplines`). Keep the tone concrete and calm; do not use slogans about majors.

- **Data & Engineering**: model building, databases, dashboards, automation. Examples from data: Alliom (forecasting models), School Harbor (SQL + Looker Studio dashboard).
- **Strategy & Research**: market and landscape research, benchmarking, business cases, monetization and compliance thinking. Examples: Alliom (business strategy), Product Space (benchmarking report).
- **Product & Design**: scoping, user-centered thinking, process design for product teams. Example: Product Space.
- **Operations & People**: role design, knowledge management, documentation, marketing and communication. Examples: UMD Dynamic Dance, SCG Internal Project.

Do not claim that members of a given major have worked on a given track unless `team.json`/`projects.json` says so. Use "Good fit if you study..." phrasing for the suggested `fits` and note the source in a code comment.

### 5.3 How a project works (component)
Horizontal (mobile: vertical) step timeline. Steps are grounded in what SCG says today; officers confirm details.
1. **Client request.** A client submits a request; SCG scopes it into a Statement of Work (SoW).
2. **Team forms.** Members choose from projects each semester; teams are formed [TBD: size/roles].
3. **Weekly rhythm.** Weekly team project meetings plus general body meetings/workshops.
4. **EY guidance.** Each client team is paired with EY consultants, senior managers and partners for direction.
5. **Deliverables.** The team delivers the items agreed in the SoW (see any project's "Scope").
6. **Handoff.** [TBD: how outcomes are presented/handed off.]

**As built (stage 3A):** a type-ahead matcher on `/join/` (`components/seat-matcher.njk`, `src/js/seat-matcher.js`). Visitors pick up to three majors, interests or skills (combobox or quick chips) from the tracks' own `fits` and `skills`; matching tracks are shown best first with the matching chips highlighted, each with "What you'd do" (from real projects, linked), "Skills you'd build", "Good fit if you study or enjoy… (suggested)" and a link to `/projects/?track=<name>`. "I'm not sure yet" shows all four. Without JS: the four tracks as a static list.

### 5.4 Join SCG `/join/`
Order: recruiting status banner → **Who belongs here** (open to all UMD undergrads; major-agnostic message; link to tracks) → **Find your seat** → **What you get** (the five existing benefits: career readiness program, alumni networking, impactful projects, EY partnership, community; reword for non-business readers and keep factual) → **Timeline** (from `site.json → timeline`, with "optional" pills; supports a "Dates TBD" state) → **Interview process** [TBD details] → **Eligibility** (from FAQ; show `needs_decision` items only after resolved) → **FAQ** (`faq.json`, accordion, searchable if > 12 items) → **Resources** (resume guide, interview prep) → sticky bottom CTA on mobile.

CTA logic: if `recruiting.open` and `application_url` → "Apply"; else if `interest_form_url` → "Join the interest list"; else show a visible `[TBD link]` placeholder.

**As built (stage 3A):** status card (label, status, closed note, CTA, "recruits each fall and spring") → Find your seat matcher → What you get (bento of the five benefits from `site.json → benefits` plus one photo) → recruiting calendar (interactive stepper from `site.json → timeline`, current step from `recruiting.current_step`, "Optional" pills, "Add to calendar" .ics per dated step; undated steps show no date text) → interview process (links to Prepare) + one eligibility sentence + FAQ accordion with live search (`needs_decision` items and answers still containing `[TBD` render only with `npm run dev:notes`; FAQPage JSON-LD from published items) → Resources (Resume guide, Prepare, Projects) → sticky bottom CTA under 768px.

### 5.5 Prepare `/join/prepare/`
Sample behavioral questions (use the three existing ones: "Tell me about yourself"; a team-conflict question; "Which client that SCG has worked with in the past interests you the most?"). Add a note linking that third question to the Projects explorer ("Browse projects to answer this one"). Download slots for the case framework PDF, interviewer-led practice case and guided individual practice case (placeholders until files are supplied).

**As built (stage 3A):** practice room (one card at a time, Previous/Next, Shuffle, "Show answer structure", 2-minute silent timer; question 3 links to `/projects/`), STAR explainer, and four downloads from the old site (`site.json → downloads`: case framework guide, guided practice case, interviewer-led practice case, SICC December 2023 prompt).

### 5.6 About `/about/`
Mission (existing: "help organizations achieve their vision of success through sustainable strategies, research, management, and process improvement"), three pillars (Commitment to Excellence in Service; Upholding Professionalism; Fostering a Strong Sense of Community) with the existing descriptions tightened, how a project works, EY + Snider Center, founding story ("Founded at the Robert H. Smith School of Business in 2020") placed here rather than in the hero.

**As built (stage 3A):** page header → story timeline (from `site.json`: established, partners, facts, stats; scroll reveal) → three expandable pillar cards → "How a project works" stepper (`data/process.json`; the Deliverables step opens School Harbor's dialog) → dark partnership band (reversed EY logo; Smith/Ed Snider Center lockup on a white plate) → photo mosaic + lightbox (`data/photos.json`) → member statistics with count-up (`site.json → member_stats`) → four "SCG elsewhere" links → Join SCG CTA.

### 5.7 Team `/team/` and Alumni `/alumni/`
- Team: levels from `team.json`. Card = photo (placeholder), name, title, **major(s)**, optional "Worked on" project chips linking to project pages. Filter by level and major. Do not show anyone without `consent_to_publish: true`.
- Alumni: card = name, major(s), current role/org, one-line SCG story; "Read more" expands the existing long bio. Filter by major and industry. Seed data in `alumni.json` is a handful of non-Smith-major alumni to prove the message; all other alumni must be added by officers with the same schema. Add an **Alumni Report** slot for the existing 2026 Alumni Report download.
- Member statistics block (existing: graduation speakers, ODK members, QUEST Honors members, teaching assistants, club presidents/VPs): keep, but only with figures supplied by officers (not carried over automatically).

### 5.8 Work With Us `/work-with-us/`
Audience: UMD student orgs, departments and nonprofits.
- Intro: "SCG works alongside your organization to create personalized and long-lasting solutions." On-campus services are always free; off-campus nonprofits get low rates (existing FAQ text).
- **What we can help with** (derived from the original Spring 2025 projects, not invented): research and benchmarking; data, dashboards and analytics; machine-learning and AI strategy; process, role and knowledge-management design; marketing and communication strategy; business and monetization strategy.
- Process (reuse How a project works), a short "Past clients" strip, and a **request form** (name, organization, what you need, timeline, email). Form posts to a configurable endpoint (e.g., Formspree/Netlify Forms; endpoint in `site.json`, currently TBD). Include honeypot spam protection and a success/error state. Never expose a personal email.

### 5.9 Partners `/partners/`
From `site.json → partners`. Keep the EY narrative but shorten and make it factual; remove the "level of prestige that elevates the SCG experience to new heights" style language. Keep the SICC case prompt download slot (existing "SICC December 2023 Case Prompt (pdf)"; placeholder).

## 6. Interactive Projects explorer (the centerpiece)

**Data**: `data/projects.json`, one object per **client tile**. Do not hardcode projects in HTML. Adding an object adds its card (Home if `featured`, `/projects/`), its dialog and its page `/projects/<id>/` with no code changes.

**Repeat-client rule.** A client that returns in a different semester keeps ONE tile with several `engagements`. Parallel projects for the same client in the same semester stay separate tiles (they link to each other: "Also for <client>: …").

| Tile field | Required | Notes |
|---|---|---|
| `id` | yes | lowercase, digits and dashes; becomes `/projects/<id>/` and the deep link `#<id>` |
| `title`, `client` | yes | `short_name` (e.g. "MPDS") is optional and searchable |
| `client_type` | recommended | one of the existing types; filter + meta row |
| `featured` | no | Home shows the first three featured tiles, in file order |
| `engagements` | yes | list, see below; newest is used on the card |
| `disciplines`, `fits` (lists) | recommended | chips in the dialog/page; `disciplines` must be in the file's list; `fits` shown as "(suggested)", `fit_inferred: true` until officers confirm |
| `team` {`size`, `roles`, `majors`}, `links` [{`label`, `url`}] | no | only filled fields render; never invent members or majors |
| `logo` | no | the client's logo, unaltered. May omit the extension (`assets/logos/hyswaplogo`): any `.png/.jpg/.jpeg/.webp/.svg` with that name is used. Without a file the tile shows the client name on a neutral background. |
| `logo_bg` | no | tile color behind the logo; if omitted it is the dominant color of the logo's outer 2px edge (neutral `#F7F4EF` for transparent logos) |
| `logo_offset` {`x`, `y`} | no | nudges a logo with uneven built-in margins (fraction of its rendered size) |

| Engagement field | Required | Notes |
|---|---|---|
| `semester` | yes | "Spring 2026", "Fall 2025", etc. (Winter/Spring/Summer/Fall + year) |
| `title` | no | shown after the semester in the engagement heading |
| `tagline` | yes | the Objective (card for the latest engagement; page description) |
| `challenge`, `scope` (list), `scope_detail`, `approach` | no | omitted if missing |
| `skills` | no | merged across engagements into one chip list |
| `outcome` | no | `null` until known; the card's Impact row shows "Results coming soon" |

Old flat projects (semester/tagline/… at the top level) are still read as one engagement.

**Semester label** (card title and dialog/page title): one semester "(Fall 2025)"; two or more in the same year "(Spring & Fall 2025)"; across years "(Fall 2025 – Spring 2026)" (earliest – latest).

No individual contact names or emails anywhere in this file (the build fails on emails/phone numbers).

**Card** (shared component `components/work-card.njk`, identical on Home and `/projects/`; spec in `docs/HOME-LAYOUT.md` block 4): logo tile (`components/logo-tile.njk`, 8/3), title + (semester label), the LATEST engagement's Objective / Scope (first two items) / Impact rows with 28px icons, "Read more →". The title link goes to `/projects/<id>/`; with JS it opens the dialog. Cards are equal height.

**Explorer `/projects/`**
- Page header (eyebrow, H1 "Projects", one-line intro). Grid: 1 col mobile, 2 from 640px, 3 from 1024px.
- Order: newest latest engagement first, then alphabetical (Home keeps file order).
- Filter bar (progressive enhancement: hidden until `projects-filter.js` runs, so no-JS shows all cards): **Search** (title, client, short name, summary, every engagement's title and tagline, skills), **Semester** (select; a tile matches if ANY engagement is in that semester), **Client type** (select), **Good fit for** (`fits`, multi-select with its own search box), **Track** (`disciplines`, multi-select chips). A group appears only when the data has at least two distinct values for it. State is in the query string (`?q=&semester=&type=&fit=&track=`, `replaceState`), the count is `aria-live="polite"`, "Clear all filters" appears when anything is active, and an empty state explains when nothing matches. On mobile, everything except Search sits behind a "Filters (n)" toggle.

**Detail (dialog and page, shared component `components/project-detail.njk`)**
- Native `<dialog>` labelled by the project title: right-side drawer (720px) on desktop, full-screen sheet on mobile, fade/slide only when motion is allowed.
- Content, in order: logo banner (same tile, 3/1); title with "(semester label)" in the card style; tagline (single-engagement tiles); Client / Client type; "Also for <client>: …" links to parallel tiles; then **one section per engagement, newest first**, headed with its semester (and title), each with **Challenge**, **Scope**, **Approach**, **Outcome** (and the engagement's tagline when there are several); then merged **Skills used**, **Disciplines**, **Good fit if you study (suggested)** (chips), **Team**, **Links**.
- Missing content: on the live site a section with no data is **omitted** (no placeholder, no note). With `SHOW_PLACEHOLDERS=1` (`npm run dev:notes`) missing sections appear as labeled placeholders. Every omitted field is listed per project in `TODO-CONTENT.md`.
- Controls: close (X, Escape, backdrop), Previous/Next buttons and Left/Right arrow keys (cycling through the cards currently visible, so filters are respected), "Open full page".
- Behavior: focus trapped and returned to the originating card; background inert; scroll locked; deep links `/projects/#<id>` and `/#<id>` (Home) open on load; browser Back closes; closing keeps the filter query.
- Standalone page `/projects/<id>/`: same content in a card on a warm background, breadcrumbs (Home / Projects / title) with `BreadcrumbList` JSON-LD (first item named "Snider Consulting Group"), own `<title>`, meta description (tagline), canonical URL and Open Graph tags, Previous/Next project links and "Back to all projects".

## 7. Content and placeholder rules

- Placeholders: any missing image uses a neutral gray block with a dashed border, centered label such as `PHOTO: Alliom team (16:9)`, and `data-placeholder="true"`. Missing text renders as `[TBD: description of what is needed]` styled with a gold-soft highlight.
- Maintain `TODO-CONTENT.md` generated by a script (`npm run todo`) that scans for `data-placeholder` and `[TBD` and lists each with its file/route.
- Statistics: show only `verified: true` numbers.
- People: only render entries with `consent_to_publish: true` (the build must enforce this).
- Never copy text, imagery or layout wholesale from reference sites.

## 8. Reference patterns (what to borrow, what to avoid)

**UConsulting LA (uconsultingla.com)**
- Borrow: case-study structure *Objective / Approach / Impact* with concrete numbers; a stats strip; a recruitment timeline where each step has a date, time, dress code and RSVP; optional low-pressure events before the deadline; a resources list; an FAQ that explicitly names the range of majors and says business experience isn't required; technical roles (AI & data) shown inside project teams and leadership; placement logos grouped by class year.
- Avoid: copying its wording, color scheme or imagery; a consulting-and-finance-only value proposition (it has no engineering-specific messaging).

**App Dev Club (appdevclub.com)**
- Borrow: a "journey" showing clear entry points and progression; featured projects with a read-more path; Apply Now visible in the nav and repeated; impact metrics near the top.
- Avoid: language that implies only one discipline belongs.

## 9. SEO, sharing, analytics

- `<title>` pattern: `Snider Consulting Group | UMD Student Consulting for Every Major`; per-page unique titles and meta descriptions; one H1 per page; canonical URLs; `sitemap.xml`, `robots.txt`; Open Graph/Twitter cards with a default image (logo plate on `--paper-2`).
- JSON-LD: `Organization` (name, logo, sameAs for Instagram/LinkedIn, parentOrganization University of Maryland) site-wide; `FAQPage` on `/join/`; `BreadcrumbList` on project pages. Do not mark up unverified claims.
- Analytics: off by default (see `site.json`). If enabled, load only after consent and keep the banner minimal.
- Web manifest with theme color `#141414` and icon from `assets/scg-icon-192.png`.

## 10. Accessibility and performance targets

- WCAG 2.2 AA: semantic landmarks, skip link, heading order, visible focus rings (gold on dark, red on light, 3:1 against adjacent colors), form labels/errors, `aria-live` for filter results, accessible tabs and accordions, alt text for every informative image (decorative = empty alt).
- Target Lighthouse (mobile): Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO 100. LCP < 2.5s on a mid-range phone; CLS < 0.1; total JS < 60KB gzipped excluding analytics; images served as WebP/AVIF with explicit dimensions and lazy loading below the fold.

## 11. Definition of done

- All routes in Section 3 exist, are responsive at 360/768/1280px, and navigable by keyboard only.
- Projects explorer: filters, search, modal with focus trap, deep links, prev/next, no-JS fallback pages, placeholders visible.
- Brand rules satisfied (logo untouched, colors per tokens, contrast verified).
- No fabricated content; `TODO-CONTENT.md` lists every placeholder.
- No personal contact details in the repo or output.
- Lighthouse targets met; no console errors; links checked.
- `README.md` documents how officers add a project, a team member, an alumnus, update the recruiting banner and deploy; `DECISIONS.md` records choices made where the spec was ambiguous.
