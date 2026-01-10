from __future__ import annotations

import json
import logging
import os
import uuid
from functools import wraps
from typing import Iterable, Optional
from datetime import datetime

from flask import Response, g, jsonify, request

__all__ = [
    "require_role",
    "audit_event",
    "current_role",
    "get_request_id",
    "init_security",
]

# Default roles that can be assigned to API keys
DEFAULT_ROLES = ("clinician", "researcher", "admin")


def _as_bool(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _rbac_enabled() -> bool:
    return _as_bool(os.getenv("RBAC_ENABLED", "0"))


def _default_role() -> str:
    return os.getenv("RBAC_DEFAULT_ROLE", "clinician").lower()


def _parse_role_keys() -> dict[str, set[str]]:
    """Parse role-specific API keys from environment variables."""
    mapping: dict[str, set[str]] = {}

    # Compact syntax: ROLE_API_KEYS="clinician:key1;researcher:key2"
    env_compact = os.getenv("ROLE_API_KEYS", "")
    if env_compact:
        for segment in env_compact.split(";"):
            if not segment or ":" not in segment:
                continue
            role, keys_str = segment.split(":", 1)
            keys = {item.strip() for item in keys_str.split(",") if item.strip()}
            if keys:
                mapping[role.strip().lower()] = keys

    # Per-role env vars (comma-separated)
    for role in DEFAULT_ROLES:
        env_value = os.getenv(f"{role.upper()}_API_KEYS", "")
        if env_value:
            keys = {item.strip() for item in env_value.split(",") if item.strip()}
            if keys:
                mapping.setdefault(role, set()).update(keys)

    return mapping


def _match_role_from_key(api_key: str | None) -> Optional[str]:
    if not api_key:
        return None
    api_key = api_key.strip()
    for role, keys in _parse_role_keys().items():
        if api_key in keys:
            return role
    return None


def get_request_id() -> str:
    """Return the per-request correlation id, creating one if missing."""
    if getattr(g, "request_id", None):
        return g.request_id
    incoming = (request.headers.get("X-Request-Id") or "").strip()
    g.request_id = incoming if incoming else uuid.uuid4().hex
    return g.request_id


def current_role() -> str:
    """Resolve the current role (best effort) for audit and RBAC checks."""
    role = getattr(g, "rbac_role", None)
    if role:
        return str(role)
    resolved = _match_role_from_key(request.headers.get("X-Api-Key"))
    header_role = (request.headers.get("X-Role") or request.headers.get("X-Client-Role") or "").strip().lower()
    fallback = header_role or _default_role()
    g.rbac_role = resolved or fallback
    return g.rbac_role


def require_role(allowed_roles: Iterable[str]):
    """Decorator enforcing RBAC when enabled; no-op when disabled."""

    allowed: set[str] = {str(role).lower() for role in allowed_roles}

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            role_from_key = _match_role_from_key(request.headers.get("X-Api-Key"))
            header_role = (request.headers.get("X-Role") or request.headers.get("X-Client-Role") or "").strip().lower()
            has_configured_keys = bool(_parse_role_keys())
            resolved_role = role_from_key or header_role or _default_role()
            g.rbac_role = resolved_role
            request_id = get_request_id()

            if _rbac_enabled():
                if has_configured_keys and not role_from_key:
                    audit_event(
                        action=f"{request.method} {request.path}",
                        role=resolved_role,
                        status="denied",
                        detail="missing_or_invalid_api_key",
                        http_status=403,
                        request_id=request_id,
                    )
                    return (
                        jsonify(
                            {
                                "error": "forbidden",
                                "status": "invalid_api_key",
                                "role": resolved_role,
                                "required_roles": sorted(allowed),
                                "request_id": request_id,
                            }
                        ),
                        403,
                    )

                if resolved_role not in allowed:
                    audit_event(
                        action=f"{request.method} {request.path}",
                        role=resolved_role,
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
                                "role": resolved_role,
                                "required_roles": sorted(allowed),
                                "request_id": request_id,
                            }
                        ),
                        403,
                    )

            return func(*args, **kwargs)

        return wrapper

    return decorator


def _build_audit_logger() -> logging.Logger:
    """Create a dedicated audit logger writing JSON lines to disk."""
    logger_name = "diagnoai_audit"
    existing = logging.getLogger(logger_name)
    if existing.handlers:
        return existing

    log_path = os.getenv(
        "AUDIT_LOG_PATH",
        os.path.join(os.path.dirname(__file__), "..", "logs", "audit.log"),
    )
    os.makedirs(os.path.dirname(log_path), exist_ok=True)

    handler = logging.FileHandler(log_path)
    handler.setFormatter(logging.Formatter("%(message)s"))

    existing.setLevel(logging.INFO)
    existing.addHandler(handler)
    existing.propagate = False
    return existing


_audit_logger = _build_audit_logger()


def audit_event(
    action: str,
    role: str,
    status: str,
    detail: Optional[str] = None,
    http_status: Optional[int] = None,
    request_id: Optional[str] = None,
    extra: Optional[dict] = None,
) -> None:
    """Emit a structured audit log line without storing PHI."""
    payload = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "action": action,
        "role": role,
        "status": status,
        "detail": detail,
        "http_status": http_status,
        "request_id": request_id or get_request_id(),
        "ip": request.remote_addr,
        "path": request.path,
        "method": request.method,
    }
    if extra:
        payload.update(extra)
    try:
        _audit_logger.info(json.dumps(payload, ensure_ascii=False))
    except Exception:
        # Failing silently keeps runtime stable; regular app logger still captures server logs.
        pass


def init_security(app) -> None:
    """Attach request/response hooks for correlation ids."""

    @app.before_request
    def _attach_request_context():
        get_request_id()

    @app.after_request
    def _inject_request_id(response: Response):
        try:
            response.headers["X-Request-Id"] = get_request_id()
        finally:
            return response
