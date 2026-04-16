"""Leaderboard entities and service layer backed by pluggable storage."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Protocol


@dataclass(frozen=True, slots=True)
class ScoreEntry:
    """One persisted score record with creation timestamp."""

    score: int
    created_at: str


class LeaderboardStore(Protocol):
    """Storage contract for leaderboard persistence operations."""

    def save_score(self, entry: ScoreEntry) -> None:
        """Persist one score entry."""
        ...

    def load_scores(self) -> list[ScoreEntry]:
        """Return all persisted score entries."""
        ...


class InMemoryLeaderboardStore:
    """Process-local leaderboard store used by default."""

    def __init__(self) -> None:
        """Initialize empty in-memory score storage."""
        self._entries: list[ScoreEntry] = []

    def save_score(self, entry: ScoreEntry) -> None:
        """Persist a score entry in memory."""
        self._entries.append(entry)

    def load_scores(self) -> list[ScoreEntry]:
        """Return all stored scores."""
        return list(self._entries)


class LeaderboardService:
    """Add and retrieve ranked scores with a configurable top-N cap."""

    def __init__(self, store: LeaderboardStore | None = None, max_entries: int = 5) -> None:
        """Bind persistence backend and maximum leaderboard size."""
        self._store = store or InMemoryLeaderboardStore()
        self._max_entries = max_entries

    def add_score(self, score: int) -> None:
        """Store a new score with current UTC timestamp."""
        self._store.save_score(
            ScoreEntry(
                score=score,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
        )

    def get_top_scores(self) -> list[ScoreEntry]:
        """Return scores sorted descending and trimmed to max entries."""
        scores = self._store.load_scores()
        scores.sort(key=lambda entry: entry.score, reverse=True)
        return scores[: self._max_entries]
