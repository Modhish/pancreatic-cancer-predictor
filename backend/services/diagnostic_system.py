from __future__ import annotations

from .commentary import (
    _build_audience_commentaries,
    _generate_fallback_commentary,
    _generate_ru_commentary,
    generate_clinical_commentary,
)
from .llm_client import groq_client
from .model_engine import MedicalDiagnosticSystem
from .pipeline import execute_diagnostic_pipeline
from .reporting import generate_pdf_report


# Attach the commentary and reporting helpers to the diagnostic system class.
MedicalDiagnosticSystem.generate_clinical_commentary = generate_clinical_commentary
MedicalDiagnosticSystem._generate_fallback_commentary = _generate_fallback_commentary
MedicalDiagnosticSystem._generate_ru_commentary = _generate_ru_commentary
MedicalDiagnosticSystem.generate_pdf_report = generate_pdf_report
MedicalDiagnosticSystem.build_audience_commentaries = _build_audience_commentaries


# Initialize the singleton diagnostic system instance used across the app.
diagnostic_system = MedicalDiagnosticSystem()


def run_diagnostic_pipeline(payload):
    """Public wrapper delegating to the pipeline executor."""
    return execute_diagnostic_pipeline(diagnostic_system, payload)


__all__ = ["diagnostic_system", "groq_client", "run_diagnostic_pipeline"]
