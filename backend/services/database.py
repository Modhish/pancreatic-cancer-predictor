from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Any, Dict, Iterator, List, Optional

from core.constants import FEATURE_DEFAULTS

ROLE_ALIASES = {
    "clinician": "doctor",
    "physician": "doctor",
    "scientist": "researcher",
}
ALLOWED_USER_ROLES = {"patient", "doctor", "researcher", "admin"}


def normalize_user_role(role: str | None) -> str:
    value = str(role or "patient").strip().lower()
    normalized = ROLE_ALIASES.get(value, value)
    return normalized if normalized in ALLOWED_USER_ROLES else "patient"


def _backend_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def resolve_database_path() -> str:
    raw = (
        os.getenv("DIAGNOAI_DB_PATH")
        or os.getenv("DATABASE_URL")
        or os.path.join("data", "diagnoai.sqlite3")
    )

    if raw.startswith("sqlite:///"):
        path = raw.removeprefix("sqlite:///")
    elif raw.startswith("file:"):
        path = raw.removeprefix("file:")
    else:
        path = raw

    if not os.path.isabs(path):
        path = os.path.abspath(os.path.join(_backend_root(), path))

    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(resolve_database_path())
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    connection = _connect()
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    with get_db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                organization TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analyst_user_id INTEGER NOT NULL,
                analyst_role TEXT NOT NULL,
                analyst_name TEXT NOT NULL,
                patient_name TEXT,
                subject_label TEXT NOT NULL,
                prediction INTEGER NOT NULL,
                probability REAL NOT NULL,
                risk_level TEXT NOT NULL,
                language TEXT NOT NULL,
                client_type TEXT NOT NULL,
                signed_by TEXT,
                ai_explanation TEXT,
                patient_values_json TEXT NOT NULL,
                shap_values_json TEXT NOT NULL,
                metrics_json TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (analyst_user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON analyses(analyst_user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_analyses_risk_level ON analyses(risk_level);
            CREATE INDEX IF NOT EXISTS idx_analyses_role ON analyses(analyst_role);
            """
        )


def _utcnow() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _row_to_user(row: sqlite3.Row | None) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    return {
        "id": int(row["id"]),
        "full_name": row["full_name"],
        "email": row["email"],
        "role": normalize_user_role(row["role"]),
        "organization": row["organization"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    normalized_email = str(email or "").strip().lower()
    if not normalized_email:
        return None
    with get_db() as connection:
        row = connection.execute(
            """
            SELECT id, full_name, email, role, organization, created_at, updated_at, password_hash
            FROM users
            WHERE email = ?
            """,
            (normalized_email,),
        ).fetchone()
    if row is None:
        return None
    user = _row_to_user(row)
    if user is None:
        return None
    user["password_hash"] = row["password_hash"]
    return user


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as connection:
        row = connection.execute(
            """
            SELECT id, full_name, email, role, organization, created_at, updated_at
            FROM users
            WHERE id = ?
            """,
            (int(user_id),),
        ).fetchone()
    return _row_to_user(row)


def create_user(
    *,
    full_name: str,
    email: str,
    password_hash: str,
    role: str,
    organization: str | None = None,
) -> Dict[str, Any]:
    normalized_email = str(email or "").strip().lower()
    normalized_role = normalize_user_role(role)
    now = _utcnow()

    with get_db() as connection:
        cursor = connection.execute(
            """
            INSERT INTO users (full_name, email, password_hash, role, organization, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(full_name).strip(),
                normalized_email,
                password_hash,
                normalized_role,
                str(organization).strip() if organization else None,
                now,
                now,
            ),
        )
        user_id = int(cursor.lastrowid)

    user = get_user_by_id(user_id)
    if user is None:
        raise RuntimeError("Failed to create user")
    return user


def save_analysis(
    *,
    analyst_user: Dict[str, Any],
    analysis: Dict[str, Any],
    patient_name: str | None = None,
) -> Dict[str, Any]:
    role = normalize_user_role(analyst_user.get("role"))
    analyst_name = str(analyst_user.get("full_name") or "Unknown user").strip()
    cleaned_patient_name = str(patient_name or "").strip() or None

    if role == "patient":
        subject_label = analyst_name
    elif cleaned_patient_name:
        subject_label = cleaned_patient_name
    else:
        subject_label = "Research case"

    signed_by = analyst_name if role == "doctor" else None
    now = _utcnow()
    patient_values = analysis.get("patient_values") or {}
    shap_values = analysis.get("shap_values") or analysis.get("shapValues") or []
    metrics = analysis.get("metrics") or {}

    with get_db() as connection:
        cursor = connection.execute(
            """
            INSERT INTO analyses (
                analyst_user_id,
                analyst_role,
                analyst_name,
                patient_name,
                subject_label,
                prediction,
                probability,
                risk_level,
                language,
                client_type,
                signed_by,
                ai_explanation,
                patient_values_json,
                shap_values_json,
                metrics_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(analyst_user["id"]),
                role,
                analyst_name,
                cleaned_patient_name,
                subject_label,
                int(analysis.get("prediction", 0)),
                float(analysis.get("probability", 0.0)),
                str(analysis.get("risk_level") or "Low"),
                str(analysis.get("language") or "en"),
                str(analysis.get("client_type") or role),
                signed_by,
                str(analysis.get("ai_explanation") or ""),
                json.dumps(patient_values, ensure_ascii=False),
                json.dumps(shap_values, ensure_ascii=False),
                json.dumps(metrics, ensure_ascii=False),
                now,
            ),
        )
        analysis_id = int(cursor.lastrowid)

    return get_analysis_by_id(analysis_id) or {"id": analysis_id}


def _deserialize_json(value: str | None, fallback: Any) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def _row_to_analysis(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": int(row["id"]),
        "analyst_user_id": int(row["analyst_user_id"]),
        "analyst_role": row["analyst_role"],
        "analyst_name": row["analyst_name"],
        "patient_name": row["patient_name"],
        "subject_label": row["subject_label"],
        "prediction": int(row["prediction"]),
        "probability": float(row["probability"]),
        "risk_level": row["risk_level"],
        "language": row["language"],
        "client_type": row["client_type"],
        "signed_by": row["signed_by"],
        "ai_explanation": row["ai_explanation"] or "",
        "patient_values": _deserialize_json(row["patient_values_json"], {}),
        "shap_values": _deserialize_json(row["shap_values_json"], []),
        "metrics": _deserialize_json(row["metrics_json"], {}),
        "created_at": row["created_at"],
    }


def get_analysis_by_id(analysis_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM analyses
            WHERE id = ?
            """,
            (int(analysis_id),),
        ).fetchone()
    return _row_to_analysis(row) if row is not None else None


def list_user_analyses(user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    capped_limit = max(1, min(int(limit), 200))
    with get_db() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM analyses
            WHERE analyst_user_id = ?
            ORDER BY datetime(created_at) DESC
            LIMIT ?
            """,
            (int(user_id), capped_limit),
        ).fetchall()
    return [_row_to_analysis(row) for row in rows]


def build_user_summary(user_id: int) -> Dict[str, Any]:
    analyses = list_user_analyses(user_id, limit=200)
    if not analyses:
        return {
            "total_analyses": 0,
            "average_probability": 0,
            "latest_risk_level": None,
            "high_risk_count": 0,
        }

    total = len(analyses)
    avg_probability = sum(item["probability"] for item in analyses) / total
    high_risk_count = sum(1 for item in analyses if item["risk_level"] == "High")
    return {
        "total_analyses": total,
        "average_probability": round(avg_probability, 4),
        "latest_risk_level": analyses[0]["risk_level"],
        "high_risk_count": high_risk_count,
    }


def _feature_hotspots(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not rows:
        return []

    totals: Dict[str, float] = {key: 0.0 for key, _ in FEATURE_DEFAULTS}
    counts: Dict[str, int] = {key: 0 for key, _ in FEATURE_DEFAULTS}

    for row in rows:
        patient_values = row.get("patient_values") or {}
        for feature, baseline in FEATURE_DEFAULTS:
            raw_value = patient_values.get(feature)
            try:
                numeric_value = float(raw_value)
            except (TypeError, ValueError):
                continue
            divisor = abs(baseline) if baseline else 1.0
            totals[feature] += abs(numeric_value - baseline) / divisor
            counts[feature] += 1

    hotspots: List[Dict[str, Any]] = []
    for feature, _ in FEATURE_DEFAULTS:
        count = counts[feature]
        if count == 0:
            continue
        hotspots.append(
            {
                "feature": feature.upper(),
                "score": round(totals[feature] / count, 4),
            }
        )

    hotspots.sort(key=lambda item: item["score"], reverse=True)
    return hotspots[:6]


def build_research_dashboard() -> Dict[str, Any]:
    with get_db() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM analyses
            ORDER BY datetime(created_at) DESC
            """
        ).fetchall()

    analyses = [_row_to_analysis(row) for row in rows]
    total = len(analyses)
    risk_distribution = {"High": 0, "Moderate": 0, "Low": 0}
    role_distribution: Dict[str, int] = {}
    trends: Dict[str, Dict[str, float]] = {}

    for analysis in analyses:
        risk_distribution[analysis["risk_level"]] = risk_distribution.get(analysis["risk_level"], 0) + 1
        role_key = str(analysis["analyst_role"] or "unknown")
        role_distribution[role_key] = role_distribution.get(role_key, 0) + 1

        day = str(analysis["created_at"])[:10]
        bucket = trends.setdefault(day, {"total_probability": 0.0, "count": 0.0})
        bucket["total_probability"] += float(analysis["probability"])
        bucket["count"] += 1.0

    trend_series = [
        {
            "date": date,
            "average_probability": round(values["total_probability"] / values["count"], 4),
            "count": int(values["count"]),
        }
        for date, values in sorted(trends.items())[-14:]
    ]
    seven_days_ago = (datetime.utcnow() - timedelta(days=6)).date().isoformat()

    return {
        "summary": {
            "total_analyses": total,
            "average_probability": round(
                (sum(item["probability"] for item in analyses) / total) if total else 0.0,
                4,
            ),
            "high_risk_share": round((risk_distribution["High"] / total) if total else 0.0, 4),
            "recent_7_day_count": sum(
                1
                for item in analyses
                if item["created_at"][:10] >= seven_days_ago
            ),
        },
        "risk_distribution": [
            {"name": risk, "value": value} for risk, value in risk_distribution.items()
        ],
        "role_distribution": [
            {"name": role, "value": value} for role, value in sorted(role_distribution.items())
        ],
        "probability_trend": trend_series,
        "feature_hotspots": _feature_hotspots(analyses),
        "recent_analyses": analyses[:12],
    }
