# Home page layout blueprint (supersedes SPEC 5.1 and 5.2 for the home page)

**What this is.** The home page must follow the *structure, section order, proportions and interaction rhythm* of the reference screenshot `docs/reference/layout-reference-uconsulting-home.jpg` (UConsulting LA's home page), rebuilt with SCG's own brand, copy, fonts, colors and images.

**What it is not.** Do not copy their text, images, icons, fonts (they use Montserrat Alternates + Open Sans), color scheme, mascot, or markup/CSS. Do not reuse any file from their site. The screenshot is an internal layout reference only; **never ship it** (keep it out of the build output). In the screenshot, the logo grid in the lower-left card did not load; ignore the broken images.

**Why this replaces the earlier home.** The first home page was too cluttered and leaned too hard on the "not only business majors" slogan. This home has 6 calm blocks. Breadth of majors is *shown* (skills and team-major chips on project cards, member backgrounds) and never announced as a slogan. The one plain statement that anyone at UMD can apply lives on `/join/` and in the FAQ.

## Wireframe (desktop, 1440px wide; heights are approximate)

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER (sticky, solid white) [SCG logo] Projects Join Team  │  60/72px
│   Alumni  Work With Us           [IG] [IN] [ Join SCG ]      │
├──────────────────────────────────────────────────────────────┤
│ 1. HERO  full-bleed photo + flat maroon-black tint           │
│   below the sticky header; ~92vh minus header on desktop     │
│              [ reversed SCG logo, no plate ]  (leads)        │
│              (540px @1440 · 480 @1280 · 400 @768 · 280 @360) │
│            Welcome to SCG   (H1 supports: ~40-64px, 1 line)  │
│   subhead on ONE line from 1024px (centered, white)          │
│   small line: "In partnership with Ernst & Young"           │
│   (no buttons: Projects + Join SCG live in the header)       │
├──────────────────────────────────────────────────────────────┤
│ 2. STAT STRIP  3 stats, centered, hairline dividers ~120px   │
│      50+             40+              15+                    │
│    ALUMNI      CLIENT PROJECTS   PLACEMENTS EACH YEAR        │
│  (photo fades to solid white in one gradient; strip is white)│
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
│  │ 2.2:1   │   │ [Case 2]│   │ [Case 3]│   ~1180px           │
│  │ Title   │   │ Title   │   │ Title   │   equal heights     │
│  │ ◉ Objective (≤3 lines)               │                     │
│  │ ◉ Scope   (1 line, ≤2)  │   │         │                  │
│  │ ◉ Impact  (≤2 lines)    │   │         │                  │
│  │ Read more →             │   │         │                  │
│  └─────────┘   └─────────┘   └─────────┘                     │
│              [ View all projects ]                           │
│   testimonial carousel (centered quote + dots) ~230px        │
│   (renders only if data/testimonials.json has entries)       │
├──────────────────────────────────────────────────────────────┤
│ 5. WHERE SCG TAKES YOU  2 columns, white         ~710px      │
│ ┌─────────────────────────┐   H2 "Where SCG Takes You"       │
│ │ card: "Our members work │   paragraph                      │
│ │ at…" name/logo grid     │   [ Explore Alumni ]             │
│ │ logos, 4 cols x 3 rows  │                                  │
│ │ (one white card, outline│                                  │
│ │  + shadow; plain tiles) │                                  │
│ │ (no stat row: figures   │                                  │
│ │  are in the stat strip) │                                  │
│ └─────────────────────────┘                                  │
├──────────────────────────────────────────────────────────────┤
│ 6. FOOTER  dark (--ink)                           ~290px     │
│ [logo plate] tagline        affiliation line     [IG] [IN]   │
│ short gold divider                                           │
│ © year Snider Consulting Group                               │
└──────────────────────────────────────────────────────────────┘
```

Mobile (360-767px): everything single column; hero ~560px; stat strip stays 3 compact columns (verified to fit at 320-360px; labels may wrap to two lines); hero subhead wraps with balanced line breaks; Community text above image; project cards in a horizontal scroll-snap row or stacked; logo card full width above its text; header collapses to a menu button with the Join SCG button kept visible.

## Block-by-block

### Header
Sticky at the top of every page and always solid white (`--paper`) from the first paint, with a 1px `--line` bottom border and a `0 1px 8px rgba(0,0,0,.08)` shadow. There is no transparent state and no scroll-driven JavaScript. Height: 60px on mobile, 72px from 1024px; it never changes on scroll. Left: the original logo (`assets/scg-logo.png`, unaltered, no plate), 36px tall on mobile and 44px on desktop, always visible; its clear space comes from the header padding plus the PNG's built-in margin. Nav: Projects, Join SCG (page), Team, Alumni, Work With Us (the rest of the site map lives in the footer), in `--ink`, about 38px between labels on desktop (10px gap + 14px link padding each side), one centered row; hover = red text + red underline; focus = 3px red ring; current page = red + underline. Right: Instagram and LinkedIn icon buttons outlined in ink and a **Join SCG** button in `--scg-gold` with ink text, hovering to `--scg-gold-dark` (state driven by `site.json -> recruiting`). Mobile: the same white bar with logo, Join SCG and a menu button that opens a full-width white panel (Escape closes it and returns focus to the button). Without JS on small screens the links show inline and the bar is not sticky, so it does not cover the page. Anchor targets use `scroll-margin-top: var(--header-h)` so they land below the bar.

### 1. Hero
- Background: `assets/placeholder-hero-quad.jpg` (UMD Washington Quad aerial already used on the current site; placeholder until better photos exist) with a flat maroon-black tint `--hero-tint: rgba(38, 8, 10, 0.72)` (no gradient, no blur on the tint). The bottom fade is one continuous gradient (`.hero::after`, `clamp(96px, 12vh, 140px)` tall) that reaches opaque `--paper` 8px before its end and overlaps the strip by 2px; the stat strip background is solid `--paper`, so there is no seam at any zoom or pixel density.
- Logo (the primary element): the officer-approved reversed variant `assets/scg-logo-reversed.png` (dark/photo backgrounds only), centered above the H1 directly on the photo: no plate or box, only `drop-shadow(0 2px 12px rgba(0,0,0,.35))`. Width 280px @360, 400 @768, 480 @1280, 540 @1440 (piecewise `clamp()`, `max-width: 82vw`); its artwork is at least ~77% of the headline's width (92% at 1440). Width/height attributes, eager with `fetchpriority="high"`, alt "Snider Consulting Group". Spacing (visible, artwork to text): logo → H1 56px (1024+), 44px (768+), 32px (mobile); H1 → subhead 20px; subhead → EY line 28px. The PNG has 21.5% transparent margin above/below the artwork, which the logo's bottom margin compensates for.
- Height: the hero starts below the sticky header, so the header height is subtracted. Desktop (1024px+) `clamp(688px, calc(92vh - 72px), 888px)`; tablet (768px+) `calc(80vh - 60px)`; mobile `max(560px, calc(85svh - 60px))`. The content block is exactly centered (equal top and bottom padding `clamp(136px, 17vh, 180px)`): the logo sits 151-271px below the header and the EY line ends 57-144px above where the fade starts. At 1440×900 the whole hero plus the top of the stat strip is visible. The photo covers the whole area (`object-fit: cover`, centered) and the tint covers the full hero. The file is required: if it is missing, the build stops with an error (it is never recreated).
- Content, vertically centered, from `data/site.json -> hero`: H1 **"Welcome to SCG"**, supporting the logo (one line at every width: `min(clamp(2.5rem, 4.2vw, 4rem), 10.4vw)` with `nowrap`: 37.4px at 360, 40px to 768, ~54px at 1280, ~60px at 1440, 64px cap); subhead **"UMD's student-run consulting group, solving real problems since 2020."**; small line **"In partnership with Ernst & Young"**. The full name "Snider Consulting Group" stays in the `<title>`, meta description, Open Graph tags, JSON-LD and the logo's alt text. **No buttons in the hero**: the header already carries Projects and the Join SCG button. Generous, even space above and below the three items.
- Subhead: max-width about 1200px, font `clamp(1rem, 1.6vw, 1.5rem)`, `white-space: nowrap` from 1024px up so it is exactly one line on desktop; below that it wraps naturally (one line at 768, two on phones) with `text-wrap: balance`. No horizontal scroll at any width.
- No "Stand-in photo" badge on the hero; the stand-in photo is tracked in `TODO-CONTENT.md` instead.
- Contrast (measured with `npm run hero-contrast` on the actual pixels behind each element, 360-1440px): H1, subhead and EY line ≥ 4.5:1 (currently 7.8-8.1:1); logo white and gold parts ≥ 3:1.

### 2. Stat strip
Exactly the verified stats in `data/site.json -> stats` (max 4), currently **50+ Alumni · 40+ Client projects · 15+ Placements each year** (figures supplied by SCG leadership). No extra wording or claims beside them. Big number in `--scg-red` (Montserrat 800, ~40-48px), small uppercase letter-spaced label in `--ink-2` beneath. Hairline vertical dividers. Founded 2020, Free to join and the EY partnership length moved to `site.json -> facts` for `/about/` and `/join/`; the EY partnership itself is stated in the hero line.

### 3. Community
- H2 **"Our Community"** with the accent word styled in `--scg-red` (the way the reference accents one letter/word; use your own treatment).
- Copy (final, supplied by SCG): two paragraphs, on (1) a small, close-knit group founded in 2020 whose members look out for one another, and (2) community beyond client work: weekly workshops, team meetings, social outings and the semesterly hikes. The hikes cover the former "signature tradition" placeholder.
- Button: **Meet the Team** (primary red) to `/team/`.
- Right column: photo slot with soft shadow and 12-16px radius. Use `assets/placeholder-group-photo.jpg` as a stand-in; label it as a placeholder in dev. Ideal final: a collage of candid member photos.

### 4. Our Work (the centerpiece, keep interactive)
- Dark band (`--ink`). H2 white. Intro paragraph (existing SCG copy, tightened): "We work alongside our clients to create personalized, long-lasting solutions that serve and elevate UMD's community. Each engagement is led by a student team and guided by consultants and partners from EY."
- Three cards from the `featured: true` projects in `data/projects.json` (Alliom, School Harbor, Product Space). Card anatomy, top to bottom:
  1. image (about 2.2:1, shorter than 16:9) with a small pill "Case Study N" bottom-left;
  2. title with semester, e.g. **Alliom (Fall 2025)**, in `--scg-red` or gold on hover;
  3. three icon rows (44px red icon circles, labels ~17px semibold, body 16px/1.5, tight row spacing): **Objective** (= `tagline`, max 3 lines), **Scope** (= the first 2 `scope` items joined into one line of plain text, max 2 lines; optional `scope_summary` overrides), **Impact** (= `outcome`, max 2 lines; if null, a compact muted one-line "Results coming soon");
  4. no skill chips on the card (skills stay in the dialog and on the project page);
  5. a small red "Read more →" (~15px) at the bottom.
  Cards are equal height and top-aligned (grid stretch); title ~24px.
- **Clicking a card opens the project dialog** from SPEC section 6 (deep link `#alliom`, focus trap, prev/next). Cards link to `/projects/<id>/` without JS.
- Below the cards: primary button **View all projects** to `/projects/`.
- Testimonials: a centered quote carousel with dots, only if `data/testimonials.json` has entries; otherwise do not render (dev shows a small placeholder). Never invent quotes.

### 5. Where SCG Takes You
- Left: a single pure-white card (#FFFFFF, 1px `--line` outline, 16px radius, soft shadow) titled "Our members work at…" (red heading) with a 4-column by 3-row logo grid (2 columns below 520px). The tiles have no background, border or shadow of their own, so only the logos show. Row 1: EY, Deloitte, Capital One, KPMG. Row 2: Bain & Company, Boston Consulting Group, Booz Allen Hamilton, Johnson & Johnson. Row 3: JPMorgan Chase, Strategy&, Morgan Stanley, Accenture (source: the old homepage's "Our Members Work At…" logos). Logos come from `data/logo-sources.json` via `npm run logos` into `assets/logos/` with blank margins (transparent or near-white) auto-trimmed, and are shown contained in identical fixed tiles (max 40px tall, max 80% of the tile wide, sized for even visual weight), at full color with no hover effect (tiles are not interactive), alt text = company name, never recolored or distorted. A logo that fails to download falls back to a text chip. The footer carries the trademark footnote. No stat row in this card: the same figures already appear in the stat strip, so they are not repeated on the page.
- Right: H2 **"Where SCG Takes You"** (accent word in red), paragraph from existing material: members build skills through an intensive 10-week professional development program originally designed by SCG members and alumni at Bain and Capital One, and connect with alumni at EY, Deloitte, Capital One, Bain and other firms through site visits, workshops, mentorship and social events. Button **Explore Alumni** to `/alumni/`.

### 6. Footer
`--ink` background. The officer-approved reversed logo (`assets/scg-logo-reversed.png`) directly on black, no plate or box, 200px wide on mobile and 240px from 768px, linking home, alt "Snider Consulting Group" (its artwork is aligned with the text column). Tagline (draft: "Student-run consulting at the University of Maryland"), a short gold divider, copyright, Instagram and LinkedIn buttons, and the line "In direct affiliation with the Ed Snider Center for Enterprise and Markets". Link out to the other site pages in a compact row.

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
