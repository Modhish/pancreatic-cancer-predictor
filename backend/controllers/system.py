from __future__ import annotations

from datetime import datetime

from flask import jsonify

from core.constants import FEATURE_DEFAULTS, FEATURE_LABELS
from services import diagnostic_system, groq_client
from services.model_engine import FEATURE_NAMES, FEATURE_ORDER

from . import api_bp


@api_bp.route("/health", methods=["GET"])
def health():
    """Lightweight health check."""
    return jsonify(
        {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "model_loaded": diagnostic_system.model is not None,
            "ai_client_available": groq_client is not None,
        }
    )


@api_bp.route("/status", methods=["GET"])
def system_status():
    """System status with feature metadata for UIs."""
    feature_defaults = {key: default for key, default in FEATURE_DEFAULTS}
    return jsonify(
        {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "model_loaded": diagnostic_system.model is not None,
            "model_metrics": diagnostic_system.model_metrics,
            "ai_commentary": groq_client is not None,
            "features": {
                "order": FEATURE_ORDER,
                "names": FEATURE_NAMES,
                "defaults": feature_defaults,
                "labels": FEATURE_LABELS.get("en", {}),
            },
            "guidelines": diagnostic_system.guideline_snapshot(),
        }
    )


@api_bp.route("/model-info", methods=["GET"])
@api_bp.route("/model", methods=["GET"])  # legacy alias
def model_info():
    """Expose model metadata and metrics."""
    metrics = diagnostic_system.model_metrics
    return jsonify(
        {
            "model_name": "Random Forest Classifier v2.1.0",
            "model_loaded": diagnostic_system.model is not None,
            "feature_count": len(FEATURE_ORDER),
            "features": FEATURE_NAMES,
            "metrics": metrics,
            "guidelines": diagnostic_system.guideline_snapshot(),
        }
    )
