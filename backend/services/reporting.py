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
    ("NCCN v2.2024", "https://www.nccn.org/professionals/physician_gls/pdf/pancreatic.pdf"),
    ("ASCO 2023", "https://ascopubs.org/doi/full/10.1200/JCO.23.00000"),
    ("ESMO 2023", "https://www.esmo.org/guidelines/gastrointestinal-cancers/pancreatic-cancer"),
    ("CAPS 2020", "https://gut.bmj.com/content/69/1/7"),
    ("AGA 2020", "https://www.gastrojournal.org/article/S0016-5085(20)30094-6/fulltext"),
]

COPY = {
    "en": {
        "title": "DiagnoAI Pancreas | Clinical Report",
        "generated_on": "Generated on",
        "risk_label": "Risk level",
        "probability_label": "Risk probability",
        "audience_label": "Audience",
        "language_label": "Language",
        "overview_title": "Clinical overview",
        "overview": {
            "High": "High-risk pattern detected. Confirm within 7 days (contrast CT/MRI, EUS-FNA if needed) and manage pain/obstruction in parallel.",
            "Moderate": "Intermediate probability. Clarify in 2–4 weeks with pancreatic protocol imaging, tumor markers, and symptom-guided follow-up.",
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
        "overview_title": "Клиническое резюме",
        "overview": {
            "High": "Обнаружен высокий риск. Подтвердите диагноз в течение 7 дней: контрастная КТ/МРТ, EUS-FNA при неопределённом изображении, параллельно контролируйте желчную обструкцию и боль.",
            "Moderate": "Умеренная вероятность. Уточните в ближайшие 2–4 недели с помощью КТ/МРТ по протоколу поджелудочной, онкомаркеров и симптом-ориентированного наблюдения.",
            "Low": "Низкая оценка риска. Поддерживайте наблюдение, усиливайте профилактику и заранее определите признаки для более раннего пересмотра.",
        },
        "labs_title": "Лабораторный срез",
        "labs_caption": "Значения приведены в исходных единицах; сверяйте с лабораторией.",
        "shap_title": "Ключевые факторы SHAP",
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


def _ensure_unicode_font(pdf: FPDF) -> Tuple[str, bool]:
    """Load DejaVu font if available so Cyrillic renders correctly."""
    fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fonts"))
    ttf_path = os.path.join(fonts_dir, "DejaVuSans.ttf")
    try:
        if os.path.exists(ttf_path):
            pdf.add_font("DejaVu", "", ttf_path, uni=True)
            pdf.add_font("DejaVu", "B", ttf_path, uni=True)
            pdf.add_font("DejaVu", "I", ttf_path, uni=True)
            return "DejaVu", True
    except Exception:
        pass
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
    """Create a professional bilingual PDF report summarizing the diagnostic analysis."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()

    font_family, unicode_ready = _ensure_unicode_font(pdf)
    pdf.set_font(font_family, "B", 14)
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

    # Header
    pdf.set_fill_color(*PALETTE["primary"])
    pdf.set_draw_color(*PALETTE["primary"])
    header_height = 26
    x0 = pdf.l_margin
    y0 = pdf.get_y()
    pdf.rect(x0, y0, content_width, header_height, "F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(x0 + 6, y0 + 6)
    pdf.cell(0, 8, _safe(copy["title"], unicode_ready), ln=True)
    pdf.set_x(x0 + 6)
    pdf.set_font(font_family, "", 10)
    pdf.cell(0, 6, _safe(f'{copy["generated_on"]}: {datetime.now().strftime("%Y-%m-%d %H:%M")}', unicode_ready), ln=True)

    pdf.set_y(y0 + header_height + 8)
    pdf.set_text_color(*PALETTE["neutral"])

    cards = [
        (copy["risk_label"], copy["risk_names"].get(risk_level, risk_level), risk_color),
        (copy["probability_label"], f"{probability_pct:.1f}%", PALETTE["primary"]),
        (copy["audience_label"], f"{client_display} | {copy['language_names'].get(locale, locale)}", PALETTE["neutral"]),
    ]
    card_gap = 4
    card_width = (content_width - card_gap * (len(cards) - 1)) / len(cards)
    card_height = 26
    card_y = pdf.get_y()

    for idx, (label, value, accent) in enumerate(cards):
        card_x = pdf.l_margin + idx * (card_width + card_gap)
        pdf.set_xy(card_x, card_y)
        pdf.set_fill_color(*PALETTE["panel"])
        pdf.set_draw_color(*PALETTE["border"])
        pdf.rect(card_x, card_y, card_width, card_height, "DF")

        pdf.set_xy(card_x + 5, card_y + 4)
        pdf.set_font(font_family, "", 9)
        pdf.set_text_color(*PALETTE["muted"])
        pdf.cell(card_width - 10, 5, _safe(label.upper(), unicode_ready))

        pdf.set_xy(card_x + 5, card_y + 12)
        pdf.set_font(font_family, "B", 12)
        pdf.set_text_color(*accent)
        pdf.multi_cell(card_width - 10, 6, _safe(value, unicode_ready))

    pdf.set_y(card_y + card_height + 8)

    # Overview
    pdf.set_font(font_family, "B", 12)
    pdf.set_fill_color(239, 246, 255)
    pdf.cell(0, 9, _safe(copy["overview_title"], unicode_ready), ln=True, fill=True)
    pdf.ln(1)
    pdf.set_font(font_family, "", 11)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.multi_cell(content_width, 6, _safe(copy["overview"].get(risk_level, ""), unicode_ready))
    pdf.ln(2)

    # Labs
    pdf.set_font(font_family, "B", 12)
    pdf.set_fill_color(241, 245, 249)
    pdf.cell(0, 9, _safe(copy["labs_title"], unicode_ready), ln=True, fill=True)
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
    rows: list[tuple[str, str]] = []
    for key in feature_order:
        label = label_map.get(key.upper(), key.upper())
        raw_value = patient_inputs.get(key)
        try:
            value = f"{float(raw_value):.2f}"
        except (TypeError, ValueError):
            value = "N/A" if raw_value is None else str(raw_value)
        rows.append((label, value))

    row_height = 8
    row_fill = False
    for idx in range(0, len(rows), 2):
        fill_color = (248, 250, 252) if row_fill else (255, 255, 255)
        pdf.set_fill_color(*fill_color)
        for col_idx in range(2):
            width = content_width / 2
            if col_idx < len(rows[idx : idx + 2]):
                label, value = rows[idx + col_idx]
                text_line = f"{label}: {value}"
            else:
                text_line = ""
            pdf.cell(width, row_height, _safe(text_line, unicode_ready), ln=0 if col_idx == 0 else 1, fill=True)
        row_fill = not row_fill

    pdf.set_text_color(*PALETTE["muted"])
    pdf.set_font(font_family, "I", 9)
    pdf.ln(1)
    pdf.multi_cell(content_width, 5, _safe(copy["labs_caption"], unicode_ready))
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.ln(2)

    # SHAP
    pdf.set_font(font_family, "B", 12)
    pdf.set_fill_color(241, 245, 249)
    pdf.cell(0, 9, _safe(copy["shap_title"], unicode_ready), ln=True, fill=True)
    pdf.set_font(font_family, "", 11)
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

    # Commentary
    commentary = analysis.get("ai_explanation") or analysis.get("aiExplanation") or ""
    commentary = repair_text_encoding(commentary or "")
    pdf.set_font(font_family, "B", 12)
    pdf.set_fill_color(239, 246, 255)
    pdf.cell(0, 9, _safe(copy["commentary_title"], unicode_ready), ln=True, fill=True)
    pdf.set_font(font_family, "", 10.5)
    if commentary.strip():
        pdf.set_fill_color(250, 253, 255)
        pdf.set_text_color(45, 55, 72)
        for paragraph in [p.strip() for p in commentary.split("\n") if p.strip()]:
            pdf.multi_cell(content_width, 6, _safe(paragraph, unicode_ready), fill=True)
            pdf.ln(1)
        pdf.set_text_color(*PALETTE["neutral"])
    else:
        pdf.set_text_color(*PALETTE["neutral"])
        pdf.multi_cell(content_width, 6, _safe(copy["commentary_empty"], unicode_ready))
    pdf.ln(2)

    # Actions
    actions = copy["actions"].get(risk_level, [])
    if actions:
        pdf.set_font(font_family, "B", 12)
        pdf.set_fill_color(241, 245, 249)
        pdf.cell(0, 9, _safe(copy["actions_title"], unicode_ready), ln=True, fill=True)
        pdf.set_font(font_family, "", 10.5)
        pdf.set_text_color(*PALETTE["neutral"])
        for action in actions:
            pdf.cell(4, 6, _safe("•", unicode_ready), ln=0)
            pdf.multi_cell(content_width - 6, 6, _safe(action, unicode_ready))
        pdf.ln(2)

    # Guidelines
    pdf.set_font(font_family, "B", 12)
    pdf.set_fill_color(239, 246, 255)
    pdf.cell(0, 9, _safe(copy["guideline_title"], unicode_ready), ln=True, fill=True)
    pdf.set_font(font_family, "", 10)
    pdf.set_text_color(37, 99, 235)
    for label, url in GUIDELINE_LINKS:
        pdf.cell(5, 6, _safe("-", unicode_ready), ln=0)
        pdf.cell(0, 6, _safe(label, unicode_ready), ln=1, link=url)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.ln(2)

    # Footer
    pdf.set_font(font_family, "I", 9)
    pdf.set_text_color(*PALETTE["muted"])
    pdf.multi_cell(content_width, 5, _safe(copy["footer"], unicode_ready))

    pdf_bytes = pdf.output(dest="S").encode("latin-1")
    buffer = BytesIO(pdf_bytes)
    buffer.seek(0)
    return buffer
