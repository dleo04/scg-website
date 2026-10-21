// "Find your seat" (components/seat-matcher.njk). Without this file the four tracks are plain
// stacked sections. With it: four selector tiles (WAI-ARIA tabs, automatic activation), one
// visible panel, and deep links (/join/#track=<slug>, kept in sync with replaceState so Back is
// not filled with entries).
(() => {
  "use strict";
  const root = document.querySelector("[data-seat]");
  if (!root) return;
  const tablist = root.querySelector("[data-seat-tiles]");
  const tabs = [...root.querySelectorAll("[data-seat-tab]")];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  const panelsWrap = root.querySelector("[data-seat-panels]");
  if (!tablist || !tabs.length || panels.some((p) => !p)) return;

  // ---- Tabs -------------------------------------------------------------------
  root.classList.add("is-enhanced");
  tablist.hidden = false;
  panels.forEach((p, i) => {
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", tabs[i].id);
    p.tabIndex = 0;
  });
  // Track shown when the page opens without a #track= hash (data-seat-default in the template).
  const DEFAULT = Math.max(0, tabs.findIndex((t) => t.hasAttribute("data-seat-default")));
  function select(i, { focus = false, sync = true } = {}) {
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

  // ---- Initial state + deep links ------------------------------------------------
  const fromHash = () => {
    const m = location.hash.match(/^#track=([a-z0-9-]+)/);
    return m ? tabs.findIndex((t) => t.dataset.seatTab === m[1]) : -1;
  };
  const start = fromHash();
  select(start >= 0 ? start : DEFAULT, { sync: false });
  if (start >= 0) requestAnimationFrame(() => document.getElementById("find-your-seat")?.scrollIntoView());
  window.addEventListener("hashchange", () => { const i = fromHash(); if (i >= 0) select(i, { sync: false }); });
  panelsWrap.classList.add("is-ready");
})();
