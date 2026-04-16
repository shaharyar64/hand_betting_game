"""Factories for building number, wind, and dragon tile collections."""

from __future__ import annotations

from dataclasses import dataclass

from .models import Tile

WIND_VALUE = 5
DRAGON_VALUE = 5
DEFAULT_COPIES_PER_TILE = 4


@dataclass(frozen=True, slots=True)
class TileFactoryConfig:
    """Configuration for tile labels, counts, values, and deck size target."""

    number_range: range = range(1, 10)
    wind_labels: tuple[str, ...] = ("E", "W", "N", "S")
    dragon_labels: tuple[str, ...] = ("Red", "Green", "White")
    copies_per_number: int = DEFAULT_COPIES_PER_TILE
    copies_per_wind: int = DEFAULT_COPIES_PER_TILE
    copies_per_dragon: int = DEFAULT_COPIES_PER_TILE
    wind_value: int = WIND_VALUE
    dragon_value: int = DRAGON_VALUE
    target_deck_size: int | None = 20


class TileFactory:
    """Create individual tiles and full/compact tile sets."""

    def __init__(self, config: TileFactoryConfig | None = None) -> None:
        """Initialize tile factory with provided or default configuration."""
        self.config = config or TileFactoryConfig()

    def create_number_tile(self, face_value: int) -> Tile:
        """Create one number tile for the provided face value."""
        return Tile(type="number", value=face_value, label=str(face_value))

    def create_wind_tile(self, direction: str) -> Tile:
        """Create one wind tile for the provided direction label."""
        return Tile(type="wind", value=self.config.wind_value, label=direction)

    def create_dragon_tile(self, color: str) -> Tile:
        """Create one dragon tile for the provided color label."""
        return Tile(type="dragon", value=self.config.dragon_value, label=color)

    def create_full_set(self) -> list[Tile]:
        """Create the configured tile set, compact or full variant."""
        if self.config.target_deck_size is not None:
            return self._create_compact_set(self.config.target_deck_size)

        tiles: list[Tile] = []
        tiles.extend(self._create_number_tiles())
        tiles.extend(self._create_wind_tiles())
        tiles.extend(self._create_dragon_tiles())
        return tiles

    def _create_compact_set(self, target_size: int) -> list[Tile]:
        """Build a trimmed deck while retaining all tile categories."""
        if target_size <= 0:
            return []

        tiles: list[Tile] = []

        # Keep all categories present for gameplay/demo fidelity.
        for number in self.config.number_range:
            tiles.append(self.create_number_tile(number))
        for label in self.config.wind_labels:
            tiles.append(self.create_wind_tile(label))
        for label in self.config.dragon_labels:
            tiles.append(self.create_dragon_tile(label))

        if len(tiles) >= target_size:
            return tiles[:target_size]

        number_values = list(self.config.number_range)
        fill_index = 0
        while len(tiles) < target_size and number_values:
            value = number_values[fill_index % len(number_values)]
            tiles.append(self.create_number_tile(value))
            fill_index += 1

        return tiles

    def _create_number_tiles(self) -> list[Tile]:
        """Create all configured copies of number tiles."""
        tiles: list[Tile] = []
        for number in self.config.number_range:
            for _ in range(self.config.copies_per_number):
                tiles.append(self.create_number_tile(number))
        return tiles

    def _create_wind_tiles(self) -> list[Tile]:
        """Create all configured copies of wind tiles."""
        tiles: list[Tile] = []
        for label in self.config.wind_labels:
            for _ in range(self.config.copies_per_wind):
                tiles.append(self.create_wind_tile(label))
        return tiles

    def _create_dragon_tiles(self) -> list[Tile]:
        """Create all configured copies of dragon tiles."""
        tiles: list[Tile] = []
        for label in self.config.dragon_labels:
            for _ in range(self.config.copies_per_dragon):
                tiles.append(self.create_dragon_tile(label))
        return tiles

