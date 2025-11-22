from __future__ import annotations

import traceback
from datetime import datetime

from flask import jsonify

from core.settings import logger


def not_found(error):
    logger.warning("404 not found: %s", error)
    return (
        jsonify(
            {
                "error": "Endpoint not found",
                "status": "not_found",
                "timestamp": datetime.now().isoformat(),
            }
        ),
        404,
    )


def internal_error(error):
    logger.error("Internal server error: %s", error)
    logger.error(traceback.format_exc())
    return (
        jsonify(
            {
                "error": "Internal server error",
                "status": "error",
                "timestamp": datetime.now().isoformat(),
            }
        ),
        500,
    )


def register_error_handlers(app):
    """Attach global error handlers."""
    app.register_error_handler(404, not_found)
    app.register_error_handler(500, internal_error)
