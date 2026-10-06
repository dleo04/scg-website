// Client request form (components/request-form.njk), progressive enhancement over a plain POST.
// - Validates on submit: each invalid field gets aria-invalid and an inline message added to its
//   aria-describedby; an error summary (links to the fields) appears and takes focus.
//   Once a field has been flagged it re-validates as the person types.
// - Valid: sends the form with fetch (Accept: JSON, as Formspree expects), the button disabled
//   and "Sending…" announced; success replaces the form with a focused thank-you message; failure
//   keeps everything typed and announces the error. A filled honeypot is treated as success.
(() => {
  "use strict";
  const root = document.querySelector("[data-request]");
  if (!root) return;
  const form = root.querySelector("[data-request-form]");
  const summary = form.querySelector("[data-error-summary]");
  const list = form.querySelector("[data-error-list]");
  const status = form.querySelector("[data-request-status]");
  const submit = form.querySelector("[data-request-submit]");
  const done = root.querySelector("[data-request-done]");
  const errorTpl = root.querySelector("template[data-request-error]");
  const fields = [...form.querySelectorAll("input:not([name='_gotcha']), textarea")];
  const flagged = new Set();
  form.noValidate = true;   // our messages replace the browser's bubbles

  function messageFor(el) {
    const v = el.value.trim();
    if (el.required && !v) return el.dataset.msgRequired || "This field is required.";
    if (v && el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return el.dataset.msgType;
    return "";
  }

  function show(el, msg) {
    const err = document.getElementById(`${el.id}-error`);
    const ids = (el.getAttribute("aria-describedby") || "").split(/\s+/).filter((id) => id && id !== err.id);
    if (msg) {
      err.textContent = msg;
      err.hidden = false;
      el.setAttribute("aria-invalid", "true");
      ids.push(err.id);
    } else {
      err.textContent = "";
      err.hidden = true;
      el.removeAttribute("aria-invalid");
    }
    if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
    else el.removeAttribute("aria-describedby");
    el.closest(".field").classList.toggle("field--invalid", Boolean(msg));
  }

  function validate() {
    const errors = [];
    for (const el of fields) {
      const msg = messageFor(el);
      show(el, msg);
      if (msg) { errors.push({ el, msg }); flagged.add(el); }
    }
    return errors;
  }

  fields.forEach((el) => el.addEventListener("input", () => {
    if (!flagged.has(el)) return;
    show(el, messageFor(el));
    // Keep the summary in step: drop fixed items, hide it when everything is fixed.
    const remaining = fields.filter((f) => f.getAttribute("aria-invalid") === "true");
    if (!summary.hidden) renderSummary(remaining.map((f) => ({ el: f, msg: messageFor(f) })), false);
  }));

  function renderSummary(errors, focus = true) {
    list.replaceChildren(...errors.map(({ el, msg }) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${el.id}`;
      a.textContent = msg;
      a.addEventListener("click", (e) => { e.preventDefault(); el.focus(); });
      li.append(a);
      return li;
    }));
    summary.hidden = errors.length === 0;
    if (errors.length && focus) summary.focus();
  }

  function setSending(on) {
    submit.disabled = on;
    submit.textContent = on ? "Sending…" : "Send request";
    form.setAttribute("aria-busy", String(on));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.classList.remove("is-error");
    const errors = validate();
    renderSummary(errors);
    if (errors.length) return;
    if (form.elements._gotcha.value) { finish(); return; }   // bot: pretend it worked
    if (form.hasAttribute("data-not-connected")) {
      status.textContent = "This form is not connected yet (development build): set forms.client_request_endpoint in site.json.";
      status.classList.add("is-error");
      return;
    }
    setSending(true);
    status.textContent = "Sending your request…";
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      finish();
    } catch {
      setSending(false);
      status.innerHTML = errorTpl.innerHTML.trim();
      status.classList.add("is-error");
    }
  });

  function finish() {
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }
})();
