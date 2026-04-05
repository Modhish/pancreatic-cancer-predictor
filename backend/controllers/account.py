from __future__ import annotations

from flask import jsonify, request

from services.auth import get_authenticated_user, require_auth
from services.database import (
    build_research_dashboard,
    build_user_summary,
    list_user_analyses,
)

from . import api_bp


@api_bp.route("/account/history", methods=["GET"])
@require_auth()
def account_history():
    user = get_authenticated_user()
    assert user is not None
    try:
        limit = int(request.args.get("limit", 50) or 50)
    except ValueError:
        limit = 50
    history = list_user_analyses(int(user["id"]), limit=limit)
    summary = build_user_summary(int(user["id"]))
    return jsonify({"history": history, "summary": summary})


@api_bp.route("/account/dashboard/researcher", methods=["GET"])
@require_auth(["researcher", "admin"])
def researcher_dashboard():
    user = get_authenticated_user()
    assert user is not None
    return jsonify({"user": user, "dashboard": build_research_dashboard()})
