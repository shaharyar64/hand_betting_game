# Hand Betting Game

Web-based Mahjong hand betting game built for extensibility, polished gameplay, and clean domain separation.

## Tech Stack

- Backend: FastAPI (Python)
- Frontend: Next.js + TypeScript + Zustand + Tailwind CSS + Framer Motion
- State and game logic: modular engine + deck/tile services + typed API contracts

## Project Structure

- `backend/app/main.py` - FastAPI application entrypoint
- `backend/app/api/game_routes.py` - game and leaderboard HTTP endpoints
- `backend/app/hand_betting_engine.py` - core game state machine and round resolution
- `backend/app/tiles/` - tile factory, deck management, tile models
- `backend/app/leaderboard/` - leaderboard service and store abstraction
- `frontend/src/components/landing/PremiumLandingPage.tsx` - landing page UI
- `frontend/src/components/game/GameDashboard.tsx` - gameplay interface
- `frontend/src/store/gameStore.ts` - async game/leaderboard client store
- `frontend/src/services/api.ts` - typed API client

## Requirements Coverage

- Landing page with a clear `New Game` entry point
- Top-5 leaderboard shown on both landing and gameplay screens
- Mahjong tile set with number, wind, and dragon tiles
- Dynamic non-number tile value scaling after resolved hands
- Draw/discard pile counters and reshuffle tracking
- Game-over handling with final score summary screen
- History timeline with compact prior-hand tile visuals and values
- Exit navigation from gameplay back to landing

## Local Setup

### 1) Install dependencies

```bash
# repository root
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt

cd frontend
npm install
```

### 2) Run backend

```bash
# from repository root
npm run dev:backend
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

### 3) Run frontend

```bash
# from repository root
npm run dev:frontend
```

Frontend default URL: [http://localhost:3000](http://localhost:3000)

## Development Notes

- The backend is implemented as a stateful engine with service boundaries to keep future feature work isolated.
- Frontend API and state are strongly typed to reduce integration drift during extension work.
- UI components are split by screen domain (`landing`, `game`) to keep design iterations localized.

## AI Usage Note

This repository includes both handwritten implementation and AI-assisted iteration. AI was used for selective drafting/refinement, while architecture decisions, acceptance-criteria alignment, and final validation were manually reviewed.

## Video Walkthrough

Add your walkthrough link here after recording:

- `TODO: replace with public video URL`