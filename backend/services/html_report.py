from __future__ import annotations

import base64
import os
import subprocess
from datetime import datetime
from io import BytesIO
from typing import Any, Dict, List

from flask import render_template
from playwright.sync_api import Playwright, sync_playwright

from core.constants import FEATURE_LABELS
from services.model_engine import MEDICAL_RANGES
from utils.text import repair_text_encoding


RISK_COLORS = {
    "High": (220, 38, 38),
    "Moderate": (217, 119, 6),
    "Low": (22, 163, 74),
}

RU_LAB_LABELS = {
    "WBC": "Лейкоциты",
    "RBC": "Эритроциты",
    "PLT": "Тромбоциты",
    "HGB": "Гемоглобин",
    "HCT": "Гематокрит",
    "MPV": "Средний объем тромбоцитов",
    "PDW": "Ширина распределения тромбоцитов",
    "MONO": "Моноциты",
    "BASO_ABS": "Базофилы (абс.)",
    "BASO_PCT": "Базофилы (%)",
    "GLUCOSE": "Глюкоза натощак",
    "ACT": "Активированное время свертывания",
    "BILIRUBIN": "Общий билирубин",
}

COPY = {
    "en": {
        "report_title": "AI-Assisted Pancreatic Risk Assessment",
        "tool_name": "DiagnoAI Pancreas",
        "generated_on": "Generated on",
        "risk_category_label": "Risk category",
        "probability_label": "Risk probability",
        "risk_names": {
            "High": "HIGH RISK",
            "Moderate": "MODERATE RISK",
            "Low": "LOW RISK",
        },
        "cover_interpretation": {
            "High": "Risk estimate consistent with higher-risk population cohorts; supports expedited clinical review.",
            "Moderate": "Risk estimate consistent with intermediate-risk population cohorts; supports targeted follow-up.",
            "Low": "Risk estimate consistent with low-risk population cohorts; supports routine surveillance.",
        },
        "cover_meta_labels": {
            "generated": "Generated",
            "intended_use": "Intended use",
            "audience": "Audience",
            "disclaimer": "Legal disclaimer",
        },
        "cover_intended_use_value": "Clinical decision support",
        "cover_disclaimer": "AI-assisted decision support; not diagnostic.",
        "executive_title": "Executive Clinical Summary",
        "executive_summary": {
            "High": (
                "The model estimates a {risk} category with an approximate probability of {probability}%. "
                "This profile aligns with higher-risk cohorts and warrants prompt clinical review. "
                "The estimate supports risk stratification and surveillance planning and does not establish a diagnosis."
            ),
            "Moderate": (
                "The model estimates a {risk} category with an approximate probability of {probability}%. "
                "This profile aligns with intermediate-risk cohorts and supports targeted follow-up. "
                "The estimate supports risk stratification and surveillance planning and does not establish a diagnosis."
            ),
            "Low": (
                "The model estimates a {risk} category with an approximate probability of {probability}%. "
                "This profile aligns with low-risk cohorts and supports routine surveillance. "
                "The estimate supports risk stratification and surveillance planning and does not establish a diagnosis."
            ),
        },
        "context_title": "Patient / Audience Context",
        "context_labels": {
            "audience": "Intended audience",
            "language": "Language",
            "use": "Intended use",
        },
        "context_use_value": "Risk stratification & surveillance support",
        "assessment_title": "Pancreatic Cancer Risk Assessment",
        "assessment_interpretation": {
            "High": "Interpretation: consistent with higher-risk population cohorts.",
            "Moderate": "Interpretation: consistent with intermediate-risk population cohorts.",
            "Low": "Interpretation: consistent with low-risk population cohorts.",
        },
        "labs_title": "Laboratory Results Summary",
        "labs_columns": ["Test", "Value", "Reference range"],
        "labs_caption": "Values shown as provided; verify units and reference ranges with the source laboratory.",
        "explainability_title": "Key Model Contributors (Explainability Analysis)",
        "impact_labels": {
            "positive": "increases risk contribution",
            "negative": "decreases risk contribution",
            "neutral": "neutral influence",
        },
        "impact_legend": "↑ increases risk contribution, ↓ decreases risk contribution, • neutral influence.",
        "explainability_empty": "Explainability data is unavailable.",
        "interpretation_title": "AI Clinical Interpretation",
        "interpretation_empty": "No AI clinical interpretation is available for this audience.",
        "recommendations_title": "Surveillance & Research Recommendations",
        "recommendations_clinical": "Clinical Surveillance Guidance",
        "recommendations_research": "Research & Data Collection Recommendations",
        "recommendations": {
            "clinical": {
                "High": [
                    "Arrange contrast-enhanced CT or MRI promptly; add EUS-FNA if imaging is equivocal.",
                    "Trend tumor markers (CA 19-9, CEA) and key metabolic/coagulation panels.",
                    "Address pain control, nutrition, and biliary obstruction in parallel with diagnostics.",
                    "Coordinate hepatobiliary surgery and oncology input for integrated planning.",
                ],
                "Moderate": [
                    "Schedule pancreatic-protocol CT or MRI within 2-4 weeks based on symptoms.",
                    "Repeat labs and tumor markers if values deviate from baseline or symptoms evolve.",
                    "Document red-flag symptoms and provide expedited return precautions.",
                    "Coordinate follow-up with gastroenterology and primary care.",
                ],
                "Low": [
                    "Maintain routine surveillance; advance imaging if new symptoms emerge.",
                    "Reinforce lifestyle risk reduction and metabolic control.",
                    "Provide education on warning signs that warrant earlier review.",
                ],
            },
            "research": [
                "Document family history, metabolic risk factors, and relevant exposures.",
                "Capture longitudinal biomarkers and imaging outcomes for trend analysis.",
                "Consider registry enrollment or research protocols where available.",
            ],
        },
        "followup_title": "Follow-Up & Monitoring Framework",
        "followup_rows": [
            {
                "label": "Biannual",
                "text": "Clinical review of symptoms and laboratory trends; adjust surveillance based on changes.",
            },
            {
                "label": "Annual",
                "text": "Imaging review per clinical context and institutional protocol.",
            },
            {
                "label": "Continuous",
                "text": "Ongoing symptom monitoring, lifestyle risk mitigation, and care coordination.",
            },
        ],
        "disclaimers_title": "Disclaimers & Governance",
        "disclaimers_text": (
            "This report provides AI-assisted decision support for risk stratification. "
            "It does not diagnose pancreatic cancer and should be interpreted alongside full clinical context, "
            "validated diagnostics, and institutional guidelines. Final responsibility for clinical decisions "
            "remains with the treating clinician."
        ),
        "client_labels": {
            "patient": "Patient",
            "clinician": "Clinician",
            "doctor": "Clinician",
            "physician": "Clinician",
        },
        "language_names": {"en": "English", "ru": "Russian"},
        "page_label": "Page",
    },
    "ru": {
        "report_title": "AI-ассистированная оценка риска рака поджелудочной железы",
        "tool_name": "DiagnoAI Pancreas",
        "generated_on": "Дата формирования",
        "risk_category_label": "Категория риска",
        "probability_label": "Вероятность риска",
        "risk_names": {
            "High": "ВЫСОКИЙ РИСК",
            "Moderate": "УМЕРЕННЫЙ РИСК",
            "Low": "НИЗКИЙ РИСК",
        },
        "cover_interpretation": {
            "High": "Оценка риска соответствует группам повышенного риска; требуется приоритетное клиническое рассмотрение.",
            "Moderate": "Оценка риска соответствует группам промежуточного риска; поддерживает целевое наблюдение.",
            "Low": "Оценка риска соответствует группам низкого риска; поддерживает рутинное наблюдение.",
        },
        "cover_meta_labels": {
            "generated": "Дата формирования",
            "intended_use": "Назначение",
            "audience": "Аудитория",
            "disclaimer": "Правовая оговорка",
        },
        "cover_intended_use_value": "Клиническая поддержка принятия решений",
        "cover_disclaimer": "Поддержка решений на основе ИИ; не является диагнозом.",
        "executive_title": "Клиническое резюме",
        "executive_summary": {
            "High": (
                "Модель оценивает категорию {risk} с ориентировочной вероятностью {probability}%. "
                "Профиль соответствует группам повышенного риска и требует приоритетного клинического рассмотрения. "
                "Оценка предназначена для стратификации риска и планирования наблюдения и не устанавливает диагноз."
            ),
            "Moderate": (
                "Модель оценивает категорию {risk} с ориентировочной вероятностью {probability}%. "
                "Профиль соответствует группам промежуточного риска и поддерживает целевое наблюдение. "
                "Оценка предназначена для стратификации риска и планирования наблюдения и не устанавливает диагноз."
            ),
            "Low": (
                "Модель оценивает категорию {risk} с ориентировочной вероятностью {probability}%. "
                "Профиль соответствует группам низкого риска и поддерживает рутинное наблюдение. "
                "Оценка предназначена для стратификации риска и планирования наблюдения и не устанавливает диагноз."
            ),
        },
        "context_title": "Контекст пациента / аудитории",
        "context_labels": {
            "audience": "Целевая аудитория",
            "language": "Язык",
            "use": "Назначение",
        },
        "context_use_value": "Стратификация риска и поддержка наблюдения",
        "assessment_title": "Оценка риска рака поджелудочной железы",
        "assessment_interpretation": {
            "High": "Интерпретация: соответствует группам повышенного риска.",
            "Moderate": "Интерпретация: соответствует группам промежуточного риска.",
            "Low": "Интерпретация: соответствует группам низкого риска.",
        },
        "labs_title": "Сводка лабораторных результатов",
        "labs_columns": ["Показатель", "Значение", "Референсный диапазон"],
        "labs_caption": "Значения приведены как предоставлены; единицы и диапазоны следует сверить с лабораторией.",
        "explainability_title": "Ключевые факторы модели (анализ интерпретируемости)",
        "impact_labels": {
            "positive": "повышает вклад в риск",
            "negative": "снижает вклад в риск",
            "neutral": "нейтральное влияние",
        },
        "impact_legend": "↑ повышает вклад в риск, ↓ снижает вклад в риск, • нейтральное влияние.",
        "explainability_empty": "Данные интерпретируемости недоступны.",
        "interpretation_title": "Клиническая интерпретация ИИ",
        "interpretation_empty": "Клиническая интерпретация ИИ для этой аудитории недоступна.",
        "recommendations_title": "Рекомендации по наблюдению и исследовательским данным",
        "recommendations_clinical": "Клиническое наблюдение",
        "recommendations_research": "Рекомендации по исследованиям и сбору данных",
        "recommendations": {
            "clinical": {
                "High": [
                    "Организовать контрастное КТ или МРТ в ближайшее время; при сомнительных результатах добавить ЭУС-ТАБ.",
                    "Отслеживать опухолевые маркеры (CA 19-9, CEA) и ключевые метаболические/коагуляционные показатели.",
                    "Параллельно с диагностикой вести контроль боли, питания и билиарной обструкции.",
                    "Согласовать план с гепатобилиарной хирургией и онкологией.",
                ],
                "Moderate": [
                    "Запланировать КТ/МРТ по панкреатическому протоколу в течение 2-4 недель с учетом симптомов.",
                    "Повторить лабораторные показатели и маркеры при отклонении от базовых значений или изменении симптомов.",
                    "Зафиксировать тревожные симптомы и дать ускоренные инструкции по повторному обращению.",
                    "Координировать наблюдение с гастроэнтерологом и врачом первичного звена.",
                ],
                "Low": [
                    "Поддерживать рутинное наблюдение; ускорить визуализацию при появлении новых симптомов.",
                    "Усилить модификацию образа жизни и контроль метаболических факторов.",
                    "Обучить признакам, требующим более раннего клинического контроля.",
                ],
            },
            "research": [
                "Зафиксировать семейный анамнез, метаболические факторы риска и значимые экспозиции.",
                "Собирать продольные биомаркеры и результаты визуализации для анализа динамики.",
                "Рассмотреть включение в регистры или исследовательские протоколы при наличии.",
            ],
        },
        "followup_title": "План наблюдения и мониторинга",
        "followup_rows": [
            {
                "label": "Каждые 6 месяцев",
                "text": "Полугодовой клинический осмотр, контроль симптомов и лабораторных трендов; корректировка наблюдения при изменениях.",
            },
            {
                "label": "Ежегодно",
                "text": "Ежегодный пересмотр визуализации в соответствии с клиническим контекстом и протоколами учреждения.",
            },
            {
                "label": "Постоянно",
                "text": "Непрерывный мониторинг симптомов, снижение факторов риска и координация лечения.",
            },
        ],
        "disclaimers_title": "Оговорки и ответственность",
        "disclaimers_text": (
            "Данный отчет предоставляет поддержку принятия решений на основе ИИ для стратификации риска. "
            "Он не диагностирует рак поджелудочной железы и должен интерпретироваться с учетом полного клинического контекста, "
            "подтвержденных диагностических методов и локальных регламентов. Окончательная ответственность за клинические решения "
            "остается за лечащим врачом."
        ),
        "client_labels": {
            "patient": "Пациент",
            "clinician": "Клиницист",
            "doctor": "Врач",
            "physician": "Врач",
        },
        "language_names": {"en": "Английский", "ru": "Русский"},
        "page_label": "Страница",
    },
}


def _load_font_face_css() -> str:
    fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fonts"))
    font_options = [
        ("DejaVu Sans", ["DejaVuSans.ttf"]),
        ("Times New Roman", ["TimesNewRoman.ttf", "Times New Roman.ttf", "times.ttf"]),
    ]
    for family, filenames in font_options:
        for filename in filenames:
            ttf_path = os.path.join(fonts_dir, filename)
            if not os.path.exists(ttf_path):
                continue
            with open(ttf_path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode("ascii")
            return (
                f"@font-face {{ font-family: '{family}'; "
                f"src: url('data:font/ttf;base64,{encoded}') format('truetype'); "
                "font-weight: 400; font-style: normal; }\n"
                f"@font-face {{ font-family: '{family}'; "
                f"src: url('data:font/ttf;base64,{encoded}') format('truetype'); "
                "font-weight: 700; font-style: normal; }}"
            )
    return ""


def _normalize_risk(risk: Any, probability: float) -> str:
    raw = str(risk or "").lower()
    if "high" in raw:
        return "High"
    if "moderate" in raw or "medium" in raw:
        return "Moderate"
    if "low" in raw:
        return "Low"
    if probability > 0.7:
        return "High"
    if probability > 0.3:
        return "Moderate"
    return "Low"


def _build_context(
    patient_inputs: Dict[str, Any], analysis: Dict[str, Any], language: str
) -> Dict[str, Any]:
    lang = "ru" if str(language or "en").lower().startswith("ru") else "en"
    copy = COPY[lang]
    client_type = str(analysis.get("client_type") or "patient").lower()
    audience = copy["client_labels"].get(client_type, client_type.title())
    try:
        prob = float(analysis.get("probability", 0) or 0)
    except (TypeError, ValueError):
        prob = 0.0
    probability_pct = prob * 100
    risk_level = _normalize_risk(analysis.get("risk_level"), prob)
    risk_name = copy["risk_names"].get(risk_level, risk_level)

    feature_order = [
        "wbc",
        "rbc",
        "plt",
        "hgb",
        "hct",
        "mpv",
        "pdw",
        "mono",
        "baso_abs",
        "baso_pct",
        "glucose",
        "act",
        "bilirubin",
    ]
    label_map = FEATURE_LABELS.get("en", FEATURE_LABELS["en"])
    if lang == "ru":
        label_map = RU_LAB_LABELS
    labs: List[Dict[str, str]] = []
    for key in feature_order:
        label = label_map.get(key.upper(), key.upper())
        raw = patient_inputs.get(key)
        try:
            value = f"{float(raw):.2f}"
        except (TypeError, ValueError):
            value = "N/A" if raw is None else str(raw)
        if key in MEDICAL_RANGES:
            min_val, max_val = MEDICAL_RANGES[key]
            range_text = f"{min_val}-{max_val}"
        else:
            range_text = ""
        labs.append({"label": label, "value": value, "range": range_text})

    raw_shap = analysis.get("shap_values") or analysis.get("shapValues") or []
    if isinstance(raw_shap, dict):
        shap_values = [raw_shap]
    elif isinstance(raw_shap, (list, tuple)):
        shap_values = list(raw_shap)
    else:
        shap_values = []
    impact_map = copy["impact_labels"]
    direction_map = {"positive": "↑", "negative": "↓", "neutral": "•"}
    shap = []
    for item in shap_values[:5]:
        feature = str(item.get("feature", "Unknown"))
        label = label_map.get(feature.upper(), feature)
        impact_key = str(item.get("impact", "neutral")).lower()
        impact = impact_map.get(impact_key, impact_map["neutral"])
        direction = direction_map.get(impact_key, "•")
        val = item.get("value", 0)
        try:
            val_num = float(val)
            val_str = f"{val_num:+.3f}"
        except (TypeError, ValueError):
            val_str = str(val)
        shap.append({"label": label, "impact": impact, "value": val_str, "direction": direction})

    audience_commentaries = analysis.get("audience_commentaries") or {}
    audience_by_lang = analysis.get("audience_commentaries_by_lang") or {}
    commentary_source = (
        audience_by_lang.get(f"{lang}:{client_type}")
        or audience_commentaries.get(client_type)
        or analysis.get("ai_explanation")
        or analysis.get("aiExplanation")
        or ""
    )
    commentary_raw = repair_text_encoding(commentary_source or "")
    commentary = [p.strip() for p in commentary_raw.split("\n") if p.strip()]

    summary_template = copy["executive_summary"].get(risk_level, "")
    executive_summary = summary_template.format(
        probability=f"{probability_pct:.1f}",
        risk=risk_name,
    )

    context_rows = [
        {"label": copy["context_labels"]["audience"], "value": audience},
        {"label": copy["context_labels"]["language"], "value": copy["language_names"].get(lang, lang)},
        {"label": copy["context_labels"]["use"], "value": copy["context_use_value"]},
    ]

    cover_metadata = [
        {"label": copy["cover_meta_labels"]["generated"], "value": datetime.now().strftime("%Y-%m-%d %H:%M")},
        {"label": copy["cover_meta_labels"]["intended_use"], "value": copy["cover_intended_use_value"]},
        {"label": copy["cover_meta_labels"]["audience"], "value": audience},
        {"label": copy["cover_meta_labels"]["disclaimer"], "value": copy["cover_disclaimer"]},
    ]

    return {
        "lang": lang,
        "report_title": copy["report_title"],
        "tool_name": copy["tool_name"],
        "generated_on": copy["generated_on"],
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "risk_category_label": copy["risk_category_label"],
        "probability_label": copy["probability_label"],
        "risk_level": risk_level,
        "risk_name": risk_name,
        "risk_class": risk_level.lower(),
        "probability_pct": f"{probability_pct:.1f}",
        "cover_interpretation": copy["cover_interpretation"].get(risk_level, ""),
        "cover_metadata": cover_metadata,
        "executive_title": copy["executive_title"],
        "executive_summary": executive_summary,
        "context_title": copy["context_title"],
        "context_rows": context_rows,
        "assessment_title": copy["assessment_title"],
        "assessment_interpretation": copy["assessment_interpretation"].get(risk_level, ""),
        "labs_title": copy["labs_title"],
        "labs_caption": copy["labs_caption"],
        "labs_columns": copy["labs_columns"],
        "labs": labs,
        "explainability_title": copy["explainability_title"],
        "impact_legend": copy["impact_legend"],
        "explainability_empty": copy["explainability_empty"],
        "shap": shap,
        "interpretation_title": copy["interpretation_title"],
        "interpretation_empty": copy["interpretation_empty"],
        "commentary": commentary,
        "recommendations_title": copy["recommendations_title"],
        "recommendations_clinical": copy["recommendations_clinical"],
        "recommendations_research": copy["recommendations_research"],
        "clinical_recommendations": copy["recommendations"]["clinical"].get(risk_level, []),
        "research_recommendations": copy["recommendations"]["research"],
        "followup_title": copy["followup_title"],
        "followup_rows": copy["followup_rows"],
        "disclaimers_title": copy["disclaimers_title"],
        "disclaimers_text": copy["disclaimers_text"],
        "audience": audience,
        "language_name": copy["language_names"].get(lang, lang),
        "page_label": copy["page_label"],
        "font_face_css": _load_font_face_css(),
    }


def _ensure_chromium_installed(playwright: Playwright) -> None:
    """
    Ensure the Playwright Chromium binary is available.
    If missing, attempt to install it once (requires network access).
    """
    try:
        playwright.chromium.executable_path  # type: ignore[attr-defined]
    except Exception:
        try:
            subprocess.check_call(
                [
                    os.environ.get("PYTHON_EXECUTABLE", "python"),
                    "-m",
                    "playwright",
                    "install",
                    "chromium",
                ]
            )
        except Exception:
            pass


def _html_to_pdf(html: str, page_label: str) -> bytes:
    """Render HTML to PDF using headless Chromium (Playwright), with a best-effort auto-install."""
    def _merge_cover_with_footer(cover_bytes: bytes, full_bytes: bytes) -> bytes:
        for module in ("pypdf", "PyPDF2"):
            try:
                pdf_module = __import__(module)
                PdfReader = getattr(pdf_module, "PdfReader")
                PdfWriter = getattr(pdf_module, "PdfWriter")
            except Exception:
                continue
            try:
                cover_reader = PdfReader(BytesIO(cover_bytes))
                full_reader = PdfReader(BytesIO(full_bytes))
                writer = PdfWriter()
                if cover_reader.pages:
                    writer.add_page(cover_reader.pages[0])
                for idx in range(1, len(full_reader.pages)):
                    writer.add_page(full_reader.pages[idx])
                output = BytesIO()
                writer.write(output)
                return output.getvalue()
            except Exception:
                break
        return full_bytes

    try:
        with sync_playwright() as p:
            _ensure_chromium_installed(p)
            browser = p.chromium.launch(args=["--no-sandbox"])
            page = browser.new_page()
            page.set_content(html, wait_until="networkidle")
            footer_template = (
                "<div style='width:100%; font-size:9px; color:#64748b; padding:0 14mm;'>"
                f"<span style='float:right;'>{page_label} "
                "<span class='pageNumber'></span> / <span class='totalPages'></span></span>"
                "</div>"
            )
            full_pdf = page.pdf(
                format="A4",
                margin={"top": "18mm", "right": "14mm", "bottom": "18mm", "left": "14mm"},
                display_header_footer=True,
                header_template="<div></div>",
                footer_template=footer_template,
                print_background=True,
            )
            cover_pdf = page.pdf(
                format="A4",
                margin={"top": "18mm", "right": "14mm", "bottom": "18mm", "left": "14mm"},
                display_header_footer=False,
                page_ranges="1",
                print_background=True,
            )
            browser.close()
            return _merge_cover_with_footer(cover_pdf, full_pdf)
    except Exception as exc:
        raise RuntimeError(
            "PDF rendering failed via Playwright. Ensure playwright is installed and Chromium is available "
            "(run: python -m playwright install chromium). "
            f"Details: {exc}"
        ) from exc


def generate_pdf(patient_inputs: Dict[str, Any], analysis: Dict[str, Any], language: str) -> BytesIO:
    ctx = _build_context(patient_inputs, analysis, language)
    html = render_template("report.html", **ctx)
    pdf_bytes = _html_to_pdf(html, ctx["page_label"])
    buf = BytesIO(pdf_bytes)
    buf.seek(0)
    return buf
