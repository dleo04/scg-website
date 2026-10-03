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
- A hero and structure that speak to every major (Section 5.1).
- **"Find your seat" role tracks** (Data & Engineering, Strategy & Research, Product & Design, Operations & People) tied to real projects.
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
- Tone: from "brightest student minds" prestige to confident and inviting. Prestige can appear as proof (EY, outcomes), not as the opening line.

### Remove
- All GoDaddy artifacts (builder scripts, "Powered by", sign-in/account blocks, boilerplate cookie banner, the `filler@godaddy.com` string).
- Duplicated hidden text (e.g., "Fall 2026 Applications Closed" repeated six times in markup).

## 3. Pages and navigation

Primary nav: **Projects · Join SCG · Who We Are ▾ (About, Team, Alumni, Partners) · Work With Us**, plus a persistent **Apply** button (state driven by `site.json → recruiting`). Footer: logo, affiliation line ("In direct affiliation with the Ed Snider Center for Enterprise and Markets"), nav, social links, contact placeholder, "© year Snider Consulting Group".

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
1. **Header** with logo, nav, Apply button (and a slim recruiting banner above it when `recruiting.open`).
2. **Hero.** H1: "Consulting isn't a major." Sub: "SCG is UMD's student-run consulting group. Engineers, data scientists, designers, researchers and business students solve real problems for real clients, side by side." CTAs: **See our projects** (primary), **Join SCG** (secondary). Right/below: placeholder photo slot (`assets/placeholders/hero.jpg`; the current group photo is provided only as a stand-in).
3. **Proof strip** from `site.json → stats`. Only `verified: true` values show real numbers; others show a clearly marked placeholder tile.
4. **"Find your seat"** (Section 5.2).
5. **Featured projects** (3, from `featured: true`) as the same interactive cards as the explorer, with "Explore all projects".
6. **How a project works** (Section 5.3), compact.
7. **Who's in the room**: a row of major chips drawn from `team.json`/`alumni.json` (placeholder until supplied) and a short line: "Members study [TBD: N] majors across [TBD] colleges."
8. **Credibility**: EY partnership, Ed Snider Center affiliation, press links, past-client chip strip (`past-clients.json`; "likely_technical" ones can sort first once confirmed).
9. **Final CTA band** (dark): "Your major isn't the point. Your curiosity is." [draft] + Apply / interest form.

### 5.2 Find your seat (component; reused on `/join/`)
Tabbed or card-based, one per track. Each track shows: who it suits (majors/interests), what you would do (written from real projects), skills you'd build, and links to the matching project cards (filters projects by `disciplines`).

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

### 5.4 Join SCG `/join/`
Order: recruiting status banner → **Who belongs here** (open to all UMD undergrads; major-agnostic message; link to tracks) → **Find your seat** → **What you get** (the five existing benefits: career readiness program, alumni networking, impactful projects, EY partnership, community; reword for non-business readers and keep factual) → **Timeline** (from `site.json → timeline`, with "optional" pills; supports a "Dates TBD" state) → **Interview process** [TBD details] → **Eligibility** (from FAQ; show `needs_decision` items only after resolved) → **FAQ** (`faq.json`, accordion, searchable if > 12 items) → **Resources** (resume guide, interview prep) → sticky bottom CTA on mobile.

CTA logic: if `recruiting.open` and `application_url` → "Apply"; else if `interest_form_url` → "Join the interest list"; else show a visible `[TBD link]` placeholder.

### 5.5 Prepare `/join/prepare/`
Sample behavioral questions (use the three existing ones: "Tell me about yourself"; a team-conflict question; "Which client that SCG has worked with in the past interests you the most?"). Add a note linking that third question to the Projects explorer ("Browse projects to answer this one"). Download slots for the case framework PDF, interviewer-led practice case and guided individual practice case (placeholders until files are supplied).

### 5.6 About `/about/`
Mission (existing: "help organizations achieve their vision of success through sustainable strategies, research, management, and process improvement"), three pillars (Commitment to Excellence in Service; Upholding Professionalism; Fostering a Strong Sense of Community) with the existing descriptions tightened, how a project works, EY + Snider Center, founding story ("Founded at the Robert H. Smith School of Business in 2020") placed here rather than in the hero.

### 5.7 Team `/team/` and Alumni `/alumni/`
- Team: levels from `team.json`. Card = photo (placeholder), name, title, **major(s)**, optional "Worked on" project chips linking to project pages. Filter by level and major. Do not show anyone without `consent_to_publish: true`.
- Alumni: card = name, major(s), current role/org, one-line SCG story; "Read more" expands the existing long bio. Filter by major and industry. Seed data in `alumni.json` is a handful of non-Smith-major alumni to prove the message; all other alumni must be added by officers with the same schema. Add an **Alumni Report** slot for the existing 2026 Alumni Report download.
- Member statistics block (existing: graduation speakers, ODK members, QUEST Honors members, teaching assistants, club presidents/VPs): keep, but only with figures supplied by officers (not carried over automatically).

### 5.8 Work With Us `/work-with-us/`
Audience: UMD student orgs, departments and nonprofits.
- Intro: "SCG works alongside your organization to create personalized and long-lasting solutions." On-campus services are always free; off-campus nonprofits get low rates (existing FAQ text).
- **What we can help with** (derived from Fall 2025 projects, not invented): research and benchmarking; data, dashboards and analytics; machine-learning and AI strategy; process, role and knowledge-management design; marketing and communication strategy; business and monetization strategy.
- Process (reuse How a project works), a short "Past clients" strip, and a **request form** (name, organization, what you need, timeline, email). Form posts to a configurable endpoint (e.g., Formspree/Netlify Forms; endpoint in `site.json`, currently TBD). Include honeypot spam protection and a success/error state. Never expose a personal email.

### 5.9 Partners `/partners/`
From `site.json → partners`. Keep the EY narrative but shorten and make it factual; remove the "level of prestige that elevates the SCG experience to new heights" style language. Keep the SICC case prompt download slot (existing "SICC December 2023 Case Prompt (pdf)"; placeholder).

## 6. Interactive Projects explorer (the centerpiece)

**Data**: `data/projects.json`. Do not hardcode projects in HTML.

**Explorer layout**
- Filter bar: **Semester** (single-select), **Track** (`disciplines`, multi-select chips), **Good fit for** (`fits`, multi-select, searchable), **Client type** (`client_type`), plus a text search over title, client, summary and skills. Show result count and a "Clear filters" button. Filters are reflected in the URL query string so views are shareable. Announce result-count changes to screen readers (`aria-live="polite"`).
- Card grid (1 col mobile, 2 tablet, 3 desktop). Card: image slot, semester + client-type chips, title, tagline, 2-3 skill chips, "View project" affordance. The whole card is one button/link.

**Detail experience (modal/drawer)**
- Clicking a card opens a **dialog** (use native `<dialog>` or an equivalent with proper ARIA: `role="dialog"`, `aria-modal`, labelled by the title) that animates in (fade/slide, reduced-motion safe). Desktop: right-side drawer ~720px or centered modal; mobile: full-screen sheet.
- Content, in order: hero image slot; title; client, semester, client type; **Challenge**; **Scope** (deliverable list from `scope`); **Approach**; **Outcome**; **Skills used** (chips); **Good fit if you study…** (`fits`, labeled as suggested); **Team** (size, roles, majors; placeholders until supplied); links.
- Any field that is `null` or contains `[TBD...]` renders as a **visible placeholder block** ("Outcome coming soon"), not hidden, so officers see what to supply. Provide a build-time flag to hide placeholders in production once content is final.
- Controls: close (X, ESC, backdrop click), **Previous/Next project** buttons and arrow-key support, "Open full page" link.
- Behavior: focus is trapped in the dialog and returns to the originating card on close; background is inert; body scroll locked; **deep link** `/projects/#alliom` opens the dialog on load; browser Back closes it (use `history.pushState`/`hashchange`).
- No-JS fallback: every card links to `/projects/<id>/`, a full server-rendered page with the same sections, its own `<title>`, meta description and Open Graph tags.

**Home featured block** reuses the same card and dialog component.

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
