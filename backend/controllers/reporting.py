from __future__ import annotations

import os
import traceback
from datetime import datetime

from flask import current_app, jsonify, request, send_file

from core.settings import logger, rate_limit
from core.security import audit_event, current_role, get_request_id, require_role
from services import diagnostic_system
from services import html_report

from . import api_bp


PDF_RATE_LIMIT = os.getenv("PDF_RATE_LIMIT", "60/minute")


@api_bp.route("/report", methods=["POST"])
@rate_limit(PDF_RATE_LIMIT)
@require_role(["clinician", "researcher", "admin"])
def download_report():
    """Generate a PDF report that summarizes the diagnostic results."""
    request_id = get_request_id()
    try:
        if not request.json:
            audit_event(
                "report",
                current_role(),
                status="validation_error",
                detail="missing_json",
                http_status=400,
                request_id=request_id,
            )
            return jsonify({"error": "No JSON data provided", "status": "validation_error"}), 400

        payload = request.json
        patient_values = (
            payload.get("patient_values")
            or payload.get("patientValues")
            or payload.get("patient")
        )
        analysis_data = payload.get("analysis") or payload.get("result")

        if not isinstance(patient_values, dict) or not isinstance(analysis_data, dict):
            audit_event(
                "report",
                current_role(),
                status="validation_error",
                detail="missing_context",
                http_status=400,
                request_id=request_id,
            )
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
        language = str(payload.get("language") or analysis.get("language") or "en").lower()
        analysis.setdefault("language", language)
        if "ai_explanation" not in analysis and "aiExplanation" in payload:
            analysis["ai_explanation"] = payload["aiExplanation"]
        if "risk_level" not in analysis:
            try:
                prob = float(analysis.get("probability", 0))
            except (TypeError, ValueError):
                prob = 0.0
            analysis["risk_level"] = "High" if prob > 0.7 else "Moderate" if prob > 0.3 else "Low"

        pdf_renderer = os.getenv("PDF_RENDERER", "fpdf").lower()

        report = None
        if pdf_renderer != "fpdf":
            try:
                report = html_report.generate_pdf(patient_values, analysis, language)
            except Exception as exc:
                logger.warning("Playwright PDF failed (%s); falling back to FPDF renderer", exc)

        if report is None:
            report = diagnostic_system.generate_pdf_report(patient_values, analysis)

        lang_suffix = "ru" if language.startswith("ru") else "en"
        filename = f"diagnoai-pancreas-report-{lang_suffix}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.pdf"
        audit_event(
            "report",
            current_role(),
            status="success",
            detail=f"risk={analysis.get('risk_level', 'n/a')}",
            http_status=200,
            request_id=request_id,
            extra={
                "language": language,
                "patient_fields": len(patient_values or {}),
            },
        )
        return send_file(
            report,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
        )
    except Exception as exc:  # pragma: no cover
        logger.error("Report generation error: %s", exc)
        logger.error(traceback.format_exc())
        audit_event(
            "report",
            current_role(),
            status="error",
            detail=str(exc),
            http_status=500,
            request_id=request_id,
        )
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
