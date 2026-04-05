from __future__ import annotations

from flask import jsonify, request

from core.security import audit_event, get_request_id
from services.auth import (
    authenticate_user_account,
    get_authenticated_user,
    register_user_account,
    require_auth,
)

from . import api_bp


@api_bp.route("/auth/signup", methods=["POST"])
def sign_up():
    request_id = get_request_id()
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid request payload", "status": "validation_error"}), 400

    try:
        auth_payload = register_user_account(payload)
    except ValueError as exc:
        audit_event(
            "auth_signup",
            "anonymous",
            status="validation_error",
            detail=str(exc),
            http_status=400,
            request_id=request_id,
        )
        return jsonify({"error": str(exc), "status": "validation_error"}), 400

    audit_event(
        "auth_signup",
        auth_payload["user"]["role"],
        status="success",
        detail=auth_payload["user"]["email"],
        http_status=201,
        request_id=request_id,
    )
    return jsonify(auth_payload), 201


@api_bp.route("/auth/signin", methods=["POST"])
def sign_in():
    request_id = get_request_id()
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid request payload", "status": "validation_error"}), 400

    email = str(payload.get("email") or "").strip().lower()
    password = str(payload.get("password") or "")

    try:
        auth_payload = authenticate_user_account(email, password)
    except PermissionError as exc:
        audit_event(
            "auth_signin",
            "anonymous",
            status="denied",
            detail=str(exc),
            http_status=401,
            request_id=request_id,
        )
        return jsonify({"error": str(exc), "status": "unauthorized"}), 401

    audit_event(
        "auth_signin",
        auth_payload["user"]["role"],
        status="success",
        detail=auth_payload["user"]["email"],
        http_status=200,
        request_id=request_id,
    )
    return jsonify(auth_payload)


@api_bp.route("/auth/me", methods=["GET"])
@require_auth()
def me():
    user = get_authenticated_user()
    return jsonify({"user": user})

