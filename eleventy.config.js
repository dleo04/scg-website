import { loadData } from "./lib/load-data.js";
import * as filters from "./lib/filters.js";

export default function (eleventyConfig) {
  // Content lives in data/*.json (outside src/) so officers have one place to edit.
  // It is validated and consent-filtered once per build, then exposed as globals.
  let cache = null;
  eleventyConfig.on("eleventy.before", () => {
    cache = null;
  });
  const data = () => (cache ??= loadData());
  for (const key of Object.keys(loadData())) {
    eleventyConfig.addGlobalData(key, () => data()[key]);
  }
  eleventyConfig.addWatchTarget("./data/");
  eleventyConfig.addWatchTarget("./lib/");

  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true, throwOnUndefined: false });

  eleventyConfig.addFilter("tbd", filters.tbd);
  eleventyConfig.addFilter("isTbd", filters.isTbd);
  eleventyConfig.addFilter("isPlaceholderImage", filters.isPlaceholderImage);
  eleventyConfig.addFilter("ctaState", filters.ctaState);
  eleventyConfig.addFilter("absoluteUrl", filters.absoluteUrl);
  eleventyConfig.addFilter("jsonLd", filters.jsonLd);
  eleventyConfig.addFilter("versioned", filters.versioned);
  eleventyConfig.addFilter("scopeLine", filters.scopeLine);
  eleventyConfig.addFilter("logoBox", filters.logoBox);
  eleventyConfig.addFilter("parseStat", filters.parseStat);
  eleventyConfig.addFilter("distinct", filters.distinct);

  // Static files. Brand assets are copied as-is (never transformed).
  // Originals in assets/logos/ are not published; pages use the small copies in assets/generated/logos/.
  eleventyConfig.addPassthroughCopy("assets/*.{png,jpg,jpeg,webp,avif,svg,pdf}");
  eleventyConfig.addPassthroughCopy("assets/placeholders/**/*.{png,jpg,jpeg,webp,svg}");
  eleventyConfig.addPassthroughCopy("assets/generated/**/*.{png,jpg,jpeg,webp,avif,svg}");
  eleventyConfig.addPassthroughCopy({ "src/css": "css", "src/js": "js" });
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/lato/files/lato-latin-400-normal.woff2": "fonts/lato-latin-400-normal.woff2",
    "node_modules/@fontsource/lato/files/lato-latin-700-normal.woff2": "fonts/lato-latin-700-normal.woff2",
    "node_modules/@fontsource/montserrat/files/montserrat-latin-600-normal.woff2": "fonts/montserrat-latin-600-normal.woff2",
    "node_modules/@fontsource/montserrat/files/montserrat-latin-700-normal.woff2": "fonts/montserrat-latin-700-normal.woff2",
    "node_modules/@fontsource/montserrat/files/montserrat-latin-800-normal.woff2": "fonts/montserrat-latin-800-normal.woff2",
  });

  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
