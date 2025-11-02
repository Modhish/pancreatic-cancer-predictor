import os
import pytest


@pytest.fixture(scope="session", autouse=True)
def _set_test_env():
    # Ensure LLM stays disabled during tests unless explicitly provided
    os.environ.setdefault("GROQ_API_KEY", "")
    os.environ.setdefault("FLASK_DEBUG", "False")
    yield


@pytest.fixture()
def app_instance():
    # Import within backend package context
    import importlib
    backend_app = importlib.import_module('app')
    return backend_app.app


@pytest.fixture()
def client(app_instance):
    return app_instance.test_client()
