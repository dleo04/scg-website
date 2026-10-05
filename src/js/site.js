// Site-wide progressive enhancement: mobile menu, accessible tabs (also the step-by-step
// steppers on /about/ and /join/), expandable pillar cards, stat count-up and
// reveal-on-scroll. Everything works without this file.
(() => {
  "use strict";

  // ---- Mobile menu (disclosure pattern) ----------------------------------
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("nav-menu");
  const desktop = window.matchMedia("(min-width: 1024px)");

  const setMenu = (open, { focusToggle = false } = {}) => {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
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

    const controls = root.querySelector("[data-tab-controls]");
    const prev = root.querySelector("[data-tab-prev]");
    const next = root.querySelector("[data-tab-next]");
    // Steppers mark their panels up as a list (role=list/listitem) for the no-JS view; once
    // they become tab panels the list roles are removed.
    const panelList = panels[0].parentElement;
    if (panelList.getAttribute("role") === "list") panelList.removeAttribute("role");

    let currentIndex = 0;
    const select = (index, focus = false) => {
      currentIndex = index;
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === tabs.length - 1;
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
      const n = { ArrowRight: current + 1, ArrowDown: current + 1, ArrowLeft: current - 1, ArrowUp: current - 1, Home: 0, End: last }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      select((n + tabs.length) % tabs.length, true);
    });
    // Previous / Next buttons (steppers). Focus stays on the button that was pressed.
    prev?.addEventListener("click", () => select(Math.max(0, currentIndex - 1)));
    next?.addEventListener("click", () => select(Math.min(tabs.length - 1, currentIndex + 1)));
    if (controls) controls.hidden = false;

    // Horizontal swipe on touch screens moves one step (vertical scrolling is untouched).
    if (root.hasAttribute("data-swipe")) {
      let x0 = null, y0 = null;
      root.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      root.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        select(Math.min(tabs.length - 1, Math.max(0, currentIndex + (dx < 0 ? 1 : -1))));
      }, { passive: true });
    }

    root.classList.add("is-tabs");
    select(Math.max(0, tabs.findIndex((t) => t.hasAttribute("data-tab-initial"))));
  });

  // ---- Expandable cards (About pillars): button toggles the details --------
  // Without JS the details are simply visible. Hover also reveals them on pointer devices (CSS).
  document.querySelectorAll("[data-expand]").forEach((card) => {
    const button = card.querySelector("[data-expand-toggle]");
    const label = button?.querySelector("[data-expand-label]");
    if (!button) return;
    card.classList.add("is-enhanced");
    button.hidden = false;
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      card.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "Show less" : "Read more";
    });
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

  // ---- Stat count-up -------------------------------------------------------
  // Final values are already in the HTML. With motion allowed, the aria-hidden digits are
  // reset to 0 and count up (easeOutCubic, 1600ms, staggered 120ms) the first time the strip
  // is ≥ 40% visible; once per page load. Screen readers read the static visually-hidden copy.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-countup]").forEach((countStrip) => {
  if (!reduceMotion && "IntersectionObserver" in window && "requestAnimationFrame" in window) {
    const nums = [...countStrip.querySelectorAll("[data-count-to]")];
    const fmt = new Intl.NumberFormat("en-US");
    const DURATION = 1600, STAGGER = 120;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    // Lock each number's final rendered width before showing 0, so nothing shifts.
    nums.forEach((el) => {
      el.style.width = `${el.getBoundingClientRect().width}px`;
      el.textContent = fmt.format(0);
    });

    const run = () => {
      nums.forEach((el, i) => {
        const target = parseInt(el.dataset.countTo, 10) || 0;
        let start = null;
        const tick = (now) => {
          if (start === null) start = now + i * STAGGER;
          const t = Math.min(1, Math.max(0, (now - start) / DURATION));
          el.textContent = fmt.format(Math.round(target * easeOutCubic(t)));
          if (t < 1) requestAnimationFrame(tick);
          else { el.textContent = fmt.format(target); el.style.width = ""; }
        };
        requestAnimationFrame(tick);
      });
    };

    let firstCallback = true;
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      const alreadyInView = firstCallback;
      firstCallback = false;
      if (!visible) return;
      io.disconnect();
      if (alreadyInView) setTimeout(run, 300); else run();
    }, { threshold: 0.4 });
    io.observe(countStrip);
  }
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
