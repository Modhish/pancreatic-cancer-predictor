#!/usr/bin/env python3
"""
Simple RU/EN smoke tests for /api/predict and /api/commentary.

Usage:
  python tests/smoke_localization.py [http://127.0.0.1:5000]

Checks that:
  - EN responses contain 'Risk probability' and look sane.
  - RU responses contain 'Вероятность риска' and have sufficient Cyrillic.
  - /api/commentary returns similarly valid text for both locales.
"""

from __future__ import annotations

import json
import sys
import urllib.request
import urllib.error
from typing import Any, Dict

API_BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5000"


def post_json(url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def count_cyr(s: str) -> int:
    return sum(1 for ch in s if "\u0400" <= ch <= "\u04FF")


def assert_ru_ok(text: str) -> None:
    assert "Вероятность риска" in text, "Missing RU probability label"
    assert count_cyr(text) >= 20, "RU text lacks sufficient Cyrillic characters"


def assert_en_ok(text: str) -> None:
    assert "Risk probability" in text, "Missing EN probability label"
    assert any(k in text for k in ["CLINICAL", "DOSSIER", "RISK"]), "EN header not found"


def main() -> int:
    print(f"Smoke tests against {API_BASE}")

    sample = {
        "wbc": 5.8,
        "rbc": 4.5,
        "plt": 220,
        "hgb": 135,
        "hct": 42,
        "mpv": 9.5,
        "pdw": 14,
        "mono": 0.5,
        "baso_abs": 0.03,
        "baso_pct": 0.8,
        "glucose": 5.2,
        "act": 28,
        "bilirubin": 12,
    }

    # EN predict
    en_predict = post_json(f"{API_BASE}/api/predict", {**sample, "client_type": "patient", "language": "en"})
    en_text = en_predict.get("ai_explanation") or en_predict.get("aiExplanation") or ""
    assert_en_ok(en_text)
    print("/api/predict EN: OK")

    # RU predict
    ru_predict = post_json(f"{API_BASE}/api/predict", {**sample, "client_type": "patient", "language": "ru"})
    ru_text = ru_predict.get("ai_explanation") or ru_predict.get("aiExplanation") or ""
    assert_ru_ok(ru_text)
    print("/api/predict RU: OK")

    # EN commentary -> RU commentary
    analysis = ru_predict
    analysis["language"] = "ru"
    comm = post_json(
        f"{API_BASE}/api/commentary",
        {
            "analysis": analysis,
            "patient_values": ru_predict.get("patient_values") or sample,
            "shap_values": ru_predict.get("shap_values") or [],
            "language": "ru",
            "client_type": "patient",
        },
    )
    comm_text = comm.get("ai_explanation") or comm.get("aiExplanation") or ""
    assert_ru_ok(comm_text)
    print("/api/commentary RU: OK")

    print("All localization smoke tests passed.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except urllib.error.URLError as e:
        print(f"Connection error: {e}")
        sys.exit(2)
    except AssertionError as e:
        print(f"Assertion failed: {e}")
        sys.exit(1)

