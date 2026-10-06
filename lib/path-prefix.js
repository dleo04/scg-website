// Path prefix for builds served from a sub-folder (the GitHub Pages preview at
// https://dleo04.github.io/scg-website/). Set PATH_PREFIX=/scg-website/ to use it; unset (local
// dev, the production build at the domain root) everything is byte-for-byte unchanged.
//
// Templates keep writing root-relative URLs ("/projects/", "/assets/…"); this transform adds
// the prefix to every root-relative URL in the built HTML: href, src, action, poster, srcset /
// imagesrcset lists, every data-* attribute (drawer/page URLs, lightbox images, backdrop files)
// and url(...) in style attributes and <style> blocks. Protocol-relative ("//…") and absolute
// URLs are left alone. Absolute URLs (canonical, Open Graph, JSON-LD, sitemap) come from the
// absoluteUrl filter, which uses SITE_URL (see lib/filters.js).
export function normalizePrefix(raw) {
  if (!raw || raw === "/") return "";
  return "/" + raw.replace(/^\/+|\/+$/g, "");
}

export function prefixHtml(html, prefix) {
  if (!prefix) return html;
  const add = (u) => (u.startsWith("/") && !u.startsWith("//") && !u.startsWith(prefix + "/") ? prefix + u : u);
  return html
    .replace(/(\s(?:href|src|action|poster|xlink:href|data-[a-z0-9-]+)=)(["'])(\/(?!\/)[^"']*)\2/gi, (m, attr, q, url) => `${attr}${q}${add(url)}${q}`)
    .replace(/(\s(?:srcset|imagesrcset)=)(["'])([^"']*)\2/gi, (m, attr, q, list) =>
      `${attr}${q}${list.split(",").map((part) => part.replace(/^(\s*)(\S+)/, (x, sp, url) => sp + add(url))).join(",")}${q}`)
    .replace(/url\((["']?)(\/(?!\/)[^)"']*)\1\)/g, (m, q, url) => `url(${q}${add(url)}${q})`);
}
