// "Life in SCG" gallery (components/photo-wall.njk): justified rows + lightbox.
// Layout (≥600px): equal-height rows (about 220px desktop, 170px tablet) that fill the width
// exactly with an 8px gap; row breaks are chosen so the centred crop needed is minimal (≈7%
// of one dimension at most); the last row keeps its natural height (within 25%). Phones: two
// photos a row at natural height. Re-laid out with a ResizeObserver; without JS a CSS
// flex-wrap fallback is used.
// Lightbox: native modal <dialog> (page inert, Tab looped, Esc / backdrop / X close, focus
// returns to the thumbnail, scroll lock), Prev/Next, Left/Right keys, swipe, "3 / 22",
// neighbours preloaded, alt text on the large image, polite announcement of changes.
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Equal-height rows ---------------------------------------------------------
  // For a row height H, choose the row breaks (dynamic programming, at most 8 photos a row) that
  // minimise the largest crop any row needs to be exactly H tall and exactly W wide; the last row
  // keeps its natural height (no crop) and must stay within 25% of H. H is searched within ±15%
  // of the target, so rows are equal and the crop stays small (about 7% of one dimension at most
  // with the current photos, centred, so faces are kept).
  function plan(ratios, W, gap, H) {
    const n = ratios.length;
    const pre = [0];
    ratios.forEach((r, i) => pre.push(pre[i] + r));
    const nat = (a, b) => (W - gap * (b - a - 1)) / (pre[b] - pre[a]);
    const best = new Array(n + 1).fill(Infinity), prev = new Array(n + 1).fill(-1);
    best[0] = 0;
    for (let i = 1; i <= n; i++) {
      for (let j = Math.max(0, i - 8); j < i; j++) {
        const h = nat(j, i);
        const c = Math.max(best[j], Math.abs(h - H) / h);
        if (c < best[i]) { best[i] = c; prev[i] = j; }
      }
    }
    let lastStart = -1, cost = Infinity;
    for (let j = Math.max(0, n - 8); j < n; j++) {
      if (Math.abs(nat(j, n) - H) / H <= 0.25 && best[j] < cost) { cost = best[j]; lastStart = j; }
    }
    if (lastStart < 0) return null;
    const rows = [[lastStart, n]];
    for (let i = lastStart; i > 0; i = prev[i]) rows.unshift([prev[i], i]);
    return { cost, rows: rows.map(([a, b], k) => ({ a, b, h: k === rows.length - 1 ? nat(a, b) : H })) };
  }

  document.querySelectorAll("[data-gallery]").forEach((list) => {
    const items = [...list.querySelectorAll(".gallery__item")];
    const ratios = items.map((li) => parseFloat(li.dataset.ar) || 1.5);
    const gap = parseFloat(getComputedStyle(list).getPropertyValue("--gap")) || 8;
    let lastWidth = 0;

    function layout() {
      const W = list.clientWidth;
      if (!W || W === lastWidth) return;
      lastWidth = W;
      const vw = window.innerWidth;   // breakpoints follow the viewport, like the CSS
      const target = vw >= 1024 ? 220 : vw >= 600 ? 170 : null;
      let rows;
      if (target) {
        let bestPlan = null;
        for (let H = Math.round(target * 0.85); H <= Math.round(target * 1.15); H++) {
          const p = plan(ratios, W, gap, H);
          if (p && (!bestPlan || p.cost < bestPlan.cost)) bestPlan = p;
        }
        rows = bestPlan.rows;
      } else {
        // Phones: two photos a row, each row at its natural height (no crop).
        rows = [];
        for (let a = 0; a < ratios.length; a += 2) {
          const b = Math.min(ratios.length, a + 2);
          const sum = ratios.slice(a, b).reduce((x, y) => x + y, 0);
          rows.push({ a, b, h: (W - gap * (b - a - 1)) / sum });
        }
      }
      rows.forEach(({ a, b, h }) => {
        // Widths proportional to the aspect ratios so the row fills W exactly at height h.
        const sum = ratios.slice(a, b).reduce((x, y) => x + y, 0);
        const free = W - gap * (b - a - 1);
        let used = 0;
        for (let i = a; i < b; i++) {
          const w = i === b - 1 ? free - used : Math.floor((free * ratios[i]) / sum * 100) / 100;
          used += w;
          items[i].style.flex = `0 0 ${w}px`;
          items[i].style.height = `${h}px`;
        }
      });
      list.classList.add("is-justified");
    }
    layout();
    new ResizeObserver(() => { lastWidth = 0; layout(); }).observe(list);

    // ---- Lightbox -------------------------------------------------------------
    const dialog = list.nextElementSibling?.matches("[data-lightbox]") ? list.nextElementSibling : null;
    if (!dialog || typeof dialog.showModal !== "function") return; // links keep working
    const links = [...list.querySelectorAll("[data-gallery-item]")];
    const img = dialog.querySelector("[data-lightbox-img]");
    const count = dialog.querySelector("[data-lightbox-count]");
    const status = dialog.querySelector("[data-lightbox-status]");
    const closeBtn = dialog.querySelector("[data-lightbox-close]");
    const N = links.length;
    let index = 0, opener = null;

    // Thumbnails become real buttons (the link is kept as the no-JS fallback).
    const buttons = links.map((a, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "gallery__link";
      for (const k of ["full", "fullWidth", "fullHeight"]) b.dataset[k] = a.dataset[k];
      const alt = a.querySelector("img").alt;
      b.setAttribute("aria-label", `Open photo ${i + 1} of ${N}: ${alt}`);
      b.append(...a.childNodes);
      a.replaceWith(b);
      b.addEventListener("click", () => { opener = b; show(i, false); document.documentElement.classList.add("dialog-open"); dialog.showModal(); closeBtn.focus(); });
      return b;
    });

    const preload = (i) => { const b = buttons[(i + N) % N]; const im = new Image(); im.src = b.dataset.full; };
    function show(i, announce = true) {
      index = (i + N) % N;
      const b = buttons[index];
      img.src = b.dataset.full;
      img.width = Number(b.dataset.fullWidth);
      img.height = Number(b.dataset.fullHeight);
      img.alt = b.querySelector("img").alt;
      count.textContent = `${index + 1} / ${N}`;
      dialog.setAttribute("aria-label", `Photo ${index + 1} of ${N}`);
      if (announce) status.textContent = `Photo ${index + 1} of ${N}: ${img.alt}`;
      preload(index + 1);
      preload(index - 1);
    }

    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("dialog-open");
      img.removeAttribute("src");
      status.textContent = "";
      opener?.focus();
    });
    closeBtn.addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-lightbox-prev]").addEventListener("click", () => show(index - 1));
    dialog.querySelector("[data-lightbox-next]").addEventListener("click", () => show(index + 1));
    // Backdrop: any click that is not on the photo or a control closes the viewer.
    dialog.addEventListener("click", (e) => { if (!e.target.closest("img, button")) dialog.close(); });
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); show(index + (e.key === "ArrowLeft" ? -1 : 1)); }
      else if (e.key === "Tab") {
        const f = [...dialog.querySelectorAll("button:not([disabled])")];
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    let x0 = null;
    dialog.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
    if (reduce) dialog.classList.add("is-still");
  });
})();
