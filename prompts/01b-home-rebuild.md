# Prompt 1b: Rebuild the Home page (use this after stage 1 if the first home was too cluttered)

Make sure these are in the repo first: `docs/HOME-LAYOUT.md`, `docs/reference/layout-reference-uconsulting-home.jpg`, `data/testimonials.json`, `assets/placeholder-hero-quad.jpg`, and the updated `CLAUDE.md` and `docs/SPEC.md`.

```
The current home page is too cluttered and leans too hard on a "not only business majors" slogan. Rebuild only the Home page.

Read docs/HOME-LAYOUT.md carefully, and open the image docs/reference/layout-reference-uconsulting-home.jpg to see the target layout. Follow that blueprint's six blocks, section order, proportions, light/dark rhythm and interaction pattern. Use SCG's own copy, colors, fonts (Montserrat headings, Lato body), logo and images only. Do not copy any text, images, icons, fonts, mascot or code from the reference site, and keep the reference screenshot out of the build output.

Requirements:
- Remove everything on the home page that is not one of the six blocks (Find your seat, How a project works, Who's in the room, credibility strip, press links, final CTA band, recruiting banner). Keep those components and their data for /join/, /about/ and /partners/; do not delete them from the project.
- Keep the interactive project experience: the three cards in "Our Work" open the same project dialog (deep links, focus trap, prev/next) and link to /projects/<id>/ without JavaScript.
- Card rows are Objective (= tagline), Scope (= first two scope items) and Impact (= outcome, or a visible "Results coming soon" placeholder), plus up to three skill chips.
- Testimonial carousel renders only if data/testimonials.json has entries with consent_to_publish:true.
- Apply the new site-wide copy rule: no slogans about majors in headings, heroes or buttons.
- Header becomes solid on scroll; hero overlay passes contrast for white text; verify all color pairings.
- Check at 360px, 768px and 1440px, keyboard-only navigation, and that nothing is horizontally scrollable.

Then show me the result at the three widths, list any placeholders, and record decisions in DECISIONS.md. Stop for my review.
```
