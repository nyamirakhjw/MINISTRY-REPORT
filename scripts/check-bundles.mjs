// After `next build`: no source maps in the public output, and a coarse compressed-size budget for JS chunks.
// Fine-grained per-route budgets (PRD §14.9) come from Lighthouse CI; this guards against accidental bloat.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const dir = path.join(process.cwd(), ".next", "static");
if (!fs.existsSync(dir)) { console.error("bundles: run `next build` first"); process.exit(1); }
const BUDGET_KB = Number(process.env.BUNDLE_BUDGET_KB ?? 700);
let total = 0, maps = 0;
const sizes = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith(".map")) maps++;
    else if (f.name.endsWith(".js")) { const gz = zlib.gzipSync(fs.readFileSync(p)).length; total += gz; sizes.push([gz, path.relative(dir, p)]); }
  }
})(dir);
sizes.sort((a, b) => b[0] - a[0]);
console.log("bundles: largest chunks (gzip KB)");
for (const [s, n] of sizes.slice(0, 8)) console.log(`  ${(s / 1024).toFixed(1).padStart(7)}  ${n}`);
console.log(`bundles: total ${(total / 1024).toFixed(0)} KB gzip across all chunks (budget ${BUDGET_KB} KB), ${maps} source map(s)`);
process.exit(maps > 0 || total / 1024 > BUDGET_KB ? 1 : 0);
