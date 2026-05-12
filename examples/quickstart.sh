#!/usr/bin/env bash
# Thin wrapper: same ingest as quickstart.py (stdlib only).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
for py in python3 python py; do
  if command -v "$py" >/dev/null 2>&1; then
    exec "$py" "$SCRIPT_DIR/quickstart.py" "$@"
  fi
done
echo "No python3/python/py found. Install Python 3.11+ or run: pwsh examples/quickstart.ps1" >&2
exit 1
