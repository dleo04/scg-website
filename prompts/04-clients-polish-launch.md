# Prompt 4: Clients, About, Partners, polish, launch prep

```
Start stage 4: remaining pages and launch hardening.

Do:
- /about/, /partners/, /work-with-us/ per SPEC 5.6, 5.8, 5.9, plus 404. The work-with-us request form posts to the endpoint configured in data/site.json (currently null: show a visible "form not connected" notice in dev and hide the form in production until an endpoint exists). Include honeypot spam protection, validation messages and success/error states.
- SEO: unique titles/descriptions, canonical URLs, sitemap.xml, robots.txt, OG image generated from the logo plate, JSON-LD as specified.
- Analytics: implement the consent-gated option from site.json, off by default.
- Performance: image optimization (WebP/AVIF, explicit dimensions, lazy loading), font loading, remove unused CSS/JS, verify the budgets in SPEC 10.
- Accessibility audit: run axe (or equivalent) on every route and fix all issues; manual keyboard and screen-reader spot checks on the nav, tabs, accordion and project dialog.
- Link check every internal and external link.
- Write README.md for officers (run locally, add a project, add a team member/alumnus, update the recruiting banner and timeline, deploy to a static host) and finalize DECISIONS.md.
- Generate TODO-CONTENT.md (npm run todo) listing every placeholder, [TBD], needs_decision FAQ item and unconfirmed fact with its file/route.
- Final pass against the Definition of Done in SPEC section 11.

Report with: Lighthouse scores, axe results, the remaining content TODOs grouped by who must supply them, and anything in the spec you could not satisfy.
```
