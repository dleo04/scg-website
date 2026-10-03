# SCG website handoff package

This folder is a ready-to-use starting repo for Claude Code. It contains the spec, the project data, brand assets and staged prompts. It does not contain the site code; Claude Code builds that.

## How to use
1. Create an empty folder on your computer, copy everything from this package into it, and open it with Claude Code.
2. Paste `prompts/00-kickoff.md` first. It makes Claude Code read everything and propose a plan without building.
3. After you approve the plan, paste `prompts/01-foundation.md`, review the result, then `02`, `03` and `04` in order. Each prompt stops for your review.
   - If the first home page feels cluttered or cliche, paste `prompts/01b-home-rebuild.md` (it rebuilds the home page from `docs/HOME-LAYOUT.md`).
   - Do NOT put the UConsulting zip in the repo; the blueprint plus one screenshot (`docs/reference/`) is all Claude Code needs.
4. The rules that must hold the whole time live in `CLAUDE.md`, which Claude Code reads automatically. That is why you do not need to paste one giant prompt.

## What is in here
- `CLAUDE.md`: standing rules and goals.
- `docs/SPEC.md`: pages, components, design tokens, interaction spec, SEO/accessibility targets, definition of done.
- `data/`: `projects.json` (your five Fall 2025 projects), `faq.json`, `site.json`, `past-clients.json`, `alumni.json`, `team.json`.
- `assets/`: logo, icon, favicon, a stand-in group photo, and `PLACEHOLDERS.md`.
- `prompts/`: five prompts for Claude Code.

## What you still need to supply (officers)
See the "Open decisions and content needed" list in the chat message that came with this package. In short: project outcomes/approach/team info, team and alumni consent and majors, recruitment dates and links, real photos, and a few policy decisions (the 5% claim, the five-semester rule).

## Privacy note
Your project spreadsheet contained individual contact names and emails. I deliberately left those out of `projects.json` so they cannot end up on a public site.
