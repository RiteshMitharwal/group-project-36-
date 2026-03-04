#!/usr/bin/env bash
# Run full stack with Docker Compose (Docker only)

set -e
cd "$(dirname "$0")"

if ! command -v docker &>/dev/null; then
  echo "Docker not found. To use Docker only:"
  echo ""
  echo "  1. Install Docker Desktop: https://docs.docker.com/desktop/install/mac-install/"
  echo "  2. Open Docker Desktop and wait until it says it's running."
  echo "  3. Run this script again: ./run.sh"
  echo ""
  exit 1
fi

# Prefer 'docker compose' (v2), fall back to 'docker-compose' (v1)
if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  echo "Docker Compose not found. Install Docker Desktop (includes Compose)."
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Starting containers (postgres, backend, frontend)..."
$COMPOSE up --build
