# Prompt 0: Kickoff (use plan mode; do not build yet)

Paste this into Claude Code from the repo root:

```
Read CLAUDE.md, docs/SPEC.md, assets/PLACEHOLDERS.md and every file in data/. Do not write any site code yet.

Then reply with:
1. A 10-line summary of the project goals and hard rules, in your own words.
2. The folder structure and Eleventy setup you propose (templates, partials, data usage, how project pages are generated from data/projects.json, how the build enforces consent_to_publish).
3. Any ambiguities, conflicts or risks you see in the spec, each with a recommended resolution.
4. A build plan in the 4 stages from prompts/01 to prompts/04, with what "done" means for each.

Wait for my approval before starting stage 1.
```
