# Prompt 2: Interactive Projects explorer

```
Start stage 2: the interactive Projects explorer, per SPEC section 6.

Do:
- Build /projects/ with the filter bar (semester, track, good-fit, client type, text search), URL-synced state, result count with aria-live, and the card grid.
- Build the project detail dialog (native <dialog> or equivalent with correct ARIA): sections in the order given in SPEC 6, focus trap, ESC/backdrop/X close, focus return, inert background, scroll lock, prev/next buttons plus arrow keys, deep links (/projects/#alliom) and Back-button behavior.
- Generate a standalone page for every project at /projects/<id>/ from data/projects.json (own title, meta description, Open Graph, BreadcrumbList JSON-LD). Cards must link to these pages so the explorer works with JavaScript disabled.
- Reuse the same card + dialog on the Home featured block.
- Render null / [TBD] fields as visible placeholder blocks, with a build flag (e.g. HIDE_PLACEHOLDERS=1) to hide them later.
- Vanilla JS only, under the size budget in SPEC section 10. Respect prefers-reduced-motion.

Test: keyboard-only use, screen-reader labels, deep link on a cold load, filter + dialog combos, 360px layout, and that adding a sixth project to data/projects.json (try it, then remove it) appears everywhere with zero code changes.

Report what you built, what is placeholder, and decisions made. Stop for my review before stage 3.
```
