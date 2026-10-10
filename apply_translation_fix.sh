#!/usr/bin/env bash
# Run this from the root of your ministry-report repo.
set -e

python3 add_translation_key.py
python3 scripts/build-messages.py

if grep -q '"syncError"' src/messages/en.json && grep -q '"syncError"' src/messages/sw.json; then
  echo "OK: syncError is now present in both src/messages/en.json and src/messages/sw.json"
  node scripts/check-i18n.mjs
  git add -A
  git status --short
  echo
  echo "Review the diff above, then:"
  echo '  git commit -m "fix: add missing log.syncError translation (v0.2.4)"'
  echo "  git push"
else
  echo "FAILED: syncError still missing from the generated catalogues."
  echo "Your scripts/build-messages.py has drifted from what add_translation_key.py expects."
  echo "Send me the contents of the \"log\": { ... } block in scripts/build-messages.py and I'll fix it directly."
  exit 1
fi
