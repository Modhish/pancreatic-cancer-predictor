from __future__ import annotations

from datetime import datetime

from flask import current_app, jsonify, request

from core.settings import logger, rate_limit
from services import run_diagnostic_pipeline

from . import api_bp


@api_bp.route("/predict", methods=["POST"])
@rate_limit("10/minute")
def predict():
    """Pancreatic cancer prediction endpoint."""
    start_time = datetime.now()
    try:
        if not request.json:
            return (
                jsonify({"error": "No JSON data provided", "status": "validation_error"}),
                400,
            )

        data = request.json
        logger.info("Processing prediction request for patient data")

        analysis, error_payload, status_code = run_diagnostic_pipeline(data)
        if status_code != 200:
            return jsonify(error_payload), status_code

        processing_time = (datetime.now() - start_time).total_seconds()
        response = {
            **analysis,
            "processing_time": f"{processing_time:.3f}s",
            "timestamp": datetime.now().isoformat(),
            "status": "success",
        }

        logger.info("Prediction completed: Risk Level %s", response["risk_level"])
        return jsonify(response)
    except Exception as exc:  # pragma: no cover
        logger.error("Prediction error: %s", exc)
        return (
            jsonify(
                {
                    "error": "Internal server error during prediction",
                    "details": str(exc) if current_app and current_app.debug else "An unexpected error occurred",
                    "status": "error",
                    "timestamp": datetime.now().isoformat(),
                }
            ),
            500,
        )
