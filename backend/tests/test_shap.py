def test_mock_shap_returns_all_features_sorted():
    from core.constants import FEATURE_DEFAULTS
    from services.model_engine import MedicalDiagnosticSystem

    system = MedicalDiagnosticSystem()
    features = [float(default) for _, default in FEATURE_DEFAULTS]
    values = system._mock_shap_calculation(features)
    assert isinstance(values, list)
    assert len(values) == len(FEATURE_DEFAULTS)
    # Ensure sorted by importance desc
    importances = [v["importance"] for v in values]
    assert importances == sorted(importances, reverse=True)
