from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal
from uuid import UUID, uuid4

TileType = Literal["number", "wind", "dragon"]


@dataclass(frozen=True, slots=True)
class Tile:
    id: UUID = field(default_factory=uuid4)
    type: TileType = "number"
    value: int = 0
    label: str = ""
