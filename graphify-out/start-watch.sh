#!/usr/bin/env bash
# Start graphify watch + auto-sync the dashboard. Stop with Ctrl+C.
set -euo pipefail
cd "$(dirname "$0")/.."

PY=""
PYFILE="graphify-out/.graphify_python"
if [ -f "$PYFILE" ]; then
  candidate="$(tr -d '\r\n' < "$PYFILE")"
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then PY="$candidate"; fi
fi
if [ -z "$PY" ] && command -v uv >/dev/null 2>&1; then
  uvdir="$(uv tool dir 2>/dev/null || true)"
  if [ -n "$uvdir" ] && [ -x "$uvdir/graphifyy/bin/python" ]; then PY="$uvdir/graphifyy/bin/python"; fi
fi
if [ -z "$PY" ] && command -v graphify >/dev/null 2>&1; then PY="python3"; fi
if [ -z "$PY" ]; then PY="$(command -v python3 || command -v python || true)"; fi
if [ -z "$PY" ]; then echo "Could not find a Python with graphify installed." >&2; exit 1; fi

exec "$PY" graphify-out/watch-sync.py
