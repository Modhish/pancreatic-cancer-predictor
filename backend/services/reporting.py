from __future__ import annotations

import os
from datetime import datetime
from io import BytesIO
from typing import Any, Dict, Tuple

from fpdf import FPDF

from core.constants import FEATURE_LABELS
from utils.text import repair_text_encoding


PALETTE = {
    "primary": (21, 94, 239),
    "neutral": (30, 41, 59),
    "muted": (100, 116, 139),
    "panel": (248, 250, 252),
    "border": (226, 232, 240),
}

RISK_COLORS = {
    "High": (220, 38, 38),
    "Moderate": (217, 119, 6),
    "Low": (22, 163, 74),
}

GUIDELINE_LINKS = [
    # Guidelines removed from PDF output per request.
]

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
            "Moderate": "Intermediate probability. Clarify in 2-4 weeks with pancreatic protocol imaging, tumor markers, and symptom-guided follow-up.",
            "Low": "Low risk estimate. Maintain surveillance, reinforce prevention, and define clear triggers for earlier reassessment.",
        },
        "labs_title": "Laboratory snapshot",
        "labs_caption": "Values shown as provided; verify units with the source laboratory.",
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
                "Schedule pancreatic protocol CT or MRI in 2-4 weeks based on symptoms.",
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
        "title": "DiagnoAI Pancreas | Клинический отчет",
        "generated_on": "Дата формирования",
        "risk_label": "Уровень риска",
        "probability_label": "Вероятность риска",
        "audience_label": "Аудитория",
        "language_label": "Язык",
        "risk_names": {"High": "ВЫСОКИЙ РИСК", "Moderate": "УМЕРЕННЫЙ РИСК", "Low": "НИЗКИЙ РИСК"},
        "overview_title": "Клиническое резюме",
        "overview": {
            "High": "Выявлен высокий риск. Подтвердите в течение 7 дней (контрастный КТ/МРТ, при необходимости ЭУС‑ПНА) и параллельно контролируйте боль/обструкцию.",
            "Moderate": "Промежуточная вероятность. Уточните в течение 2–4 недель с панкреатическим протоколом визуализации, маркерами опухоли и наблюдением по симптомам.",
            "Low": "Низкая оценка риска. Поддерживайте наблюдение, усиливайте профилактику и заранее определите признаки для более раннего пересмотра.",
        },
        "labs_title": "Лабораторные показатели",
        "labs_caption": "Значения указаны как предоставлены; сверяйте единицы измерения с лабораторией.",
        "shap_title": "Основные драйверы SHAP",
        "shap_none": "SHAP-анализ недоступен.",
        "impact_labels": {
            "positive": "повышает риск",
            "negative": "снижает риск",
            "neutral": "нейтральное влияние",
        },
        "commentary_title": "Клинический комментарий ИИ",
        "commentary_empty": "Комментарий ИИ недоступен для этой аудитории.",
        "actions_title": "Приоритетные действия",
        "actions": {
            "High": [
                "Выполнить контрастную КТ/МРТ в течение 7 дней; при неясности добавить ЭУС‑ПНА.",
                "Отслеживать опухолевые маркеры (CA 19-9, CEA), метаболические и коагуляционные панели.",
                "Параллельно контролировать боль, питание и билиарную обструкцию.",
                "Раннее вовлечение гепатобилиарного хирурга и онколога для совместного планирования.",
            ],
            "Moderate": [
                "Запланировать панкреатический протокол КТ/МРТ через 2–4 недели в зависимости от симптомов.",
                "Повторять лабораторные анализы и маркеры при изменении от исходных значений.",
                "Задокументировать тревожные симптомы и обеспечить ускоренный возврат при их появлении.",
                "Координировать наблюдение с гастроэнтерологом и лечащим врачом.",
            ],
            "Low": [
                "Поддерживать рутинное наблюдение; ускорить визуализацию при новых симптомах.",
                "Усиливать профилактику и контроль метаболических факторов риска.",
                "Обучить предупреждающим признакам для более раннего обращения.",
            ],
        },
        "guideline_title": "Рекомендации",
        "footer": "Поддержка принятия решений с помощью ИИ. Интерпретируйте с учетом клинического контекста и медицинских руководств.",
        "client_labels": {
            "patient": "Пациент",
            "clinician": "Клиницист",
            "doctor": "Врач",
            "physician": "Врач",
        },
        "language_names": {"en": "Английский", "ru": "Русский"},
    },
}


def _ensure_unicode_font(pdf: FPDF) -> Tuple[str, bool]:
    """Load Times New Roman if available so Cyrillic renders correctly (with fallback)."""
    fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fonts"))
    candidates = [
        os.path.join(fonts_dir, "TimesNewRoman.ttf"),
        os.path.join(fonts_dir, "Times New Roman.ttf"),
        os.path.join(fonts_dir, "times.ttf"),
        os.path.join(fonts_dir, "DejaVuSans.ttf"),  # fallback to legacy font if Times New Roman is absent
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # system font inside container
    ]
    # Use a fresh font name to avoid picking up stale cache PKL files with wrong absolute paths.
    font_name = "ReportSerifDyn"
    for ttf_path in candidates:
        try:
            if os.path.exists(ttf_path):
                # Verify file is readable before registering to avoid runtime errors.
                with open(ttf_path, "rb"):
                    pass
                # If a cached PKL exists but points to a missing TTF (e.g., host Windows path), delete it to force rebuild.
                pkl_path = os.path.splitext(ttf_path)[0] + ".pkl"
                if os.path.exists(pkl_path):
                    try:
                        import pickle

                        with open(pkl_path, "rb") as f:
                            meta = pickle.load(f)
                        missing = isinstance(meta, dict) and not os.path.exists(str(meta.get("ttffile", "")))
                    except Exception:
                        missing = False
                    if missing:
                        try:
                            os.remove(pkl_path)
                        except Exception:
                            pass
                pdf.add_font(font_name, "", ttf_path, uni=True)
                pdf.add_font(font_name, "B", ttf_path, uni=True)
                pdf.add_font(font_name, "I", ttf_path, uni=True)
                return font_name, True
        except Exception:
            continue
    return "Helvetica", False


def _safe(text: Any, unicode_ready: bool) -> str:
    s = "" if text is None else str(text)
    if unicode_ready:
        return s
    return s.encode("latin-1", "replace").decode("latin-1")


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


def generate_pdf_report(self, patient_inputs: Dict[str, Any], analysis: Dict[str, Any]) -> BytesIO:
    """Create a medical-grade bilingual PDF with clear clinical structure."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    font_family, unicode_ready = _ensure_unicode_font(pdf)
    content_width = pdf.w - pdf.l_margin - pdf.r_margin

    language_code = str(analysis.get("language") or "en").lower()
    locale = "ru" if language_code.startswith("ru") else "en"
    copy = COPY.get(locale, COPY["en"])

    client_type = str(analysis.get("client_type") or "patient").lower()
    client_display = copy["client_labels"].get(client_type, client_type.title())

    try:
        probability_pct = float(analysis.get("probability", 0) or 0) * 100
    except (TypeError, ValueError):
        probability_pct = 0.0
    risk_level = _normalize_risk(analysis.get("risk_level"), probability_pct / 100.0)
    risk_color = RISK_COLORS.get(risk_level, PALETTE["primary"])
    risk_names = copy.get("risk_names") or {"High": "HIGH RISK", "Moderate": "MODERATE RISK", "Low": "LOW RISK"}
    risk_name_display = risk_names.get(risk_level, risk_level)

    def section_header(title: str, fill=(241, 245, 249)) -> None:
        pdf.set_font(font_family, "B", 12)
        pdf.set_fill_color(*fill)
        pdf.set_text_color(*PALETTE["neutral"])
        pdf.cell(0, 9, _safe(title, unicode_ready), ln=True, fill=True)
        pdf.ln(1)

    def muted_caption(text: str) -> None:
        pdf.set_font(font_family, "I", 9)
        pdf.set_text_color(*PALETTE["muted"])
        pdf.multi_cell(content_width, 5, _safe(text, unicode_ready))
        pdf.set_text_color(*PALETTE["neutral"])

    def divider() -> None:
        pdf.set_draw_color(*PALETTE["border"])
        pdf.set_line_width(0.3)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
        pdf.ln(3)

    # Masthead with badge
    masthead_h = 34
    x0 = pdf.l_margin
    y0 = pdf.get_y()
    pdf.set_fill_color(*PALETTE["panel"])
    pdf.rect(x0, y0, content_width, masthead_h, "F")
    pdf.set_xy(x0 + 8, y0 + 8)
    pdf.set_font(font_family, "B", 15)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.cell(content_width - 60, 8, _safe(copy["title"], unicode_ready), ln=1)
    pdf.set_x(x0 + 8)
    pdf.set_font(font_family, "", 10)
    pdf.set_text_color(*PALETTE["muted"])
    pdf.cell(content_width - 60, 6, _safe(f"{copy['generated_on']}: {datetime.now().strftime('%Y-%m-%d %H:%M')}", unicode_ready), ln=1)

    # Risk pill on the right
    pill_w, pill_h = 56, 16
    pill_x = x0 + content_width - pill_w - 6
    pill_y = y0 + 9
    pdf.set_fill_color(*risk_color)
    pdf.set_text_color(255, 255, 255)
    pdf.rect(pill_x, pill_y, pill_w, pill_h, "F")
    pdf.set_xy(pill_x, pill_y + 3)
    pdf.set_font(font_family, "B", 11)
    pdf.cell(pill_w, 6, _safe(risk_name_display.upper(), unicode_ready), ln=0, align="C")

    pdf.set_y(y0 + masthead_h + 6)
    pdf.set_text_color(*PALETTE["neutral"])

    # Key facts row
    cards = [
        (copy["probability_label"], f"{probability_pct:.1f}%", PALETTE["primary"]),
        (copy["audience_label"], f"{client_display} / {copy['language_names'].get(locale, locale)}", PALETTE["neutral"]),
    ]
    card_gap = 6
    card_width = (content_width - card_gap) / 2
    card_height = 24
    row_y = pdf.get_y()
    pdf.set_draw_color(*PALETTE["border"])
    for idx, (label, value, accent) in enumerate(cards):
        card_x = pdf.l_margin + idx * (card_width + card_gap)
        pdf.set_fill_color(248, 250, 252)
        pdf.rect(card_x, row_y, card_width, card_height, "FD")
        pdf.set_xy(card_x + 6, row_y + 4)
        pdf.set_font(font_family, "", 9)
        pdf.set_text_color(*PALETTE["muted"])
        pdf.cell(card_width - 12, 5, _safe(label.upper(), unicode_ready))
        pdf.set_xy(card_x + 6, row_y + 11)
        pdf.set_font(font_family, "B", 12)
        pdf.set_text_color(*accent)
        pdf.cell(card_width - 12, 6, _safe(value, unicode_ready))
    pdf.set_y(row_y + card_height + 8)

    # Clinical synopsis
    section_header(copy["overview_title"], fill=(239, 246, 255))
    pdf.set_font(font_family, "", 11)
    pdf.multi_cell(content_width, 6, _safe(copy["overview"].get(risk_level, ""), unicode_ready))
    pdf.ln(2)
    divider()

    # Labs table (striped)
    section_header(copy["labs_title"], fill=(241, 245, 249))
    pdf.set_font(font_family, "B", 10)
    pdf.set_fill_color(248, 250, 252)
    pdf.set_text_color(*PALETTE["muted"])
    pdf.cell(content_width * 0.65, 7, _safe("Test", unicode_ready), ln=0, fill=True)
    pdf.cell(content_width * 0.35, 7, _safe("Value", unicode_ready), ln=1, fill=True)

    pdf.set_font(font_family, "", 10.5)
    pdf.set_text_color(*PALETTE["neutral"])
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
    label_map = FEATURE_LABELS.get(locale, FEATURE_LABELS["en"])
    row_fill = False
    for key in feature_order:
        label = label_map.get(key.upper(), key.upper())
        raw_value = patient_inputs.get(key)
        try:
            value = f"{float(raw_value):.2f}"
        except (TypeError, ValueError):
            value = "N/A" if raw_value is None else str(raw_value)
        if row_fill:
            pdf.set_fill_color(248, 250, 252)
        else:
            pdf.set_fill_color(255, 255, 255)
        pdf.cell(content_width * 0.65, 7, _safe(label, unicode_ready), ln=0, fill=True)
        pdf.cell(content_width * 0.35, 7, _safe(value, unicode_ready), ln=1, fill=True)
        row_fill = not row_fill

    pdf.ln(1)
    muted_caption(copy["labs_caption"])
    pdf.ln(2)
    divider()

    # SHAP drivers (concise list)
    section_header(copy["shap_title"], fill=(241, 245, 249))
    pdf.set_font(font_family, "", 10.5)
    shap_values = analysis.get("shap_values") or analysis.get("shapValues") or []
    impact_labels = copy["impact_labels"]
    if shap_values:
        for idx, item in enumerate(shap_values[:5], start=1):
            feature = str(item.get("feature", "Unknown"))
            label = label_map.get(feature.upper(), feature)
            impact = impact_labels.get(str(item.get("impact", "neutral")).lower(), impact_labels["neutral"])
            val = item.get("value", 0)
            try:
                val_str = f"{float(val):+.3f}"
            except (TypeError, ValueError):
                val_str = str(val)
            line = f"{idx}. {label} ({impact}): {val_str}"
            pdf.multi_cell(content_width, 6, _safe(line, unicode_ready))
    else:
        pdf.multi_cell(content_width, 6, _safe(copy["shap_none"], unicode_ready))
    pdf.ln(2)
    divider()

    # Commentary
    commentary = analysis.get("ai_explanation") or analysis.get("aiExplanation") or ""
    commentary = repair_text_encoding(commentary or "")
    section_header(copy["commentary_title"], fill=(239, 246, 255))
    pdf.set_font(font_family, "", 10.5)
    if commentary.strip():
        pdf.set_fill_color(250, 253, 255)
        pdf.set_text_color(45, 55, 72)
        for paragraph in [p.strip() for p in commentary.split("\n") if p.strip()]:
            pdf.multi_cell(content_width, 6, _safe(paragraph, unicode_ready), fill=True)
            pdf.ln(1)
        pdf.set_text_color(*PALETTE["neutral"])
    else:
        pdf.multi_cell(content_width, 6, _safe(copy["commentary_empty"], unicode_ready))
    pdf.ln(2)
    divider()

    # Actions
    actions = copy["actions"].get(risk_level, [])
    if actions:
        section_header(copy["actions_title"], fill=(241, 245, 249))
        pdf.set_font(font_family, "", 10.5)
        pdf.set_text_color(*PALETTE["neutral"])
        for action in actions:
            pdf.cell(5, 6, _safe("•", unicode_ready), ln=0)
            pdf.multi_cell(content_width - 6, 6, _safe(action, unicode_ready))
        pdf.ln(2)
        divider()

    # Footer
    pdf.set_font(font_family, "I", 9)
    pdf.set_text_color(*PALETTE["muted"])
    pdf.multi_cell(content_width, 5, _safe(copy["footer"], unicode_ready))

    pdf_bytes = pdf.output(dest="S").encode("latin-1")
    buffer = BytesIO(pdf_bytes)
    buffer.seek(0)
    return buffer

