from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    log_loss,
    matthews_corrcoef,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

FEATURE_COLUMNS = [
    "wbc",
    "rbc",
    "plt",
    "hgb",
    "hct",
    "mpv",
    "pdw",
    "neut_abs",
    "neut_pct",
    "lymph_abs",
    "lymph_pct",
    "mono_abs",
    "mono_pct",
    "eos_abs",
    "eos_pct",
    "baso_abs",
    "baso_pct",
    "esr",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a Random Forest model from the cleaned user CBC dataset."
    )
    parser.add_argument(
        "--csv",
        default="datasets/user_cbc_dataset.csv",
        help="Prepared CSV path.",
    )
    parser.add_argument(
        "--artifact",
        default="backend/models/user_cbc_rf.pkl",
        help="Output model artifact path.",
    )
    parser.add_argument(
        "--metrics-out",
        default="backend/models/user_cbc_rf.metrics.json",
        help="Output metrics JSON path.",
    )
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--val-size", type=float, default=0.1)
    return parser.parse_args()


def _class_balance(values: Sequence[int]) -> Dict[str, int]:
    counts = Counter(int(value) for value in values)
    return {
        "negative": int(counts.get(0, 0)),
        "positive": int(counts.get(1, 0)),
    }


def _load_dataset(csv_path: Path) -> Tuple[np.ndarray, np.ndarray]:
    if not csv_path.exists():
        raise FileNotFoundError(f"Prepared CSV not found: {csv_path}")

    rows: List[List[float]] = []
    labels: List[int] = []
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = [column for column in ["label", *FEATURE_COLUMNS] if column not in reader.fieldnames]
        if missing:
            raise ValueError(f"CSV is missing required columns: {missing}")

        for row in reader:
            labels.append(int(row["label"]))
            rows.append([float(row[column]) for column in FEATURE_COLUMNS])

    return np.asarray(rows, dtype=np.float32), np.asarray(labels, dtype=np.int32)


def _evaluate(model: RandomForestClassifier, x: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
    return _evaluate_with_threshold(model.predict_proba(x)[:, 1], y, threshold=0.5)


def _evaluate_with_threshold(
    probabilities: np.ndarray,
    y: np.ndarray,
    threshold: float,
) -> Dict[str, Any]:
    predictions = (probabilities >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, predictions, labels=[0, 1]).ravel()
    specificity = tn / (tn + fp) if (tn + fp) else None

    metrics: Dict[str, Any] = {
        "accuracy": round(float(accuracy_score(y, predictions)), 6),
        "precision": round(float(precision_score(y, predictions, zero_division=0)), 6),
        "recall": round(float(recall_score(y, predictions, zero_division=0)), 6),
        "specificity": round(float(specificity), 6) if specificity is not None else None,
        "f1_score": round(float(f1_score(y, predictions, zero_division=0)), 6),
        "mcc": round(float(matthews_corrcoef(y, predictions)), 6),
        "log_loss": round(float(log_loss(y, probabilities, labels=[0, 1])), 6),
        "brier_score": round(float(np.mean((probabilities - y) ** 2)), 6),
        "pr_auc": round(float(average_precision_score(y, probabilities)), 6),
        "threshold": round(float(threshold), 6),
        "rows": int(len(y)),
        "class_balance": _class_balance(y),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        },
    }
    metrics["roc_auc"] = round(float(roc_auc_score(y, probabilities)), 6)
    return metrics


def _best_threshold(probabilities: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
    best_metrics: Dict[str, Any] | None = None
    best_key: Tuple[float, float, float] | None = None

    for threshold in np.arange(0.2, 0.61, 0.05):
        metrics = _evaluate_with_threshold(probabilities, y, threshold=float(threshold))
        ranking_key = (
            float(metrics["f1_score"]),
            float(metrics["recall"]),
            float(metrics["mcc"]),
        )
        if best_key is None or ranking_key > best_key:
            best_key = ranking_key
            best_metrics = metrics

    if best_metrics is None:
        raise RuntimeError("Threshold search did not produce any metrics.")
    return best_metrics


def main() -> int:
    args = parse_args()
    csv_path = Path(args.csv)
    artifact_path = Path(args.artifact)
    metrics_path = Path(args.metrics_out)

    features, labels = _load_dataset(csv_path)

    train_val_x, test_x, train_val_y, test_y = train_test_split(
        features,
        labels,
        test_size=args.test_size,
        stratify=labels,
        random_state=args.random_state,
    )
    relative_val_size = args.val_size / (1.0 - args.test_size)
    train_x, val_x, train_y, val_y = train_test_split(
        train_val_x,
        train_val_y,
        test_size=relative_val_size,
        stratify=train_val_y,
        random_state=args.random_state,
    )

    candidates = [
        {"n_estimators": 200, "max_depth": None, "min_samples_leaf": 1},
        {"n_estimators": 400, "max_depth": None, "min_samples_leaf": 1},
        {"n_estimators": 200, "max_depth": 12, "min_samples_leaf": 1},
        {"n_estimators": 400, "max_depth": 12, "min_samples_leaf": 1},
        {"n_estimators": 200, "max_depth": None, "min_samples_leaf": 2},
        {"n_estimators": 400, "max_depth": None, "min_samples_leaf": 2},
        {"n_estimators": 200, "max_depth": 12, "min_samples_leaf": 2},
        {"n_estimators": 400, "max_depth": 12, "min_samples_leaf": 2},
    ]

    best_model: RandomForestClassifier | None = None
    best_params: Dict[str, Any] | None = None
    best_val_metrics: Dict[str, Any] | None = None
    best_threshold: float | None = None
    best_key: Tuple[float, float] | None = None

    for params in candidates:
        model = RandomForestClassifier(
            n_estimators=params["n_estimators"],
            max_depth=params["max_depth"],
            min_samples_leaf=params["min_samples_leaf"],
            class_weight="balanced",
            random_state=args.random_state,
            n_jobs=-1,
        )
        model.fit(train_x, train_y)
        val_probabilities = model.predict_proba(val_x)[:, 1]
        val_metrics = _best_threshold(val_probabilities, val_y)
        ranking_key = (
            float(val_metrics.get("f1_score") or 0.0),
            float(val_metrics.get("mcc") or 0.0),
        )
        if best_key is None or ranking_key > best_key:
            best_model = model
            best_params = dict(params)
            best_val_metrics = val_metrics
            best_threshold = float(val_metrics["threshold"])
            best_key = ranking_key

    if best_model is None or best_params is None or best_val_metrics is None or best_threshold is None:
        raise RuntimeError("No model candidate was selected.")

    train_probabilities = best_model.predict_proba(train_x)[:, 1]
    val_probabilities = best_model.predict_proba(val_x)[:, 1]
    test_probabilities = best_model.predict_proba(test_x)[:, 1]
    train_metrics = _evaluate_with_threshold(train_probabilities, train_y, threshold=best_threshold)
    validation_metrics = _evaluate_with_threshold(val_probabilities, val_y, threshold=best_threshold)
    test_metrics = _evaluate_with_threshold(test_probabilities, test_y, threshold=best_threshold)
    feature_importances = [
        {"feature": feature, "importance": round(float(importance), 6)}
        for feature, importance in sorted(
            zip(FEATURE_COLUMNS, best_model.feature_importances_),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)

    metadata = {
        "model_name": "Random Forest Classifier",
        "dataset_name": "User CBC dataset from Excel workbook",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source_csv": str(csv_path.resolve()),
        "target_name": "label",
        "feature_columns": FEATURE_COLUMNS,
        "random_state": args.random_state,
        "split": {
            "test_size": args.test_size,
            "validation_size": args.val_size,
            "train_rows": int(len(train_y)),
            "validation_rows": int(len(val_y)),
            "test_rows": int(len(test_y)),
        },
        "class_balance": {
            "overall": _class_balance(labels),
            "train": _class_balance(train_y),
            "validation": _class_balance(val_y),
            "test": _class_balance(test_y),
        },
        "best_params": best_params,
        "selected_threshold": round(best_threshold, 6),
        "feature_importances": feature_importances,
        "train_metrics": train_metrics,
        "validation_metrics": validation_metrics,
        "validation_threshold_search_best": best_val_metrics,
        "metrics": test_metrics,
    }

    joblib.dump(
        {
            "model": best_model,
            "model_name": metadata["model_name"],
            "created_at": metadata["created_at"],
            "source_csv": metadata["source_csv"],
            "target_name": metadata["target_name"],
            "feature_columns": FEATURE_COLUMNS,
            "split": metadata["split"],
            "class_balance": metadata["class_balance"],
            "metrics": test_metrics,
            "feature_importances": feature_importances,
            "best_params": best_params,
            "selected_threshold": round(best_threshold, 6),
        },
        artifact_path,
    )
    metrics_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Saved artifact: {artifact_path}")
    print(f"Saved metrics:  {metrics_path}")
    print(json.dumps(test_metrics, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
