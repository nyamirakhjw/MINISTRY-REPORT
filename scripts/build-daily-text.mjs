#!/usr/bin/env node
/**
 * Builds src/data/daily-text/<year>.json from the daily-texts markdown file.
 *
 *   npm run daily-text -- data-source/Daily_TEXT_2026.md 2026
 *
 * The markdown comes from a PDF conversion, so the columns are interleaved. What stays reliable is this pattern:
 * a bold date heading ("**Thursday,** **November** **5**"), followed later by the scripture in italics ending with its
 * reference ("_—2_ _Ki._ _20:3._"). The script reads only those, and refuses to write the file unless every day of the
 * year has exactly one clean entry.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const [, , inputArg = "data-source/Daily_TEXT_2026.md", yearArg = "2026"] = process.argv;
const year = Number(yearArg);
const src = readFileSync(inputArg, "utf8");

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const heading = new RegExp(`\\*\\*(${DAYS.join("|")}),\\*\\*\\s+\\*\\*(${MONTHS.join("|")})\\*\\*\\s+\\*\\*(\\d{1,2})\\*\\*`, "g");
const italic = /(?<![\w\\])_([^_\n]+?)_(?!\w)/g;
const SOURCE_MARK = /^w\d{2}\.\d{2}\.?$/; // magazine issue markers such as "w25.03" printed inside the column text
const MAX_REF_WORDS = 7;

const clean = (s) =>
  s
    .replace(/ﬃ/g, "ffi").replace(/ﬄ/g, "ffl").replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl").replace(/ﬀ/g, "ff")
    .replace(/(\s|^)\.\s\.\s\.(?=\s|$|[,;:?!])/g, "$1…").replace(/\s*…\s*/g, " … ")
    .replace(/(\w)- (?=[a-z])/g, "$1") // a word split across two printed lines
    .replace(/\s+([,.;:?!”’])/g, "$1")
    .replace(/\s+/g, " ").trim();

const heads = [...src.matchAll(heading)].map((m) => ({ at: m.index, end: m.index + m[0].length, weekday: m[1], month: m[2], day: Number(m[3]) }));
const problems = [];
const days = {};

heads.forEach((h, i) => {
  const mm = MONTHS.indexOf(h.month) + 1;
  const date = new Date(Date.UTC(year, mm - 1, h.day));
  const key = `${year}-${String(mm).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`;
  if (date.getUTCMonth() !== mm - 1 || DAYS[date.getUTCDay()] !== h.weekday) return problems.push(`${key}: heading does not match the calendar`);
  if (days[key]) return problems.push(`${key}: found twice`);

  const window = src.slice(h.end, h.end + 1800);
  const tokens = [];
  for (const m of window.matchAll(italic)) {
    const text = m[1].trim();
    if (SOURCE_MARK.test(text)) continue;
    tokens.push({ text, at: h.end + m.index });
  }
  // The reference starts at the first dash that is followed, within a few words, by a number ending in a full stop.
  // A dash inside the verse itself ("nations—of a man") never leads to one, so it stays part of the verse.
  const done = (w) => /\d/.test(w) && /\.$/.test(w);
  let verseWords = null;
  let refWords = null;
  let last = null;
  for (let dash = 0; dash < tokens.length && !refWords; dash += 1) {
    if (!tokens[dash].text.includes("—")) continue;
    const at = tokens[dash].text.indexOf("—");
    const before = tokens[dash].text.slice(0, at).trim();
    const first = tokens[dash].text.slice(at + 1).trim();
    const words = first ? [first] : [];
    let j = dash;
    while (!(words.length && done(words[words.length - 1])) && j + 1 < tokens.length && words.length < MAX_REF_WORDS) {
      j += 1;
      words.push(tokens[j].text);
      if (/ftn\.$/.test(tokens[j].text)) break;
    }
    if (words.length && /\d/.test(words.join(" ")) && (done(words[words.length - 1]) || /ftn\.$/.test(words[words.length - 1]))) {
      verseWords = [...tokens.slice(0, dash).map((t) => t.text), ...(before ? [before] : [])];
      refWords = words;
      last = tokens[j];
    }
  }
  if (!refWords) return problems.push(`${key}: no reference found`);
  const next = heads[i + 1];
  if (next && next.at > tokens[0].at && next.at < last.at) problems.push(`${key}: another date heading sits inside this scripture (check by hand)`);

  const text = clean(verseWords.join(" "));
  const ref = clean(refWords.join(" ")).replace(/[.;]\s*$/, "").replace(/;\s*ftn$/, "");
  if (text.length < 8 || text.length > 260) problems.push(`${key}: verse length ${text.length} looks wrong`);
  days[key] = { t: text, r: ref };
});

// Hand corrections (see scripts/daily-text-fixes/<year>.json), applied after parsing.
const fixesPath = `scripts/daily-text-fixes/${year}.json`;
if (existsSync(fixesPath)) {
  for (const [key, fix] of Object.entries(JSON.parse(readFileSync(fixesPath, "utf8")))) {
    if (key.startsWith("_")) continue;
    if (!days[key]) problems.push(`${key}: has a fix but no parsed day`);
    else days[key] = { ...days[key], ...fix };
  }
}
// Words from magazine titles must never appear in a scripture: they mean commentary leaked in.
const LEAK = /\b(Watch ?Tower|Publications Index|Research Guide)\b|\b(Tow|Re)-(?=\s|$)/;
for (const [key, v] of Object.entries(days)) if (LEAK.test(v.t)) problems.push(`${key}: commentary words leaked into the verse (add a fix)`);

const expected = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
const count = Object.keys(days).length;
if (count !== expected) problems.push(`found ${count} days, expected ${expected}`);
for (let d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1)) {
  const key = d.toISOString().slice(0, 10);
  if (!days[key]) problems.push(`${key}: missing`);
}

if (problems.length) {
  console.error(`Daily text NOT written. ${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
const out = `src/data/daily-text/${year}.json`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ year, days }, null, 1) + "\n");
console.log(`Wrote ${out}: ${count} days.`);
