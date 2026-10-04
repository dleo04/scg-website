// Projects explorer filters (SPEC 6), progressive enhancement over a plain list of cards.
// Search (title, client, summary, tagline, skills), semester, client type, good-fit and track
// filters; state lives in the URL query (?q=&semester=&type=&fit=&track=) so views are
// shareable; the result count is announced politely; "Clear all" resets everything.
(() => {
  "use strict";
  const form = document.querySelector("[data-filters]");
  const items = [...document.querySelectorAll("[data-project-item]")];
  if (!form || !items.length) return;

  const q = form.querySelector('[name="q"]');
  const semester = form.querySelector('[name="semester"]');
  const type = form.querySelector('[name="type"]');
  const fits = [...form.querySelectorAll('[name="fit"]')];
  const tracks = [...form.querySelectorAll('[name="track"]')];
  const count = form.querySelector("[data-count]");
  const clears = [...document.querySelectorAll("[data-clear]")];
  const empty = document.querySelector("[data-empty]");
  const fitBadge = form.querySelector("[data-fit-count]");
  const fitSearch = form.querySelector("[data-fit-search]");
  const fitEmpty = form.querySelector("[data-fit-empty]");
  const total = items.length;
  const toggle = form.querySelector("[data-filters-toggle]");
  const more = form.querySelector("[data-filters-more]");
  const activeCount = form.querySelector("[data-active-count]");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    more.classList.toggle("is-open", open);
  });

  const split = (s) => (s ? s.split("|") : []);
  const checked = (list) => list.filter((c) => c.checked).map((c) => c.value);

  function readUrl() {
    const p = new URLSearchParams(location.search);
    q.value = p.get("q") || "";
    if (semester) semester.value = p.get("semester") || "";
    if (type) type.value = p.get("type") || "";
    const f = p.getAll("fit"), t = p.getAll("track");
    fits.forEach((c) => { c.checked = f.includes(c.value); });
    tracks.forEach((c) => { c.checked = t.includes(c.value); });
  }

  function writeUrl(state) {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.semester) p.set("semester", state.semester);
    if (state.type) p.set("type", state.type);
    state.fits.forEach((v) => p.append("fit", v));
    state.tracks.forEach((v) => p.append("track", v));
    const qs = p.toString();
    history.replaceState(history.state, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
  }

  function apply({ updateUrl = true } = {}) {
    const state = {
      q: q.value.trim(),
      semester: semester ? semester.value : "",
      type: type ? type.value : "",
      fits: checked(fits),
      tracks: checked(tracks),
    };
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach((el) => {
      const d = el.dataset;
      const ok =
        words.every((w) => d.search.includes(w)) &&
        (!state.semester || d.semester === state.semester) &&
        (!state.type || d.type === state.type) &&
        (!state.fits.length || split(d.fits).some((v) => state.fits.includes(v))) &&
        (!state.tracks.length || split(d.tracks).some((v) => state.tracks.includes(v)));
      el.hidden = !ok;
      if (ok) shown++;
    });
    const active = !!(state.q || state.semester || state.type || state.fits.length || state.tracks.length);
    count.textContent = active
      ? `Showing ${shown} of ${total} project${total === 1 ? "" : "s"}`
      : `Showing all ${total} project${total === 1 ? "" : "s"}`;
    clears.forEach((b) => { b.hidden = !active; });
    if (empty) empty.hidden = shown > 0;
    if (fitBadge) {
      fitBadge.hidden = !state.fits.length;
      fitBadge.textContent = state.fits.length ? `(${state.fits.length})` : "";
    }
    // Mobile "Filters" toggle shows how many non-search filters are active.
    const nonSearch = (state.semester ? 1 : 0) + (state.type ? 1 : 0) + state.fits.length + state.tracks.length;
    if (activeCount) activeCount.textContent = nonSearch ? `(${nonSearch})` : "";
    if (updateUrl) writeUrl(state);
  }

  function clearAll() {
    q.value = "";
    if (semester) semester.value = "";
    if (type) type.value = "";
    [...fits, ...tracks].forEach((c) => { c.checked = false; });
    if (fitSearch) { fitSearch.value = ""; filterFitOptions(); }
    apply();
    q.focus();
  }

  // Narrow the long "Good fit for" option list as the user types.
  function filterFitOptions() {
    const term = (fitSearch?.value || "").trim().toLowerCase();
    let visible = 0;
    form.querySelectorAll("[data-fit-option]").forEach((opt) => {
      const show = !term || opt.textContent.toLowerCase().includes(term);
      opt.hidden = !show;
      if (show) visible++;
    });
    if (fitEmpty) fitEmpty.hidden = visible > 0;
  }

  let timer;
  q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(apply, 150); });
  form.addEventListener("change", (e) => { if (e.target !== fitSearch) apply(); });
  fitSearch?.addEventListener("input", filterFitOptions);
  clears.forEach((b) => b.addEventListener("click", clearAll));
  // Close the "Good fit for" panel with Escape (focus back on its summary).
  const fitDetails = form.querySelector("[data-fits]");
  fitDetails?.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && fitDetails.open) {
      e.stopPropagation();
      fitDetails.open = false;
      fitDetails.querySelector("summary").focus();
    }
  });
  window.addEventListener("popstate", () => { readUrl(); apply({ updateUrl: false }); });

  form.hidden = false;
  readUrl();
  apply({ updateUrl: false });
})();
