// "Find your seat" (components/seat-matcher.njk). Without this file the four tracks are plain
// stacked sections. With it: four selector tiles (WAI-ARIA tabs, automatic activation), one
// visible panel, a search box that matches majors, interests and skills, and deep links
// (/join/#track=<slug>, kept in sync with replaceState so Back is not filled with entries).
(() => {
  "use strict";
  const root = document.querySelector("[data-seat]");
  if (!root) return;
  const tablist = root.querySelector("[data-seat-tiles]");
  const tabs = [...root.querySelectorAll("[data-seat-tab]")];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  const panelsWrap = root.querySelector("[data-seat-panels]");
  const search = root.querySelector("[data-seat-search]");
  const input = root.querySelector("[data-seat-input]");
  const clearBtn = root.querySelector("[data-seat-clear]");
  const status = root.querySelector("[data-seat-status]");
  const chips = [...root.querySelectorAll("[data-seat-suggest]")];
  if (!tablist || !tabs.length || panels.some((p) => !p)) return;

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9+#& ]+/g, " ").replace(/\s+/g, " ").trim();
  const terms = tabs.map((t) => {
    const d = JSON.parse(t.dataset.terms || "{}");
    return { track: (d.track || []).map((x) => [x, norm(x)]), project: (d.project || []).map((x) => [x, norm(x)]) };
  });

  // ---- Tabs -------------------------------------------------------------------
  root.classList.add("is-enhanced");
  tablist.hidden = false;
  search.hidden = false;
  panels.forEach((p, i) => {
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", tabs[i].id);
    p.tabIndex = 0;
  });
  let current = 0;
  function select(i, { focus = false, sync = true } = {}) {
    current = i;
    tabs.forEach((t, n) => {
      const on = n === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[n].classList.toggle("is-active", on);
      panels[n].inert = !on;               // hidden panels stay in the grid (stable height) but are inert
      panels[n].setAttribute("aria-hidden", String(!on));
    });
    if (focus) tabs[i].focus();
    if (sync) history.replaceState(history.state, "", `${location.pathname}${location.search}#track=${tabs[i].dataset.seatTab}`);
  }
  tablist.addEventListener("click", (e) => {
    const i = tabs.indexOf(e.target.closest("[data-seat-tab]"));
    if (i >= 0) select(i);
  });
  tablist.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (n === undefined) return;
    e.preventDefault();
    select((n + tabs.length) % tabs.length, { focus: true });
  });

  // ---- Matching -----------------------------------------------------------------
  // Up to three terms, split on commas or " and ". Score per track: 3 for an exact match with
  // one of the track's own fits/skills/name, 2 for a partial match there, 1 for a match with
  // the fits/skills of the track's projects.
  const splitTerms = (text) => text.split(/,|\band\b|;/i).map(norm).filter((t) => t.length >= 2).slice(0, 3);
  // Partial = equal, a word of the term starts with the query ("ux" → "UX evaluation"), or
  // (3+ characters) either contains the other ("psych" → "Psychology", "data science" → "Data").
  const partial = (a, b) => a === b || b.split(" ").some((w) => w.startsWith(a)) || (a.length >= 3 && b.includes(a)) || (b.length >= 3 && a.includes(b));
  function score(i, q) {
    const own = terms[i].track.filter(([, n]) => partial(q, n));
    if (own.some(([, n]) => n === q)) return { s: 3, hits: own.map(([x]) => x) };
    if (own.length) return { s: 2, hits: own.map(([x]) => x) };
    if (terms[i].project.some(([, n]) => partial(q, n))) return { s: 1, hits: [] };
    return { s: 0, hits: [] };
  }

  const list = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a.at(-1)}`);
  let announceTimer = 0;
  function announce(text) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { status.textContent = text; }, 400); // debounced: final result only
  }

  function reset({ keepInput = false } = {}) {
    tabs.forEach((t) => {
      const b = t.querySelector("[data-seat-badge]");
      b.hidden = true;
      b.textContent = "";
      t.classList.remove("is-best", "is-also");
    });
    root.querySelectorAll("[data-term].is-hit").forEach((el) => el.classList.remove("is-hit"));
    if (!keepInput) input.value = "";
    clearBtn.hidden = !input.value;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(splitTerms(input.value).includes(norm(c.dataset.seatSuggest)))));
  }

  function run() {
    reset({ keepInput: true });
    const qs = splitTerms(input.value);
    if (!qs.length) { status.textContent = ""; return; }
    const results = tabs.map((t, i) => {
      const per = qs.map((q) => score(i, q));
      return { i, total: per.reduce((a, r) => a + r.s, 0), hits: per.flatMap((r) => r.hits) };
    });
    const matched = results.filter((r) => r.total > 0).sort((a, b) => b.total - a.total || a.i - b.i);
    if (!matched.length) {
      status.textContent = "";
      announce("No exact match yet. Here are all four tracks.");
      return;
    }
    const [best, ...also] = matched;
    const badge = (r, text, cls) => {
      const b = tabs[r.i].querySelector("[data-seat-badge]");
      b.textContent = text;
      b.hidden = false;
      tabs[r.i].classList.add(cls);
    };
    badge(best, "Best match", "is-best");
    also.forEach((r) => badge(r, "Also relevant", "is-also"));
    // Highlight matched skills / fits in every matching panel.
    matched.forEach((r) => panels[r.i].querySelectorAll("[data-term]").forEach((el) => {
      if (r.hits.includes(el.dataset.term)) el.classList.add("is-hit");
    }));
    select(best.i);
    announce(`Best match: ${tabs[best.i].querySelector(".seat-tile__name").textContent}.` +
      (also.length ? ` Also relevant: ${list(also.map((r) => tabs[r.i].querySelector(".seat-tile__name").textContent))}.` : ""));
  }

  let typingTimer = 0;
  input.addEventListener("input", () => { clearTimeout(typingTimer); typingTimer = setTimeout(run, 180); clearBtn.hidden = !input.value; });
  input.addEventListener("keydown", (e) => { if (e.key === "Escape" && input.value) { e.preventDefault(); clear(); } });
  chips.forEach((c) => c.addEventListener("click", () => {
    const parts = input.value.split(",").map((s) => s.trim()).filter(Boolean);
    const term = c.dataset.seatSuggest;
    const at = parts.findIndex((p) => norm(p) === norm(term));
    if (at >= 0) parts.splice(at, 1);
    else if (parts.length < 3) parts.push(term);
    input.value = parts.join(", ");
    run();
  }));
  function clear() {
    reset();
    status.textContent = "";
    announce("Search cleared. Showing all four tracks.");
    select(0);
    input.focus();
  }
  clearBtn.addEventListener("click", clear);

  // ---- Initial state + deep links ------------------------------------------------
  const fromHash = () => {
    const m = location.hash.match(/^#track=([a-z0-9-]+)/);
    return m ? tabs.findIndex((t) => t.dataset.seatTab === m[1]) : -1;
  };
  const start = fromHash();
  select(start >= 0 ? start : 0, { sync: false });
  if (start >= 0) requestAnimationFrame(() => document.getElementById("find-your-seat")?.scrollIntoView());
  window.addEventListener("hashchange", () => { const i = fromHash(); if (i >= 0) select(i, { sync: false }); });
  panelsWrap.classList.add("is-ready");
})();
