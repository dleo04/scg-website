// "More past clients" (/work-with-us/): collapses the name list to its first two rows with a
// "Show all N clients" / "Show fewer" button (aria-expanded + aria-controls). Rows are measured
// from the pills' positions and re-measured on resize while collapsed. Without JS (or when
// everything fits in two rows) all names show and the button stays hidden.
(() => {
  "use strict";
  const list = document.querySelector("[data-client-list]");
  const btn = document.querySelector("[data-client-toggle]");
  if (!list || !btn) return;
  const items = [...list.children];
  let expanded = false;

  function layout() {
    items.forEach((li) => { li.hidden = false; });
    const tops = [...new Set(items.map((li) => li.offsetTop))].sort((a, b) => a - b);
    if (tops.length <= 2) { btn.hidden = true; return; }
    btn.hidden = false;
    if (!expanded) items.forEach((li) => { li.hidden = li.offsetTop > tops[1]; });
    btn.setAttribute("aria-expanded", String(expanded));
    btn.textContent = expanded ? btn.dataset.labelLess : btn.dataset.labelMore;
  }
  btn.addEventListener("click", () => { expanded = !expanded; layout(); });
  let w = window.innerWidth;
  window.addEventListener("resize", () => { if (window.innerWidth !== w) { w = window.innerWidth; layout(); } });
  layout();
})();
