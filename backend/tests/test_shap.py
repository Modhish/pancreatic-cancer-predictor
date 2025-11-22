def test_mock_shap_returns_sorted_top9():
    from services.model_engine import MedicalDiagnosticSystem

    system = MedicalDiagnosticSystem()
    # Nominal inputs
    features = [6.5, 4.5, 250, 140, 42, 9.5, 14, 0.5, 0.03, 0.8, 5.0, 28, 12]
    values = system._mock_shap_calculation(features)
    assert isinstance(values, list)
    assert len(values) == 9
    # Ensure sorted by importance desc
    importances = [v["importance"] for v in values]
    assert importances == sorted(importances, reverse=True)
