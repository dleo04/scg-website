// Practice room on /join/prepare/. Without JS all questions and hints are listed.
// Deck: one question at a time, Previous/Next (and Left/Right arrows on the deck), Shuffle,
// and a "Show answer structure" toggle per card. Timer: 2-minute countdown with Start/Pause
// and Reset, silent; screen readers hear start, pause and "time's up" (not every second).
(() => {
  "use strict";

  // ---- Deck -------------------------------------------------------------------
  const deck = document.querySelector("[data-deck]");
  if (deck) {
    const list = deck.querySelector(".deck__cards");
    let cards = [...deck.querySelectorAll("[data-card]")];
    const pos = deck.querySelector("[data-deck-pos]");
    const prev = deck.querySelector("[data-deck-prev]");
    const next = deck.querySelector("[data-deck-next]");
    let index = 0;

    cards.forEach((card) => {
      const button = card.querySelector("[data-card-reveal]");
      const hints = card.querySelector("[data-card-hints]");
      hints.hidden = true;
      button.hidden = false;
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        button.textContent = open ? "Hide answer structure" : "Show answer structure";
        hints.hidden = !open;
        card.classList.toggle("is-revealed", open);
      });
    });

    const nav = deck.querySelector("[data-deck-nav]");
    const show = (i, focus = false) => {
      index = (i + cards.length) % cards.length;
      cards.forEach((c, n) => { c.hidden = n !== index; });
      // The arrows live in the visible card's footer, right of "Show answer structure".
      const had = nav.contains(document.activeElement) ? document.activeElement : null;
      cards[index].querySelector(".qcard__actions").append(nav);
      had?.focus();
      pos.textContent = `Question ${index + 1} of ${cards.length}`;
      if (focus) cards[index].querySelector(".qcard__q").focus();
    };
    cards.forEach((c) => c.querySelector(".qcard__q").setAttribute("tabindex", "-1"));

    prev.addEventListener("click", () => show(index - 1));
    next.addEventListener("click", () => show(index + 1));
    deck.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea")) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
    });
    deck.querySelector("[data-deck-shuffle]").addEventListener("click", () => {
      // Fisher–Yates, then make sure the order actually changed.
      const before = cards.map((c) => c.id).join();
      do {
        for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cards[i], cards[j]] = [cards[j], cards[i]];
        }
      } while (cards.length > 1 && cards.map((c) => c.id).join() === before);
      cards.forEach((c, n) => {
        c.querySelector(".qcard__num").textContent = `Question ${n + 1}`;
        list.append(c);
      });
      show(0, true);
    });

    deck.querySelector("[data-deck-bar]").hidden = false;
    deck.querySelector("[data-deck-nav]").hidden = false;
    deck.classList.add("is-deck");
    show(0);
  }

  // ---- Timer --------------------------------------------------------------------
  const timer = document.querySelector("[data-timer]");
  if (timer) {
    const TOTAL = 120;
    const time = timer.querySelector("[data-timer-time]");
    const dial = timer.querySelector(".timer__dial");
    const status = timer.querySelector("[data-timer-status]");
    const toggle = timer.querySelector("[data-timer-toggle]");
    const reset = timer.querySelector("[data-timer-reset]");
    let left = TOTAL, running = false, last = 0, raf = 0;
    const label = (s) => { const c = Math.ceil(s); return `${Math.floor(c / 60)}:${String(c % 60).padStart(2, "0")}`; };

    // The gold ring fills as time elapses; with reduced motion it stays static (time text only).
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      time.textContent = label(left);
      if (!still) dial.style.setProperty("--progress", String(1 - left / TOTAL));
      timer.classList.toggle("is-done", left <= 0);
    };
    const tick = (now) => {
      if (!running) return;
      left = Math.max(0, left - (now - last) / 1000);
      last = now;
      draw();
      if (left <= 0) {
        running = false;
        toggle.textContent = "Start";
        status.textContent = "Time's up.";
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    toggle.addEventListener("click", () => {
      if (running) {
        running = false;
        cancelAnimationFrame(raf);
        toggle.textContent = "Resume";
        status.textContent = `Paused with ${label(left)} left.`;
      } else {
        if (left <= 0) left = TOTAL;
        running = true;
        last = performance.now();
        toggle.textContent = "Pause";
        status.textContent = `Timer started: ${label(left)}.`;
        raf = requestAnimationFrame(tick);
      }
    });
    reset.addEventListener("click", () => {
      running = false;
      cancelAnimationFrame(raf);
      left = TOTAL;
      toggle.textContent = "Start";
      status.textContent = "Timer reset to 2:00.";
      draw();
    });
    timer.hidden = false;
    draw();
  }
})();
