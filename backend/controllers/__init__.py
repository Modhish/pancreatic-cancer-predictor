"""Controller package exposing the API blueprint and registration helper."""

from .api import api_bp, register_routes

__all__ = ["api_bp", "register_routes"]
