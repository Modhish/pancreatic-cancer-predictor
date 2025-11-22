# -*- coding: utf-8 -*-
"""
DiagnoAI Pancreas - modular Flask backend entry point.

This file now orchestrates the modularized backend, keeping the file itself
compact while configuration, core utilities, services, and controllers live in their
own modules for easier maintenance (~200 lines per module).
"""

from __future__ import annotations

import os

from core.settings import app, logger
from controllers import register_routes

register_routes(app)


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    logger.info("Starting DiagnoAI backend on %s:%s (debug=%s)", host, port, debug)
    app.run(host=host, port=port, debug=debug)
