# Image placeholders

Provided brand assets (use as-is):
- `scg-logo.png`: official logo, 668x184. Do not alter.
- `scg-icon-192.png`, `favicon-32.png`: icon/favicon.

Stand-in photo (replace when better photos exist):
- `placeholder-group-photo.jpg`: the current group photo (members in suits in front of the Smith School sign). Use only as a temporary hero stand-in. It reinforces the "business school only" impression, so the goal is to replace it with candid, varied photos: members at work sessions, whiteboards, laptops, client presentations, socials, EY workshops, and members from many majors.

Generate neutral placeholder blocks (no stock imagery) for everything else, with a visible label, at these sizes:

| Slot | Ratio | Where |
|---|---|---|
| Hero photo | 4:3 or 16:9 | Home |
| Project image (one per project) | 16:9 | Cards, modal, project page |
| Role-track illustration | 1:1 | Find your seat |
| Team headshot | 4:5 | Team |
| Alumni photo | 4:5 | Alumni |
| Partner logo | wide, transparent | Partners, credibility strip |
| Past-client logos | wide, transparent | Credibility strip (use text chips until supplied) |
| Open Graph image | 1200x630 | Social previews |

Project image paths referenced by `data/projects.json` live under `assets/placeholders/`; create those files as generated gray placeholder SVG/PNGs so nothing 404s.
