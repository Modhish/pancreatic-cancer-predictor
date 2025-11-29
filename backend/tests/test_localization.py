import json

import pytest

EN_PROBABILITY_LABEL = "Risk probability"
RU_PROBABILITY_LABEL = "Вероятность риска"

SAMPLE_PATIENT = {
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


def _extract_explanation(payload: dict) -> str:
    # Response keys vary between camel/snake case across endpoints
    return payload.get("ai_explanation") or payload.get("aiExplanation") or ""


def _count_cyrillic(text: str) -> int:
    return sum(1 for ch in text if "\u0400" <= ch <= "\u04FF")


@pytest.mark.parametrize(
    "language, expected_label, validator",
    [
        ("en", EN_PROBABILITY_LABEL, lambda text: any(k in text for k in ("CLINICAL", "DOSSIER", "RISK"))),
        ("ru", RU_PROBABILITY_LABEL, lambda text: _count_cyrillic(text) >= 20),
    ],
)
def test_predict_localized_probability_label(client, language, expected_label, validator):
    payload = {**SAMPLE_PATIENT, "client_type": "patient", "language": language}
    response = client.post("/api/predict", data=json.dumps(payload), content_type="application/json")
    assert response.status_code == 200
    data = response.get_json()

    explanation = _extract_explanation(data)
    assert explanation, f"No explanation returned for locale {language}"
    assert expected_label in explanation
    assert validator(explanation)


def test_commentary_ru_localized(client):
    predict_payload = {**SAMPLE_PATIENT, "client_type": "patient", "language": "ru"}
    predict_resp = client.post("/api/predict", data=json.dumps(predict_payload), content_type="application/json")
    assert predict_resp.status_code == 200
    predict_json = predict_resp.get_json()

    commentary_payload = {
        "analysis": {**predict_json, "language": "ru"},
        "patient_values": predict_json.get("patient_values") or SAMPLE_PATIENT,
        "shap_values": predict_json.get("shap_values") or [],
        "language": "ru",
        "client_type": "patient",
    }
    commentary_resp = client.post(
        "/api/commentary", data=json.dumps(commentary_payload), content_type="application/json"
    )
    assert commentary_resp.status_code == 200
    commentary_json = commentary_resp.get_json()

    explanation = _extract_explanation(commentary_json)
    assert explanation, "No commentary explanation returned for RU"
    assert RU_PROBABILITY_LABEL in explanation
    assert _count_cyrillic(explanation) >= 20
