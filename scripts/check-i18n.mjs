// Fails when: (1) en.json and sw.json differ in keys, (2) code uses a translation key that en.json lacks,
// (3) a translation is empty. Static keys only; keys built at runtime are covered by the prefix rules below.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const load = (l) => JSON.parse(fs.readFileSync(path.join(root, "src/messages", `${l}.json`), "utf8"));
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const en = load("en"), sw = load("sw");
const enKeys = new Set(flat(en)), swKeys = new Set(flat(sw));
let problems = 0;
const fail = (m) => { problems++; console.error("i18n:", m); };

for (const k of enKeys) if (!swKeys.has(k)) fail(`missing in sw.json: ${k}`);
for (const k of swKeys) if (!enKeys.has(k)) fail(`missing in en.json: ${k}`);
const get = (o, k) => k.split(".").reduce((a, p) => a?.[p], o);
for (const k of enKeys) { if (String(get(en, k)).trim() === "") fail(`empty en: ${k}`); if (String(get(sw, k)).trim() === "") fail(`empty sw: ${k}`); }

function walk(d, out = []) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(f.name) && !/\.test\./.test(f.name)) out.push(p);
  }
  return out;
}

const used = new Set();
const declRe = /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:\{[^}]*namespace:\s*)?["']([\w.]+)["']/g;
for (const file of walk(path.join(root, "src"))) {
  const src = fs.readFileSync(file, "utf8");
  // Walk declarations and usages in source order so a later `const t = ...` in another function takes over.
  const events = [];
  for (const m of src.matchAll(declRe)) events.push({ at: m.index, kind: "decl", v: m[1], ns: m[2] });
  const names = [...new Set(events.map((e) => e.v))];
  for (const v of names) {
    const re = new RegExp(`(?<![\\w.])${v}(?:\\.rich|\\.raw|\\.has)?\\(\\s*["']([\\w.]+)["']`, "g");
    for (const m of src.matchAll(re)) events.push({ at: m.index, kind: "use", v, key: m[1] });
  }
  events.sort((a, b) => a.at - b.at);
  const current = {};
  for (const e of events) {
    if (e.kind === "decl") { current[e.v] = e.ns; continue; }
    const ns = current[e.v];
    if (!ns) continue;
    const key = `${ns}.${e.key}`;
    used.add(key);
    if (!enKeys.has(key)) fail(`${path.relative(root, file)} uses missing key ${key}`);
  }
}
// Keys assembled at runtime: the whole family must exist.
const families = {
  "categories.": ["publisher", "auxiliary_pioneer", "regular_pioneer", "special_pioneer"],
  "roles.": ["publisher", "ministerial_servant", "elder"],
  "common.": ["strength0", "strength1", "strength2", "strength3", "light", "dark", "system"],
  "errors.": ["invalid", "unknown", "summaryTitle"],
};
for (const [ns, list] of Object.entries(families)) for (const k of list) if (!enKeys.has(ns + k)) fail(`missing runtime key ${ns}${k}`);
if (process.argv.includes("--list")) console.error([...used].sort().join("\n"));
console.error(`i18n: ${enKeys.size} keys, ${used.size} static usages checked, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);

