// "Find your seat" matcher (components/seat-matcher.njk). Progressive enhancement: without
// this file the four tracks are a static list. The vocabulary is read from the tracks' own
// chips (data-term), so it always matches data/tracks.json.
// Combobox: WAI-ARIA 1.2 pattern (list autocomplete). Up/Down move, Enter picks, Esc closes,
// Backspace in an empty field removes the last pick.
(() => {
  "use strict";
  const root = document.querySelector("[data-seat]");
  if (!root) return;
  const finder = root.querySelector("[data-seat-finder]");
  const input = root.querySelector("[data-seat-input]");
  const listbox = root.querySelector("[data-seat-options]");
  const pickedList = root.querySelector("[data-seat-picked]");
  const status = root.querySelector("[data-seat-status]");
  const results = root.querySelector("[data-seat-results]");
  const tracks = [...root.querySelectorAll("[data-seat-track]")];
  const showAllWrap = root.querySelector("[data-seat-showall-wrap]");
  const MAX = 3;

  // Terms per track, and the combined vocabulary with the kind of each term.
  const termsOf = new Map(tracks.map((t) => [t, new Set([...t.querySelectorAll("[data-term]")].map((c) => c.dataset.term))]));
  const kind = new Map();
  tracks.forEach((t) => t.querySelectorAll("[data-term]").forEach((c) => {
    kind.set(c.dataset.term, c.classList.contains("chip--gold") ? "Major or interest" : "Skill");
  }));
  const vocabulary = [...kind.keys()].sort((a, b) => a.localeCompare(b));
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let picked = [];
  let showAll = false;
  let options = [];
  let active = -1;

  function render() {
    // Picked chips with remove buttons.
    pickedList.replaceChildren(...picked.map((term) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "seat__picked-chip";
      b.innerHTML = `<span></span><span aria-hidden="true" class="seat__x">×</span>`;
      b.firstChild.textContent = term;
      b.setAttribute("aria-label", `Remove ${term}`);
      b.addEventListener("click", () => { remove(term); input.focus(); });
      li.append(b);
      return li;
    }));
    pickedList.hidden = !picked.length;
    input.disabled = picked.length >= MAX;
    input.placeholder = picked.length >= MAX ? "Three picks: remove one to change" : (picked.length ? "Add another" : "e.g. Psychology, SQL, Design");
    root.querySelectorAll("[data-seat-add]").forEach((b) => b.setAttribute("aria-pressed", String(picked.includes(b.dataset.seatAdd))));

    // Score tracks; show the matching ones, best first.
    const scored = tracks.map((t, i) => {
      const hits = picked.filter((term) => termsOf.get(t).has(term));
      return { t, i, hits };
    });
    const filtering = picked.length > 0 && !showAll;
    const order = filtering ? [...scored].sort((a, b) => b.hits.length - a.hits.length || a.i - b.i) : scored;
    order.forEach(({ t, hits }) => {
      results.append(t);
      t.hidden = filtering && hits.length === 0;
      const match = t.querySelector("[data-seat-match]");
      match.hidden = hits.length === 0;
      match.textContent = hits.length ? `Matches ${list(hits)}` : "";
      t.querySelectorAll("[data-term]").forEach((c) => c.classList.toggle("is-match", picked.includes(c.dataset.term)));
      t.classList.toggle("is-match", hits.length > 0);
    });
    const shown = order.filter(({ t }) => !t.hidden).length;
    showAllWrap.hidden = !(filtering && shown < tracks.length);
    status.textContent = !picked.length
      ? (showAll ? "Showing all four tracks." : "")
      : filtering
        ? `${shown === 1 ? "1 track matches" : `${shown} tracks match`} ${list(picked)}.`
        : `Showing all four tracks; matches for ${list(picked)} are marked.`;
  }

  const list = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a.at(-1)}`);

  function add(term) {
    if (!term || picked.includes(term) || picked.length >= MAX) return;
    picked = [...picked, term];
    showAll = false;
    input.value = "";
    closeOptions();
    render();
  }
  function remove(term) {
    picked = picked.filter((t) => t !== term);
    render();
  }

  // ---- Listbox ----------------------------------------------------------------
  function openOptions() {
    const q = norm(input.value.trim());
    options = vocabulary.filter((t) => !picked.includes(t) && (!q || norm(t).includes(q)))
      .sort((a, b) => (q ? (norm(b).startsWith(q) - norm(a).startsWith(q)) : 0) || a.localeCompare(b))
      .slice(0, 8);
    listbox.replaceChildren(...(options.length ? options.map((term, i) => {
      const li = document.createElement("li");
      li.id = `seat-opt-${i}`;
      li.setAttribute("role", "option");
      li.className = "seat__option";
      li.innerHTML = `<span></span><span class="seat__option-kind"></span>`;
      li.firstChild.textContent = term;
      li.lastChild.textContent = kind.get(term);
      li.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus in the input
      li.addEventListener("click", () => { add(term); input.focus(); });
      return li;
    }) : [Object.assign(document.createElement("li"), { className: "seat__option seat__option--empty", textContent: "No match. Try a broader word, or pick “I'm not sure”." })]));
    active = -1;
    listbox.hidden = false;
    input.setAttribute("aria-expanded", "true");
    input.removeAttribute("aria-activedescendant");
  }
  function closeOptions() {
    listbox.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  }
  function move(delta) {
    if (listbox.hidden) openOptions();
    if (!options.length) return;
    active = (active + delta + options.length) % options.length;
    [...listbox.children].forEach((li, i) => li.setAttribute("aria-selected", String(i === active)));
    input.setAttribute("aria-activedescendant", `seat-opt-${active}`);
    listbox.children[active].scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("input", openOptions);
  input.addEventListener("focus", () => { if (input.value) openOptions(); });
  input.addEventListener("blur", () => setTimeout(closeOptions, 120));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") {
      if (!listbox.hidden && active >= 0) { e.preventDefault(); add(options[active]); }
      else if (!listbox.hidden && options.length === 1) { e.preventDefault(); add(options[0]); }
    } else if (e.key === "Escape") {
      if (!listbox.hidden) { e.preventDefault(); closeOptions(); } else input.value = "";
    } else if (e.key === "Backspace" && !input.value && picked.length) {
      remove(picked.at(-1));
    }
  });

  root.querySelectorAll("[data-seat-add]").forEach((b) => b.addEventListener("click", () => {
    const term = b.dataset.seatAdd;
    if (picked.includes(term)) remove(term); else add(term);
  }));
  root.querySelector("[data-seat-unsure]").addEventListener("click", () => { picked = []; showAll = true; render(); status.textContent = "Showing all four tracks."; });
  root.querySelector("[data-seat-showall]").addEventListener("click", () => { showAll = true; render(); });

  finder.hidden = false;
  root.classList.add("is-enhanced");
  render();
})();
