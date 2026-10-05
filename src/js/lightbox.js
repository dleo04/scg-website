// Photo lightbox (components/photo-wall.njk), progressive enhancement over plain links.
// Native modal <dialog>: the page behind is inert; Tab is looped inside; Esc closes;
// Left/Right arrows (and swipe) move between photos; focus returns to the tile on close.
(() => {
  "use strict";
  document.querySelectorAll("[data-lightbox-group]").forEach((group) => {
    const dialog = group.nextElementSibling?.matches("[data-lightbox]") ? group.nextElementSibling : null;
    if (!dialog || typeof dialog.showModal !== "function") return; // links keep working
    const items = [...group.querySelectorAll("[data-lightbox-item]")];
    const img = dialog.querySelector("[data-lightbox-img]");
    const caption = dialog.querySelector("[data-lightbox-caption]");
    const count = dialog.querySelector("[data-lightbox-count]");
    const closeBtn = dialog.querySelector("[data-lightbox-close]");
    let index = 0;
    let opener = null;

    function show(i) {
      index = (i + items.length) % items.length;
      const a = items[index];
      const tile = a.querySelector("img");
      img.src = a.dataset.full;
      img.width = Number(a.dataset.width);
      img.height = Number(a.dataset.height);
      img.alt = tile.alt;
      caption.textContent = `${a.dataset.caption || ""}`;
      const pos = `${index + 1} of ${items.length}`;
      count.textContent = pos;
      // The caption names the dialog; the position is read with it.
      caption.setAttribute("aria-description", `Photo ${pos}`);
    }

    items.forEach((a, i) => a.addEventListener("click", (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      opener = a;
      show(i);
      document.documentElement.classList.add("dialog-open");
      dialog.showModal();
      closeBtn.focus();
    }));

    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("dialog-open");
      img.removeAttribute("src");
      opener?.focus();
    });
    closeBtn.addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-lightbox-prev]").addEventListener("click", () => show(index - 1));
    dialog.querySelector("[data-lightbox-next]").addEventListener("click", () => show(index + 1));
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop

    dialog.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        show(index + (e.key === "ArrowLeft" ? -1 : 1));
      } else if (e.key === "Tab") {
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
  });
})();
