// Site-wide progressive enhancement: mobile menu, "Who We Are" dropdown,
// accessible tabs and reveal-on-scroll. Everything works without this file.
(() => {
  "use strict";

  // ---- Mobile menu (disclosure pattern) ----------------------------------
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("nav-menu");
  const desktop = window.matchMedia("(min-width: 1024px)");
  const header = document.querySelector("[data-header]");

  // ---- Header: transparent over the hero, solid once the page scrolls ----
  if (header && document.body.classList.contains("has-hero")) {
    const update = () => header.classList.toggle("is-solid", window.scrollY > 8);
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  const setMenu = (open, { focusToggle = false } = {}) => {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    header?.classList.toggle("is-menu-open", open);
    if (!open && focusToggle) toggle.focus();
  };

  toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  desktop.addEventListener("change", () => setMenu(false));

  // ---- Dropdown groups ---------------------------------------------------
  const groups = [...document.querySelectorAll(".nav-group")].map((group) => {
    const button = group.querySelector(".nav-group__toggle");
    const list = group.querySelector(".nav-group__menu");
    const set = (open, focusButton = false) => {
      button.setAttribute("aria-expanded", String(open));
      list.classList.toggle("is-open", open);
      if (!open && focusButton) button.focus();
    };
    button.addEventListener("click", () => set(button.getAttribute("aria-expanded") !== "true"));
    // Close the desktop dropdown when focus leaves it.
    group.addEventListener("focusout", (e) => {
      if (desktop.matches && !group.contains(e.relatedTarget)) set(false);
    });
    return { group, button, set };
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openGroup = groups.find((g) => g.button.getAttribute("aria-expanded") === "true" && g.group.contains(document.activeElement));
    if (openGroup) return openGroup.set(false, true);
    if (toggle?.getAttribute("aria-expanded") === "true") setMenu(false, { focusToggle: true });
  });

  document.addEventListener("click", (e) => {
    groups.forEach((g) => { if (desktop.matches && !g.group.contains(e.target)) g.set(false); });
    if (menu?.classList.contains("is-open") && !e.target.closest(".site-header")) setMenu(false);
  });

  // ---- Tabs (WAI-ARIA tabs pattern, automatic activation) ----------------
  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tablist = root.querySelector("[data-tablist]");
    const tabs = [...root.querySelectorAll("[data-tab]")];
    const panels = tabs.map((t) => document.getElementById(t.dataset.tab));
    if (!tablist || !tabs.length || panels.some((p) => !p)) return;

    tablist.setAttribute("role", "tablist");
    tabs.forEach((tab, i) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panels[i].id);
      panels[i].setAttribute("role", "tabpanel");
      panels[i].setAttribute("aria-labelledby", tab.id);
      panels[i].tabIndex = 0;
    });

    const select = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus();
    };

    tablist.addEventListener("click", (e) => {
      const i = tabs.indexOf(e.target.closest("[data-tab]"));
      if (i >= 0) select(i);
    });
    tablist.addEventListener("keydown", (e) => {
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      const last = tabs.length - 1;
      const next = { ArrowRight: current + 1, ArrowDown: current + 1, ArrowLeft: current - 1, ArrowUp: current - 1, Home: 0, End: last }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });

    root.classList.add("is-tabs");
    select(0);
  });

  // ---- Testimonial carousel: one quote at a time, dot buttons, no autoplay --
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const slides = [...root.querySelectorAll("[data-slide]")];
    const dotsWrap = root.querySelector("[data-dots]");
    if (slides.length < 2 || !dotsWrap) return;
    const dots = [...dotsWrap.querySelectorAll("button")];
    const show = (index) => {
      slides.forEach((s, i) => { s.hidden = i !== index; });
      dots.forEach((d, i) => d.setAttribute("aria-current", i === index ? "true" : "false"));
    };
    dots.forEach((d, i) => d.addEventListener("click", () => show(i)));
    dotsWrap.addEventListener("keydown", (e) => {
      const i = dots.indexOf(document.activeElement);
      if (i < 0 || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
      e.preventDefault();
      const n = (i + (e.key === "ArrowRight" ? 1 : -1) + dots.length) % dots.length;
      dots[n].focus();
      show(n);
    });
    dotsWrap.hidden = false;
    root.classList.add("is-carousel");
    show(0);
  });

  // ---- Reveal on scroll (skipped under reduced motion) --------------------
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealables = document.querySelectorAll("[data-reveal]");
  if (!reduce && "IntersectionObserver" in window && revealables.length) {
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealables.forEach((el) => io.observe(el));
  }
})();
