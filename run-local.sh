#!/usr/bin/env bash
# Run WITHOUT Docker: backend (SQLite) + frontend (Next.js)
# Requires: Python 3, Node.js (npm)

set -e
cd "$(dirname "$0")"
PROJECT_ROOT="$PWD"

# --- Backend ---
echo "=== Backend (Django + SQLite) ==="
cd "$PROJECT_ROOT/backend"

if [ ! -d .venv ]; then
  echo "Creating Python virtualenv..."
  python3 -m venv .venv
fi
source .venv/bin/activate

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

export DATABASE_URL="${DATABASE_URL:-sqlite:///./db.sqlite3}"
# Use path relative to backend dir for SQLite
if [[ "$DATABASE_URL" == sqlite* ]]; then
  export DATABASE_URL="sqlite:///./db.sqlite3"
fi

DB_EXISTED=0
[ -f db.sqlite3 ] && DB_EXISTED=1
echo "Running migrations..."
python manage.py migrate --noinput
if [ "$DB_EXISTED" = "0" ] || [ "$SEED" = "1" ]; then
  echo "Seeding data..."
  python manage.py seed_workload
fi

echo "Starting backend at http://localhost:8000"
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd "$PROJECT_ROOT"

# Give backend a moment to start
sleep 2

# --- Frontend ---
echo ""
echo "=== Frontend (Next.js) ==="
cd "$PROJECT_ROOT/frontend"

if [ ! -d node_modules ]; then
  echo "Installing npm packages (this may take a minute)..."
  npm install
fi

export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8000}"
echo "Starting frontend at http://localhost:3000"
npm run dev &
FRONTEND_PID=$!
cd "$PROJECT_ROOT"

echo ""
echo "----------------------------------------"
echo "  App:  http://localhost:3000"
echo "  API:  http://localhost:8000"
echo "  Login: admin / admin123"
echo "         academic1 / academic123"
echo "----------------------------------------"
echo "Press Ctrl+C to stop both servers."
echo ""

cleanup() {
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM
wait
