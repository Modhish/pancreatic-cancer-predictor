from __future__ import annotations

from flask import jsonify, request

from core.settings import logger, rate_limit
from core.security import audit_event, current_role, get_request_id, require_role
from services import process_batch_csv

from . import api_bp


@api_bp.route("/batch-predict", methods=["POST"])
@rate_limit("20/minute")
@require_role(["researcher", "clinician", "admin"])
def batch_predict():
    """Batch CSV prediction endpoint with calibration summary."""
    request_id = get_request_id()
    uploaded = request.files.get("file")
    language = str(request.form.get("language") or "en").lower()
    client_type = str(request.form.get("client_type") or "researcher").lower()
    include_commentary_raw = (request.form.get("include_commentary") or request.form.get("includeCommentary") or "").lower()
    include_commentary = include_commentary_raw in {"1", "true", "yes", "on"}
    max_records_raw = request.form.get("max_records") or request.form.get("maxRecords")
    try:
        max_records = int(max_records_raw) if max_records_raw else None
    except (TypeError, ValueError):
        max_records = None

    if not uploaded:
        audit_event(
            "batch_predict",
            current_role(),
            status="validation_error",
            detail="missing_file",
            http_status=400,
            request_id=request_id,
        )
        return (
            jsonify(
                {
                    "error": "missing_file",
                    "status": "validation_error",
                    "details": "Upload a CSV file under form field 'file'.",
                    "request_id": request_id,
                }
            ),
            400,
        )

    try:
        payload = process_batch_csv(
            uploaded.read(),
            language=language,
            client_type=client_type,
            include_commentary=include_commentary,
            max_records=max_records,
        )
        summary = payload.get("summary", {})
        audit_event(
            "batch_predict",
            current_role(),
            status="success",
            detail=f"processed={summary.get('processed', 0)}",
            http_status=200,
            request_id=request_id,
            extra={
                "language": language,
                "client_type": client_type,
                "failed": summary.get("failed", 0),
                "labelled_rows": summary.get("labelled_rows", 0),
            },
        )
        return jsonify(payload), 200
    except ValueError as exc:
        audit_event(
            "batch_predict",
            current_role(),
            status="validation_error",
            detail=str(exc),
            http_status=400,
            request_id=request_id,
        )
        return (
            jsonify(
                {
                    "error": "invalid_batch_payload",
                    "status": "validation_error",
                    "details": str(exc),
                    "request_id": request_id,
                }
            ),
            400,
        )
    except Exception as exc:  # pragma: no cover
        logger.error("Batch prediction failed: %s", exc)
        audit_event(
            "batch_predict",
            current_role(),
            status="error",
            detail=str(exc),
            http_status=500,
            request_id=request_id,
        )
        return (
            jsonify(
                {
                    "error": "batch_processing_error",
                    "status": "error",
                    "details": str(exc),
                    "request_id": request_id,
                }
            ),
            500,
        )
