from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal
from uuid import UUID

from .tiles import DeckManagementService, Tile

BetChoice = Literal["higher", "lower"]
RoundOutcome = Literal["win", "lose"]
GameStatus = Literal["idle", "awaiting_bet", "resolved", "game_over"]

WIN_POINTS = 10
LOSE_POINTS = -5
SCALING_STEP = 1
SCALING_MIN = 0
SCALING_MAX = 10
MAX_RESHUFFLES = 3


@dataclass(slots=True)
class CurrentHand:
    anchor_tile: Tile
    active_tile: Tile


@dataclass(slots=True)
class TileSnapshot:
    id: UUID
    type: str
    label: str
    value: int


@dataclass(slots=True)
class HandHistoryEntry:
    anchor_tile_id: UUID
    active_tile_id: UUID
    drawn_tile_id: UUID
    anchor_tile: TileSnapshot
    active_tile: TileSnapshot
    drawn_tile: TileSnapshot
    bet: BetChoice
    previous_total: int
    next_total: int
    outcome: RoundOutcome
    score_delta: int
    score_after_round: int


@dataclass(slots=True)
class GameState:
    current_hand: CurrentHand | None = None
    history: list[HandHistoryEntry] = field(default_factory=list)
    score: int = 0
    bet: BetChoice | None = None
    game_status: GameStatus = "idle"
    game_over_reason: str | None = None


class HandBettingGameEngine:
    """
    State-machine style engine for hand betting gameplay.

    Round flow:
    1) start_hand() draws 2 tiles
    2) place_bet("higher" | "lower")
    3) resolve_hand() draws 1 tile and compares totals
    """

    def __init__(
        self,
        deck_service: DeckManagementService | None = None,
        initial_score: int = 0,
    ) -> None:
        self.deck_service = deck_service or DeckManagementService()
        self.state = GameState(score=initial_score)
        # Dynamic value overrides (mainly for non-number tiles).
        self._dynamic_values: dict[UUID, int] = {}

    def start_hand(self) -> GameState:
        self._ensure_not_game_over()
        if self.state.current_hand is not None and self.state.game_status == "awaiting_bet":
            return self.state

        first_tile = self._draw_tile_or_end_game()
        second_tile = self._draw_tile_or_end_game()
        if first_tile is None or second_tile is None:
            return self.state

        self.state.current_hand = CurrentHand(anchor_tile=first_tile, active_tile=second_tile)
        self.state.bet = None
        self.state.game_status = "awaiting_bet"
        return self.state

    def place_bet(self, bet: BetChoice) -> GameState:
        self._ensure_not_game_over()
        if self.state.current_hand is None:
            raise RuntimeError("No active hand. Call start_hand() first.")
        if self.state.game_status != "awaiting_bet":
            raise RuntimeError("Game is not ready for betting.")
        self.state.bet = bet
        return self.state

    def resolve_hand(self) -> GameState:
        self._ensure_not_game_over()
        if self.state.current_hand is None:
            raise RuntimeError("No active hand. Call start_hand() first.")
        if self.state.bet is None:
            raise RuntimeError("No bet placed. Call place_bet() first.")

        anchor = self.state.current_hand.anchor_tile
        active = self.state.current_hand.active_tile
        drawn = self._draw_tile_or_end_game()
        if drawn is None:
            return self.state

        previous_total = self._tile_value(anchor) + self._tile_value(active)
        next_total = self._tile_value(active) + self._tile_value(drawn)

        won = (self.state.bet == "higher" and next_total > previous_total) or (
            self.state.bet == "lower" and next_total < previous_total
        )
        outcome: RoundOutcome = "win" if won else "lose"
        score_delta = WIN_POINTS if won else LOSE_POINTS
        self.state.score += score_delta

        self._apply_dynamic_scaling([anchor, active, drawn], outcome)
        self.deck_service.discard_tile(anchor)

        self.state.history.append(
            HandHistoryEntry(
                anchor_tile_id=anchor.id,
                active_tile_id=active.id,
                drawn_tile_id=drawn.id,
                anchor_tile=TileSnapshot(
                    id=anchor.id,
                    type=anchor.type,
                    label=anchor.label,
                    value=self._tile_value(anchor),
                ),
                active_tile=TileSnapshot(
                    id=active.id,
                    type=active.type,
                    label=active.label,
                    value=self._tile_value(active),
                ),
                drawn_tile=TileSnapshot(
                    id=drawn.id,
                    type=drawn.type,
                    label=drawn.label,
                    value=self._tile_value(drawn),
                ),
                bet=self.state.bet,
                previous_total=previous_total,
                next_total=next_total,
                outcome=outcome,
                score_delta=score_delta,
                score_after_round=self.state.score,
            )
        )

        self.state.current_hand = CurrentHand(anchor_tile=active, active_tile=drawn)
        self.state.bet = None
        self.state.game_status = "resolved"

        if self._is_game_over():
            self._set_game_over("terminal_tile_or_reshuffle_limit")
            return self.state

        self.state.game_status = "awaiting_bet"
        return self.state

    def _draw_tile_or_end_game(self) -> Tile | None:
        try:
            tile = self.deck_service.draw_tile()
        except RuntimeError:
            self._set_game_over("draw_unavailable_or_max_reshuffles")
            return None

        # Capture baseline values once to support dynamic scaling by tile id.
        self._dynamic_values.setdefault(tile.id, tile.value)
        return tile

    def _tile_value(self, tile: Tile) -> int:
        return self._dynamic_values.get(tile.id, tile.value)

    def _apply_dynamic_scaling(self, tiles: list[Tile], outcome: RoundOutcome) -> None:
        delta = SCALING_STEP if outcome == "win" else -SCALING_STEP
        for tile in tiles:
            if tile.type == "number":
                continue
            current = self._dynamic_values.get(tile.id, tile.value)
            self._dynamic_values[tile.id] = max(SCALING_MIN, min(SCALING_MAX, current + delta))

    def _is_game_over(self) -> bool:
        has_terminal_tile = any(
            value <= SCALING_MIN or value >= SCALING_MAX for value in self._dynamic_values.values()
        )
        reshuffle_limit_reached = self.deck_service.reshuffle_count >= MAX_RESHUFFLES
        return has_terminal_tile or reshuffle_limit_reached

    def _set_game_over(self, reason: str) -> None:
        self.state.game_status = "game_over"
        self.state.game_over_reason = reason

    def _ensure_not_game_over(self) -> None:
        if self.state.game_status == "game_over":
            raise RuntimeError("Game is over. Create a new engine instance for a new game.")

    @property
    def draw_pile_count(self) -> int:
        return len(self.deck_service.draw_pile)

    @property
    def discard_pile_count(self) -> int:
        return len(self.deck_service.discard_pile)

    @property
    def reshuffle_count(self) -> int:
        return self.deck_service.reshuffle_count
