from __future__ import annotations

from dataclasses import dataclass

from .models import Tile

WIND_VALUE = 5
DRAGON_VALUE = 5
DEFAULT_COPIES_PER_TILE = 4


@dataclass(frozen=True, slots=True)
class TileFactoryConfig:
    number_range: range = range(1, 10)
    wind_labels: tuple[str, ...] = ("E", "W", "N", "S")
    dragon_labels: tuple[str, ...] = ("Red", "Green", "White")
    copies_per_number: int = DEFAULT_COPIES_PER_TILE
    copies_per_wind: int = DEFAULT_COPIES_PER_TILE
    copies_per_dragon: int = DEFAULT_COPIES_PER_TILE
    wind_value: int = WIND_VALUE
    dragon_value: int = DRAGON_VALUE


class TileFactory:
    def __init__(self, config: TileFactoryConfig | None = None) -> None:
        self.config = config or TileFactoryConfig()

    def create_number_tile(self, face_value: int) -> Tile:
        return Tile(type="number", value=face_value, label=str(face_value))

    def create_wind_tile(self, direction: str) -> Tile:
        return Tile(type="wind", value=self.config.wind_value, label=direction)

    def create_dragon_tile(self, color: str) -> Tile:
        return Tile(type="dragon", value=self.config.dragon_value, label=color)

    def create_full_set(self) -> list[Tile]:
        tiles: list[Tile] = []
        tiles.extend(self._create_number_tiles())
        tiles.extend(self._create_wind_tiles())
        tiles.extend(self._create_dragon_tiles())
        return tiles

    def _create_number_tiles(self) -> list[Tile]:
        tiles: list[Tile] = []
        for number in self.config.number_range:
            for _ in range(self.config.copies_per_number):
                tiles.append(self.create_number_tile(number))
        return tiles

    def _create_wind_tiles(self) -> list[Tile]:
        tiles: list[Tile] = []
        for label in self.config.wind_labels:
            for _ in range(self.config.copies_per_wind):
                tiles.append(self.create_wind_tile(label))
        return tiles

    def _create_dragon_tiles(self) -> list[Tile]:
        tiles: list[Tile] = []
        for label in self.config.dragon_labels:
            for _ in range(self.config.copies_per_dragon):
                tiles.append(self.create_dragon_tile(label))
        return tiles

