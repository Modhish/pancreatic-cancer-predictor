from __future__ import annotations

import csv
import io
import os
import statistics
from collections import Counter
from typing import Any, Dict, Iterable, List, Optional, Tuple

from core.constants import FEATURE_DEFAULTS
from core.settings import logger
from .diagnostic_system import diagnostic_system
from .pipeline import execute_diagnostic_pipeline

DEFAULT_MAX_RECORDS = int(os.getenv("MAX_BATCH_RECORDS", "250") or "250")

CalibrationPoint = Tuple[float, int]


def _safe_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def _normalize_row(row: Dict[str, Any]) -> Dict[str, Any]:
    normalized: Dict[str, Any] = {}
    for key, default in FEATURE_DEFAULTS:
        value = None
        # Accept multiple casings
        for candidate in (key, key.upper(), key.capitalize()):
            if candidate in row and row[candidate] not in (None, ""):
                value = row[candidate]
                break
        normalized[key] = _safe_float(value, default)
    return normalized


def _parse_label(row: Dict[str, Any]) -> Optional[int]:
    for candidate in ("label", "target", "y", "outcome"):
        if candidate in row:
            try:
                value = int(float(row[candidate]))
                if value in (0, 1):
                    return value
            except (TypeError, ValueError):
                return None
    return None


def _calibration_curve(points: List[CalibrationPoint], bins: int = 5) -> Dict[str, Any]:
    if not points:
        return {"bins": [], "sampled": 0, "brier_score": None}

    bins_data = []
    total = len(points)
    brier_sum = 0.0
    for prob, label in points:
        brier_sum += (prob - label) ** 2

    for idx in range(bins):
        lower = idx / bins
        upper = 1.0 if idx == bins - 1 else (idx + 1) / bins
        bucket = [
            (p, l)
            for p, l in points
            if (p >= lower and (p < upper or (idx == bins - 1 and p <= upper)))
        ]
        if not bucket:
            bins_data.append(
                {
                    "bin": f"{lower:.2f}-{upper:.2f}",
                    "count": 0,
                    "avg_prob": None,
                    "observed_rate": None,
                }
            )
            continue
        probs = [p for p, _ in bucket]
        labels = [l for _, l in bucket]
        bins_data.append(
            {
                "bin": f"{lower:.2f}-{upper:.2f}",
                "count": len(bucket),
                "avg_prob": sum(probs) / len(probs),
                "observed_rate": sum(labels) / len(labels),
            }
        )

    return {
        "bins": bins_data,
        "sampled": total,
        "brier_score": round(brier_sum / total, 6),
    }


def _percentile(data: List[float], percentile: float) -> float:
    if not data:
        return 0.0
    data_sorted = sorted(data)
    k = (len(data_sorted) - 1) * percentile / 100.0
    f = int(k)
    c = min(f + 1, len(data_sorted) - 1)
    if f == c:
        return data_sorted[int(k)]
    return data_sorted[f] * (c - k) + data_sorted[c] * (k - f)


def process_batch_csv(
    csv_bytes: bytes,
    language: str = "en",
    client_type: str = "clinician",
    include_commentary: bool = False,
    max_records: Optional[int] = None,
) -> Dict[str, Any]:
    """Score a batch CSV of patient rows and build a calibration summary."""
    if not csv_bytes:
        raise ValueError("Empty CSV payload")

    max_rows = max_records or DEFAULT_MAX_RECORDS
    decoded = csv_bytes.decode("utf-8-sig")
    stream = io.StringIO(decoded)
    reader = csv.DictReader(stream)

    if not reader.fieldnames:
        raise ValueError("CSV is missing headers")

    results: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    calibration_points: List[CalibrationPoint] = []

    for idx, row in enumerate(reader, start=1):
        if idx > max_rows:
            raise ValueError(f"Row limit exceeded (max {max_rows})")

        payload = _normalize_row(row)
        payload["language"] = language
        payload["client_type"] = client_type

        analysis, error_payload, status_code = execute_diagnostic_pipeline(
            diagnostic_system, payload
        )
        if status_code != 200 or not analysis:
            errors.append(
                {
                    "row": idx,
                    "error": (error_payload or {}).get("error", "validation_error"),
                    "details": (error_payload or {}).get("details") or (error_payload or {}).get("validation_errors"),
                }
            )
            continue

        label = _parse_label(row)
        if label is not None:
            calibration_points.append((float(analysis["probability"]), label))

        result_row = {
            "row": idx,
            "prediction": analysis["prediction"],
            "probability": analysis["probability"],
            "risk_level": analysis["risk_level"],
            "patient_values": analysis["patient_values"],
            "shap_values": analysis["shap_values"],
            "metrics": analysis.get("metrics", {}),
        }
        if include_commentary:
            result_row["ai_explanation_b64"] = analysis.get("ai_explanation_b64")
        results.append(result_row)

    probabilities = [r["probability"] for r in results]
    risk_counts = Counter([r["risk_level"] for r in results])
    calibration = _calibration_curve(calibration_points)

    summary = {
        "total_rows": len(results) + len(errors),
        "processed": len(results),
        "failed": len(errors),
        "risk_counts": dict(risk_counts),
        "probability_avg": round(statistics.mean(probabilities), 6) if probabilities else None,
        "probability_p50": round(_percentile(probabilities, 50), 6) if probabilities else None,
        "probability_p90": round(_percentile(probabilities, 90), 6) if probabilities else None,
        "labelled_rows": len(calibration_points),
    }

    return {
        "summary": summary,
        "calibration": calibration,
        "results": results,
        "errors": errors,
    }


__all__ = ["process_batch_csv"]
