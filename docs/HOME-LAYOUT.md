# Home page layout blueprint (supersedes SPEC 5.1 and 5.2 for the home page)

**What this is.** The home page must follow the *structure, section order, proportions and interaction rhythm* of the reference screenshot `docs/reference/layout-reference-uconsulting-home.jpg` (UConsulting LA's home page), rebuilt with SCG's own brand, copy, fonts, colors and images.

**What it is not.** Do not copy their text, images, icons, fonts (they use Montserrat Alternates + Open Sans), color scheme, mascot, or markup/CSS. Do not reuse any file from their site. The screenshot is an internal layout reference only; **never ship it** (keep it out of the build output). In the screenshot, the logo grid in the lower-left card did not load; ignore the broken images.

**Why this replaces the earlier home.** The first home page was too cluttered and leaned too hard on the "not only business majors" slogan. This home has 6 calm blocks. Breadth of majors is *shown* (skills and team-major chips on project cards, member backgrounds) and never announced as a slogan. The one plain statement that anyone at UMD can apply lives on `/join/` and in the FAQ.

## Wireframe (desktop, 1440px wide; heights are approximate)

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER (overlays hero)  [SCG logo plate]  Projects Join Team │  ~70px
│   Alumni  Work With Us           [IG] [IN] [ Join SCG ]      │
├──────────────────────────────────────────────────────────────┤
│ 1. HERO  full-bleed photo + dark overlay           ~660px    │
│                                                              │
│              WELCOME TO THE                                  │
│          SNIDER CONSULTING GROUP     (H1, centered, white)   │
│   one-line subhead (centered, white, ~22px)                  │
│   small line: "In partnership with Ernst & Young"           │
│   [ See our projects ]  [ Join SCG ]                         │
├──────────────────────────────────────────────────────────────┤
│ 2. STAT STRIP  3 stats, centered, hairline dividers ~120px   │
│     2020            Free            4+ years                 │
│  FOUNDED       TO JOIN       EY PARTNERSHIP                  │
│  (strip sits over the hero's bottom edge on a white wash)    │
├──────────────────────────────────────────────────────────────┤
│ 3. COMMUNITY  2 columns, white background        ~520px      │
│  H2 "Our Community"            ┌──────────────┐              │
│  2 short paragraphs            │ photo collage│  (slot)      │
│  [ Meet the Team ]             │  / group pic │              │
│                                └──────────────┘              │
├──────────────────────────────────────────────────────────────┤
│ 4. OUR WORK  dark band (--ink), full-bleed       ~1150px     │
│        H2 "Our Work" (centered, white)                       │
│        intro paragraph (centered, max ~900px)                │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   3 cards, 40px gap │
│  │ photo   │   │ photo   │   │ photo   │   content width     │
│  │ [Case 1]│   │ [Case 2]│   │ [Case 3]│   ~1180px           │
│  │ Title   │   │ Title   │   │ Title   │                     │
│  │ ◉ Objective ◉ ...                    │                     │
│  │ ◉ Scope   │   │         │   │         │                  │
│  │ ◉ Impact  │   │         │   │         │                  │
│  │ team chips│   │         │   │         │                  │
│  └─────────┘   └─────────┘   └─────────┘                     │
│              [ View all projects ]                           │
│   testimonial carousel (centered quote + dots) ~230px        │
│   (renders only if data/testimonials.json has entries)       │
├──────────────────────────────────────────────────────────────┤
│ 5. WHERE SCG TAKES YOU  2 columns, white         ~710px      │
│ ┌─────────────────────────┐   H2 "Where SCG Takes You"       │
│ │ card: "Our members work │   paragraph                      │
│ │ at…" name/logo grid     │   [ Explore Alumni ]             │
│ │ (4 cols x 3 rows)       │                                  │
│ │ ── optional 3 stats ──  │                                  │
│ └─────────────────────────┘                                  │
├──────────────────────────────────────────────────────────────┤
│ 6. FOOTER  dark (--ink)                           ~290px     │
│ [logo plate] tagline        affiliation line     [IG] [IN]   │
│ short gold divider                                           │
│ © year Snider Consulting Group                               │
└──────────────────────────────────────────────────────────────┘
```

Mobile (360-767px): everything single column; hero ~560px; stat strip stacks to 3 compact columns (or 1 column if too tight); Community text above image; project cards in a horizontal scroll-snap row or stacked; logo card full width above its text; header collapses to a menu button with the Join SCG button kept visible.

## Block-by-block

### Header
Logo (`assets/scg-logo.png`) on a small white rounded plate so the red/gold logo reads over the dark hero. Nav: Projects, Join SCG (page), Team, Alumni, Work With Us (the rest of the site map lives in the footer). Right side: Instagram and LinkedIn icon buttons and a **Join SCG** button (state driven by `site.json -> recruiting`). Transparent over the hero; on scroll it becomes solid (`--paper`) with a subtle shadow. Keyboard-accessible mobile menu.

### 1. Hero
- Background: `assets/placeholder-hero-quad.jpg` (UMD Washington Quad aerial already used on the current site; placeholder until better photos exist) with an `--ink` overlay around 55-65% so white text passes contrast. Add a subtle bottom fade to white into the stat strip.
- Content, vertically centered: H1 **"Welcome to the Snider Consulting Group"**; subhead (draft): **"UMD's student-run consulting group, solving real problems for campus organizations and nonprofits since 2020."**; small line **"In partnership with Ernst & Young"**; two buttons: primary **See our projects** (gold fill on dark), secondary **Join SCG** (outline).
- Optional slot above the H1 (like a small emblem): leave out unless a distinct mark exists. Do not repeat the logo.

### 2. Stat strip
Three verified stats from `data/site.json -> stats` where `verified: true`: Founded 2020 · Free to join · EY partnership 4+ years. Big number in `--scg-red` (Montserrat 800, ~40px), small uppercase tracked label beneath. Hairline vertical dividers on desktop. If officers later verify "client projects" and "alumni" counts, those can replace or extend the strip (max 4 items).

### 3. Community
- H2 **"Our Community"** with the accent word styled in `--scg-red` (the way the reference accents one letter/word; use your own treatment).
- Copy from existing SCG material (tighten, do not invent): the pillar "Fostering a Strong Sense of Community" (collaborative environment, knowledge sharing, mutual support) and the weekly rhythm (weekly general body meetings/workshops, weekly team project meetings, occasional social outings). Add `[TBD: one sentence on a signature tradition/retreat]` as a visible placeholder.
- Button: **Meet the Team** (primary red) to `/team/`.
- Right column: photo slot with soft shadow and 12-16px radius. Use `assets/placeholder-group-photo.jpg` as a stand-in; label it as a placeholder in dev. Ideal final: a collage of candid member photos.

### 4. Our Work (the centerpiece, keep interactive)
- Dark band (`--ink`). H2 white. Intro paragraph (existing SCG copy, tightened): "We work alongside our clients to create personalized, long-lasting solutions that serve and elevate UMD's community. Each engagement is led by a student team and guided by consultants and partners from EY."
- Three cards from the `featured: true` projects in `data/projects.json` (Alliom, School Harbor, Product Space). Card anatomy, top to bottom:
  1. image (16:9 slot) with a small pill "Case Study N" bottom-left;
  2. title with semester, e.g. **Alliom (Fall 2025)**, in `--scg-red` or gold on hover;
  3. three icon rows: **Objective** (= project `tagline`), **Scope** (= the first 2 `scope` items), **Impact** (= `outcome`; if null, show "Results coming soon" as a placeholder);
  4. a thin row of **team/skill chips** (project `skills`, up to 3; and `team.majors` when supplied) to quietly show who works on these;
  5. a "View project" affordance.
- **Clicking a card opens the project dialog** from SPEC section 6 (deep link `#alliom`, focus trap, prev/next). Cards link to `/projects/<id>/` without JS.
- Below the cards: primary button **View all projects** to `/projects/`.
- Testimonials: a centered quote carousel with dots, only if `data/testimonials.json` has entries; otherwise do not render (dev shows a small placeholder). Never invent quotes.

### 5. Where SCG Takes You
- Left: a bordered card (12-16px radius, soft shadow) titled "Our members work at…" with a 4-column name/logo grid. Use these employers already published on the current SCG site as text chips until logos are supplied: EY, Deloitte, Capital One, KPMG, Bain & Company, Boston Consulting Group, Booz Allen Hamilton, Johnson & Johnson. (Source: the old homepage's "Our Members Work At…" logo row.) Under a hairline, an optional 3-stat row, rendered only if three verified stats exist.
- Right: H2 **"Where SCG Takes You"** (accent word in red), paragraph from existing material: members build skills through an intensive 10-week professional development program originally designed by SCG members and alumni at Bain and Capital One, and connect with alumni at EY, Deloitte, Capital One, Bain and other firms through site visits, workshops, mentorship and social events. Button **Explore Alumni** to `/alumni/`.

### 6. Footer
`--ink` background. Logo on a white plate, tagline (draft: "Student-run consulting at the University of Maryland"), a short gold divider, copyright, Instagram and LinkedIn buttons, and the line "In direct affiliation with the Ed Snider Center for Enterprise and Markets". Link out to the other site pages in a compact row.

## Visual rules for this page
- Alternate light and dark blocks exactly as above: dark hero, white strip, white community, dark work, white places, dark footer.
- Fonts: Montserrat for headings (800 for H1/H2, tight letter-spacing), Lato for body; **do not** use Montserrat Alternates or Open Sans.
- Colors: `--ink` for dark bands, `--scg-red` for accent words, stat numbers, primary buttons on light; `--scg-gold` for primary button fill and highlights on dark. Contrast checked.
- Content width about 1180px; section padding 80-100px vertical on desktop, 56px on mobile.
- Cards: white, 12-16px radius, 1px `--line` border, hover lift (off under reduced motion).
- No extra sections on the home page. In particular **remove**: Find your seat tabs, How-a-project-works strip, "Who's in the room" chips, credibility/past-client strip, press links, final CTA band, recruiting banner. (Those belong on `/join/`, `/about/`, `/partners/`.)

## Copy rules for the whole site (new)
- Never use slogans about majors ("not just business majors", "every major welcome", "consulting isn't a major") in headings, heroes or buttons. Show range through concrete content: skills, tools and team-major chips on projects; majors on Team and Alumni.
- One calm sentence of explicit eligibility belongs on `/join/` and in the FAQ ("Open to all UMD undergraduates in good academic standing with five or more semesters remaining").
