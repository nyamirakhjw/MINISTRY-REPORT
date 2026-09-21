// Pre-launch checklist "no leftover placeholder text": scans source, public files and catalogues.
// Also enforces: no service-role key or server-only imports in client code, no framework names in titles.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const banned = [/lorem ipsum/i, /\bTODO\b/, /\bFIXME\b/, /\bXXX\b/, /Create Next App/i, /example\.com/i, /placeholder text/i, /coming soon/i];
const skipDirs = new Set(["node_modules", ".next", ".git", "design-system", "brand-src", "docs", "e2e"]);
const skipFiles = new Set(["check-content.mjs", "seed.sql", "bootstrap-owner.sql", "set-landing-details.sql", "package-lock.json", ".env.example"]);
let problems = 0;
const fail = (m) => { problems++; console.error("content:", m); };

function walk(d, out = []) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (skipDirs.has(f.name)) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// Shipped code and content only. Docs, CI files and lint config legitimately mention the banned words.
const SHIPPED = ["src", "public", "supabase/functions", "supabase/migrations", "supabase/templates"];
const files = SHIPPED.filter((d) => fs.existsSync(path.join(root, d))).flatMap((d) => walk(path.join(root, d)));
for (const file of files) {
  const rel = path.relative(root, file);
  if (skipFiles.has(path.basename(file)) || /\.(png|ico|webp|jpg)$/.test(file) || rel.includes("tests/database")) continue;
  const src = fs.readFileSync(file, "utf8");
  for (const re of banned) if (re.test(src)) fail(`${rel} matches ${re}`);
  if (/\.(tsx?)$/.test(file) && rel.startsWith("src/") && /(^|\/)(components|hooks)\//.test(rel) && /SUPABASE_SERVICE_ROLE_KEY|supabase\/admin|server-only/.test(src) && !rel.includes("/shell/sign-out")) {
    fail(`${rel} must not reference server-only code or the service-role key`);
  }
  if (rel.startsWith("src/") && /["'](Next|React|Vite|Create React App)["']\s*[,}]/.test(src) && /title/.test(src)) fail(`${rel} looks like a framework name in a title`);
}
const hits = walk(path.join(root, "src")).filter((f) => /"use client"/.test(fs.readFileSync(f, "utf8")) && /supabase\/admin|supabase\/server/.test(fs.readFileSync(f, "utf8")));
for (const f of hits) fail(`${path.relative(root, f)} is a client file importing a server Supabase client`);
console.error(`content: ${problems} problem(s)`);
process.exit(problems ? 1 : 0);

