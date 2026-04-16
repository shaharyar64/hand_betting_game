# Hand Betting Game - Core Files and API Overview

This document explains where the core files are and what they currently do so leadership can quickly understand the product architecture.

## System Shape

- Backend: FastAPI service that owns game rules, tile/deck lifecycle, and leaderboard state.
- Frontend: Next.js app that renders landing + game dashboard, calls backend APIs, and stores UI state in Zustand.
- Data storage: In-memory only in the current implementation (no persistent database).

## Core Backend Files

- `backend/app/main.py`
  - Creates the FastAPI app, configures CORS for local frontend ports, exposes `/health`, and mounts game routes.

- `backend/app/api/game_routes.py`
  - Defines all game endpoints.
  - Maintains a single in-memory `GameSessionStore` with active engine + leaderboard.
  - Serializes engine state/history/tile payloads returned to the frontend.

- `backend/app/hand_betting_engine.py`
  - Main production gameplay engine.
  - Manages round flow: start hand -> place bet -> resolve hand.
  - Applies score rules (`+10` win, `-5` lose), dynamic scaling for non-number tiles, and game-over checks.

- `backend/app/tiles/deck_service.py`
  - Handles draw pile/discard pile operations and bounded reshuffles (max 3).
  - Supports forced reshuffle-limit state for debug/testing.

- `backend/app/tiles/factory.py`
  - Builds number, wind, and dragon tiles.
  - Supports compact deck generation (default target deck size is 20).

- `backend/app/tiles/models.py`
  - Defines immutable `Tile` model and tile type union.

- `backend/app/leaderboard/service.py`
  - Provides in-memory leaderboard storage.
  - Adds scores with UTC timestamps and returns top scores sorted descending.

## API Endpoints (Backend)

- `GET /health`
  - Returns service health status.
  - Response: `{ "status": "ok" }`

- `POST /new-game`
  - Resets game engine, starts first hand, and returns full initial state.
  - Includes score, game status, hand, tiles, deck counts, and history.

- `GET /hand`
  - Returns current hand/game state snapshot.
  - Returns `404` when no active hand exists yet.

- `POST /bet/{choice}`
  - Resolves one round using `choice` = `higher` or `lower`.
  - Returns updated score/status, round result, history, and next hand.
  - Returns `400` for invalid choice or invalid engine state.

- `GET /leaderboard`
  - Returns top scores from in-memory leaderboard store.

## Core Frontend Files

- `frontend/src/app/layout.tsx`
  - Global layout wrapper and font configuration.

- `frontend/src/app/page.tsx`
  - Landing route; renders `PremiumLandingPage`.

- `frontend/src/app/game/page.tsx`
  - Game route; renders `GameDashboard`.

- `frontend/src/components/landing/PremiumLandingPage.tsx`
  - Landing UI and leaderboard preview.
  - Calls leaderboard API on mount.

- `frontend/src/components/game/GameDashboard.tsx`
  - Main interactive game screen.
  - Displays tiles, score, deck counters, history, leaderboard, and game-over state.
  - Triggers new game + place bet actions through store.

- `frontend/src/components/game/TileCard.tsx`
  - Shared tile visual component with color/palette logic and animations.

- `frontend/src/store/gameStore.ts`
  - Zustand store for app state.
  - Calls backend APIs, normalizes history payload, and tracks loading/error flags.

- `frontend/src/services/api.ts`
  - Typed API client wrappers around backend endpoints.
  - Centralized request function with error handling.

- `frontend/src/domain/game/state.ts`
  - Frontend-only functional game-state model utilities (not API-driven runtime source of truth).

- `frontend/src/domain/tiles/*`
  - Tile types, tile-set creation, and deck helper functions for domain modeling.

## Runtime Notes for Leadership

- Current leaderboard and game session are in-memory; server restart clears data.
- Backend exposes local CORS for `localhost` and `127.0.0.1` on ports `3000` and `3001`.
- Game-over reasons are machine-readable strings used directly by frontend labels.

## Practical Source Inventory (All Files)

This section lists every current source file under `backend/app` and `frontend/src` with its purpose.

### Backend (`backend/app`)

- `backend/app/__init__.py`
  - Package marker for backend app module.

- `backend/app/main.py`
  - FastAPI app bootstrap, CORS setup, `/health` endpoint, and router inclusion.

- `backend/app/hand_betting_engine.py`
  - Core gameplay state machine (start hand, place bet, resolve hand, scoring, game-over logic).

- `backend/app/api/__init__.py`
  - Exports API router for app registration.

- `backend/app/api/game_routes.py`
  - All HTTP game endpoints and response serialization helpers.

- `backend/app/leaderboard/__init__.py`
  - Exports leaderboard service interfaces/implementations.

- `backend/app/leaderboard/service.py`
  - In-memory leaderboard storage and top-score retrieval logic.

- `backend/app/tiles/__init__.py`
  - Exports tile models, factory, and deck services.

- `backend/app/tiles/models.py`
  - Immutable tile entity (`id`, `type`, `value`, `label`) and tile type definition.

- `backend/app/tiles/factory.py`
  - Tile creation logic for number/wind/dragon and compact/full deck assembly.

- `backend/app/tiles/deck_service.py`
  - Draw/discard/reshuffle deck lifecycle with max reshuffle limit enforcement.

### Frontend (`frontend/src`)

- `frontend/src/app/layout.tsx`
  - Global Next.js layout, metadata, and font setup.

- `frontend/src/app/page.tsx`
  - Root route that renders the landing page component.

- `frontend/src/app/game/page.tsx`
  - Game route container that renders the gameplay dashboard.

- `frontend/src/components/index.ts`
  - Barrel export for shared UI components.

- `frontend/src/components/landing/PremiumLandingPage.tsx`
  - Landing experience and leaderboard preview fetch/render.

- `frontend/src/components/game/GameDashboard.tsx`
  - Main game UI: score/status/cards/history/leaderboard/actions.

- `frontend/src/components/game/TileCard.tsx`
  - Reusable animated tile visual component with palette selection.

- `frontend/src/services/api.ts`
  - Typed frontend API client for backend endpoints and response contracts.

- `frontend/src/store/gameStore.ts`
  - Zustand state store orchestrating API calls and UI state transitions.

- `frontend/src/domain/game/index.ts`
  - Barrel export for frontend game domain functions/types.

- `frontend/src/domain/game/state.ts`
  - Pure frontend game-state transition helpers (domain utilities).

- `frontend/src/domain/tiles/index.ts`
  - Barrel export for tile types/factory/deck helpers.

- `frontend/src/domain/tiles/types.ts`
  - Frontend tile type system definitions (number/wind/dragon tile shapes).

- `frontend/src/domain/tiles/factory.ts`
  - Frontend tile-set generator and tile-count utility helpers.

- `frontend/src/domain/tiles/deck.ts`
  - Frontend immutable deck operations (shuffle, draw, discard, reshuffle).
