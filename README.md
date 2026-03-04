# Minimal Workload Management System

A production-quality SaaS for university operations teams to manage academic workload allocations.

## Stack

- **Backend:** Django 4.2, Django REST Framework, PostgreSQL, JWT (simplejwt), Docker
- **Frontend:** Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui, Recharts

## Run without Docker (no Docker required)

**Requirements:** Python 3 and Node.js (npm).

**One command:**
```bash
cd /path/to/WorkloadManagement
./run-local.sh
```
Uses SQLite (no PostgreSQL). Migrations and seed run on first start. Then open **http://localhost:3000** — login: `admin` / `admin123` or `academic1` / `academic123`.

**Two terminals (alternative):**  
Terminal 1: `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py seed_workload && python manage.py runserver 0.0.0.0:8000`  
Terminal 2: `cd frontend && npm install && NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev`

---

## Run with Docker

**1. Install Docker**  
- **macOS:** [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) — install, open the app, wait until it says “Docker is running”.  
- **Windows:** [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/).  
- Then run: `docker --version` and `docker compose version` (or `docker-compose --version`).

**2. Run the app**
   ```bash
   cp .env.example .env
   ./run.sh
   ```
   Or: `docker compose up --build` (or `docker-compose up --build`).

**3. Seed (first run only)** — in a new terminal:
   ```bash
   docker compose exec backend python manage.py seed_workload
   ```
   (Or `docker-compose exec ...` if you use Compose v1.)

**4. Open**  
- App: http://localhost:3000  
- API: http://localhost:8000  
- Login: `admin` / `admin123` or `academic1` / `academic123`

## Development

### Backend (local, SQLite)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py seed_workload
python manage.py runserver 0.0.0.0:8000
```

### Frontend (local)
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### Tests
```bash
# Backend
docker-compose exec backend pytest
# or: cd backend && pytest

# Frontend
cd frontend && npm run test
```

## API Overview

- **Auth:** `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`
- **Admin CRUD:** departments, academics, modules, eligibility, years
- **Allocations:** `GET/POST /api/allocations`, `GET/PATCH/DELETE /api/allocations/:id`
- **Analytics:** admin summary/risk, academic my-workload, history, group-summary

Locked academic years prevent create/edit/delete of allocations; viewing is allowed.

## License

Proprietary.
