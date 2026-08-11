#!/usr/bin/env bash
# Linux/macOS counterpart to START-I9-AUDIT.bat
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
I9AUDIT="$ROOT/OnBlickMicroservices/src/API/Services/OpenAI/I9Audit"

if [[ -f "$I9AUDIT/START.sh" ]]; then
  exec bash "$I9AUDIT/START.sh" "$@"
fi

if [[ -f "$I9AUDIT/START.bat" ]]; then
  echo "Found I9Audit tree but only START.bat (Windows). Run that on Windows, or provide START.sh."
  exit 1
fi

echo "OnBlickMicroservices I9Audit not present at: $I9AUDIT"
echo "Falling back to local I-9 Assist Audit Agent demo..."
DEMO_DIR="$ROOT/I-9-Assist-Agent"
cd "$DEMO_DIR"
PORT="${PORT:-8765}"
exec python3 -m http.server "$PORT"
