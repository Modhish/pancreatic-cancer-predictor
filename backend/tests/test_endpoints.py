import json

SAMPLE_PATIENT = {
    "wbc": 5.8,
    "rbc": 4.5,
    "plt": 220.0,
    "hgb": 135.0,
    "hct": 42.0,
    "mpv": 9.5,
    "pdw": 16.0,
    "neut_abs": 3.5,
    "neut_pct": 60.0,
    "lymph_abs": 2.0,
    "lymph_pct": 30.0,
    "mono_abs": 0.5,
    "mono_pct": 6.0,
    "eos_abs": 0.2,
    "eos_pct": 2.0,
    "baso_abs": 0.03,
    "baso_pct": 0.5,
    "esr": 12.0,
}


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.get_json()
    assert data["status"] == "ok"
    assert "timestamp" in data
    assert isinstance(data.get("model_loaded"), bool)


def test_status(client):
    r = client.get("/api/status")
    assert r.status_code == 200
    data = r.get_json()
    assert data["status"] == "ok"
    assert "model_metrics" in data
    assert isinstance(data.get("features"), dict)
    assert "order" in data["features"]


def test_model_info(client):
    r = client.get("/api/model-info")
    assert r.status_code == 200
    data = r.get_json()
    assert data["model_name"]
    assert isinstance(data.get("features"), list)
    assert isinstance(data.get("metrics"), dict)


def test_predict_happy_path(client, auth_headers):
    payload = {
        **SAMPLE_PATIENT,
        "language": "en",
        "client_type": "patient",
    }
    r = client.post("/api/predict", data=json.dumps(payload), content_type="application/json", headers=auth_headers)
    assert r.status_code == 200
    data = r.get_json()
    for key in ("prediction", "probability", "shap_values", "risk_level", "processing_time"):
        assert key in data


def test_predict_validation_error(client, auth_headers):
    payload = {"wbc": "not-a-number"}
    r = client.post("/api/predict", data=json.dumps(payload), content_type="application/json", headers=auth_headers)
    assert r.status_code == 400
    data = r.get_json()
    assert data["status"] == "validation_error"


def test_commentary_and_report(client, auth_headers):
    payload = {
        **SAMPLE_PATIENT,
        "language": "en",
        "client_type": "patient",
    }
    r = client.post("/api/predict", data=json.dumps(payload), content_type="application/json", headers=auth_headers)
    assert r.status_code == 200
    result = r.get_json()

    r2 = client.post(
        "/api/commentary",
        data=json.dumps(
            {
                "analysis": result,
                "patient_values": result.get("patient_values", {}),
                "shap_values": result.get("shap_values", []),
                "language": "en",
                "client_type": "patient",
            }
        ),
        content_type="application/json",
        headers=auth_headers,
    )
    assert r2.status_code == 200
    data2 = r2.get_json()
    assert "ai_explanation" in data2

    r3 = client.post(
        "/api/report",
        data=json.dumps(
            {
                "patient": result.get("patient_values", {}),
                "analysis": result,
                "language": "en",
            }
        ),
        content_type="application/json",
        headers=auth_headers,
    )
    assert r3.status_code == 200
    assert r3.headers.get("Content-Type", "").startswith("application/pdf")


def test_commentary_requires_existing_model_context(client, auth_headers):
    resp = client.post(
        "/api/commentary",
        data=json.dumps({"patient_values": SAMPLE_PATIENT, "language": "ru"}),
        content_type="application/json",
        headers=auth_headers,
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["status"] == "validation_error"


def test_report_handles_object_shap(client, auth_headers):
    """Ensure shap_values supplied as an object does not break PDF generation."""
    payload = {
        "patient": SAMPLE_PATIENT,
        "analysis": {
            "probability": 0.4,
            "risk_level": "Moderate",
            "language": "en",
            "shap_values": {"feature": "wbc", "value": 0.12, "impact": "positive"},
        },
    }
    resp = client.post("/api/report", data=json.dumps(payload), content_type="application/json", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers.get("Content-Type", "").startswith("application/pdf")
