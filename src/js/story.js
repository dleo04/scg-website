// "Since 2020" timeline (/about/): the line fills (top to bottom) and each dot fills when its
// card scrolls into view. Without JS, or with reduced motion, everything is in its final state.
(() => {
  "use strict";
  const list = document.querySelector("[data-story]");
  if (!list || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = [...list.querySelectorAll(".story__item")];
  let reached = -1;
  const dotY = (item) => item.offsetTop + parseFloat(getComputedStyle(item, "::before").top) + 8;
  const update = () => {
    items.forEach((it, i) => it.classList.toggle("is-reached", i <= reached));
    list.style.setProperty("--story-progress", reached < 0 ? "0px" : `${dotY(items[reached]) - 8}px`);
  };
  list.classList.add("is-progress");
  update();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) reached = Math.max(reached, items.indexOf(e.target)); });
    update();
  }, { rootMargin: "0px 0px -30% 0px" });
  items.forEach((it) => io.observe(it));
  window.addEventListener("resize", update);
})();
