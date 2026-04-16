"""API router exports for backend route registration."""

from .game_routes import router as game_router

__all__ = ["game_router"]
