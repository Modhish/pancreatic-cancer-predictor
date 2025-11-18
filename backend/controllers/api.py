from __future__ import annotations

import traceback
from datetime import datetime
from typing import Any, Dict

from flask import Blueprint, jsonify, request, send_file, current_app

from core.constants import rebuild_feature_vector
from core.settings import logger, rate_limit
from services import diagnostic_system, groq_client, run_diagnostic_pipeline
from utils.text import encode_text_base64, repair_text_encoding

api_bp = Blueprint("api", __name__)


@api_bp.route("/api/predict", methods=["POST"])
@rate_limit("10/minute")
def predict():
    """Professional pancreatic cancer prediction endpoint."""
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
        logger.error("Traceback: %s", traceback.format_exc())
        return (
            jsonify(
                {
                    "error": "Internal server error during prediction",
                    "details": str(exc) if current_app.debug else "An unexpected error occurred",
                    "status": "error",
                    "timestamp": datetime.now().isoformat(),
                }
            ),
            500,
        )


@api_bp.route("/api/commentary", methods=["POST"])
@rate_limit("30/minute")
def regenerate_commentary():
    """Regenerate AI commentary in a requested language using existing context."""
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
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
        risk_level = "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
        return jsonify(
            {
                "ai_explanation": commentary,
                "ai_explanation_b64": encode_text_base64(commentary),
                "language": language,
                "risk_level": risk_level,
                "prediction": int(prediction),
                "probability": float(probability),
            }
        )
    except Exception as exc:  # pragma: no cover
        logger.error("Commentary regeneration error: %s", exc)
        logger.error(traceback.format_exc())
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


@api_bp.route("/api/report", methods=["POST"])
@rate_limit("10/minute")
def download_report():
    """Generate a PDF report that summarizes the diagnostic results."""
    try:
        if not request.json:
            return jsonify({"error": "No JSON data provided", "status": "validation_error"}), 400

        payload = request.json
        patient_values = payload.get("patient_values") or payload.get("patientValues")
        analysis_data = payload.get("analysis")
        if not isinstance(patient_values, dict) or not isinstance(analysis_data, dict):
            return (
                jsonify(
                    {
                        "error": "Missing report context",
                        "status": "validation_error",
                        "details": "patient_values and analysis are required.",
                    }
                ),
                400,
            )

        if "ai_explanation" not in analysis_data and "aiExplanation" in payload:
            analysis_data["ai_explanation"] = payload["aiExplanation"]
        if "risk_level" not in analysis_data:
            try:
                prob = float(analysis_data.get("probability", 0))
            except (TypeError, ValueError):
                prob = 0.0
            analysis_data["risk_level"] = "High" if prob > 0.7 else "Moderate" if prob > 0.3 else "Low"

        report = diagnostic_system.generate_pdf_report(patient_values, analysis_data)
        report.seek(0)

        filename = f"diagnoai-pancreas-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.pdf"
        return send_file(
            report,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
        )
    except Exception as exc:  # pragma: no cover
        logger.error("Report generation error: %s", exc)
        logger.error(traceback.format_exc())
        return (
            jsonify(
                {
                    "error": "Failed to generate report",
                    "details": str(exc) if current_app.debug else "Unexpected error",
                    "status": "error",
                }
            ),
            500,
        )


@api_bp.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "model_loaded": diagnostic_system.model is not None,
            "ai_client_available": groq_client is not None,
        }
    )


@api_bp.route("/status", methods=["GET"])
def status():
    return jsonify(
        {
            "status": "ok",
            "model_loaded": diagnostic_system.model is not None,
            "model_metrics": diagnostic_system.model_metrics,
            "ai_commentary": groq_client is not None,
        }
    )


@api_bp.route("/model", methods=["GET"])
def model_info():
    metrics = diagnostic_system.model_metrics
    return jsonify(
        {
            "model": "Random Forest Classifier v2.1.0",
            "accuracy": f"{metrics['accuracy']:.1%}",
            "precision": f"{metrics['precision']:.1%}",
            "recall": f"{metrics['recall']:.1%}",
            "f1_score": f"{metrics['f1_score']:.1%}",
            "roc_auc": f"{metrics['roc_auc']:.3f}",
            "guidelines": diagnostic_system.guideline_snapshot(),
        }
    )


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


def register_routes(app):
    """Register API blueprint and error handlers."""
    app.register_blueprint(api_bp)
    app.register_error_handler(404, not_found)
    app.register_error_handler(500, internal_error)
