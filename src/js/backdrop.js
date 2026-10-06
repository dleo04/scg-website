// Faded fixed page backdrop (opt-in: site.json → page_backdrops; layer in layouts/base.njk).
// Loads the image only after the page has loaded and the browser is idle (never preloaded, no
// effect on LCP), picks the portrait file on portrait viewports and swaps it when the
// orientation changes. Only once the image has loaded does <html> get .backdrop-ready, which
// shows the layer and lets the light sections show it through (CSS). If the image fails, with
// prefers-reduced-data, or without JS, nothing changes: the page keeps its solid colours.
(() => {
  "use strict";
  const layer = document.querySelector(".page-backdrop");
  if (!layer || window.matchMedia("(prefers-reduced-data: reduce)").matches) return;
  const portrait = window.matchMedia("(orientation: portrait)");
  let current = "";
  function show() {
    const src = portrait.matches ? layer.dataset.backdropPortrait : layer.dataset.backdropDesktop;
    if (!src || src === current) return;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      current = src;
      layer.style.setProperty("--backdrop-image", `url("${src}")`);
      document.documentElement.classList.add("backdrop-ready");
    };
    img.src = src;
  }
  const start = () => ("requestIdleCallback" in window ? requestIdleCallback(show, { timeout: 2000 }) : setTimeout(show, 200));
  if (document.readyState === "complete") start(); else window.addEventListener("load", start, { once: true });
  portrait.addEventListener("change", show);
})();
