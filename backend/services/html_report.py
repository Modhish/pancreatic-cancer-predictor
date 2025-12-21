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


PALETTE = {
    "High": (220, 38, 38),
    "Moderate": (217, 119, 6),
    "Low": (22, 163, 74),
}

COPY = {
    "en": {
        "title": "DiagnoAI Pancreas | Clinical Report",
        "generated_on": "Generated on",
        "risk_label": "Risk level",
        "probability_label": "Risk probability",
        "audience_label": "Audience",
        "language_label": "Language",
        "risk_names": {"High": "HIGH RISK", "Moderate": "MODERATE RISK", "Low": "LOW RISK"},
        "overview_title": "Clinical overview",
        "overview": {
            "High": "High-risk pattern detected. Confirm within 7 days (contrast CT/MRI, EUS-FNA if needed) and manage pain/obstruction in parallel.",
            "Moderate": "Intermediate probability. Clarify in 2–4 weeks with pancreatic protocol imaging, tumor markers, and symptom-guided follow-up.",
            "Low": "Low risk estimate. Maintain surveillance, reinforce prevention, and define clear triggers for earlier reassessment.",
        },
        "labs_title": "Laboratory snapshot",
        "labs_caption": "Values shown with reference ranges when available; verify units with the source laboratory.",
        "shap_title": "Top SHAP drivers",
        "shap_none": "SHAP analysis unavailable.",
        "impact_labels": {
            "positive": "raises risk",
            "negative": "reduces risk pressure",
            "neutral": "neutral influence",
        },
        "commentary_title": "AI clinical commentary",
        "commentary_empty": "AI commentary is not available for this audience.",
        "actions_title": "Priority next steps",
        "actions": {
            "High": [
                "Order contrast-enhanced CT or MRI within 7 days; add EUS-FNA if imaging is equivocal.",
                "Trend tumor markers (CA 19-9, CEA) plus metabolic/coagulation panels.",
                "Manage pain, nutrition, and biliary obstruction in parallel to diagnostics.",
                "Engage hepatobiliary surgery and oncology early for joint planning.",
            ],
            "Moderate": [
                "Schedule pancreatic protocol CT or MRI in 2–4 weeks based on symptoms.",
                "Repeat labs and tumor markers sooner if values drift from baseline.",
                "Document red-flag symptoms and provide expedited return precautions.",
                "Coordinate follow-up with gastroenterology and primary care.",
            ],
            "Low": [
                "Maintain routine surveillance; advance imaging if new symptoms emerge.",
                "Reinforce lifestyle risk reduction and metabolic control.",
                "Educate on warning signs that justify earlier clinical review.",
            ],
        },
        "guideline_title": "Guideline references",
        "footer": "AI-assisted decision support. Interpret alongside full clinical context and governing medical guidelines.",
        "client_labels": {
            "patient": "Patient",
            "clinician": "Clinician",
            "doctor": "Clinician",
            "physician": "Clinician",
        },
        "language_names": {"en": "English", "ru": "Russian"},
    },
    "ru": {
        "title": "DiagnoAI Pancreas | Клинический отчёт",
        "generated_on": "Дата формирования",
        "risk_label": "Уровень риска",
        "probability_label": "Вероятность риска",
        "audience_label": "Целевая аудитория",
        "language_label": "Язык",
        "risk_names": {"High": "ВЫСОКИЙ РИСК", "Moderate": "УМЕРЕННЫЙ РИСК", "Low": "НИЗКИЙ РИСК"},
        "overview_title": "Клиническое резюме",
        "overview": {
            "High": "Обнаружен высокий риск. Подтвердите диагноз в течение 7 дней: контрастная КТ/МРТ, EUS-FNA при неопределённом изображении, параллельно контролируйте желчную обструкцию и боль.",
            "Moderate": "Умеренная вероятность. Уточните в ближайшие 2–4 недели с помощью КТ/МРТ по протоколу поджелудочной, онкомаркеров и симптом-ориентированного наблюдения.",
            "Low": "Низкая оценка риска. Поддерживайте наблюдение, усиливайте профилактику и заранее определите признаки для более раннего пересмотра.",
        },
        "labs_title": "Лабораторные данные",
        "labs_caption": "Значения и референсные интервалы (если доступны); сверяйте единицы измерения с лабораторией.",
        "shap_title": "Основные драйверы SHAP",
        "shap_none": "SHAP-анализ недоступен.",
        "impact_labels": {
            "positive": "повышает риск",
            "negative": "снижает риск",
            "neutral": "нейтрально",
        },
        "commentary_title": "Клинический комментарий ИИ",
        "commentary_empty": "Комментарий недоступен для выбранной аудитории.",
        "actions_title": "Приоритетные шаги",
        "actions": {
            "High": [
                "Провести контрастную КТ или МРТ в течение 7 дней; при неопределённости — EUS-FNA.",
                "Отслеживать онкомаркеры (CA 19-9, CEA) и ключевые метаболические показатели.",
                "Параллельно вести обезболивание, питание и коррекцию желчной обструкции.",
                "Подключить хирурга-гепатобилиара, онколога и генетика для совместного плана.",
            ],
            "Moderate": [
                "Запланировать КТ/МРТ по протоколу поджелудочной в течение 2–4 недель по тяжести симптомов.",
                "Повторить лабораторные показатели раньше при отклонении от базовых значений.",
                "Фиксировать тревожные симптомы и дать пациенту быстрые маршруты возврата.",
                "Скоординировать наблюдение с гастроэнтерологом и врачом первичного звена.",
            ],
            "Low": [
                "Сохранять обычный график наблюдения; ускорить обследование при новых симптомах.",
                "Укреплять профилактику и контроль метаболических факторов.",
                "Обучить признакам, требующим более ранней консультации.",
            ],
        },
        "guideline_title": "Клинические рекомендации",
        "footer": "Система поддержки решений на базе ИИ. Окончательные решения принимает лечащий врач.",
        "client_labels": {
            "patient": "Пациент",
            "clinician": "Врач/клинический специалист",
            "doctor": "Врач",
            "physician": "Врач",
        },
        "language_names": {"en": "Английский", "ru": "Русский"},
    },
}


def _load_font_face_css() -> str:
    fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fonts"))
    ttf_path = os.path.join(fonts_dir, "DejaVuSans.ttf")
    if not os.path.exists(ttf_path):
        return ""
    with open(ttf_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("ascii")
    return (
        "@font-face { font-family: 'DejaVu'; "
        "src: url('data:font/ttf;base64," + encoded + "') format('truetype'); "
        "font-weight: 400; font-style: normal; }\n"
        "@font-face { font-family: 'DejaVu'; "
        "src: url('data:font/ttf;base64," + encoded + "') format('truetype'); "
        "font-weight: 700; font-style: normal; }"
    )


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


def _build_context(patient_inputs: Dict[str, Any], analysis: Dict[str, Any], language: str) -> Dict[str, Any]:
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
    risk_name = {
        "High": copy["risk_names"]["High"],
        "Moderate": copy["risk_names"]["Moderate"],
        "Low": copy["risk_names"]["Low"],
    }.get(risk_level, risk_level)

    feature_order = ["wbc", "rbc", "plt", "hgb", "hct", "mpv", "pdw", "mono", "baso_abs", "baso_pct", "glucose", "act", "bilirubin"]
    labels = FEATURE_LABELS.get(lang, FEATURE_LABELS["en"])
    labs: List[Dict[str, str]] = []
    for key in feature_order:
        label = labels.get(key.upper(), key.upper())
        raw = patient_inputs.get(key)
        try:
            value = f"{float(raw):.2f}"
        except (TypeError, ValueError):
            value = "N/A" if raw is None else str(raw)
        min_val = max_val = None
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
    shap = []
    for item in shap_values[:5]:
        feature = str(item.get("feature", "Unknown"))
        label = labels.get(feature.upper(), feature)
        impact = impact_map.get(str(item.get("impact", "neutral")).lower(), impact_map["neutral"])
        val = item.get("value", 0)
        try:
            val_num = float(val)
            val_str = f"{val_num:+.3f}"
            width = min(100, int(abs(val_num) * 220))
        except (TypeError, ValueError):
            val_str = str(val)
            width = 30
        shap.append({"label": label, "impact": impact, "value": val_str, "width": width})

    commentary_source = ""
    audience_commentaries = analysis.get("audience_commentaries") or {}
    audience_by_lang = analysis.get("audience_commentaries_by_lang") or {}
    # Prefer per-language audience commentary if present
    commentary_source = audience_by_lang.get(f"{lang}:{client_type}") or audience_commentaries.get(client_type) or ""
    if not commentary_source:
        commentary_source = analysis.get("ai_explanation") or analysis.get("aiExplanation") or ""
    commentary_raw = repair_text_encoding(commentary_source or "")
    commentary = [p.strip() for p in commentary_raw.split("\n") if p.strip()]

    actions = copy["actions"].get(risk_level, [])

    return {
        "lang": lang,
        "title": copy["title"],
        "generated_on": copy["generated_on"],
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "risk_label": copy["risk_label"],
        "probability_label": copy["probability_label"],
        "audience_label": copy["audience_label"],
        "language_label": copy["language_label"],
        "risk_level": risk_level,
        "risk_name": risk_name,
        "probability_pct": f"{probability_pct:.1f}",
        "audience": audience,
        "language_name": copy["language_names"].get(lang, lang),
        "overview_title": copy["overview_title"],
        "overview_text": copy["overview"].get(risk_level, ""),
        "labs_title": copy["labs_title"],
        "labs_caption": copy["labs_caption"],
        "labs": labs,
        "shap_title": copy["shap_title"],
        "shap_none": copy["shap_none"],
        "shap": shap,
        "commentary_title": copy["commentary_title"],
        "commentary_empty": copy["commentary_empty"],
        "commentary": commentary,
        "actions_title": copy["actions_title"],
        "actions": actions,
        "guideline_title": copy["guideline_title"],
        "guidelines": [
            ("NCCN v2.2024", "https://www.nccn.org/professionals/physician_gls/pdf/pancreatic.pdf"),
            ("ASCO 2023", "https://ascopubs.org/doi/full/10.1200/JCO.23.00000"),
            ("ESMO 2023", "https://www.esmo.org/guidelines/gastrointestinal-cancers/pancreatic-cancer"),
            ("CAPS 2020", "https://gut.bmj.com/content/69/1/7"),
            ("AGA 2020", "https://www.gastrojournal.org/article/S0016-5085(20)30094-6/fulltext"),
        ],
        "footer": copy["footer"],
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
                [os.environ.get("PYTHON_EXECUTABLE", "python"), "-m", "playwright", "install", "chromium"]
            )
        except Exception:
            # If installation fails, let the caller handle the Playwright error.
            pass


def _html_to_pdf(html: str) -> bytes:
    """Render HTML to PDF using headless Chromium (Playwright), with a best-effort auto-install."""
    try:
        with sync_playwright() as p:
            _ensure_chromium_installed(p)
            browser = p.chromium.launch(args=["--no-sandbox"])
            page = browser.new_page()
            page.set_content(html, wait_until="networkidle")
            pdf_bytes = page.pdf(
                format="A4",
                margin={"top": "18mm", "right": "14mm", "bottom": "18mm", "left": "14mm"},
            )
            browser.close()
            return pdf_bytes
    except Exception as exc:
        raise RuntimeError(
            "PDF rendering failed via Playwright. Ensure playwright is installed and Chromium is available "
            "(run: python -m playwright install chromium). "
            f"Details: {exc}"
        ) from exc


def generate_pdf(patient_inputs: Dict[str, Any], analysis: Dict[str, Any], language: str) -> BytesIO:
    ctx = _build_context(patient_inputs, analysis, language)
    html = render_template("report.html", **ctx)
    pdf_bytes = _html_to_pdf(html)
    buf = BytesIO(pdf_bytes)
    buf.seek(0)
    return buf
