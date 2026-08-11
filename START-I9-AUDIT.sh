#!/usr/bin/env bash
# Linux/macOS counterpart to START-I9-AUDIT.bat
# Windows bat expects:
#   OnBlickMicroservices/src/API/Services/OpenAI/I9Audit/START.bat
# on branch I9_Audit_Agent from:
#   https://onblickrigaps.visualstudio.com/_git/OnBlickMicroservices?version=GBI9_Audit_Agent

set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
I9AUDIT="$ROOT/OnBlickMicroservices/src/API/Services/OpenAI/I9Audit"

if [[ -f "$I9AUDIT/START.bat" || -f "$I9AUDIT/START.sh" ]]; then
  cd "$I9AUDIT"
  if [[ -f START.sh ]]; then
    exec bash START.sh "$@"
  fi
  echo "Found I9Audit tree but only START.bat (Windows). Run that on Windows, or provide START.sh."
  exit 1
fi

echo "OnBlickMicroservices I9Audit not present at:"
echo "  $I9AUDIT"
echo
echo "Falling back to local I-9 Assist Audit Agent demo..."
DEMO_DIR="$ROOT/I-9-Assist-Agent"
if [[ ! -f "$DEMO_DIR/i9-assist-audit-agent.html" ]]; then
  echo "Missing $DEMO_DIR/i9-assist-audit-agent.html"
  exit 1
fi

cd "$DEMO_DIR"
PORT="${PORT:-8765}"
if curl -sf "http://127.0.0.1:${PORT}/i9-assist-audit-agent.html" >/dev/null 2>&1; then
  echo "Already running: http://127.0.0.1:${PORT}/i9-assist-audit-agent.html"
  exit 0
fi

echo "Starting http://127.0.0.1:${PORT}/i9-assist-audit-agent.html"
exec python3 -m http.server "$PORT"
