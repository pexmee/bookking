#!/usr/bin/env bash
# First-time BookKing setup on Linux/macOS.
# Requires Docker: https://docs.docker.com/get-docker/

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. See https://docs.docker.com/get-docker/" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is required (docker compose plugin or standalone)." >&2
  exit 1
fi

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "Created .env from .env.example (edit as needed)."
fi

docker compose pull
docker compose up -d

echo ""
echo "BookKing is starting."
echo "Open https://localhost when the stack is up (HTTPS only)."
echo ""
echo "Your browser may warn about the auto-generated certificate — that is expected."
echo "For a trusted local certificate (no warning on this computer), run:"
echo "  ./scripts/setup-certs.sh"
echo "  docker compose restart caddy"
echo ""
echo "See README for phone/LAN access and login setup."
