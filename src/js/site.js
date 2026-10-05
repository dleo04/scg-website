// Site-wide progressive enhancement: mobile menu, the "Join SCG" sub-menu, accessible tabs (also the step-by-step
// steppers on /about/ and /join/), stat count-up and reveal-on-scroll. Everything works without this file.
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

  // ---- "Join SCG" sub-menu (disclosure pattern, not role=menu) ---------------
  // "Join SCG" stays a plain link; the caret button next to it toggles the list.
  // Desktop (≥1024px): opens on hover (200ms close delay) and when keyboard focus enters the
  // item; Esc closes and returns focus to the caret; a click outside closes; Up/Down move
  // between entries; Tab walks link → caret → entries. Mobile menu: the caret is an
  // accordion toggle. Without JS the caret stays hidden and the sub-list is not shown.
  const hoverDesktop = window.matchMedia("(min-width: 1024px) and (hover: hover)");
  const subs = [...document.querySelectorAll("[data-nav-sub]")].map((item) => {
    const button = item.querySelector("[data-nav-sub-toggle]");
    const list = item.querySelector("[data-nav-sub-list]");

    const entries = () => [...list.querySelectorAll("a")];
    let closeTimer = 0;
    let openedByHover = false;
    let refocusing = false;   // Esc returns focus to the caret; that must not re-open the panel
    const isOpen = () => button.getAttribute("aria-expanded") === "true";
    const set = (open, { focusButton = false, hover = false } = {}) => {
      clearTimeout(closeTimer);
      openedByHover = open && hover;
      button.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);
      if (!open && focusButton) { refocusing = true; button.focus(); refocusing = false; }
    };
    button.hidden = false;
    item.classList.add("is-enhanced");

    // A click on the caret of a panel that hover just opened keeps it open (no open-then-close).
    button.addEventListener("click", () => set(openedByHover ? true : !isOpen()));
    item.addEventListener("mouseenter", () => { if (hoverDesktop.matches && !isOpen()) set(true, { hover: true }); });
    item.addEventListener("mouseleave", () => {
      if (!hoverDesktop.matches) return;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => { if (!item.contains(document.activeElement)) set(false); }, 200);
    });
    item.addEventListener("focusin", (e) => {
      if (desktop.matches && !refocusing && e.target.matches(":focus-visible") && !isOpen()) set(true);
    });
    item.addEventListener("focusout", (e) => {
      if (desktop.matches && !item.contains(e.relatedTarget)) set(false);
    });
    item.addEventListener("keydown", (e) => {
      const list_ = entries();
      const i = list_.indexOf(document.activeElement);
      if (e.key === "Escape" && isOpen()) {
        e.stopPropagation();
        set(false, { focusButton: true });
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen()) set(true);
        const n = i < 0 ? (e.key === "ArrowDown" ? 0 : list_.length - 1) : (i + (e.key === "ArrowDown" ? 1 : -1) + list_.length) % list_.length;
        list_[n].focus();
      } else if ((e.key === "Home" || e.key === "End") && i >= 0) {
        e.preventDefault();
        list_[e.key === "Home" ? 0 : list_.length - 1].focus();
      }
    });
    // Same-page anchors (/join/#faq): close the dropdown and the mobile menu after choosing.
    list.addEventListener("click", (e) => {
      if (!e.target.closest("a")) return;
      set(false);
      setMenu(false);
    });
    return { item, set, isOpen };
  });
  desktop.addEventListener("change", () => subs.forEach((s) => s.set(false)));

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (toggle?.getAttribute("aria-expanded") === "true") setMenu(false, { focusToggle: true });
  });

  document.addEventListener("click", (e) => {
    subs.forEach((s) => { if (desktop.matches && s.isOpen() && !s.item.contains(e.target)) s.set(false); });
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

    // Optional stepper features (About "How a project works"):
    //   data-step-fade      panels share one grid cell and crossfade (hidden ones are inert)
    //   data-step-progress  done/current classes, red fill up to the current step, ✓ on done steps
    //   data-step-hash="step"  #step=<n> opens step n on load; the hash follows (replaceState)
    //   [data-step-status]  polite announcement "Step n of N: <name>" on user changes
    //   [data-step-current] the current step's name under the rail (phones show numbers only)
    const fade = root.hasAttribute("data-step-fade");
    const progress = root.hasAttribute("data-step-progress");
    const hashKey = root.dataset.stepHash;
    const status = root.querySelector("[data-step-status]");
    const currentLabel = root.querySelector("[data-step-current]");
    const fill = root.querySelector("[data-step-fill]");
    const names = tabs.map((t) => t.querySelector(".stepper__name")?.textContent.trim() || t.textContent.trim());
    const nums = tabs.map((t) => t.querySelector(".stepper__num"));
    let ready = false;

    let currentIndex = 0;
    const select = (index, focus = false) => {
      currentIndex = index;
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        if (fade) {
          panels[i].classList.toggle("is-active", on);
          panels[i].inert = !on;
          panels[i].setAttribute("aria-hidden", String(!on));
        } else {
          panels[i].hidden = !on;
        }
        if (progress) {
          tab.classList.toggle("is-done", i < index);
          tab.classList.toggle("is-current", on);
          if (nums[i]) nums[i].textContent = i < index ? "✓" : String(i + 1);
        }
      });
      if (fill) fill.style.setProperty("--step-progress", String(tabs.length > 1 ? index / (tabs.length - 1) : 0));
      if (currentLabel) currentLabel.textContent = names[index];
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === tabs.length - 1;
      if (focus) tabs[index].focus();
      if (hashKey && ready) history.replaceState(history.state, "", `${location.pathname}${location.search}#${hashKey}=${index + 1}`);
      if (status && ready) status.textContent = `Step ${index + 1} of ${tabs.length}: ${names[index]}`;
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
    const fromHash = () => {
      if (!hashKey) return -1;
      const m = location.hash.match(new RegExp(`^#${hashKey}=(\\d+)$`));
      return m ? Math.min(tabs.length, Math.max(1, Number(m[1]))) - 1 : -1;
    };
    const start = fromHash();
    select(start >= 0 ? start : Math.max(0, tabs.findIndex((t) => t.hasAttribute("data-tab-initial"))));
    if (start >= 0) requestAnimationFrame(() => root.scrollIntoView({ block: "start" }));
    if (hashKey) window.addEventListener("hashchange", () => { const i = fromHash(); if (i >= 0) select(i); });
    ready = true;
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
