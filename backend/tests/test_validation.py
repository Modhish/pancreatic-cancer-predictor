from typing import Dict


def test_parse_patient_inputs_defaults():
    from backend.app import parse_patient_inputs, FEATURE_DEFAULTS

    payload: Dict[str, float] = {}
    features, normalized = parse_patient_inputs(payload)
    assert len(features) == len(FEATURE_DEFAULTS)
    for (key, default), value in zip(FEATURE_DEFAULTS, features):
        assert isinstance(value, float)
        assert normalized[key] == value


def test_validate_medical_data_in_range():
    from backend.app import MedicalDiagnosticSystem, FEATURE_DEFAULTS

    system = MedicalDiagnosticSystem()
    sample = {k: float(v) for k, v in FEATURE_DEFAULTS}
    ok, errors = system.validate_medical_data(sample)
    assert ok is True
    assert errors == []


def test_validate_medical_data_out_of_range():
    from backend.app import MedicalDiagnosticSystem

    system = MedicalDiagnosticSystem()
    bad = {
        'wbc': 100.0,  # invalid
        'rbc': 0.1,    # invalid
        'plt': 1000.0, # invalid
        'hgb': 10.0,   # invalid
        'hct': 10.0,   # invalid
        'mpv': 20.0,   # invalid
        'pdw': 50.0,   # invalid
        'mono': 2.0,   # invalid
        'baso_abs': 1.0, # invalid
        'baso_pct': 10.0, # invalid
        'glucose': 20.0,  # invalid
        'act': 100.0,     # invalid
        'bilirubin': 100.0 # invalid
    }
    ok, errors = system.validate_medical_data(bad)
    assert ok is False
    assert isinstance(errors, list) and errors


def test_rule_based_prediction_thresholds():
    from backend.app import MedicalDiagnosticSystem

    system = MedicalDiagnosticSystem()
    # Very low-risk values near normal
    features = [6.5, 4.5, 250, 140, 42, 9.5, 14, 0.5, 0.03, 0.8, 5.0, 28, 12]
    pred, prob = system._rule_based_prediction(features)
    assert 0.1 <= prob <= 0.95
    assert pred in (0, 1)

