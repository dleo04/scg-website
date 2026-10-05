// FAQ live search (/join/). Without JS every question is listed. Filters questions and
// answers as you type (matching from the start of words), hides empty groups, announces
// the count and opens a single match.
(() => {
  "use strict";
  const root = document.querySelector("[data-faq]");
  if (!root) return;
  const wrap = root.querySelector("[data-faq-search-wrap]");
  const input = root.querySelector("[data-faq-search]");
  const count = root.querySelector("[data-faq-count]");
  const empty = root.querySelector("[data-faq-empty]");
  const groups = [...root.querySelectorAll("[data-faq-group]")];
  const items = [...root.querySelectorAll("[data-faq-item]")];
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const text = new Map(items.map((d) => [d, norm(d.textContent)]));

  let timer;
  function apply() {
    const words = norm(input.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach((d) => {
      // Each word must start a word in the question or answer ("ey" does not match "they").
      const hit = words.every((w) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text.get(d)));
      d.hidden = !hit;
      if (hit) shown++;
    });
    groups.forEach((g) => { g.hidden = !g.querySelector("[data-faq-item]:not([hidden])"); });
    empty.hidden = shown > 0;
    const visible = items.filter((d) => !d.hidden);
    if (words.length && visible.length === 1) visible[0].open = true;
    clearTimeout(timer);
    // Debounced so screen readers hear the final count, not every keystroke.
    timer = setTimeout(() => {
      count.textContent = words.length ? `${shown} of ${items.length} questions match.` : "";
    }, 350);
  }

  input.addEventListener("input", apply);
  wrap.hidden = false;
})();
