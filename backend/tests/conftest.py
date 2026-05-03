import os
from pathlib import Path
import sys
import uuid

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture(scope="session", autouse=True)
def _set_test_env(tmp_path_factory):
    # Ensure LLM stays disabled during tests unless explicitly provided
    os.environ["GROQ_API_KEY"] = ""
    os.environ.setdefault("FLASK_DEBUG", "False")
    os.environ.setdefault(
        "DIAGNOAI_DB_PATH",
        str(tmp_path_factory.mktemp("diagnoai-db") / "test.sqlite3"),
    )
    yield


@pytest.fixture(scope="session")
def app_instance():
    from app import app as flask_app

    return flask_app


@pytest.fixture()
def client(app_instance):
    return app_instance.test_client()


@pytest.fixture()
def auth_headers(client):
    email = f"patient-{uuid.uuid4().hex}@example.test"
    response = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Test Patient",
            "email": email,
            "password": "test-password-123",
            "role": "patient",
        },
    )
    assert response.status_code == 201
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}
