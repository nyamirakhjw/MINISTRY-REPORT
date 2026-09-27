#!/usr/bin/env node
// Deep-merges every messages/*.en.json / messages/*.sw.json fragment in this drop (Sprint 1's
// en.settings.json/sw.settings.json and Phase 3's en.phase3.json/sw.phase3.json) into
// src/messages/en.json / src/messages/sw.json. Never overwrites an existing key — safe to run more than
// once, and safe to run after you've started customizing the drafted Kiswahili strings.
// Usage: node scripts/merge-messages.mjs
import { readFileSync, writeFileSync } from "node:fs";

const FRAGMENTS = {
  en: ["messages/en.settings.json", "messages/en.phase3.json"],
  sw: ["messages/sw.settings.json", "messages/sw.phase3.json"],
};

function deepMergeMissing(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      target[key] ??= {};
      deepMergeMissing(target[key], value);
    } else if (!(key in target)) {
      target[key] = value;
    }
  }
  return target;
}

for (const [lang, sources] of Object.entries(FRAGMENTS)) {
  const targetPath = `src/messages/${lang}.json`;
  const target = JSON.parse(readFileSync(targetPath, "utf8"));
  for (const sourcePath of sources) {
    const source = JSON.parse(readFileSync(sourcePath, "utf8"));
    deepMergeMissing(target, source);
    console.log(`Merged ${sourcePath} into ${targetPath}`);
  }
  writeFileSync(targetPath, JSON.stringify(target, null, 2) + "\n");
}
