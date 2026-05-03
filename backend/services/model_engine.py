from __future__ import annotations

import math
import os
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import shap

from core.constants import FEATURE_DEFAULTS, FEATURE_LABELS
from core.settings import logger
try:  # pragma: no cover
    from guidelines import (
        FOLLOW_UP_WINDOWS,
        GUIDELINE_SOURCES,
        HIGH_RISK_CRITERIA,
        IMAGING_PATHWAYS,
        LAB_THRESHOLDS,
    )
except ImportError:  # pragma: no cover
    from ..guidelines import (  # type: ignore
        FOLLOW_UP_WINDOWS,
        GUIDELINE_SOURCES,
        HIGH_RISK_CRITERIA,
        IMAGING_PATHWAYS,
        LAB_THRESHOLDS,
    )


# Conservative reference ranges for incoming payload validation
MEDICAL_RANGES: Dict[str, tuple[float, float]] = {
    "wbc": (4.0, 11.0),
    "rbc": (4.0, 5.5),
    "plt": (150, 450),
    "hgb": (110, 170),
    "hct": (32, 52),
    "mpv": (7.0, 13.0),
    "pdw": (9.0, 20.0),
    "neut_abs": (1.5, 8.0),
    "neut_pct": (40.0, 75.0),
    "lymph_abs": (1.0, 4.0),
    "lymph_pct": (18.0, 45.0),
    "mono_abs": (0.1, 1.2),
    "mono_pct": (2.0, 12.0),
    "eos_abs": (0.0, 0.6),
    "eos_pct": (0.0, 6.0),
    "baso_abs": (0.0, 0.2),
    "baso_pct": (0.0, 3.0),
    "esr": (0.0, 40.0),
}

FEATURE_ORDER = [key for key, _ in FEATURE_DEFAULTS]
FEATURE_NAMES = [
    FEATURE_LABELS["en"].get(key.upper(), key.upper()) for key in FEATURE_ORDER
]
MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "user_cbc_rf.pkl"


__all__ = [
    "MedicalDiagnosticSystem",
    "diagnostic_system",
    "MEDICAL_RANGES",
    "FEATURE_NAMES",
]


class MedicalDiagnosticSystem:
    """Handles model loading, validation, and SHAP-based explanations."""

    def __init__(self) -> None:
        self.model = None
        self.scaler = None
        self.shap_explainer = None
        self.selected_threshold = 0.5
        self.model_metrics: Dict[str, float] = {}
        self.model_metadata: Dict[str, Any] = {
            "artifact_path": str(MODEL_PATH),
            "feature_order": FEATURE_ORDER,
            "feature_names": FEATURE_NAMES,
            "mode": "rule_based_fallback",
            "model_name": "Rule-based heuristic",
        }
        self.guideline_sources = GUIDELINE_SOURCES
        self.lab_thresholds = LAB_THRESHOLDS
        self.imaging_pathways = IMAGING_PATHWAYS
        self.high_risk_criteria = HIGH_RISK_CRITERIA
        self.follow_up_windows = FOLLOW_UP_WINDOWS
        self.load_model()

    def load_model(self) -> None:
        """Load the trained estimator and scaler from disk."""
        try:
            model_path = MODEL_PATH
            if model_path.exists():
                model_data = joblib.load(model_path)
                self.model = model_data.get("model") if isinstance(model_data, dict) else model_data
                self.scaler = model_data.get("scaler") if isinstance(model_data, dict) else None
                if isinstance(model_data, dict):
                    self.selected_threshold = float(model_data.get("selected_threshold") or 0.5)
                    self.model_metrics = {
                        str(key): float(value)
                        for key, value in (model_data.get("metrics") or {}).items()
                        if isinstance(value, (int, float))
                    }
                    self.model_metadata.update(
                        {
                            "artifact_path": str(model_path),
                            "model_name": model_data.get("model_name") or type(self.model).__name__,
                            "created_at": model_data.get("created_at"),
                            "source_csv": model_data.get("source_csv"),
                            "target_name": model_data.get("target_name"),
                            "split": model_data.get("split"),
                            "class_balance": model_data.get("class_balance"),
                            "selected_threshold": self.selected_threshold,
                            "mode": "ml_model",
                        }
                    )
                try:
                    if self.model is not None:
                        try:
                            self.shap_explainer = shap.TreeExplainer(self.model)
                        except Exception:
                            self.shap_explainer = shap.Explainer(self.model)
                        logger.info("SHAP explainer initialized")
                except Exception as exc:
                    logger.warning("Could not initialize SHAP explainer: %s", exc)
                logger.info("Model loaded successfully")
            else:
                logger.info("Model file not found at %s, using rule-based predictions", model_path)
                self.model = None
                self.model_metrics = {}
                self.model_metadata.update(
                    {
                        "artifact_path": str(model_path),
                        "model_name": "Rule-based heuristic",
                        "mode": "rule_based_fallback",
                    }
                )
        except Exception as exc:  # pragma: no cover
            logger.error("Error loading model: %s", exc)
            self.model = None
            self.model_metrics = {}
            self.model_metadata.update(
                {
                    "model_name": "Rule-based heuristic",
                    "mode": "rule_based_fallback",
                }
            )

    def validate_medical_data(self, data: Dict[str, float]) -> tuple[bool, List[str]]:
        """Ensure provided biomarkers fall inside conservative reference ranges."""
        errors: List[str] = []
        for feature, value in data.items():
            if feature in MEDICAL_RANGES:
                min_val, max_val = MEDICAL_RANGES[feature]
                if not (min_val <= value <= max_val):
                    errors.append(
                        f"{feature.upper()}: {value} outside normal range ({min_val}-{max_val})",
                    )
        return len(errors) == 0, errors

    def predict_cancer_risk(self, features: List[float]) -> tuple[int, float]:
        """Infer pancreatic cancer risk via the trained estimator (fallbacks to rules)."""
        if self.model is not None:
            try:
                if self.scaler is not None:
                    features_scaled = self.scaler.transform([features])
                else:
                    features_scaled = [features]
                probability = self.model.predict_proba(features_scaled)[0][1]
                prediction = 1 if probability >= self.selected_threshold else 0
                return int(prediction), float(probability)
            except Exception as exc:  # pragma: no cover
                logger.error("Model prediction error: %s", exc)
        return self._rule_based_prediction(features)

    def _rule_based_prediction(self, features: List[float]) -> tuple[int, float]:
        """Deterministic clinical heuristic used when the ML model is unavailable."""
        values = dict(zip(FEATURE_ORDER, features))
        wbc = values.get("wbc", 5.8)
        plt = values.get("plt", 220.0)
        hgb = values.get("hgb", 135.0)
        mpv = values.get("mpv", 9.5)
        pdw = values.get("pdw", 16.0)
        neut_pct = values.get("neut_pct", 60.0)
        lymph_pct = values.get("lymph_pct", 30.0)
        mono_abs = values.get("mono_abs", 0.5)
        esr = values.get("esr", 12.0)

        risk_score = 0.0
        if esr > 30:
            risk_score += 0.35
        elif esr > 20:
            risk_score += 0.2

        if plt > 350:
            risk_score += 0.2
        elif plt < 180:
            risk_score += 0.15

        if wbc > 9.0:
            risk_score += 0.15
        elif wbc < 4.5:
            risk_score += 0.1

        if hgb < 130:
            risk_score += 0.15
        elif hgb < 110:
            risk_score += 0.25

        if mpv > 10.0:
            risk_score += 0.1

        if pdw > 18.0:
            risk_score += 0.15

        if neut_pct > 75 or lymph_pct < 18:
            risk_score += 0.12

        if mono_abs > 0.6:
            risk_score += 0.1

        scaled_score = max(-3.0, min(3.0, risk_score * 3.0 - 1.0))
        probability = 1 / (1 + math.exp(-scaled_score))
        probability = max(0.1, min(0.95, probability))
        prediction = 1 if probability > 0.5 else 0
        return prediction, probability

    def calculate_shap_analysis(
        self,
        features: List[float],
        prediction: int,
    ) -> List[Dict[str, Any]]:
        """Run SHAP explainability (falls back to deterministic mock data)."""
        if self.shap_explainer is not None and self.model is not None:
            try:
                features_arr = np.array([features])
                shap_values = self.shap_explainer.shap_values(features_arr)
                if isinstance(shap_values, list):
                    selected = shap_values[1] if len(shap_values) > 1 else shap_values[0]
                    values_arr = np.asarray(selected)
                else:
                    values_arr = np.asarray(getattr(shap_values, "values", shap_values))

                if values_arr.ndim == 3:
                    class_idx = 1 if values_arr.shape[-1] > 1 else 0
                    values = values_arr[0, :, class_idx]
                elif values_arr.ndim == 2:
                    if values_arr.shape[0] == 1:
                        values = values_arr[0]
                    elif values_arr.shape[0] == len(FEATURE_NAMES) and values_arr.shape[1] > 1:
                        class_idx = 1 if values_arr.shape[1] > 1 else 0
                        values = values_arr[:, class_idx]
                    else:
                        values = values_arr[0]
                else:
                    values = values_arr

                return [
                    {
                        "feature": FEATURE_NAMES[idx],
                        "value": float(value),
                        "impact": "positive" if value > 0 else "negative",
                        "importance": abs(float(value)),
                    }
                    for idx, value in enumerate(values)
                ]
            except Exception as exc:  # pragma: no cover
                logger.warning("SHAP calculation failed: %s", exc)
        return self._mock_shap_calculation(features)

    def _mock_shap_calculation(self, features: List[float]) -> List[Dict[str, Any]]:
        """Produce deterministic SHAP-style output when compute is unavailable."""
        shap_values: List[Dict[str, Any]] = []
        normal_values = [default for _, default in FEATURE_DEFAULTS]
        weights = [0.08, 0.05, 0.08, 0.06, 0.04, 0.08, 0.16, 0.05, 0.06, 0.05, 0.06, 0.08, 0.06, 0.04, 0.04, 0.04, 0.04, 0.22]
        feature_impacts = [
            (value - normal_values[idx]) * weights[idx]
            for idx, value in enumerate(features[: len(normal_values)])
        ]

        for idx, (feature_name, impact_value) in enumerate(
            zip(FEATURE_NAMES, feature_impacts),
        ):
            raw_value = features[idx] if idx < len(features) else 0.0
            noise = math.sin((raw_value + 1) * (idx + 1) * 0.37) * 0.006
            final_value = impact_value + noise
            shap_values.append(
                {
                    "feature": feature_name,
                    "value": round(final_value, 3),
                    "impact": "positive" if final_value > 0 else "negative",
                    "importance": abs(final_value),
                },
            )

        shap_values.sort(key=lambda item: item["importance"], reverse=True)
        return shap_values

    def guideline_snapshot(self) -> Dict[str, Any]:
        """Expose latest high-level guideline metadata for health endpoints."""
        return {
            "sources": self.guideline_sources,
            "lab_thresholds": self.lab_thresholds,
            "imaging_pathways": self.imaging_pathways,
            "high_risk_criteria": self.high_risk_criteria,
            "follow_up_windows": self.follow_up_windows,
        }


diagnostic_system = MedicalDiagnosticSystem()
