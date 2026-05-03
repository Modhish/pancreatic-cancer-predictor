from typing import Dict


def test_parse_patient_inputs_defaults():
    from core.constants import FEATURE_DEFAULTS
    from services.pipeline import parse_patient_inputs

    payload: Dict[str, float] = {}
    features, normalized = parse_patient_inputs(payload)
    assert len(features) == len(FEATURE_DEFAULTS)
    for (key, default), value in zip(FEATURE_DEFAULTS, features):
        assert isinstance(value, float)
        assert normalized[key] == value


def test_validate_medical_data_in_range():
    from core.constants import FEATURE_DEFAULTS
    from services.model_engine import MedicalDiagnosticSystem

    system = MedicalDiagnosticSystem()
    sample = {k: float(v) for k, v in FEATURE_DEFAULTS}
    ok, errors = system.validate_medical_data(sample)
    assert ok is True
    assert errors == []


def test_validate_medical_data_out_of_range():
    from services.model_engine import MedicalDiagnosticSystem

    system = MedicalDiagnosticSystem()
    bad = {
        "wbc": 100.0,  # invalid
        "rbc": 0.1,  # invalid
        "plt": 1000.0,  # invalid
        "hgb": 10.0,  # invalid
        "hct": 10.0,  # invalid
        "mpv": 20.0,  # invalid
        "pdw": 50.0,  # invalid
        "neut_abs": 20.0,  # invalid
        "neut_pct": 95.0,  # invalid
        "lymph_abs": 10.0,  # invalid
        "lymph_pct": 90.0,  # invalid
        "mono_abs": 2.0,  # invalid
        "mono_pct": 30.0,  # invalid
        "eos_abs": 2.0,  # invalid
        "eos_pct": 20.0,  # invalid
        "baso_abs": 1.0,  # invalid
        "baso_pct": 10.0,  # invalid
        "esr": 100.0,  # invalid
    }
    ok, errors = system.validate_medical_data(bad)
    assert ok is False
    assert isinstance(errors, list) and errors


def test_rule_based_prediction_thresholds():
    from core.constants import FEATURE_DEFAULTS
    from services.model_engine import MedicalDiagnosticSystem

    system = MedicalDiagnosticSystem()
    features = [float(default) for _, default in FEATURE_DEFAULTS]
    pred, prob = system._rule_based_prediction(features)
    assert 0.1 <= prob <= 0.95
    assert pred in (0, 1)
