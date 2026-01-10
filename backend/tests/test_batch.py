import io
import json


SAMPLE_CSV = """wbc,rbc,plt,hgb,hct,mpv,pdw,mono,baso_abs,baso_pct,glucose,act,bilirubin,label
5.8,4.0,184,127,40,9.5,14,0.5,0.03,0.8,5.2,28,12,0
6.4,4.6,200,135,42,10.1,15,0.6,0.02,0.5,6.1,32,18,1
"""


def test_batch_predict_success(client):
    payload = {
        "file": (io.BytesIO(SAMPLE_CSV.encode("utf-8")), "patients.csv"),
    }
    resp = client.post("/api/batch-predict", data=payload, content_type="multipart/form-data")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["summary"]["processed"] == 2
    assert data["summary"]["failed"] == 0
    assert len(data["results"]) == 2
    assert "calibration" in data
    assert data["calibration"]["sampled"] >= 2


def test_batch_predict_missing_file(client):
    resp = client.post("/api/batch-predict")
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "missing_file"


def test_rbac_enforced_with_api_keys(monkeypatch, client):
    # Enable RBAC and configure a single clinician key
    monkeypatch.setenv("RBAC_ENABLED", "1")
    monkeypatch.setenv("ROLE_API_KEYS", "clinician:test-key")

    payload = {
        "wbc": 5.8,
        "rbc": 4.0,
        "plt": 184.0,
        "hgb": 127.0,
        "hct": 40.0,
        "mpv": 9.5,
        "pdw": 14.0,
        "mono": 0.5,
        "baso_abs": 0.03,
        "baso_pct": 0.8,
        "glucose": 5.2,
        "act": 28.0,
        "bilirubin": 12.0,
        "language": "en",
        "client_type": "patient",
    }

    denied = client.post("/api/predict", data=json.dumps(payload), content_type="application/json")
    assert denied.status_code == 403

    allowed = client.post(
        "/api/predict",
        data=json.dumps(payload),
        content_type="application/json",
        headers={"X-Api-Key": "test-key"},
    )
    assert allowed.status_code == 200
