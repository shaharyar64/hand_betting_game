from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Protocol


@dataclass(frozen=True, slots=True)
class ScoreEntry:
    score: int
    created_at: str


class LeaderboardStore(Protocol):
    def save_score(self, entry: ScoreEntry) -> None:
        ...

    def load_scores(self) -> list[ScoreEntry]:
        ...


class InMemoryLeaderboardStore:
    def __init__(self) -> None:
        self._entries: list[ScoreEntry] = []

    def save_score(self, entry: ScoreEntry) -> None:
        self._entries.append(entry)

    def load_scores(self) -> list[ScoreEntry]:
        return list(self._entries)


class LeaderboardService:
    def __init__(self, store: LeaderboardStore | None = None, max_entries: int = 5) -> None:
        self._store = store or InMemoryLeaderboardStore()
        self._max_entries = max_entries

    def add_score(self, score: int) -> None:
        self._store.save_score(
            ScoreEntry(
                score=score,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
        )

    def get_top_scores(self) -> list[ScoreEntry]:
        scores = self._store.load_scores()
        scores.sort(key=lambda entry: entry.score, reverse=True)
        return scores[: self._max_entries]
