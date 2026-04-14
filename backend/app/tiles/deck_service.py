from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Callable

from .factory import TileFactory
from .models import Tile

MAX_RESHUFFLE_COUNT = 3


@dataclass(slots=True)
class DeckState:
    draw_pile: list[Tile] = field(default_factory=list)
    discard_pile: list[Tile] = field(default_factory=list)
    reshuffle_count: int = 0


class DeckManagementService:
    """
    Deck management with explicit draw/discard piles and bounded reshuffles.

    The service is designed for scale by allowing factory and RNG injection.
    """

    def __init__(
        self,
        tile_factory: TileFactory | None = None,
        randomizer: random.Random | None = None,
        max_reshuffle_count: int = MAX_RESHUFFLE_COUNT,
    ) -> None:
        self._tile_factory = tile_factory or TileFactory()
        self._randomizer = randomizer or random.Random()
        self._max_reshuffle_count = max_reshuffle_count
        self._state = DeckState()
        self.create_deck()

    @property
    def draw_pile(self) -> list[Tile]:
        return self._state.draw_pile

    @property
    def discard_pile(self) -> list[Tile]:
        return self._state.discard_pile

    @property
    def reshuffle_count(self) -> int:
        return self._state.reshuffle_count

    def create_deck(self) -> list[Tile]:
        """Create a fresh deck and set it as draw pile."""
        self._state.draw_pile = self._tile_factory.create_full_set()
        return self._state.draw_pile

    def shuffle_deck(self) -> None:
        self._randomizer.shuffle(self._state.draw_pile)

    def draw_tile(self) -> Tile:
        """
        Draw one tile from draw pile.
        If draw pile is empty, attempt reshuffle flow first.
        """
        if not self._state.draw_pile:
            self.reshuffle()

        if not self._state.draw_pile:
            raise RuntimeError("No tiles available to draw.")

        # pop() prevents duplicate references between draw/discard piles.
        return self._state.draw_pile.pop()

    def discard_tile(self, tile: Tile) -> None:
        self._state.discard_pile.append(tile)

    def reshuffle(self) -> None:
        """
        Rebuild draw pile by combining:
        - a newly created full deck
        - all current discard tiles

        Then shuffle and clear discard pile.
        """
        if self._state.reshuffle_count >= self._max_reshuffle_count:
            raise RuntimeError(
                f"Max reshuffle limit reached ({self._max_reshuffle_count})."
            )

        new_deck = self._tile_factory.create_full_set()
        combined = [*new_deck, *self._state.discard_pile]

        self._state.draw_pile = combined
        self._state.discard_pile.clear()
        self._state.reshuffle_count += 1
        self.shuffle_deck()

    def force_reshuffle_limit_reached(self) -> None:
        """
        Test helper: force deck state into a terminal reshuffle condition.
        """
        self._state.reshuffle_count = self._max_reshuffle_count
        self._state.draw_pile.clear()

