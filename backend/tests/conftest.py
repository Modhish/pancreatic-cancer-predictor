import os
from pathlib import Path
import sys

import pytest


@pytest.fixture(scope="session", autouse=True)
def _set_test_env():
    # Ensure LLM stays disabled during tests unless explicitly provided
    os.environ.setdefault("GROQ_API_KEY", "")
    os.environ.setdefault("FLASK_DEBUG", "False")
    yield


@pytest.fixture(scope="session")
def app_instance():
    # Make sure the backend package is importable regardless of cwd
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(backend_dir))

    from app import app as flask_app

    return flask_app


@pytest.fixture()
def client(app_instance):
    return app_instance.test_client()
