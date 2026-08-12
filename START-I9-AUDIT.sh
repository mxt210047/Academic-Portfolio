#!/usr/bin/env bash
# Launches the OnBlick I-9 Audit Agent UI (Figma wireframe implementation).
# Windows: START-I9-AUDIT.bat still targets OnBlickMicroservices I9Audit\START.bat
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
UI="$ROOT/I-9-Assist-Agent"
API="$ROOT/OnBlickMicroservices/src/API/Services/OpenAI/I9Audit"
PORT="${PORT:-8765}"

if [[ -f "$UI/index.html" ]]; then
  cd "$UI"
  if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    echo "I-9 Audit Agent already running: http://127.0.0.1:${PORT}/"
  else
    echo "Starting I-9 Audit Agent UI → http://127.0.0.1:${PORT}/"
    exec python3 -m http.server "$PORT"
  fi
  exit 0
fi

if [[ -f "$API/START.sh" ]]; then
  exec bash "$API/START.sh" "$@"
fi

echo "I-9 Assist Agent UI not found at $UI"
exit 1
