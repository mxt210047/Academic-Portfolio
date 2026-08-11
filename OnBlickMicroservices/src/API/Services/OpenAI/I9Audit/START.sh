#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
export PATH="$DOTNET_ROOT:$PATH"
dotnet restore I9Audit.sln
dotnet build I9Audit.sln -c Debug
exec dotnet run --project I9Audit.csproj --urls "http://127.0.0.1:5089"
