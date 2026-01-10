from __future__ import annotations

from datetime import datetime

from flask import current_app, jsonify, request

from core.settings import logger, rate_limit
from core.security import audit_event, current_role, get_request_id, require_role
from services import run_diagnostic_pipeline

from . import api_bp


@api_bp.route("/predict", methods=["POST"])
@rate_limit("10/minute")
@require_role(["clinician", "researcher", "admin"])
def predict():
    """Pancreatic cancer prediction endpoint."""
    start_time = datetime.now()
    request_id = get_request_id()
    try:
        if not request.json:
            audit_event(
                "predict",
                current_role(),
                status="validation_error",
                detail="missing_json",
                http_status=400,
                request_id=request_id,
            )
            return (
                jsonify({"error": "No JSON data provided", "status": "validation_error"}),
                400,
            )

        data = request.json
        logger.info("Processing prediction request for patient data")

        analysis, error_payload, status_code = run_diagnostic_pipeline(data)
        if status_code != 200:
            audit_event(
                "predict",
                current_role(),
                status="validation_error",
                detail=(error_payload or {}).get("error", "validation_error"),
                http_status=status_code,
                request_id=request_id,
            )
            return jsonify(error_payload), status_code

        processing_time = (datetime.now() - start_time).total_seconds()
        response = {
            **analysis,
            "processing_time": f"{processing_time:.3f}s",
            "timestamp": datetime.now().isoformat(),
            "status": "success",
        }

        logger.info("Prediction completed: Risk Level %s", response["risk_level"])
        audit_event(
            "predict",
            current_role(),
            status="success",
            detail=f"risk={response.get('risk_level')}",
            http_status=200,
            request_id=request_id,
            extra={
                "probability": round(float(response.get("probability", 0)), 4),
                "processing_time": response.get("processing_time"),
            },
        )
        return jsonify(response)
    except Exception as exc:  # pragma: no cover
        logger.error("Prediction error: %s", exc)
        audit_event(
            "predict",
            current_role(),
            status="error",
            detail=str(exc),
            http_status=500,
            request_id=request_id,
        )
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
