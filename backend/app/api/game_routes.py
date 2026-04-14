from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import cast

from fastapi import APIRouter, HTTPException

from ..hand_betting_engine import BetChoice, HandBettingGameEngine

router = APIRouter(prefix="", tags=["game"])


@dataclass(slots=True)
class LeaderboardEntry:
    score: int
    rounds_played: int
    finished_at: str


class GameSessionStore:
    def __init__(self) -> None:
        self.engine = HandBettingGameEngine()
        self.leaderboard: list[LeaderboardEntry] = []
        self.max_leaderboard_size = 5

    def reset(self) -> HandBettingGameEngine:
        self.engine = HandBettingGameEngine()
        self.engine.start_hand()
        return self.engine

    def add_result(self, score: int, rounds_played: int) -> None:
        self.leaderboard.append(
            LeaderboardEntry(
                score=score,
                rounds_played=rounds_played,
                finished_at=datetime.now(timezone.utc).isoformat(),
            )
        )
        self.leaderboard.sort(key=lambda item: item.score, reverse=True)
        self.leaderboard = self.leaderboard[: self.max_leaderboard_size]


store = GameSessionStore()


def _current_hand_payload(engine: HandBettingGameEngine) -> dict[str, int | str | None]:
    hand = engine.state.current_hand
    if hand is None:
        return {"anchor_label": None, "anchor_value": None, "active_label": None, "active_value": None}

    return {
        "anchor_label": hand.anchor_tile.label,
        "anchor_value": hand.anchor_tile.value,
        "active_label": hand.active_tile.label,
        "active_value": hand.active_tile.value,
    }


@router.post("/new-game")
async def new_game() -> dict[str, object]:
    engine = store.reset()
    return {
        "ok": True,
        "message": "Game started",
        "data": {
            "score": engine.state.score,
            "game_status": engine.state.game_status,
            "hand": _current_hand_payload(engine),
            "history_count": len(engine.state.history),
        },
    }


@router.get("/hand")
async def get_hand() -> dict[str, object]:
    if store.engine.state.current_hand is None:
        raise HTTPException(status_code=404, detail="No active hand. Start a game with POST /new-game.")

    return {
        "ok": True,
        "data": {
            "score": store.engine.state.score,
            "game_status": store.engine.state.game_status,
            "bet": store.engine.state.bet,
            "hand": _current_hand_payload(store.engine),
            "history_count": len(store.engine.state.history),
        },
    }


@router.post("/bet/{choice}")
async def place_bet(choice: str) -> dict[str, object]:
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
        store.add_result(score=state.score, rounds_played=len(state.history))

    return {
        "ok": True,
        "data": {
            "score": state.score,
            "game_status": state.game_status,
            "game_over_reason": state.game_over_reason,
            "history_count": len(state.history),
            "last_round": None
            if last_round is None
            else {
                "bet": last_round.bet,
                "previous_total": last_round.previous_total,
                "next_total": last_round.next_total,
                "outcome": last_round.outcome,
                "score_delta": last_round.score_delta,
            },
            "next_hand": _current_hand_payload(store.engine),
        },
    }


@router.get("/leaderboard")
async def get_leaderboard() -> dict[str, object]:
    return {
        "ok": True,
        "data": {
            "top": [asdict(item) for item in store.leaderboard],
        },
    }
