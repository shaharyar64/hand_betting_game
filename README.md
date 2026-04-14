# hand_betting_game

Project scaffold with:
- `backend/` FastAPI base API
- `frontend/` Next.js + Tailwind CSS app
- shared root scripts for common local workflows

## Structure

- `backend/app/main.py` - FastAPI application entrypoint
- `backend/requirements.txt` - Python backend dependencies
- `frontend/` - Next.js application

## Backend setup and run

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
npm run dev:backend
```

API health check:

```bash
curl http://127.0.0.1:8000/health
```

## Frontend setup and run

```bash
cd frontend
npm install
npm run dev
```

Or from the repository root:

```bash
npm run dev:frontend
```