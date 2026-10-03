# Prompt 3: Join, Prepare, Team, Alumni

```
Start stage 3: recruitment and people pages, per SPEC 5.4, 5.5, 5.7.

Do:
- /join/: who belongs, find-your-seat, what you get, timeline (driven by data/site.json -> timeline, with "optional" pills and a graceful "Dates TBD" state), interview process placeholder, eligibility, FAQ from data/faq.json (accordion; items with needs_decision:true must NOT render in production builds and should be listed in TODO-CONTENT.md; needs_review items render with a visible "draft" marker in dev only), resources, and a sticky mobile CTA. CTA logic exactly as in SPEC 5.4.
- Add FAQPage JSON-LD built only from published FAQ items.
- /join/prepare/: sample behavioral questions and download slots.
- /team/: card grid by level with major(s) and worked-on project chips, filter by level and major. The build must skip any entry without consent_to_publish:true and must fail loudly if a published entry has "[TBD]" in the name.
- /alumni/: filterable by major and industry, expandable bios, Alumni Report download slot. Seed data in data/alumni.json must show only entries with consent_to_publish:true in production (all seeds are false right now, so show a clearly marked sample/placeholder state).

Make sure the language on every page is welcoming to non-business majors and contains no unverifiable claims. Run the same device, keyboard and contrast checks as before.

Report what you built, what is placeholder, and decisions made. Stop for my review before stage 4.
```
