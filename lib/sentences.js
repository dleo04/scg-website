// Sentence splitting that does not break at initials or abbreviations. Used wherever a summary,
// excerpt or sentence list is derived from longer text (lib/load-data.js).
//
// A sentence ends at ".", "!" or "?" (plus any closing quotes/brackets) followed by whitespace
// and an uppercase letter, digit or opening quote, EXCEPT:
//   - after a single capital letter: an initial ("Robert H. Smith", "J. Doe");
//   - after a known abbreviation: Mr., Ms., Mrs., Dr., Prof., St., Jr., Sr., Inc., Corp., Co.,
//     Ltd., vs., etc., e.g., i.e., and dotted forms such as M.S., B.S., B.A., M.A., M.B.A.,
//     Ph.D., U.S., U.K. (any letters separated by dots);
//   - inside parentheses, brackets or double quotes.
const ABBREVIATIONS = new Set(["mr", "ms", "mrs", "dr", "prof", "st", "jr", "sr", "inc", "corp", "co", "ltd", "vs", "etc", "no", "dept", "univ", "approx", "e.g", "i.e"]);

function isAbbreviationBefore(text, dotIndex) {
  // The token that ends at the period (letters and inner dots, e.g. "Ph.D" or "H" or "Inc").
  const m = /([A-Za-z](?:[A-Za-z]|\.(?=[A-Za-z]))*)$/.exec(text.slice(0, dotIndex));
  if (!m) return false;
  const token = m[1];
  if (/^[A-Z]$/.test(token)) return true;                         // initial: "H."
  if (/^(?:[A-Za-z]{1,3}\.)+[A-Za-z]{1,3}$/.test(token)) return true; // dotted: "M.S", "Ph.D", "U.S"
  return ABBREVIATIONS.has(token.toLowerCase());
}

export function splitSentences(text) {
  const s = String(text || "").trim();
  if (!s) return [];
  const out = [];
  let start = 0, depth = 0, inQuote = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "[") depth++;
    else if ((c === ")" || c === "]") && depth > 0) depth--;
    else if (c === '"' || c === "“" || c === "”") inQuote = c === "“" ? true : c === "”" ? false : !inQuote;
    if (!".!?".includes(c) || depth > 0 || inQuote) continue;
    let j = i + 1;
    while (j < s.length && /["”’')\]]/.test(s[j])) j++;   // closing quotes/brackets belong to the sentence
    if (j >= s.length || !/\s/.test(s[j])) continue;
    let k = j; while (k < s.length && /\s/.test(s[k])) k++;
    if (k >= s.length || !/[A-Z0-9"“‘(]/.test(s[k])) continue;
    if (c === "." && isAbbreviationBefore(s, i)) continue;
    out.push(s.slice(start, j).trim());
    start = k; i = k - 1;
  }
  if (start < s.length) out.push(s.slice(start).trim());
  return out.filter(Boolean);
}

export const firstSentence = (text) => splitSentences(text)[0] || "";
