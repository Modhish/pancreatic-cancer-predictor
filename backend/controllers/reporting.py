from __future__ import annotations

import traceback
from datetime import datetime

from flask import current_app, jsonify, request, send_file

from core.settings import logger, rate_limit
from services import diagnostic_system

from . import api_bp


@api_bp.route("/report", methods=["POST"])
@rate_limit("10/minute")
def download_report():
    """Generate a PDF report that summarizes the diagnostic results."""
    try:
        if not request.json:
            return jsonify({"error": "No JSON data provided", "status": "validation_error"}), 400

        payload = request.json
        patient_values = (
            payload.get("patient_values")
            or payload.get("patientValues")
            or payload.get("patient")
        )
        analysis_data = payload.get("analysis") or payload.get("result")

        if not isinstance(patient_values, dict) or not isinstance(analysis_data, dict):
            return (
                jsonify(
                    {
                        "error": "Missing report context",
                        "status": "validation_error",
                        "details": "patient (or patient_values) and analysis (or result) are required.",
                    }
                ),
                400,
            )

        # Normalize expected keys
        analysis = dict(analysis_data)
        if "ai_explanation" not in analysis and "aiExplanation" in payload:
            analysis["ai_explanation"] = payload["aiExplanation"]
        if "risk_level" not in analysis:
            try:
                prob = float(analysis.get("probability", 0))
            except (TypeError, ValueError):
                prob = 0.0
            analysis["risk_level"] = "High" if prob > 0.7 else "Moderate" if prob > 0.3 else "Low"

        report = diagnostic_system.generate_pdf_report(patient_values, analysis)
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
