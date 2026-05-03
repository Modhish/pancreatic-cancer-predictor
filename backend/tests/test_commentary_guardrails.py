from services.commentary import _contains_unsafe_claim


def test_commentary_guardrail_blocks_diagnostic_claims():
    assert _contains_unsafe_claim("You have pancreatic cancer and should start chemotherapy.")
    assert _contains_unsafe_claim("Диагноз: рак поджелудочной железы.")
    assert _contains_unsafe_claim("У вас рак поджелудочной железы.")
    assert _contains_unsafe_claim("Необходимо назначить химиотерапию.")


def test_commentary_guardrail_allows_risk_assessment_language():
    text = (
        "This is a screening aid. The model estimates elevated risk, "
        "so the result should be reviewed by the treating medical team."
    )
    assert not _contains_unsafe_claim(text)
