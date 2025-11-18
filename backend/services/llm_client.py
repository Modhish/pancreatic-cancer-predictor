"""Shared initialization for the external Groq client."""

from __future__ import annotations

import os

from groq import Groq

from core.settings import logger


def _init_client() -> Groq | None:
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        logger.info("AI client initialized successfully")
        return client
    except Exception as exc:  # pragma: no cover
        logger.warning("AI client initialization failed: %s", exc)
        return None


groq_client = _init_client()

__all__ = ["groq_client"]
