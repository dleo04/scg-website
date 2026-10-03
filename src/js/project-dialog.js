// Project detail dialog (SPEC 6), progressive enhancement over plain links.
// - Links with data-project-open="<id>" open the dialog instead of navigating.
// - Content is cloned from <template data-project-template="<id>">.
// - Native <dialog>.showModal() makes the page inert; Tab is also looped inside.
// - ESC, the close button and a backdrop click close it; focus returns to the opener.
// - Previous/Next buttons and Left/Right arrow keys move between projects.
// - Deep link: /#alliom (or /projects/#alliom) opens on load; Back closes it.
(() => {
  "use strict";
  const dialog = document.getElementById("project-dialog");
  if (!dialog || typeof dialog.showModal !== "function") return; // links keep working

  const body = dialog.querySelector("[data-dialog-body]");
  const pos = dialog.querySelector("[data-dialog-position]");
  const full = dialog.querySelector("[data-dialog-full]");
  const templates = [...document.querySelectorAll("template[data-project-template]")];
  const ids = templates.map((t) => t.dataset.projectTemplate);
  const byId = Object.fromEntries(templates.map((t) => [t.dataset.projectTemplate, t]));

  let current = null;   // id shown
  let opener = null;    // element to return focus to
  let pushed = false;   // whether we added a history entry for this dialog

  const openerFor = (id) => document.querySelector(`[data-project-open="${CSS.escape(id)}"]`);

  function render(id) {
    const tpl = byId[id];
    body.replaceChildren(tpl.content.cloneNode(true));
    const title = body.querySelector("[data-detail-title]");
    if (title) title.id = "project-dialog-title";
    pos.textContent = `${ids.indexOf(id) + 1} of ${ids.length}`;
    full.href = tpl.dataset.projectUrl;
    full.setAttribute("aria-label", `Open full page for ${tpl.dataset.projectTitle}`);
    body.scrollTop = 0;
    current = id;
  }

  function open(id, { push = true, from = null } = {}) {
    if (!byId[id]) return;
    render(id);
    if (!dialog.open) {
      opener = from || openerFor(id);
      document.documentElement.classList.add("dialog-open"); // scroll lock
      dialog.showModal();
    }
    body.querySelector("[data-detail-title]")?.focus();
    if (push) {
      history.pushState({ scgProject: id }, "", `#${id}`);
      pushed = true;
    }
  }

  function step(delta) {
    if (current === null) return;
    const next = ids[(ids.indexOf(current) + delta + ids.length) % ids.length];
    render(next);
    body.querySelector("[data-detail-title]")?.focus();
    history.replaceState(history.state, "", `#${next}`);
  }

  // All close paths go through here so the URL and history stay in sync.
  function requestClose() {
    if (!dialog.open) return;
    if (pushed) {
      history.back(); // popstate closes the dialog
    } else {
      history.replaceState(null, "", location.pathname + location.search);
      dialog.close();
    }
  }

  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("dialog-open");
    pushed = false;
    current = null;
    const target = opener && document.contains(opener) ? opener : null;
    opener = null;
    target?.focus();
  });

  dialog.addEventListener("cancel", (e) => { e.preventDefault(); requestClose(); });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) requestClose(); }); // backdrop
  dialog.querySelector("[data-dialog-close]").addEventListener("click", requestClose);
  dialog.querySelector("[data-dialog-prev]").addEventListener("click", () => step(-1));
  dialog.querySelector("[data-dialog-next]").addEventListener("click", () => step(1));

  dialog.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.target.closest("input, textarea, select")) {
      e.preventDefault();
      step(e.key === "ArrowLeft" ? -1 : 1);
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog (native modal lets it reach browser chrome).
      const focusables = [...dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!focusables.length) return;
      const active = document.activeElement;
      if (!dialog.contains(active)) { e.preventDefault(); focusables[0].focus(); return; }
      const isAfter = (el) => active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING;
      const isBefore = (el) => active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING;
      if (!e.shiftKey && !focusables.some(isAfter)) {
        e.preventDefault();
        focusables[0].focus();
      } else if (e.shiftKey && !focusables.some(isBefore)) {
        e.preventDefault();
        focusables.at(-1).focus();
      }
    }
  });

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-project-open]");
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!byId[link.dataset.projectOpen]) return;
    e.preventDefault();
    open(link.dataset.projectOpen, { from: link });
  });

  window.addEventListener("popstate", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (byId[id]) {
      if (dialog.open) render(id);
      else open(id, { push: false });
    } else if (dialog.open) {
      pushed = false;
      dialog.close();
    }
  });

  // Deep link on load.
  const initial = decodeURIComponent(location.hash.slice(1));
  if (byId[initial]) open(initial, { push: false });
})();
