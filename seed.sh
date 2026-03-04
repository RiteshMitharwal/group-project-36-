#!/usr/bin/env bash
# Seed the database (run once after first 'docker compose up')

set -e
cd "$(dirname "$0")"

if ! command -v docker &>/dev/null; then
  echo "Docker is not installed or not in PATH."
  exit 1
fi

echo "Seeding workload data..."
docker compose exec backend python manage.py seed_workload
echo ""
echo "Done. You can log in with:"
echo "  Admin:    username: admin       password: admin123"
echo "  Academic: username: academic1   password: academic123"
