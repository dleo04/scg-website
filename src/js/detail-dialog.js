// Detail drawer (SPEC 6), progressive enhancement over plain links. Used by the project dialog
// (components/project-dialog.njk, kind "project") and the alumni bio drawer
// (components/alumni-dialog.njk, kind "alumni"). For each <dialog data-detail-dialog="<kind>">:
// - Links with data-<kind>-open="<id>" open the dialog instead of navigating.
// - Content is cloned from <template data-<kind>-template="<id>" data-<kind>-url data-<kind>-title>.
// - Native <dialog>.showModal() makes the page inert; Tab is also looped inside.
// - ESC, the close button and a backdrop click close it; focus returns to the opener.
// - Previous/Next buttons and Left/Right arrow keys move through the visible (filtered) list.
// - Deep link: #<id> opens it on load; Back closes it.
(() => {
  "use strict";
  document.querySelectorAll("dialog[data-detail-dialog]").forEach((dialog) => {
    if (typeof dialog.showModal !== "function") return; // links keep working
    const kind = dialog.dataset.detailDialog;
    const openAttr = `data-${kind}-open`, tplAttr = `data-${kind}-template`;

    const body = dialog.querySelector("[data-dialog-body]");
    const pos = dialog.querySelector("[data-dialog-position]");
    const full = dialog.querySelector("[data-dialog-full]");
    const templates = [...document.querySelectorAll(`template[${tplAttr}]`)];
    const ids = templates.map((t) => t.getAttribute(tplAttr));
    const byId = Object.fromEntries(templates.map((t) => [t.getAttribute(tplAttr), t]));
    const titleId = `${dialog.id}-title`;
    // Prev/next follow the openers currently visible on the page (so filters are respected); if
    // the open item is not among them (e.g. deep-linked), use all items.
    const order = () => {
      const visible = [...document.querySelectorAll(`[${openAttr}]`)]
        .filter((a) => !a.closest("[hidden], [inert]"))
        .map((a) => a.getAttribute(openAttr))
        .filter((id, i, arr) => byId[id] && arr.indexOf(id) === i);
      return current && visible.includes(current) ? visible : ids;
    };

    let current = null;   // id shown
    let opener = null;    // element to return focus to
    let pushed = false;   // whether we added a history entry for this dialog

    const openerFor = (id) => document.querySelector(`[${openAttr}="${CSS.escape(id)}"]`);

    function render(id) {
      const tpl = byId[id];
      body.replaceChildren(tpl.content.cloneNode(true));
      const title = body.querySelector("[data-detail-title]");
      if (title) title.id = titleId;
      current = id;
      const list = order();
      pos.textContent = `${list.indexOf(id) + 1} of ${list.length}`;
      full.href = tpl.getAttribute(`data-${kind}-url`);
      full.setAttribute("aria-label", `Open full page for ${tpl.getAttribute(`data-${kind}-title`)}`);
      body.scrollTop = 0;
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
        history.pushState({ scgDetail: id }, "", `#${id}`);
        pushed = true;
      }
    }

    function step(delta) {
      if (current === null) return;
      const list = order();
      const next = list[(list.indexOf(current) + delta + list.length) % list.length];
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
      const link = e.target.closest(`[${openAttr}]`);
      if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!byId[link.getAttribute(openAttr)]) return;
      e.preventDefault();
      open(link.getAttribute(openAttr), { from: link });
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
  });
})();
