// Distinct majors across the published people (team members and alumni with
// consent_to_publish: true). Majors only, not minors. Names are normalized before counting:
// whitespace trimmed/collapsed, "&" and "and" treated as the same, case ignored, so
// "Government & Politics" and "Government and Politics" count once. The label shown for a
// group is its most common spelling.
const keyOf = (m) => String(m).trim().replace(/\s*&\s*/g, " and ").replace(/\s+/g, " ").toLowerCase();

export function distinctMajors(people) {
  const groups = new Map();
  for (const p of people) {
    const majors = Array.isArray(p.majors) ? p.majors : p.majors ? [p.majors] : [];
    for (const m of majors) {
      if (!m || !String(m).trim() || /\[TBD/i.test(m)) continue;
      const k = keyOf(m);
      const g = groups.get(k) || { spellings: new Map(), people: new Set() };
      g.spellings.set(m.trim(), (g.spellings.get(m.trim()) || 0) + 1);
      g.people.add(p.id);
      groups.set(k, g);
    }
  }
  const list = [...groups.values()]
    .map((g) => ({ name: [...g.spellings].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0], people: g.people.size, spellings: [...g.spellings.keys()] }))
    .sort((a, b) => b.people - a.people || a.name.localeCompare(b.name));
  return { count: list.length, list };
}
