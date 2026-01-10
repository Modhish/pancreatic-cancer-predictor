"""API controllers grouped by route domain for clarity."""

from flask import Blueprint

# Single API blueprint shared by all route modules
api_bp = Blueprint("api", __name__, url_prefix="/api")


def register_routes(app):
    """Register blueprints and error handlers on the Flask app."""
    # Import routes so decorators run and attach to the shared blueprint
    from . import batch, commentary, prediction, reporting, system  # noqa: F401
    from .errors import register_error_handlers

    app.register_blueprint(api_bp)
    register_error_handlers(app)

    # Backwards-compatible aliases for legacy, non-prefixed paths
    app.add_url_rule("/health", view_func=system.health)
    app.add_url_rule("/status", view_func=system.system_status)
    app.add_url_rule("/model", view_func=system.model_info)


__all__ = ["api_bp", "register_routes"]
