from __future__ import annotations

from datetime import datetime

from flask import current_app, jsonify, request

from core.settings import logger, rate_limit
from core.security import audit_event, current_role, get_request_id
from services.auth import get_authenticated_user, require_auth
from services.database import normalize_user_role, save_analysis
from services import run_diagnostic_pipeline

from . import api_bp


@api_bp.route("/predict", methods=["POST"])
@rate_limit("10/minute")
@require_auth(["patient", "doctor", "researcher", "admin"])
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

        user = get_authenticated_user()
        if user is None:
            return jsonify({"error": "authentication_required", "status": "unauthorized"}), 401

        role = normalize_user_role(user.get("role"))
        data = dict(request.json)
        data["client_type"] = role
        logger.info("Processing prediction request for patient data")

        patient_name = str(data.get("patient_name") or "").strip()
        if role == "doctor" and not patient_name:
            return (
                jsonify(
                    {
                        "error": "Patient name is required for doctor analyses",
                        "status": "validation_error",
                    }
                ),
                400,
            )

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

        saved_analysis = save_analysis(
            analyst_user=user,
            analysis=analysis,
            patient_name=patient_name if role != "patient" else str(user.get("full_name") or "").strip(),
        )
        processing_time = (datetime.now() - start_time).total_seconds()
        response = {
            **analysis,
            "analysis_id": saved_analysis.get("id"),
            "patient_name": saved_analysis.get("patient_name"),
            "subject_label": saved_analysis.get("subject_label"),
            "signed_by": saved_analysis.get("signed_by"),
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
