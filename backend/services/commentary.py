from __future__ import annotations

from typing import Any, Dict, List

from core.constants import (
    COMMENTARY_LOCALE,
    FEATURE_LABELS,
    RU_FEATURE_LABELS,
)
from core.settings import logger
from utils.text import is_readable_russian, repair_text_encoding

from .llm_client import groq_client

def generate_clinical_commentary(self, prediction: int, probability: float,
                                 shap_values: List[Dict], patient_data: List[float],
                                 language: str = 'en', client_type: str = 'patient') -> str:
    """Generate AI-powered clinical commentary tailored to the audience."""
    
    language = (language or 'en').lower()
    audience = (client_type or 'patient').lower()
    is_professional = audience in {'doctor', 'clinician', 'provider', 'specialist', 'researcher', 'medical', 'hospital', 'physician', 'scientist', 'scientists'}
    locale_code = 'ru' if language.startswith('ru') else 'en'
    
    # Select the requested locale bundle (fallback to EN if unavailable)
    locale_bundle = COMMENTARY_LOCALE.get(locale_code, COMMENTARY_LOCALE['en'])
    scientist_mode = audience in {'scientist', 'researcher'}
    
    # Select audience bundle robustly; RU locale may omit 'patient'/'scientist'
    if scientist_mode:
        audience_bundle = locale_bundle.get('scientist') or locale_bundle.get('professional') or locale_bundle.get('patient', {})
    elif is_professional:
        audience_bundle = locale_bundle.get('professional') or locale_bundle.get('patient', {})
    else:
        audience_bundle = locale_bundle.get('patient') or locale_bundle.get('professional') or locale_bundle.get('scientist', {})
    
    probability_label = audience_bundle.get('probability_label', locale_bundle.get('probability_label', 'Risk probability'))
    
    try:
        # Determine risk level
        risk_level = "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
        
        # Get SHAP feature values
        top_factors = [sv['feature'] for sv in shap_values[:5]]
        risk_label = locale_bundle.get('risk_labels', {}).get(risk_level, risk_level.upper())
        header_text = audience_bundle.get('header_template', 'CLINICAL DOSSIER | {risk} RISK').format(risk=risk_label)
        
        # Structure for response (could be more dynamic depending on language)
        language_instruction = locale_bundle.get('language_prompt', 'Respond clearly and precisely.')
        audience_instruction = audience_bundle.get('audience_guidance', '')
        response_structure = audience_bundle.get('outline_template', '{header}\n{probability_label}: <...>')
        response_structure = response_structure.format(header=header_text, probability_label=probability_label)
        
        # Form the prompt for GPT-based AI response
        prompt = f"""
You are a medical AI assistant analyzing pancreatic cancer risk assessment results.

MODEL PREDICTION: {'High Risk - Further Evaluation Recommended' if prediction == 1 else 'Low Risk Assessment'}
RISK PROBABILITY: {probability:.1%}
RISK LEVEL: {risk_level}
HEADER TO USE: {header_text}
PROBABILITY LABEL: {probability_label}
TOP CONTRIBUTORS: {', '.join(top_factors)}

TOP CONTRIBUTING FACTORS:
{chr(10).join([f"- {factor}: {sv['value']:.3f} ({sv['impact']} impact)" for factor, sv in zip(top_factors, shap_values[:5])])}

PATIENT LABORATORY VALUES:
- WBC: {patient_data[0]} (normal: 4-11)
- PLT: {patient_data[2]} (normal: 150-450)
- Bilirubin: {patient_data[12]} (normal: 5-21)
- Glucose: {patient_data[10]} (normal: 3.9-5.6)

{response_structure}

Be accurate, align with audience needs, and emphasize that this is a screening tool requiring clinical correlation.
{audience_instruction}
{language_instruction}
Compose a thorough narrative totaling roughly 600-800 words to ensure complete context.
Keep the structure tidy with no extra blank lines beyond single spacing between sections.
End with a brief summary reinforcing next steps and that clinical decisions remain with the treating physician.
"""

        # Send the request to the AI
        response = groq_client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=600
        )
        
        ai_text = response.choices[0].message.content or ""
        ai_text = repair_text_encoding(ai_text)
        
        # If Russian is requested but text is unreadable, fallback to deterministic template
        if locale_code == 'ru' and not is_readable_russian(ai_text):
            return self._generate_fallback_commentary(
                prediction, probability, shap_values, language=language, client_type=audience
            )
        return ai_text

    except Exception as e:
        logger.error(f"AI commentary generation error: {e}")
        return self._generate_fallback_commentary(
            prediction, probability, shap_values, language=language, client_type=audience
        )


def _generate_fallback_commentary(self, prediction: int, probability: float,
                                  shap_values: List[Dict], language: str = 'en',
                                  client_type: str = 'patient') -> str:
    """Generate dynamic clinical commentary based on actual values."""
    language = (language or 'en').lower()
    audience = (client_type or 'patient').lower()
    is_professional = audience in {'doctor', 'clinician', 'provider', 'specialist', 'researcher', 'medical', 'hospital', 'physician', 'scientist', 'scientists'}

    risk_level = "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
    locale_code = 'ru' if language.startswith('ru') else 'en'
    locale_bundle = COMMENTARY_LOCALE.get(locale_code, COMMENTARY_LOCALE['en'])
    scientist_mode = audience in {'scientist', 'researcher'}
    
    if scientist_mode:
        audience_bundle = locale_bundle.get('scientist') or locale_bundle.get('professional') or locale_bundle.get('patient', {})
    elif is_professional:
        audience_bundle = locale_bundle.get('professional') or locale_bundle.get('patient', {})
    else:
        audience_bundle = locale_bundle.get('patient') or locale_bundle.get('professional') or locale_bundle.get('scientist', {})

    feature_labels = RU_FEATURE_LABELS if locale_code == 'ru' else FEATURE_LABELS['en']
    
    probability_pct = f"{probability:.1%}"
    risk_label = (locale_bundle.get('risk_labels') or {}).get(risk_level, risk_level.upper())
    probability_label = audience_bundle.get('probability_label', locale_bundle.get('probability_label', 'Risk probability'))

    top_factor_lines: list[str] = []
    impact_terms = audience_bundle.get('impact_terms', {
        'positive': 'increases risk',
        'negative': 'reduces risk',
        'neutral': 'neutral contribution',
    })
    
    for sv in shap_values[:5]:
        feature_key = str(sv.get('feature', 'Unknown')).upper()
        feature_label = feature_labels.get(feature_key, feature_key.replace('_', ' ').title())
        impact_key = str(sv.get('impact', 'neutral')).lower()
        if impact_key not in impact_terms:
            impact_key = 'neutral'
        impact_phrase = impact_terms.get(impact_key, 'neutral contribution')
        value = sv.get('value')
        try:
            value_str = f"{float(value):+.3f}"
        except (TypeError, ValueError):
            value_str = str(value) if value is not None else 'N/A'
        top_factor_lines.append(f"- {feature_label}: {impact_phrase} ({value_str})")

    while len(top_factor_lines) < 5:
        top_factor_lines.append(f"- {audience_bundle.get('default_driver', 'Additional factor within normal range')}")

    header_tmpl = audience_bundle.get('header_template', 'CLINICAL DOSSIER | {risk} RISK')
    base_lines: list[str] = [
        header_tmpl.format(risk=risk_label),
        f"{probability_label}: {probability_pct}",
        ''
    ]

    # Professional/scientist layout; patients use the patient layout in any locale
    if scientist_mode or is_professional:
        synopsis_map = audience_bundle.get('synopsis', {})
        actions_map = audience_bundle.get('actions', {})
        coordination_map = audience_bundle.get('coordination', {})
        monitoring_map = audience_bundle.get('monitoring', {})
        
        if locale_code == 'ru':
            if not header_tmpl or header_tmpl == 'CLINICAL DOSSIER | {risk} RISK':
                header_tmpl = '\u041a\u041b\u0418\u041d\u0418\u0427\u0415\u0421\u041a\u041e\u0415 \u0414\u041e\u0421\u042c\u0415 | {risk} \u0420\u0418\u0421\u041a'
                base_lines[0] = header_tmpl.format(risk=risk_label)
            
        lines = base_lines + [
            audience_bundle['drivers_title']
        ]
        lines.extend(top_factor_lines)
        lines.append('')
        lines.append(audience_bundle['synopsis_title'])
        lines.append(synopsis_map.get(risk_level, synopsis_map.get('Low', '')))
        lines.append('')
        lines.append(audience_bundle['actions_title'])
        lines.extend(f"- {item}" for item in actions_map.get(risk_level, actions_map.get('Low', [])))
        lines.append('')
        lines.append(audience_bundle['coordination_title'])
        lines.extend(f"- {item}" for item in coordination_map.get(risk_level, coordination_map.get('Low', [])))
        lines.append('')
        lines.append(audience_bundle['monitoring_title'])
        lines.extend(f"- {item}" for item in monitoring_map.get(risk_level, monitoring_map.get('Low', [])))
        lines.append('')
    else:
        core_map = audience_bundle['core_message']
        next_steps_map = audience_bundle['next_steps']
        warning_items = audience_bundle.get('warning_signs', [])
        support_items = audience_bundle.get('support', [])

        core_text = core_map.get(risk_level, core_map.get('Low', '')).format(probability=probability_pct)

        lines = base_lines + [
            audience_bundle['core_title'],
            core_text,
            '',
            audience_bundle['drivers_title'],
        ]
        lines.extend(top_factor_lines)
        lines.append('')
        lines.append(audience_bundle['next_steps_title'])
        lines.extend(f"- {item}" for item in next_steps_map.get(risk_level, next_steps_map.get('Low', [])))
        lines.append('')
        lines.append(audience_bundle['warnings_title'])
        lines.extend(f"- {item}" for item in warning_items)
        lines.append('')
        lines.append(audience_bundle['support_title'])
        lines.extend(f"- {item}" for item in support_items)
        lines.append('')
        # Optional extras for patient
        if audience_bundle.get('timeline_title') and isinstance(audience_bundle.get('timeline'), dict):
            lines.append(audience_bundle['timeline_title'])
            tmap = audience_bundle['timeline']
            lines.extend(f"- {item}" for item in tmap.get(risk_level, tmap.get('Low', [])))
            lines.append('')
        if audience_bundle.get('questions_title') and isinstance(audience_bundle.get('questions'), list):
            lines.append(audience_bundle['questions_title'])
            lines.extend(f"- {q}" for q in audience_bundle.get('questions', []))
            lines.append('')
        lines.append(audience_bundle['reminder_title'])
        lines.append(audience_bundle['reminder_text'])

    return "\n".join(lines)


def _generate_ru_commentary(self, prediction: int, probability: float,
                            shap_values: List[Dict], patient_data: List[float],
                            audience: str = 'patient') -> str:
    """Structured Russian fallback commentary using locale templates."""
    locale_bundle = COMMENTARY_LOCALE.get('ru', COMMENTARY_LOCALE['en'])
    risk_level = "High" if probability > 0.7 else "Moderate" if probability > 0.3 else "Low"
    probability_pct = f"{probability * 100:.1f}%"

    if audience in {'scientist', 'researcher'} and locale_bundle.get('scientist'):
        audience_bundle = locale_bundle['scientist']
    elif audience in {'doctor', 'clinician', 'provider', 'physician', 'specialist', 'medical', 'hospital'}:
        audience_bundle = locale_bundle.get('professional') or locale_bundle.get('patient', {})
    else:
        audience_bundle = locale_bundle.get('patient') or locale_bundle.get('professional', {})

    probability_label = audience_bundle.get(
        'probability_label', locale_bundle.get('probability_label', 'Вероятность риска')
    )
    header_template = audience_bundle.get('header_template', 'КЛИНИЧЕСКОЕ ДОСЬЕ | {risk} РИСК')
    header = header_template.format(
        risk=locale_bundle.get('risk_labels', {}).get(risk_level, risk_level.upper())
    )

    # Build SHAP factor lines
    shap_lines: list[str] = []
    for sv in shap_values[:5]:
        key = str(sv.get('feature', '')).upper()
        label = RU_FEATURE_LABELS.get(key, FEATURE_LABELS['ru'].get(key, key))
        impact = str(sv.get('impact', 'neutral')).lower()
        if impact == 'positive':
            impact_text = 'повышает риск'
        elif impact == 'negative':
            impact_text = 'снижает риск'
        else:
            impact_text = 'влияет нейтрально'
        try:
            value = float(sv.get('value', 0.0))
            value_repr = f"{value:+.3f}"
        except Exception:
            value_repr = str(sv.get('value', '0'))
        shap_lines.append(f"- {label}: {impact_text} ({value_repr})")

    core_map = audience_bundle.get('core_message', locale_bundle.get('core_message', {}))
    core_text = core_map.get(risk_level, core_map.get('Low', '')).format(probability=probability_pct)

    lines: list[str] = [
        header,
        f"{probability_label}: {probability_pct}",
        '',
        audience_bundle.get('core_title', locale_bundle.get('core_title', 'СУТЬ')),
        core_text,
        '',
        audience_bundle.get('drivers_title', 'КЛЮЧЕВЫЕ ФАКТОРЫ'),
        *shap_lines,
        '',
    ]

    next_steps_map = audience_bundle.get('next_steps', {})
    if isinstance(next_steps_map, dict) and next_steps_map:
        lines.append(audience_bundle.get('next_steps_title', 'СЛЕДУЮЩИЕ ШАГИ'))
        lines.extend(f"- {s}" for s in next_steps_map.get(risk_level, next_steps_map.get('Low', [])))
        lines.append('')

    warning_items = audience_bundle.get('warning_signs', [])
    if warning_items:
        lines.append(audience_bundle.get('warnings_title', 'КОГДА ОБРАЩАТЬСЯ СРОЧНО'))
        lines.extend(f"- {w}" for w in warning_items)
        lines.append('')

    support_items = audience_bundle.get('support', [])
    if support_items:
        lines.append(audience_bundle.get('support_title', 'ПОДДЕРЖКА'))
        lines.extend(f"- {s}" for s in support_items)
        lines.append('')

    timeline_map = audience_bundle.get('timeline')
    if isinstance(timeline_map, dict):
        lines.append(audience_bundle.get('timeline_title', 'ПЛАН НАБЛЮДЕНИЯ'))
        lines.extend(f"- {item}" for item in timeline_map.get(risk_level, timeline_map.get('Low', [])))
        lines.append('')

    questions = audience_bundle.get('questions')
    if isinstance(questions, list) and questions:
        lines.append(audience_bundle.get('questions_title', 'ВОПРОСЫ К ВРАЧУ'))
        lines.extend(f"- {q}" for q in questions)
        lines.append('')

    lines.append(audience_bundle.get('reminder_title', 'ВАЖНО'))
    lines.append(
        audience_bundle.get(
            'reminder_text',
            'Отчет носит информационный характер и требует подтверждения лечащим врачом.',
        )
    )

    return "\n".join(lines)

    def generate_clinical_commentary(self, prediction: int, probability: float, shap_values: List[Dict], patient_data: List[float], language: str = 'en', client_type: str = 'patient') -> str:
        """Generate AI-powered clinical commentary tailored to the audience in multiple languages."""
        
        language = (language or 'en').lower()
        client_type = (client_type or 'patient').lower()

        # Determine locale based on language
        locale_code = 'ru' if language.startswith('ru') else 'en'
        
        # Select appropriate audience and locale bundle for commentary
        audience = 'doctor' if client_type in {'doctor', 'clinician', 'physician', 'specialist', 'researcher'} else 'patient'
        locale_bundle = COMMENTARY_LOCALE.get(locale_code, COMMENTARY_LOCALE['en'])

        # Set up language-based text and commentary components
        if language == 'ru':
            commentary = self._generate_ru_commentary(prediction, probability, shap_values, patient_data, audience)
        else:
            commentary = self._generate_fallback_commentary(prediction, probability, shap_values, language=language, client_type=client_type)

        return commentary

