from __future__ import annotations

import os
import re
from functools import wraps
from typing import Any, Dict, Iterable, Optional

from flask import g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

from core.security import audit_event, get_request_id
from services.database import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    normalize_user_role,
)

TOKEN_MAX_AGE_SECONDS = int(os.getenv("AUTH_TOKEN_MAX_AGE_SECONDS", str(60 * 60 * 24 * 7)))
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _is_production_runtime() -> bool:
    env_name = (os.getenv("FLASK_ENV") or os.getenv("APP_ENV") or os.getenv("ENV") or "").strip().lower()
    return env_name in {"prod", "production"}


def _serializer() -> URLSafeTimedSerializer:
    secret_key = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY")
    if not secret_key:
        if _is_production_runtime():
            raise RuntimeError("JWT_SECRET or SECRET_KEY must be configured in production")
        secret_key = "diagnoai-dev-secret"
    return URLSafeTimedSerializer(secret_key=secret_key, salt="diagnoai-auth")


def _sanitize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": int(user["id"]),
        "full_name": str(user["full_name"]),
        "email": str(user["email"]),
        "role": normalize_user_role(user.get("role")),
        "organization": user.get("organization"),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
    }


def _issue_token(user: Dict[str, Any]) -> str:
    return _serializer().dumps(
        {
            "sub": int(user["id"]),
            "email": str(user["email"]),
            "role": normalize_user_role(user.get("role")),
        }
    )


def register_user_account(payload: Dict[str, Any]) -> Dict[str, Any]:
    full_name = str(payload.get("full_name") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    password = str(payload.get("password") or "")
    role = normalize_user_role(payload.get("role"))
    organization = str(payload.get("organization") or "").strip() or None

    if len(full_name) < 3:
        raise ValueError("Full name must be at least 3 characters")
    if not EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if get_user_by_email(email):
        raise ValueError("An account with this email already exists")

    user = create_user(
        full_name=full_name,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
        organization=organization,
    )
    sanitized = _sanitize_user(user)
    return {"token": _issue_token(sanitized), "user": sanitized}


def authenticate_user_account(email: str, password: str) -> Dict[str, Any]:
    user = get_user_by_email(email)
    if not user or not check_password_hash(str(user.get("password_hash") or ""), password):
        raise PermissionError("Invalid email or password")
    sanitized = _sanitize_user(user)
    return {"token": _issue_token(sanitized), "user": sanitized}


def get_authenticated_user() -> Optional[Dict[str, Any]]:
    cached_user = getattr(g, "current_user", None)
    if cached_user:
        return cached_user

    header = str(request.headers.get("Authorization") or "").strip()
    if not header.lower().startswith("bearer "):
        return None

    token = header.split(" ", 1)[1].strip()
    if not token:
        return None

    try:
        payload = _serializer().loads(token, max_age=TOKEN_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return None

    user = get_user_by_id(int(payload.get("sub", 0)))
    if user is None:
        return None

    sanitized = _sanitize_user(user)
    g.current_user = sanitized
    return sanitized


def require_auth(allowed_roles: Iterable[str] | None = None):
    allowed = {
        normalize_user_role(role) for role in (allowed_roles or [])
    }

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            request_id = get_request_id()
            user = get_authenticated_user()
            if user is None:
                audit_event(
                    action=f"{request.method} {request.path}",
                    role="anonymous",
                    status="denied",
                    detail="authentication_required",
                    http_status=401,
                    request_id=request_id,
                )
                return (
                    jsonify(
                        {
                            "error": "authentication_required",
                            "status": "unauthorized",
                            "request_id": request_id,
                        }
                    ),
                    401,
                )

            if allowed and normalize_user_role(user.get("role")) not in allowed:
                audit_event(
                    action=f"{request.method} {request.path}",
                    role=str(user.get("role")),
                    status="denied",
                    detail="insufficient_role",
                    http_status=403,
                    request_id=request_id,
                )
                return (
                    jsonify(
                        {
                            "error": "forbidden",
                            "status": "insufficient_role",
                            "required_roles": sorted(allowed),
                            "request_id": request_id,
                        }
                    ),
                    403,
                )

            return func(*args, **kwargs)

        return wrapper

    return decorator
