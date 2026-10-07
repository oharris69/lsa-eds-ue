#!/bin/bash
# Upload the DA documents built by build-da-docs.mjs (media first, then pages)
# to the DA source API. Credentials are not handled here.
#
# Usage: tools/importer/upload-to-da.sh [/tmp/da-out]
set -euo pipefail

OUT="${1:-/tmp/da-out}"
MANIFEST="$OUT/manifest.json"
ORG=$(node -e "console.log(require('$MANIFEST').org)")
REPO=$(node -e "console.log(require('$MANIFEST').repo)")
CONTENT=$(node -e "console.log(require('$MANIFEST').contentDir)")
API="https://admin.da.live/source/$ORG/$REPO"
FAIL=0

mime() {
  case "${1##*.}" in
    png) echo image/png ;; jpg|jpeg) echo image/jpeg ;; gif) echo image/gif ;;
    svg) echo image/svg+xml ;; webp) echo image/webp ;; *) echo application/octet-stream ;;
  esac
}

for f in $(node -e "require('$MANIFEST').media.forEach((m) => console.log(m))"); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    -F "data=@$CONTENT/media-da/$f;type=$(mime "$f")" "$API/media-da/$f")
  echo "media $f -> $code"
  [[ "$code" =~ ^20 ]] || FAIL=1
done

for p in $(node -e "require('$MANIFEST').pages.forEach((p) => console.log(p.path))"); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    -F "data=@$OUT/$p.html;type=text/html" "$API/$p.html")
  echo "page /$p -> $code"
  [[ "$code" =~ ^20 ]] || FAIL=1
done

exit $FAIL
