from __future__ import annotations

from typing import Any, Dict

from core.constants import FEATURE_DEFAULTS
from utils.text import encode_text_base64, repair_text_encoding


def parse_patient_inputs(payload: Dict[str, Any]) -> tuple[list[float], Dict[str, float]]:
    """Convert incoming payload into feature list and normalized map."""
    features: list[float] = []
    normalized: Dict[str, float] = {}

    for key, default in FEATURE_DEFAULTS:
        raw_value = payload.get(key, default)
        try:
            value = float(raw_value)
        except (TypeError, ValueError) as exc:
            raise ValueError(str(exc)) from exc

        features.append(value)
        normalized[key] = value

    return features, normalized


def execute_diagnostic_pipeline(
    diagnostic_system,
    payload: Dict[str, Any],
) -> tuple[Dict[str, Any] | None, Dict[str, Any] | None, int]:
    """Execute the full diagnostic flow returning analysis data or an error payload."""
    try:
        features, normalized = parse_patient_inputs(payload)
    except (TypeError, ValueError) as exc:
        return (
            None,
            {
                "error": "Invalid numeric values in request data",
                "details": str(exc),
                "status": "validation_error",
            },
            400,
        )

    is_valid, errors = diagnostic_system.validate_medical_data(normalized)
    if not is_valid:
        return (
            None,
            {
                "error": "Medical data validation failed",
                "validation_errors": errors,
                "status": "validation_error",
            },
            400,
        )

    prediction, probability = diagnostic_system.predict_cancer_risk(features)
    shap_values = diagnostic_system.calculate_shap_analysis(features, prediction)
    language = str(payload.get("language", "en")).lower()
    client_type = str(payload.get("client_type", "patient") or "patient").lower()

    ai_explanation = diagnostic_system.generate_clinical_commentary(
        prediction,
        probability,
        shap_values,
        features,
        language=language,
        client_type=client_type,
    )

    if not language.startswith("ru"):
        ai_explanation = repair_text_encoding(ai_explanation)

    ai_explanation_b64 = encode_text_base64(ai_explanation)
    analysis = {
        "prediction": int(prediction),
        "probability": float(probability),
        "risk_level": "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low",
        "shap_values": shap_values,
        "metrics": {k: v for k, v in diagnostic_system.model_metrics.items()},
        "ai_explanation": ai_explanation,
        "ai_explanation_b64": ai_explanation_b64,
        "patient_values": normalized,
        "language": language,
        "client_type": client_type,
    }

    return analysis, None, 200
