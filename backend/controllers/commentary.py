from __future__ import annotations

import traceback
from typing import Any, Dict

from flask import current_app, jsonify, request

from core.constants import rebuild_feature_vector
from core.settings import logger, rate_limit
from core.security import audit_event, current_role, get_request_id, require_role
from services import diagnostic_system
from utils.text import encode_text_base64, repair_text_encoding

from . import api_bp


@api_bp.route("/commentary", methods=["POST"])
@rate_limit("30/minute")
@require_role(["clinician", "researcher", "admin"])
def regenerate_commentary():
    """Regenerate AI commentary in a requested language using existing context."""
    request_id = get_request_id()
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        audit_event(
            "commentary",
            current_role(),
            status="validation_error",
            detail="invalid_payload",
            http_status=400,
            request_id=request_id,
        )
        return jsonify({"error": "Invalid payload", "status": "validation_error"}), 400

    analysis_payload = payload.get("analysis") if isinstance(payload.get("analysis"), dict) else {}
    merged: Dict[str, Any] = {}
    if isinstance(analysis_payload, dict):
        merged.update(analysis_payload)
    merged.update({k: v for k, v in payload.items() if k != "analysis"})

    shap_values = merged.get("shap_values") or merged.get("shapValues") or []
    if not isinstance(shap_values, list):
        shap_values = []

    patient_values = merged.get("patient_values") or merged.get("patientValues")
    if patient_values is None and isinstance(merged.get("patient"), dict):
        patient_values = merged.get("patient")

    feature_vector = merged.get("features") or merged.get("feature_vector")

    if patient_values is None and not isinstance(feature_vector, list):
        audit_event(
            "commentary",
            current_role(),
            status="validation_error",
            detail="missing_patient_values",
            http_status=400,
            request_id=request_id,
        )
        return (
            jsonify(
                {
                    "error": "Patient values are required to regenerate commentary",
                    "status": "validation_error",
                }
            ),
            400,
        )

    if isinstance(feature_vector, list) and feature_vector:
        try:
            features = [float(value) for value in feature_vector]
        except (TypeError, ValueError):
            features = rebuild_feature_vector(patient_values if isinstance(patient_values, dict) else None)
    else:
        features = rebuild_feature_vector(patient_values if isinstance(patient_values, dict) else None)

    try:
        probability = float(merged.get("probability", 0.0))
    except (TypeError, ValueError):
        probability = 0.0

    prediction_raw = merged.get("prediction")
    if prediction_raw is None:
        prediction = 1 if probability > 0.5 else 0
    else:
        try:
            prediction = int(prediction_raw)
        except (TypeError, ValueError):
            prediction = 1 if probability > 0.5 else 0

    language = str(merged.get("language") or payload.get("language") or "en").lower()
    client_type = str(
        merged.get("client_type")
        or merged.get("clientType")
        or payload.get("client_type")
        or "patient"
    ).lower()

    try:
        commentary = diagnostic_system.generate_clinical_commentary(
            prediction,
            probability,
            shap_values,
            features,
            language=language,
            client_type=client_type,
        )
        if not str(language).lower().startswith("ru"):
            commentary = repair_text_encoding(commentary)
        try:
            audience_commentaries = diagnostic_system.build_audience_commentaries(
                prediction,
                probability,
                shap_values,
                features,
                language,
                client_type,
                commentary,
            )
        except Exception:
            audience_commentaries = {client_type: commentary}
        risk_level = "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
        audit_event(
            "commentary",
            current_role(),
            status="success",
            detail=f"risk={risk_level}",
            http_status=200,
            request_id=request_id,
            extra={
                "language": language,
                "client_type": client_type,
                "prediction": int(prediction),
            },
        )
        return jsonify(
            {
                "ai_explanation": commentary,
                "ai_explanation_b64": encode_text_base64(commentary),
                "language": language,
                "risk_level": risk_level,
                "prediction": int(prediction),
                "probability": float(probability),
                "audience_commentaries": audience_commentaries,
            }
        )
    except Exception as exc:  # pragma: no cover
        logger.error("Commentary regeneration error: %s", exc)
        logger.error(traceback.format_exc())
        audit_event(
            "commentary",
            current_role(),
            status="error",
            detail=str(exc),
            http_status=500,
            request_id=request_id,
        )
        return (
            jsonify(
                {
                    "error": "Failed to regenerate commentary",
                    "details": str(exc) if current_app.debug else "Unexpected error",
                    "status": "error",
                }
            ),
            500,
        )
