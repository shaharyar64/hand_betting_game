from __future__ import annotations

import random
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

Choice = Literal["high", "low"]
Outcome = Literal["win", "loss"]

WIN_POINTS = 10
LOSS_POINTS = -5
MAX_HANDS = 20


@dataclass
class Hand:
    number: int
    card: int
    started_at: str


@dataclass
class HandHistoryEntry:
    hand_number: int
    card: int
    choice: Choice
    outcome: Outcome
    score_delta: int
    score_after_hand: int
    resolved_at: str


@dataclass
class GameState:
    game_id: str
    score: int
    hand: Hand | None = None
    history: list[HandHistoryEntry] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: _utc_now_iso())
    game_over: bool = False
    game_over_reason: str | None = None


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _draw_card() -> int:
    return random.randint(1, 13)


def _resolve_outcome(choice: Choice, card: int) -> Outcome:
    # 7 is neutral; this keeps the game moving and slightly favors risk.
    if card == 7:
        return "loss"
    if choice == "high":
        return "win" if card > 7 else "loss"
    return "win" if card < 7 else "loss"


class GameEngine:
    def __init__(self) -> None:
        self._active_game: GameState | None = None
        self._leaderboard: list[dict[str, str | int]] = []

    def new_game(self, starting_score: int = 100) -> GameState:
        game = GameState(game_id=str(uuid.uuid4()), score=starting_score)
        game.hand = Hand(number=1, card=_draw_card(), started_at=_utc_now_iso())
        self._active_game = game
        return game

    def get_hand(self) -> dict[str, str | int | bool | None]:
        if not self._active_game:
            return {"has_game": False}

        return {
            "has_game": True,
            "game_id": self._active_game.game_id,
            "score": self._active_game.score,
            "game_over": self._active_game.game_over,
            "game_over_reason": self._active_game.game_over_reason,
            "hand": None
            if not self._active_game.hand
            else {
                "number": self._active_game.hand.number,
                "card": self._active_game.hand.card,
                "choices": ["high", "low"],
            },
        }

    def place_bet(self, choice: Choice) -> dict[str, str | int | bool | dict | None]:
        if not self._active_game:
            raise ValueError("No active game. Start a new game first.")
        if self._active_game.game_over:
            raise ValueError("Game is over. Start a new game to continue.")
        if not self._active_game.hand:
            raise ValueError("No active hand to resolve.")

        hand = self._active_game.hand
        outcome = _resolve_outcome(choice, hand.card)
        score_delta = WIN_POINTS if outcome == "win" else LOSS_POINTS
        self._active_game.score += score_delta

        self._active_game.history.append(
            HandHistoryEntry(
                hand_number=hand.number,
                card=hand.card,
                choice=choice,
                outcome=outcome,
                score_delta=score_delta,
                score_after_hand=self._active_game.score,
                resolved_at=_utc_now_iso(),
            )
        )

        if self._active_game.score <= 0:
            self._active_game.game_over = True
            self._active_game.game_over_reason = "score_depleted"
        elif len(self._active_game.history) >= MAX_HANDS:
            self._active_game.game_over = True
            self._active_game.game_over_reason = "max_hands_reached"

        next_hand: dict[str, int] | None = None
        if not self._active_game.game_over:
            self._active_game.hand = Hand(
                number=hand.number + 1, card=_draw_card(), started_at=_utc_now_iso()
            )
            next_hand = {
                "number": self._active_game.hand.number,
                "card": self._active_game.hand.card,
            }
        else:
            self._active_game.hand = None
            self._leaderboard.append(
                {
                    "game_id": self._active_game.game_id,
                    "score": self._active_game.score,
                    "played_at": _utc_now_iso(),
                    "hands_played": len(self._active_game.history),
                }
            )
            self._leaderboard = sorted(
                self._leaderboard, key=lambda item: int(item["score"]), reverse=True
            )[:10]

        return {
            "game_id": self._active_game.game_id,
            "choice": choice,
            "card": hand.card,
            "outcome": outcome,
            "score_delta": score_delta,
            "score": self._active_game.score,
            "game_over": self._active_game.game_over,
            "game_over_reason": self._active_game.game_over_reason,
            "next_hand": next_hand,
        }

    def leaderboard(self) -> list[dict[str, str | int]]:
        return self._leaderboard
