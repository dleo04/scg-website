# Launch runbook: sniderconsultinggroup.com → GitHub Pages

This moves the domain **sniderconsultinggroup.com** from the old GoDaddy website to this site, served by GitHub Pages from the repository `dleo04/scg-website`. Follow the steps in order; where the order matters it says why. Tick each box as you go.

**Roles:** one person with access to the GitHub repository (admin, for Settings → Pages), one with access to the domain's DNS at GoDaddy. Best done together, on a weekday morning, not during recruiting.

**Reference values**

| What | Value |
|---|---|
| Apex `A` records (`@`) | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| Apex `AAAA` records (`@`, optional, IPv6) | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| `www` | `CNAME` → `dleo04.github.io` (the account's Pages host, **without** `/scg-website`) |
| Custom domain in GitHub | `sniderconsultinggroup.com` (apex; GitHub then redirects `www` to it) |
| Launch switch | `SITE_MODE` in `.github/workflows/pages.yml` (`preview` → `production`) |

Check the four IPs against GitHub's documentation ("Managing a custom domain for your GitHub Pages site") on the day; they have not changed for years, but the docs are the source of truth.

---

## 1. One to two days before

- [ ] **Lower the DNS TTL.** At GoDaddy, set the TTL of the records you will change (the `@` `A` record(s), any `@` `AAAA`, and `www`) to the lowest allowed value (e.g. 600 seconds / 10 minutes). Wait at least the *old* TTL (often 1 hour; up to 24 hours if it was set high) before launch day, so the change and a rollback both take effect quickly.
- [ ] **Back up the old site.**
  - Screenshots of every page of the old site (full page, desktop and phone): the pages listed in `data/redirects.json` plus the home page.
  - An offline copy of the HTML and images, e.g. `wget --mirror --convert-links --page-requisites --no-parent https://sniderconsultinggroup.com/` (or the browser's "Save page as… complete" for each page). Keep it outside this repository (it may contain personal details).
  - Any content only the old site holds (form submissions, contact entries, analytics) exported from the GoDaddy account.
- [ ] **Back up the DNS zone.** Write down (or export) **every** DNS record of the domain exactly as it is now: type, name, value, TTL, priority. This list is the rollback plan.
- [ ] **Identify what must stay.** In that list, mark every record that is **not** the website:
  - **Keep unchanged:** `MX` (email), email `TXT` records (SPF `v=spf1 …`, DKIM, `_dmarc`), email `CNAME`/`SRV` records (e.g. `autodiscover`, `_autodiscover`, `email`, `mail`), verification `TXT` records (Google, Microsoft, others), `NS` and `SOA`, and anything else you cannot explain (ask before touching).
  - **Will be replaced:** the `A` record(s) for `@` (the GoDaddy website), any `AAAA` for `@` that points to GoDaddy, and the `www` record. Also note any **domain forwarding** set up in GoDaddy for this domain; it must be turned off at launch, or it will override the records.
- [ ] **Verify the domain with GitHub (recommended).** In the GitHub *account or organization* settings (not the repository) → Pages → add `sniderconsultinggroup.com` as a verified domain. GitHub shows a `TXT` record (`_github-pages-challenge-<owner>`) to add at GoDaddy. Adding it does not affect the old site, and it stops anyone else's repository from claiming the domain.
- [ ] **Final content check on the preview** (https://dleo04.github.io/scg-website/): recruiting status, dates, the "about 2%" figure, and the open items in `TODO-CONTENT.md` that matter for launch.
- [ ] **Build production locally once:** `npm run build:production` must pass (it runs check:notes, the redirects check and the privacy check). Serve `_site` at the root and click through.

## 2. Launch day: in this order

1. [ ] **Flip the switch.** In `.github/workflows/pages.yml` set `SITE_MODE: production`. Commit ("Launch: production mode") and push to `main`.
2. [ ] **Confirm the deploy.** Actions tab → "Deploy to GitHub Pages" → both jobs green; the build log shows `[site-mode] production` and `wrote _site/CNAME`.
   *From this moment the github.io preview address shows the production build, whose links point to the domain root, so the preview at `/scg-website/` looks broken (missing styles, wrong links) until step 3–4. That is expected; keep the gap short.*
3. [ ] **Set the custom domain.** Repository → Settings → Pages → Custom domain: `sniderconsultinggroup.com` → Save. (With a GitHub Actions deployment this setting is what counts; the `CNAME` file in the build is a matching backup.) GitHub starts a DNS check, which fails until step 4.
   *From now on `https://dleo04.github.io/scg-website/` redirects to `sniderconsultinggroup.com`. Until DNS changes, that lands on the **old** GoDaddy site. There is no separate preview any more after launch.*
4. [ ] **Change DNS at GoDaddy** (only the records marked "replace" in step 1):
   - Delete the `@` `A` record(s) pointing to GoDaddy; add four `A` records for `@` with the four GitHub IPs above.
   - Optional: add the four `AAAA` records for `@`; delete any `@` `AAAA` pointing to GoDaddy.
   - Set `www` to `CNAME` → `dleo04.github.io`.
   - Turn off any GoDaddy domain forwarding / "connect to website builder" for this domain.
   - Leave every `MX`, `TXT`, email and verification record exactly as it was.
5. [ ] **Wait for DNS and HTTPS.** Check with `dig sniderconsultinggroup.com +short` (should list the four GitHub IPs) and `dig www.sniderconsultinggroup.com +short` (should show `dleo04.github.io.` then GitHub IPs). In Settings → Pages the DNS check turns green; GitHub then issues the certificate (minutes, sometimes up to 24 hours).
6. [ ] **Enforce HTTPS.** When the certificate is ready, tick **Enforce HTTPS** in Settings → Pages. (The box stays greyed out until then. Do not remove and re-add the domain to "speed it up"; that restarts the certificate.)
7. [ ] **Test the redirects** (section 3).
8. [ ] **Take the old site offline at GoDaddy** only after a day or two of the new site working (unpublishing it before then removes the rollback target). Cancel the GoDaddy website plan when you no longer need it; **do not** cancel the domain registration or email.

## 3. Checks right after launch

- [ ] `https://sniderconsultinggroup.com/` loads with a valid certificate; `http://` and `https://www.` both end on `https://sniderconsultinggroup.com/`.
- [ ] Main pages: Home, Projects (open a project drawer), Join (timeline, FAQ search), Team, Alumni (open a bio), About, Partners, Work With Us, Contact (the request form opens an email to the club address).
- [ ] View source on any page: canonical and `og:url` use `https://sniderconsultinggroup.com/…`; **no** `<meta name="robots" content="noindex">`; no `/scg-website/` anywhere.
- [ ] `https://sniderconsultinggroup.com/robots.txt` says `Allow: /` and lists `https://sniderconsultinggroup.com/sitemap.xml`; the sitemap lists real-domain URLs only.
- [ ] Old URLs redirect (spot-check at least): `/home-1` → Home, `/about-us` → About, `/services` → Work With Us, `/contact-us` → Contact, `/apply` → Join, `/interview-resources` → Interview prep, `/our-alumni` → Alumni, `/krushi-shah` → her alumni page, `/daniel-leo` → Team. Full list: `data/redirects.json`.
- [ ] An unknown URL (e.g. `/does-not-exist`) shows the site's 404 page with the menu.
- [ ] **Email still works:** send a message to and from the domain's mailboxes (if the domain has email).
- [ ] Share a page in a chat app or check a link preview tool: title, description and image appear.
- [ ] Google Search Console: add/verify the domain (DNS `TXT`), submit `https://sniderconsultinggroup.com/sitemap.xml`, request indexing of the home page. The old URLs are covered by the redirect pages.

## 4. Rollback

If the new site is broken in a way that cannot be fixed within the hour:

1. **DNS back to GoDaddy:** restore the `@` `A`/`AAAA` and `www` records exactly as saved in step 1 (delete the GitHub ones). With the lowered TTL this takes effect in minutes. Email records were never touched, so mail is unaffected throughout.
2. **GitHub:** Settings → Pages → remove the custom domain. The site is then served at `https://dleo04.github.io/scg-website/` again.
3. **Preview build again:** set `SITE_MODE: preview` in the workflow, commit, push; after the deploy the github.io preview works normally (prefixed links, noindex).
4. Fix the problem on the preview, then repeat section 2.

If only a page or link is wrong (not the whole site), do **not** roll back DNS: fix it in the repository and push; the deploy takes a few minutes.

## 5. Afterwards

- Raise the DNS TTL back to a normal value (e.g. 1 hour) once everything has been stable for a few days.
- Keep the backups from step 1 for at least a semester.
- New old-URL redirects: add them to `data/redirects.json` (see README → "Redirects from the old site").
