import io
import uuid


SAMPLE_CSV = """wbc,rbc,plt,hgb,hct,mpv,pdw,neut_abs,neut_pct,lymph_abs,lymph_pct,mono_abs,mono_pct,eos_abs,eos_pct,baso_abs,baso_pct,esr,label
5.8,4.5,220,135,42,9.5,16,3.5,60,2.0,30,0.5,6,0.2,2,0.03,0.5,12,0
8.4,4.2,360,125,39,10.5,18.5,6.5,75,1.0,18,0.8,10,0.1,1,0.04,0.6,35,1
"""


def _researcher_headers(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Test Researcher",
            "email": f"researcher-{uuid.uuid4().hex}@example.test",
            "password": "test-password-123",
            "role": "researcher",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


def test_batch_predict_success(client):
    auth_headers = _researcher_headers(client)
    payload = {
        "file": (io.BytesIO(SAMPLE_CSV.encode("utf-8")), "patients.csv"),
    }
    resp = client.post("/api/batch-predict", data=payload, content_type="multipart/form-data", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["summary"]["processed"] == 2
    assert data["summary"]["failed"] == 0
    assert len(data["results"]) == 2
    assert "calibration" in data
    assert data["calibration"]["sampled"] >= 2


def test_batch_predict_missing_file(client):
    auth_headers = _researcher_headers(client)
    resp = client.post("/api/batch-predict", headers=auth_headers)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "missing_file"


def test_batch_predict_requires_auth(client):
    payload = {
        "file": (io.BytesIO(SAMPLE_CSV.encode("utf-8")), "patients.csv"),
    }
    resp = client.post("/api/batch-predict", data=payload, content_type="multipart/form-data")
    assert resp.status_code == 401


def test_rbac_enforced_with_api_keys(monkeypatch, client):
    auth_headers = _researcher_headers(client)
    # Enable RBAC and configure a single clinician key
    monkeypatch.setenv("RBAC_ENABLED", "1")
    monkeypatch.setenv("ROLE_API_KEYS", "clinician:test-key")

    payload = {
        "file": (io.BytesIO(SAMPLE_CSV.encode("utf-8")), "patients.csv"),
    }

    denied = client.post("/api/batch-predict", data=payload, content_type="multipart/form-data", headers=auth_headers)
    assert denied.status_code == 403

    allowed = client.post(
        "/api/batch-predict",
        data={"file": (io.BytesIO(SAMPLE_CSV.encode("utf-8")), "patients.csv")},
        content_type="multipart/form-data",
        headers={**auth_headers, "X-Api-Key": "test-key"},
    )
    assert allowed.status_code == 200
