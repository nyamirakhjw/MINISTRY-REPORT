import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "supabase/functions/**", "node_modules/**"]),
  {
    rules: {
      // "Ship it clean. No half-finished items, no RULE left in." (pre-launch checklist)
      "no-warning-comments": ["error", { terms: ["RULE", "fixme", "xxx", "hack"], location: "anywhere" }],
      "no-console": ["error", { allow: ["error"] }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]);



