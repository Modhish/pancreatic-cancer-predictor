from __future__ import annotations

import os
import json
import re
from typing import Any, Dict, List

from core.constants import (
    COMMENTARY_LOCALE,
    FEATURE_DEFAULTS,
    FEATURE_LABELS,
    RU_FEATURE_LABELS,
)
from core.settings import logger
from utils.text import is_readable_russian, repair_text_encoding

from .llm_client import groq_client

PROFESSIONAL_AUDIENCES = {
    "doctor",
    "clinician",
    "provider",
    "specialist",
    "medical",
    "hospital",
    "physician",
}
SCIENTIST_AUDIENCES = {"scientist", "scientists", "researcher", "researchers"}

UNSAFE_CLAIM_PATTERNS = [
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\byou have pancreatic cancer\b",
        r"\bpatient has pancreatic cancer\b",
        r"\bconfirmed pancreatic cancer\b",
        r"\bdiagnosis\s*:\s*pancreatic cancer\b",
        r"\bdefinitive diagnosis of pancreatic cancer\b",
        r"\bfinal diagnosis\s*:\s*pancreatic cancer\b",
        r"\bstart chemotherapy\b",
        r"\bbegin chemotherapy\b",
        r"\bprescribe\b",
        r"у\s+вас\s+рак\s+поджелудочной",
        r"пациент\s+имеет\s+рак\s+поджелудочной",
        r"подтвержден[а-я]*\s+рак\s+поджелудочной",
        r"диагноз\s*:\s*рак\s+поджелудочной",
        r"окончательный\s+диагноз\s*:\s*рак",
        r"начать\s+химиотерапию",
        r"назначить\s+химиотерапию",
    )
]


def _contains_unsafe_claim(text: str) -> bool:
    """Detect LLM claims that turn risk assessment into diagnosis or treatment orders."""
    return any(pattern.search(text or "") for pattern in UNSAFE_CLAIM_PATTERNS)


def _normalize_language(language: str | None) -> str:
    value = str(language or "en").strip().lower()
    return value or "en"


def _normalize_audience(client_type: str | None) -> str:
    value = str(client_type or "patient").strip().lower()
    return value or "patient"


def _select_audience_bundle(
    locale_bundle: Dict[str, Any],
    client_type: str,
) -> tuple[Dict[str, Any], bool, bool]:
    audience_key = _normalize_audience(client_type)
    scientist_mode = audience_key in SCIENTIST_AUDIENCES
    professional_mode = scientist_mode or audience_key in PROFESSIONAL_AUDIENCES

    if scientist_mode:
        audience_bundle = (
            locale_bundle.get("scientist")
            or locale_bundle.get("professional")
            or locale_bundle.get("patient", {})
        )
    elif professional_mode:
        audience_bundle = locale_bundle.get("professional") or locale_bundle.get("patient", {})
    else:
        audience_bundle = (
            locale_bundle.get("patient")
            or locale_bundle.get("professional")
            or locale_bundle.get("scientist", {})
        )

    return audience_bundle or {}, professional_mode, scientist_mode


def _format_top_factor_lines(
    shap_values: List[Dict[str, Any]],
    audience_bundle: Dict[str, Any],
    locale_code: str,
) -> List[str]:
    if locale_code == "ru":
        feature_labels = RU_FEATURE_LABELS or FEATURE_LABELS.get("ru", FEATURE_LABELS["en"])
    else:
        feature_labels = FEATURE_LABELS["en"]

    impact_terms = audience_bundle.get(
        "impact_terms",
        {"positive": "increases risk", "negative": "reduces risk", "neutral": "neutral contribution"},
    )

    lines: List[str] = []
    for shap_info in shap_values[:5]:
        feature_key = str(shap_info.get("feature", "Feature")).upper()
        label = feature_labels.get(feature_key, feature_key.replace("_", " ").title())
        impact_key = str(shap_info.get("impact", "neutral")).lower()
        if impact_key not in impact_terms:
            impact_key = "neutral"
        impact_phrase = impact_terms.get(impact_key, impact_terms.get("neutral", "neutral contribution"))

        raw_value = shap_info.get("value")
        try:
            value_repr = f"{float(raw_value):+.3f}"
        except (TypeError, ValueError):
            value_repr = str(raw_value) if raw_value is not None else "N/A"

        lines.append(f"- {label}: {impact_phrase} ({value_repr})")

    default_driver = audience_bundle.get("default_driver")
    while len(lines) < 5 and default_driver:
        lines.append(f"- {default_driver}")

    return lines


def generate_clinical_commentary(
    self,
    prediction: int,
    probability: float,
    shap_values: List[Dict[str, Any]],
    patient_data: List[float],
    language: str = "en",
    client_type: str = "patient",
) -> str:
    """Generate AI-powered clinical commentary tailored to the audience."""

    language_code = _normalize_language(language)
    audience_key = _normalize_audience(client_type)
    locale_code = "ru" if language_code.startswith("ru") else "en"
    locale_bundle = COMMENTARY_LOCALE.get(locale_code, COMMENTARY_LOCALE["en"])
    audience_bundle, professional_mode, scientist_mode = _select_audience_bundle(locale_bundle, audience_key)

    probability_label = audience_bundle.get(
        "probability_label",
        locale_bundle.get("probability_label", "Risk probability"),
    )

    risk_level = "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
    risk_label = locale_bundle.get("risk_labels", {}).get(risk_level, risk_level.upper())
    header_text = audience_bundle.get("header_template", "CLINICAL DOSSIER | {risk} RISK").format(risk=risk_label)
    response_structure = audience_bundle.get("outline_template", "{header}\n{probability_label}: <...>").format(
        header=header_text,
        probability_label=probability_label,
    )

    top_factors = [str(sv.get("feature", "Unknown")) for sv in shap_values[:5]]

    # Prefer audience-specific language prompt (e.g., scientist) and fall back to locale-level prompt
    language_instruction = audience_bundle.get(
        "language_prompt",
        locale_bundle.get("language_prompt", "Respond clearly and precisely."),
    )

    audience_instruction = audience_bundle.get("audience_guidance", "")
    scientist_instruction = ""
    if scientist_mode:
        scientist_instruction = (
            "You are tailoring the response for biomedical or translational researchers. "
            "Highlight mechanisms of action, signaling pathways, biomarker trajectories, "
            "clinical trial evidence, and sources of bias. Differentiate this guidance from clinician-facing "
            "instructions by focusing on research implications, data interpretation, and mechanistic detail."
        )

    def _safe_patient_value(idx: int, default: float = 0.0) -> float:
        try:
            return float(patient_data[idx])
        except (TypeError, ValueError, IndexError):
            return default

    if groq_client is not None:
        top_factor_lines = "\n".join(
            f"- {sv.get('feature', 'Unknown')}: {sv.get('value', 0.0)} ({sv.get('impact', 'neutral')} impact)"
            for sv in shap_values[:5]
        )
        selected_lab_lines = "\n".join(
            f"- {feature.upper()}: {_safe_patient_value(idx, default):.2f}"
            for idx, (feature, default) in enumerate(FEATURE_DEFAULTS)
        )

        prompt = f"""
You are a medical AI assistant explaining a pancreatic cancer screening/risk-support assessment.
This is a bachelor research prototype and decision-support aid, not a diagnostic medical device.

MODEL PREDICTION: {'High Risk - Additional Evaluation Required' if prediction == 1 else 'Low Risk Screen'}
RISK PROBABILITY: {probability:.1%}
RISK LEVEL: {risk_level}
HEADER TO USE: {header_text}
PROBABILITY LABEL: {probability_label}
TOP CONTRIBUTORS: {', '.join(top_factors) or 'None supplied'}

TOP CONTRIBUTING FACTORS:
{top_factor_lines or 'No SHAP factors available'}

SELECTED CBC/ESR LAB VALUES:
{selected_lab_lines}

{response_structure}

Be accurate, align with audience expectations, state that this is a screening/risk-support aid, and provide clear follow-up guidance.
You cannot override, reinterpret, or replace the model prediction, probability, or SHAP factors.
Do not say the patient has cancer, do not write "diagnosis: cancer", and do not order treatment such as chemotherapy.
{audience_instruction}
{scientist_instruction}
{language_instruction}
End with a concise reminder that definitive care decisions rest with the treating medical team.
"""

        try:
            response = groq_client.chat.completions.create(
                model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=600,
            )
            ai_text = response.choices[0].message.content or ""
            ai_text = repair_text_encoding(ai_text)
            if _contains_unsafe_claim(ai_text):
                raise ValueError("LLM output contained unsafe diagnostic or treatment wording")
            if locale_code == "ru" and not is_readable_russian(ai_text):
                raise ValueError("LLM output unreadable in requested language")
            return ai_text
        except Exception as exc:  # pragma: no cover
            logger.warning("Falling back to template commentary: %s", exc)

    if locale_code == "ru":
        ru_audience = "scientist" if scientist_mode else "doctor" if professional_mode else "patient"
        return self._generate_ru_commentary(
            prediction,
            probability,
            shap_values,
            patient_data,
            audience=ru_audience,
        )

    return self._generate_fallback_commentary(
        prediction,
        probability,
        shap_values,
        language=language_code,
        client_type=audience_key,
    )


def _generate_fallback_commentary(
    self,
    prediction: int,
    probability: float,
    shap_values: List[Dict[str, Any]],
    language: str = "en",
    client_type: str = "patient",
) -> str:
    """Deterministic fallback commentary using locale templates."""

    locale_code = "ru" if _normalize_language(language).startswith("ru") else "en"
    locale_bundle = COMMENTARY_LOCALE.get(locale_code, COMMENTARY_LOCALE["en"])
    audience_bundle, professional_mode, scientist_mode = _select_audience_bundle(locale_bundle, client_type)

    probability_pct = f"{probability:.1%}"
    risk_level = "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
    risk_label = locale_bundle.get("risk_labels", {}).get(risk_level, risk_level.upper())
    probability_label = audience_bundle.get(
        "probability_label",
        locale_bundle.get("probability_label", "Risk probability"),
    )
    header_template = audience_bundle.get("header_template", "CLINICAL DOSSIER | {risk} RISK")
    base_lines: List[str] = [
        header_template.format(risk=risk_label),
        f"{probability_label}: {probability_pct}",
        "",
    ]

    top_factor_lines = _format_top_factor_lines(shap_values, audience_bundle, locale_code)

    if professional_mode or scientist_mode:
        synopsis_map = audience_bundle.get("synopsis", {})
        actions_map = audience_bundle.get("actions", {})
        coordination_map = audience_bundle.get("coordination", {})
        monitoring_map = audience_bundle.get("monitoring", {})

        lines = base_lines + [audience_bundle.get("drivers_title", "TOP SIGNAL DRIVERS")]
        lines.extend(top_factor_lines)
        lines.append("")
        lines.append(audience_bundle.get("synopsis_title", "EVIDENCE SYNTHESIS"))
        lines.append(synopsis_map.get(risk_level, synopsis_map.get("Low", "")))

        if actions_map:
            lines.append("")
            lines.append(audience_bundle.get("actions_title", "RECOMMENDED ACTIONS"))
            lines.extend(f"- {item}" for item in actions_map.get(risk_level, actions_map.get("Low", [])))

        if coordination_map:
            lines.append("")
            lines.append(audience_bundle.get("coordination_title", "COORDINATION"))
            lines.extend(f"- {item}" for item in coordination_map.get(risk_level, coordination_map.get("Low", [])))

        if monitoring_map:
            lines.append("")
            lines.append(audience_bundle.get("monitoring_title", "MONITORING"))
            lines.extend(f"- {item}" for item in monitoring_map.get(risk_level, monitoring_map.get("Low", [])))

        lines.append("")
        lines.append(audience_bundle.get("reminder_title", "SAFE PRACTICE REMINDER"))
        lines.append(audience_bundle.get("reminder_text", "All recommendations require specialist confirmation."))
        return "\n".join(lines)

    core_map = audience_bundle.get("core_message", {})
    next_steps_map = audience_bundle.get("next_steps", {})
    warning_items = audience_bundle.get("warning_signs", [])
    support_items = audience_bundle.get("support", [])
    timeline_map = audience_bundle.get("timeline")
    questions = audience_bundle.get("questions")

    core_text = core_map.get(risk_level, core_map.get("Low", "")).format(probability=probability_pct)

    lines = base_lines + [
        audience_bundle.get("core_title", "WHAT THIS MEANS"),
        core_text,
        "",
        audience_bundle.get("drivers_title", "TOP SIGNAL DRIVERS"),
    ]
    lines.extend(top_factor_lines)
    lines.append("")

    if next_steps_map:
        lines.append(audience_bundle.get("next_steps_title", "NEXT STEPS"))
        lines.extend(f"- {item}" for item in next_steps_map.get(risk_level, next_steps_map.get("Low", [])))
        lines.append("")

    if warning_items:
        lines.append(audience_bundle.get("warnings_title", "WARNING SIGNS"))
        lines.extend(f"- {item}" for item in warning_items)
        lines.append("")

    if support_items:
        lines.append(audience_bundle.get("support_title", "SUPPORT OPTIONS"))
        lines.extend(f"- {item}" for item in support_items)
        lines.append("")

    if isinstance(timeline_map, dict) and timeline_map:
        lines.append(audience_bundle.get("timeline_title", "MONITORING PLAN"))
        lines.extend(f"- {item}" for item in timeline_map.get(risk_level, timeline_map.get("Low", [])))
        lines.append("")

    if isinstance(questions, list) and questions:
        lines.append(audience_bundle.get("questions_title", "QUESTIONS FOR CLINICIAN"))
        lines.extend(f"- {question}" for question in questions)
        lines.append("")

    lines.append(audience_bundle.get("reminder_title", "REMINDER"))
    lines.append(
        audience_bundle.get(
            "reminder_text",
            "This screening commentary does not replace individualized medical advice.",
        )
    )
    return "\n".join(lines)


def _generate_ru_commentary(
    self,
    prediction: int,
    probability: float,
    shap_values: List[Dict[str, Any]],
    patient_data: List[float],
    audience: str = "patient",
) -> str:
    """Proxy to the fallback generator with Russian locale."""

    _ = patient_data  # placeholder to keep signature compatibility
    return self._generate_fallback_commentary(
        prediction,
        probability,
        shap_values,
        language="ru",
        client_type=audience,
    )


def _format_chart_driver_summary(shap_values: List[Dict[str, Any]], limit: int = 5) -> str:
    rows: List[str] = []
    sorted_values = sorted(
        shap_values,
        key=lambda item: abs(float(item.get("value") or item.get("importance") or 0)),
        reverse=True,
    )
    for item in sorted_values[:limit]:
        feature = str(item.get("feature") or "Feature")
        try:
            value = float(item.get("value", 0.0))
            value_text = f"{value:+.3f}"
        except (TypeError, ValueError):
            value_text = str(item.get("value") or "N/A")
        rows.append(f"{feature}: {value_text}")
    return "; ".join(rows)


def _fallback_shap_chart_explanations(
    probability: float,
    shap_values: List[Dict[str, Any]],
    language: str,
) -> Dict[str, str]:
    top = sorted(
        shap_values,
        key=lambda item: abs(float(item.get("value") or item.get("importance") or 0)),
        reverse=True,
    )
    first = str(top[0].get("feature", "the strongest feature")) if top else "the strongest feature"
    second = str(top[1].get("feature", "the next strongest feature")) if len(top) > 1 else "the next strongest feature"
    positive = sum(1 for item in shap_values if float(item.get("value") or 0) > 0)
    negative = sum(1 for item in shap_values if float(item.get("value") or 0) < 0)
    probability_pct = f"{probability:.1%}"

    if str(language or "").lower().startswith("ru"):
        return {
            "bar": (
                f"Столбчатая диаграмма ранжирует все признаки по абсолютному вкладу SHAP. "
                f"Наибольший вклад дает {first}; красные значения повышают расчетный риск, "
                f"синие значения снижают его."
            ),
            "line": (
                f"Линейная траектория показывает, как базовый уровень постепенно меняется под влиянием "
                f"ведущих факторов и приходит к итоговой вероятности {probability_pct}. "
                f"График удобен для объяснения последовательного накопления вклада."
            ),
            "decision": (
                f"Decision plot показывает накопительный путь модели от базового значения к итоговой оценке. "
                f"Он помогает увидеть, как {first}, {second} и остальные признаки последовательно меняют сигнал риска."
            ),
            "beeswarm": (
                f"Диаграмма распределения показывает направление каждого SHAP-сигнала относительно нейтральной оси. "
                f"В этом результате {positive} признаков смещают оценку вверх, а {negative} признаков смещают ее вниз."
            ),
            "waterfall": (
                f"Waterfall-график показывает арифметику прогноза: от ожидаемого базового значения к индивидуальной оценке. "
                f"Главные изменения связаны с {first} и {second}; это не диагноз, а объяснение модельного расчета."
            ),
        }

    return {
        "bar": (
            f"The bar chart ranks all features by absolute SHAP contribution. "
            f"The strongest driver is {first}; red values push the model risk upward, "
            f"while blue values pull it downward."
        ),
        "line": (
            f"The trajectory chart shows how the baseline estimate changes as the leading factors are added, "
            f"ending at a model probability of {probability_pct}. It is best for explaining the step-by-step accumulation of risk signal."
        ),
        "beeswarm": (
            f"The beeswarm-style spread shows each SHAP signal relative to the neutral axis. "
            f"In this result, {positive} features move the estimate upward and {negative} move it downward."
        ),
        "waterfall": (
            f"The waterfall chart shows the prediction arithmetic from expected baseline to individualized output. "
            f"The largest changes are linked to {first} and {second}; this explains the model calculation, not a diagnosis."
        ),
    }


def generate_shap_chart_explanations(
    self,
    prediction: int,
    probability: float,
    shap_values: List[Dict[str, Any]],
    patient_data: List[float],
    language: str = "en",
    client_type: str = "patient",
) -> Dict[str, str]:
    """Generate short explanations for each SHAP visualization."""

    _ = (self, prediction, patient_data, client_type)
    language_code = _normalize_language(language)
    fallback = _fallback_shap_chart_explanations(probability, shap_values, language_code)

    if groq_client is None or not shap_values:
        return fallback

    top_factor_lines = _format_chart_driver_summary(shap_values, limit=8)
    locale_instruction = (
        "Respond in Russian." if language_code.startswith("ru") else "Respond in English."
    )
    prompt = f"""
Write concise explanations for four SHAP visualizations in a pancreatic cancer risk-support research prototype.
Return only valid JSON with exactly these string keys: bar, line, beeswarm, waterfall.
Each value must be 1-2 sentences, clinically cautious, and tied to the supplied SHAP data.
Do not diagnose cancer, do not recommend treatment, and do not override the model result.

Risk probability: {probability:.1%}
Top SHAP factors: {top_factor_lines}
{locale_instruction}
"""

    try:
        response = groq_client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=500,
        )
        raw = repair_text_encoding(response.choices[0].message.content or "")
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        parsed = json.loads(match.group(0) if match else raw)
        explanations = {
            key: str(parsed.get(key) or fallback[key]).strip()
            for key in ("bar", "line", "beeswarm", "waterfall")
        }
        joined = "\n".join(explanations.values())
        if _contains_unsafe_claim(joined):
            raise ValueError("Chart explanation contained unsafe wording")
        if language_code.startswith("ru") and not is_readable_russian(joined):
            raise ValueError("Chart explanation unreadable in requested language")
        return explanations
    except Exception as exc:  # pragma: no cover
        logger.warning("Falling back to template SHAP chart explanations: %s", exc)
        return fallback


def _build_audience_commentaries(
    self,
    prediction: int,
    probability: float,
    shap_values: List[Dict[str, Any]],
    patient_data: List[float],
    language: str,
    primary_audience: str,
    primary_text: str,
) -> Dict[str, str]:
    """Precompute commentary variants for patient, doctor, and scientist toggles."""

    language_code = _normalize_language(language)
    primary_key = _normalize_audience(primary_audience)
    variants: Dict[str, str] = {}

    for audience in ("patient", "doctor", "scientist"):
        if audience == primary_key:
            variants[audience] = primary_text
            continue

        try:
            if language_code.startswith("ru"):
                variants[audience] = self._generate_ru_commentary(
                    prediction,
                    probability,
                    shap_values,
                    patient_data,
                    audience=audience,
                )
            else:
                variants[audience] = self._generate_fallback_commentary(
                    prediction,
                    probability,
                    shap_values,
                    language=language_code,
                    client_type=audience,
                )
        except Exception as exc:  # pragma: no cover
            logger.warning("Failed to build %s commentary variant: %s", audience, exc)
            continue

    return variants


__all__ = [
    "generate_clinical_commentary",
    "generate_shap_chart_explanations",
    "_generate_fallback_commentary",
    "_generate_ru_commentary",
    "_build_audience_commentaries",
]
