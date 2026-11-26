#!/bin/sh
# Regenerate the downloadable CV after editing cv.md.
# Needs the local site running (bundle exec jekyll serve --port 4000) and Google Chrome.
set -eu
cd "$(dirname "$0")/.."
URL="${CV_SOURCE_URL:-http://127.0.0.1:4000/cv/pdf-source/}"
OUT="assets/pdf/hasan-jaffal-cv.pdf"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

curl -sf -o /dev/null "$URL" || { echo "CV source not reachable at $URL; start jekyll serve first." >&2; exit 1; }
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$OUT" "$URL" 2>/dev/null
test -s "$OUT" || { echo "PDF was not written." >&2; exit 1; }
echo "Wrote $OUT"
