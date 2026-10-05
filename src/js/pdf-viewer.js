// PDF preview for /join/prepare/ (progressive enhancement over plain links to the PDFs).
// - "Preview" links (data-pdf-preview) open a native modal <dialog>: the page behind is inert,
//   Tab is looped inside, Esc / backdrop / X close it, focus returns to the link, scroll locks.
// - PDF.js (self-hosted in /js/vendor/pdfjs/) is imported the first time a preview opens, so
//   it adds nothing to the initial page load.
// - One page at a time, fit-to-width, zoom in/out, Previous/Next (and Left/Right arrows),
//   canvas at the device pixel ratio, next page prefetched, a text layer for selection and
//   screen readers, page changes announced politely. If rendering fails: a message and a
//   download link. Deep link: /join/prepare/#preview=<slug>.
(() => {
  "use strict";
  const dialog = document.querySelector("[data-pdf-viewer]");
  const links = [...document.querySelectorAll("[data-pdf-preview]")];
  if (!dialog || typeof dialog.showModal !== "function" || !links.length) return;

  const $ = (sel) => dialog.querySelector(sel);
  const titleEl = $("[data-pdf-title]"), pageEl = $("[data-pdf-page]"), zoomEl = $("[data-pdf-zoom]");
  const prevBtn = $("[data-pdf-prev]"), nextBtn = $("[data-pdf-next]"), zoomIn = $("[data-pdf-zoom-in]"), zoomOut = $("[data-pdf-zoom-out]");
  const download = $("[data-pdf-download]"), errorLink = $("[data-pdf-error-link]"), status = $("[data-pdf-status]");
  const stage = $("[data-pdf-stage]"), loading = $("[data-pdf-loading]"), errorBox = $("[data-pdf-error]");
  const wrap = $("[data-pdf-wrap]"), canvas = $("[data-pdf-canvas]"), textLayerEl = $("[data-pdf-text]");
  const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

  let pdfjs = null;          // the PDF.js module, once loaded
  let doc = null, task = null, pageNum = 1, zoomIndex = 2, opener = null, current = null;
  let renderTask = null, textLayer = null, token = 0;
  const pageCache = new Map();

  async function loadLib() {
    if (pdfjs) return pdfjs;
    pdfjs = await import("/js/vendor/pdfjs/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/js/vendor/pdfjs/pdf.worker.min.mjs";
    return pdfjs;
  }

  const getPage = (n) => {
    if (!pageCache.has(n)) pageCache.set(n, doc.getPage(n));
    return pageCache.get(n);
  };

  function setState(state) {
    loading.hidden = state !== "loading";
    errorBox.hidden = state !== "error";
    wrap.hidden = state !== "ready";
    stage.setAttribute("aria-busy", String(state === "loading"));
  }

  function updateControls() {
    const total = doc ? doc.numPages : 0;
    pageEl.textContent = total ? `Page ${pageNum} of ${total}` : "";
    prevBtn.disabled = !doc || pageNum <= 1;
    nextBtn.disabled = !doc || pageNum >= total;
    zoomEl.textContent = `${Math.round(ZOOMS[zoomIndex] * 100)}%`;
    zoomOut.disabled = !doc || zoomIndex === 0;
    zoomIn.disabled = !doc || zoomIndex === ZOOMS.length - 1;
  }

  async function render() {
    const my = ++token;
    renderTask?.cancel();
    textLayer?.cancel?.();
    try {
      const page = await getPage(pageNum);
      if (my !== token) return;
      const base = page.getViewport({ scale: 1 });
      const fit = Math.max(0.1, (stage.clientWidth - 32) / base.width);   // fit to width
      const scale = fit * ZOOMS[zoomIndex];
      const viewport = page.getViewport({ scale });
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      wrap.style.width = `${Math.floor(viewport.width)}px`;
      wrap.style.height = `${Math.floor(viewport.height)}px`;
      const ctx = canvas.getContext("2d");
      renderTask = page.render({ canvasContext: ctx, canvas, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
      await renderTask.promise;
      if (my !== token) return;
      // Text layer: invisible, selectable text positioned over the canvas.
      textLayerEl.replaceChildren();
      textLayerEl.style.setProperty("--total-scale-factor", String(scale));
      textLayerEl.style.setProperty("--scale-round-x", "1px");
      textLayerEl.style.setProperty("--scale-round-y", "1px");
      textLayer = new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: textLayerEl, viewport });
      await textLayer.render().catch(() => {});
      if (my !== token) return;
      setState("ready");
      updateControls();
      // Prefetch the next page.
      if (pageNum < doc.numPages) getPage(pageNum + 1).catch(() => {});
    } catch (err) {
      if (err?.name === "RenderingCancelledException" || my !== token) return;
      fail();
    }
  }

  function fail() {
    setState("error");
    status.textContent = "This preview could not be shown. Use Download PDF instead.";
    updateControls();
  }

  function announce() {
    status.textContent = `Page ${pageNum} of ${doc.numPages}`;
  }

  async function open(link, { push = true } = {}) {
    current = link;
    opener = link;
    const url = link.dataset.pdfUrl;
    titleEl.textContent = link.dataset.pdfTitle;
    download.href = url;
    errorLink.href = url;
    download.setAttribute("aria-label", `Download PDF: ${link.dataset.pdfTitle}, ${link.dataset.pdfSize}`);
    pageNum = 1;
    zoomIndex = 2;
    doc = null;
    pageCache.clear();
    canvas.width = 0;
    setState("loading");
    updateControls();
    document.documentElement.classList.add("dialog-open");
    if (!dialog.open) dialog.showModal();
    titleEl.focus();
    if (push) history.replaceState(history.state, "", `${location.pathname}${location.search}#preview=${link.dataset.pdfPreview}`);
    try {
      await loadLib();
      if (current !== link) return;
      await task?.destroy();
      task = pdfjs.getDocument({ url, isEvalSupported: false });
      doc = await task.promise;
      if (current !== link) return;
      status.textContent = `${link.dataset.pdfTitle}. Page 1 of ${doc.numPages}.`;
      await render();
    } catch {
      if (current === link) fail();
    }
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener("close", () => {
    token++;
    renderTask?.cancel();
    task?.destroy();
    task = null; doc = null; current = null;
    pageCache.clear();
    document.documentElement.classList.remove("dialog-open");
    if (location.hash.startsWith("#preview=")) history.replaceState(history.state, "", location.pathname + location.search);
    const target = opener && document.contains(opener) ? opener : null;
    opener = null;
    target?.focus();
  });
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
  $("[data-pdf-close]").addEventListener("click", close);

  const go = (delta) => {
    if (!doc) return;
    const n = Math.min(doc.numPages, Math.max(1, pageNum + delta));
    if (n === pageNum) return;
    pageNum = n;
    updateControls();
    stage.scrollTop = 0;
    render().then(announce);
  };
  const zoom = (delta) => {
    if (!doc) return;
    const n = Math.min(ZOOMS.length - 1, Math.max(0, zoomIndex + delta));
    if (n === zoomIndex) return;
    zoomIndex = n;
    render().then(() => { status.textContent = `Zoom ${Math.round(ZOOMS[zoomIndex] * 100)}%`; });
  };
  prevBtn.addEventListener("click", () => go(-1));
  nextBtn.addEventListener("click", () => go(1));
  zoomIn.addEventListener("click", () => zoom(1));
  zoomOut.addEventListener("click", () => zoom(-1));

  dialog.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      go(e.key === "ArrowLeft" ? -1 : 1);
    } else if (e.key === "Tab") {
      const f = [...dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
    }
  });

  // Re-fit when the window size changes (orientation change on phones).
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    if (!dialog.open || !doc) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });

  links.forEach((link) => link.addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(link);
  }));

  const fromHash = () => {
    const m = location.hash.match(/^#preview=([a-z0-9-]+)/);
    return m ? links.find((l) => l.dataset.pdfPreview === m[1]) : null;
  };
  const initial = fromHash();
  if (initial) open(initial, { push: false });
})();
