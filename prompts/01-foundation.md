# Prompt 1: Foundation, design system, Home

```
Start stage 1 of the SCG site build, following CLAUDE.md and docs/SPEC.md.

Do:
- Scaffold the Eleventy project: package.json scripts (dev, build, todo), base layout, header/footer partials, skip link, nav with the Apply button driven by data/site.json -> recruiting, and a mobile menu that is keyboard accessible.
- Implement the design tokens, typography and component styles from SPEC section 4 in one CSS file organized with custom properties. Include buttons, chips, cards, stat tiles, accordion, tabs, timeline, and the placeholder block/[TBD] styles from SPEC section 7.
- Create generated neutral placeholder images under assets/placeholders/ for every slot in assets/PLACEHOLDERS.md so nothing 404s.
- Build the Home page per SPEC 5.1 and the components in 5.2 (Find your seat) and 5.3 (How a project works). For the featured projects block, render static cards from data for now (the interactive dialog comes in stage 2).
- Add favicon, web manifest, meta tags, Open Graph defaults and JSON-LD Organization.

Constraints: logo untouched, brand colors only, no invented facts or numbers (use the verified/placeholder logic for stats), no GoDaddy leftovers.

When done: run the site, check 360/768/1280px, check keyboard navigation and contrast, fix issues, then give me a short report of what exists, what is placeholder, and any decisions you made (also record them in DECISIONS.md). Stop for my review before stage 2.
```
