"""HTTP endpoints and payload serializers for the game session."""

from __future__ import annotations

from dataclasses import asdict
from typing import cast
from fastapi import APIRouter, HTTPException

from ..hand_betting_engine import BetChoice, HandBettingGameEngine, HandHistoryEntry, Tile
from ..leaderboard import LeaderboardService

router = APIRouter(prefix="", tags=["game"])


class GameSessionStore:
    """Keep a single in-memory game engine and leaderboard for API calls."""

    def __init__(self) -> None:
        """Initialize game engine and leaderboard state for the process."""
        self.engine = HandBettingGameEngine()
        self.leaderboard = LeaderboardService(max_entries=5)

    def reset(self) -> HandBettingGameEngine:
        """Recreate engine state and start the first hand."""
        self.engine = HandBettingGameEngine()
        self.engine.start_hand()
        return self.engine

    def add_result(self, score: int) -> None:
        """Store a completed game's final score."""
        self.leaderboard.add_score(score)


store = GameSessionStore()


def _current_hand_payload(engine: HandBettingGameEngine) -> dict[str, int | str | None]:
    """Serialize the active hand labels and values for API responses."""
    hand = engine.state.current_hand
    if hand is None:
        return {"anchor_label": None, "anchor_value": None, "active_label": None, "active_value": None}

    return {
        "anchor_label": hand.anchor_tile.label,
        "anchor_value": hand.anchor_tile.value,
        "active_label": hand.active_tile.label,
        "active_value": hand.active_tile.value,
    }


def _serialize_tile(tile: Tile) -> dict[str, str | int]:
    """Serialize a tile into a JSON-safe dictionary."""
    return {
        "id": str(tile.id),
        "type": tile.type,
        "value": tile.value,
        "label": tile.label,
    }


def _current_hand_tiles(engine: HandBettingGameEngine) -> list[dict[str, str | int]]:
    """Return serialized anchor/active tiles for the current hand."""
    hand = engine.state.current_hand
    if hand is None:
        return []
    return [_serialize_tile(hand.anchor_tile), _serialize_tile(hand.active_tile)]


def _serialize_history_entry(entry: HandHistoryEntry) -> dict[str, object]:
    """Serialize one resolved hand entry with tile snapshots and scoring."""
    return {
        "bet": entry.bet,
        "previous_total": entry.previous_total,
        "next_total": entry.next_total,
        "outcome": entry.outcome,
        "score_delta": entry.score_delta,
        "score_after_round": entry.score_after_round,
        "tiles": {
            "anchor": {
                "id": str(entry.anchor_tile.id),
                "type": entry.anchor_tile.type,
                "label": entry.anchor_tile.label,
                "value": entry.anchor_tile.value,
            },
            "active": {
                "id": str(entry.active_tile.id),
                "type": entry.active_tile.type,
                "label": entry.active_tile.label,
                "value": entry.active_tile.value,
            },
            "drawn": {
                "id": str(entry.drawn_tile.id),
                "type": entry.drawn_tile.type,
                "label": entry.drawn_tile.label,
                "value": entry.drawn_tile.value,
            },
        },
    }


def _deck_payload(engine: HandBettingGameEngine) -> dict[str, int]:
    """Expose draw/discard counts and reshuffle usage."""
    return {
        "draw_pile_count": engine.draw_pile_count,
        "discard_pile_count": engine.discard_pile_count,
        "reshuffle_count": engine.reshuffle_count,
    }


def _game_state_payload(engine: HandBettingGameEngine) -> dict[str, object]:
    """Build the full game payload used by state-returning endpoints."""
    return {
        "score": engine.state.score,
        "game_status": engine.state.game_status,
        "game_over_reason": engine.state.game_over_reason,
        "hand": _current_hand_payload(engine),
        "tiles": _current_hand_tiles(engine),
        "deck": _deck_payload(engine),
        "history_count": len(engine.state.history),
        "history": [_serialize_history_entry(entry) for entry in reversed(engine.state.history)],
    }


@router.post("/new-game")
async def new_game() -> dict[str, object]:
    """Start a fresh game session and return initial state."""
    engine = store.reset()
    return {
        "ok": True,
        "message": "Game started",
        "data": _game_state_payload(engine),
    }


@router.get("/hand")
async def get_hand() -> dict[str, object]:
    """Return the current hand and cumulative game state."""
    if store.engine.state.current_hand is None:
        raise HTTPException(status_code=404, detail="No active hand. Start a game with POST /new-game.")

    return {
        "ok": True,
        "data": {
            "score": store.engine.state.score,
            "game_status": store.engine.state.game_status,
            "game_over_reason": store.engine.state.game_over_reason,
            "bet": store.engine.state.bet,
            "hand": _current_hand_payload(store.engine),
            "tiles": _current_hand_tiles(store.engine),
            "deck": _deck_payload(store.engine),
            "history_count": len(store.engine.state.history),
            "history": [
                _serialize_history_entry(entry) for entry in reversed(store.engine.state.history)
            ],
        },
    }


@router.post("/bet/{choice}")
async def place_bet(choice: str) -> dict[str, object]:
    """Resolve one betting round using the provided higher/lower choice."""
    normalized = choice.lower()
    if normalized not in {"higher", "lower"}:
        raise HTTPException(status_code=400, detail="Choice must be 'higher' or 'lower'.")

    try:
        store.engine.place_bet(cast(BetChoice, normalized))
        state = store.engine.resolve_hand()
    except RuntimeError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    last_round = state.history[-1] if state.history else None
    if state.game_status == "game_over":
        store.add_result(score=state.score)

    return {
        "ok": True,
        "data": {
            "score": state.score,
            "game_status": state.game_status,
            "game_over_reason": state.game_over_reason,
            "deck": _deck_payload(store.engine),
            "history_count": len(state.history),
            "result": None if last_round is None else last_round.outcome == "win",
            "last_round": None
            if last_round is None
            else _serialize_history_entry(last_round),
            "history": [_serialize_history_entry(entry) for entry in reversed(state.history)],
            "next_hand": _current_hand_payload(store.engine),
            "next_tiles": _current_hand_tiles(store.engine),
        },
    }


@router.get("/leaderboard")
async def get_leaderboard() -> dict[str, object]:
    """Return top leaderboard entries from in-memory storage."""
    return {
        "ok": True,
        "data": {
            "top": [asdict(item) for item in store.leaderboard.get_top_scores()],
        },
    }
