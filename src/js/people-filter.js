// /team/ and /alumni/ filters + alumni "Read more" disclosures (progressive enhancement).
// Without JS every card (and every full bio) is visible and the filter form stays hidden.
// Filters: name search (team) or name/employer/bio search (alumni), plus any <select> in the
// form (level, major, industry). State lives in the URL query (?q=&level=&major=&industry=);
// the result count is announced politely; groups with no visible card are hidden.
(() => {
  "use strict";

  // ---- Bio disclosures (alumni) ----------------------------------------------------
  document.querySelectorAll("[data-bio-toggle]").forEach((btn) => {
    const card = btn.closest("[data-person]");
    const bio = document.getElementById(btn.getAttribute("aria-controls"));
    const label = btn.querySelector("[data-bio-label]");
    const set = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Show less" : "Read more";
      card.classList.toggle("is-open", open);
    };
    btn.hidden = false;
    set(false);
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
  });

  // ---- Filters ---------------------------------------------------------------------
  const form = document.querySelector("[data-people-filters]");
  const items = [...document.querySelectorAll("[data-person]")];
  if (!form || !items.length) return;
  form.hidden = false;
  const q = form.querySelector('[name="q"]');
  const selects = [...form.querySelectorAll("select")];
  const count = form.querySelector("[data-people-count]");
  const groups = [...document.querySelectorAll("[data-people-group]")];
  const empty = document.querySelector("[data-people-empty]");
  const total = items.length;
  const noun = document.body.classList.contains("page-alumni") ? ["alumnus", "alumni"] : ["person", "people"];
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  items.forEach((el) => { el.dataset.haystack = norm(el.dataset.search || el.dataset.name); });

  const field = (name) => ({ level: "level", major: "majors", industry: "industry" })[name];
  function readUrl() {
    const p = new URLSearchParams(location.search);
    q.value = p.get("q") || "";
    selects.forEach((s) => {
      const v = p.get(s.name) || "";
      s.value = [...s.options].some((o) => o.value === v) ? v : "";
    });
  }
  function writeUrl() {
    const p = new URLSearchParams();
    if (q.value.trim()) p.set("q", q.value.trim());
    selects.forEach((s) => { if (s.value) p.set(s.name, s.value); });
    const qs = p.toString();
    history.replaceState(history.state, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
  }
  function apply({ updateUrl = true } = {}) {
    const words = norm(q.value.trim()).split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach((el) => {
      const ok = words.every((w) => el.dataset.haystack.includes(w)) &&
        selects.every((s) => !s.value || (el.dataset[field(s.name)] || "").split("|").includes(s.value));
      el.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach((g) => { g.hidden = !g.querySelector("[data-person]:not([hidden])"); });
    empty.hidden = shown > 0;
    const active = words.length || selects.some((s) => s.value);
    const n = (k) => (k === 1 ? noun[0] : noun[1]);
    count.textContent = active ? `Showing ${shown} of ${total} ${n(total)}` : `Showing all ${total} ${n(total)}`;
    if (updateUrl) writeUrl();
  }
  let t;
  q.addEventListener("input", () => { clearTimeout(t); t = setTimeout(apply, 150); });
  selects.forEach((s) => s.addEventListener("change", () => apply()));
  document.querySelectorAll("[data-people-clear]").forEach((b) => b.addEventListener("click", () => {
    q.value = "";
    selects.forEach((s) => { s.value = ""; });
    apply();
    q.focus();
  }));
  readUrl();
  apply({ updateUrl: false });
})();
