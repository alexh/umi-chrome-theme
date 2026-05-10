#!/usr/bin/env bash
# Open chrome://extensions and print load-unpacked instructions.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cat <<EOF
─── Utility Materials Theme // local install ───

Theme directory:
  ${REPO_DIR}

Steps:
  1. Toggle "Developer mode" (top-right).
  2. Click "Load unpacked" and select the directory above.
  3. The theme applies immediately. Open a new tab to confirm.

After editing files:
  1. chrome://settings/appearance  →  Reset to default
  2. chrome://extensions  →  Reload the Utility Materials card
  3. Open a new tab.

Opening chrome://extensions ...
EOF

URL="chrome://extensions"

case "$(uname -s)" in
  Darwin)  open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL" ;;
  Linux)   for cmd in google-chrome google-chrome-stable chromium chromium-browser brave; do
             if command -v "$cmd" >/dev/null 2>&1; then "$cmd" "$URL" >/dev/null 2>&1 & disown; exit 0; fi
           done
           echo "  (No Chrome/Chromium binary found on PATH — open ${URL} manually.)" ;;
  *)       echo "  (Unknown OS — open ${URL} manually.)" ;;
esac
