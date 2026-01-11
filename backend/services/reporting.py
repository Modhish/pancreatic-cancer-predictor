
from __future__ import annotations

import os
from datetime import datetime
from io import BytesIO
from typing import Any, Dict, Tuple

from fpdf import FPDF

from core.constants import FEATURE_LABELS
from utils.text import repair_text_encoding


PALETTE = {
    "accent": (15, 118, 110),
    "neutral": (15, 23, 42),
    "muted": (100, 116, 139),
    "panel": (248, 250, 252),
    "border": (226, 232, 240),
    "soft": (241, 245, 249),
}

RISK_COLORS = {
    "High": (220, 38, 38),
    "Moderate": (217, 119, 6),
    "Low": (22, 163, 74),
}

MEDICAL_RANGES = {
    "wbc": (4.0, 11.0),
    "rbc": (4.0, 5.5),
    "plt": (150, 450),
    "hgb": (110, 170),
    "hct": (32, 52),
    "mpv": (7.0, 13.0),
    "pdw": (9.0, 20.0),
    "mono": (0.1, 1.2),
    "baso_abs": (0.0, 0.2),
    "baso_pct": (0.0, 3.0),
    "glucose": (3.5, 7.5),
    "act": (10, 45),
    "bilirubin": (3, 25),
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


class ReportPDF(FPDF):
    def __init__(self) -> None:
        super().__init__()
        self.report_title = ""
        self.footer_label = "Page"
        self.font_family = "Helvetica"
        self.unicode_ready = False

    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_font(self.font_family, "B", 9)
        self.set_text_color(*PALETTE["muted"])
        self.cell(0, 6, _safe(self.report_title, self.unicode_ready), ln=1)
        self.set_draw_color(*PALETTE["border"])
        self.set_line_width(0.2)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(2)

    def footer(self) -> None:
        if self.page_no() == 1:
            return
        self.set_y(-12)
        self.set_font(self.font_family, "", 8)
        self.set_text_color(*PALETTE["muted"])
        label = f"{self.footer_label} {self.page_no()}/{{nb}}"
        self.cell(0, 6, _safe(label, self.unicode_ready), align="C")


def _ensure_unicode_font(pdf: FPDF) -> Tuple[str, bool]:
    """Load DejaVu Sans if available so Cyrillic renders correctly (with fallback)."""
    fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fonts"))
    candidates = [
        os.path.join(fonts_dir, "DejaVuSans.ttf"),
        os.path.join(fonts_dir, "TimesNewRoman.ttf"),
        os.path.join(fonts_dir, "Times New Roman.ttf"),
        os.path.join(fonts_dir, "times.ttf"),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    font_name = "ReportSansDyn"
    for ttf_path in candidates:
        try:
            if os.path.exists(ttf_path):
                with open(ttf_path, "rb"):
                    pass
                pkl_path = os.path.splitext(ttf_path)[0] + ".pkl"
                if os.path.exists(pkl_path):
                    try:
                        import pickle

                        with open(pkl_path, "rb") as f:
                            meta = pickle.load(f)
                        missing = isinstance(meta, dict) and not os.path.exists(
                            str(meta.get("ttffile", ""))
                        )
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


def generate_pdf_report(
    self, patient_inputs: Dict[str, Any], analysis: Dict[str, Any]
) -> BytesIO:
    """Create a medical-grade bilingual PDF with formal clinical structure."""
    pdf = ReportPDF()
    font_family, unicode_ready = _ensure_unicode_font(pdf)

    language_code = str(analysis.get("language") or "en").lower()
    locale = "ru" if language_code.startswith("ru") else "en"
    copy = COPY.get(locale, COPY["en"])

    pdf.font_family = font_family
    pdf.unicode_ready = unicode_ready
    pdf.report_title = copy["report_title"]
    pdf.footer_label = copy["page_label"]

    pdf.set_margins(16, 18, 16)
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.alias_nb_pages()
    pdf.add_page()

    content_width = pdf.w - pdf.l_margin - pdf.r_margin

    client_type = str(analysis.get("client_type") or "patient").lower()
    client_display = copy["client_labels"].get(client_type, client_type.title())

    try:
        probability_pct = float(analysis.get("probability", 0) or 0) * 100
    except (TypeError, ValueError):
        probability_pct = 0.0
    risk_level = _normalize_risk(analysis.get("risk_level"), probability_pct / 100.0)
    risk_color = RISK_COLORS.get(risk_level, PALETTE["accent"])
    risk_names = copy.get("risk_names") or {
        "High": "HIGH RISK",
        "Moderate": "MODERATE RISK",
        "Low": "LOW RISK",
    }
    risk_name_display = risk_names.get(risk_level, risk_level)

    def section_title(title: str) -> None:
        pdf.set_font(font_family, "B", 10.5)
        pdf.set_text_color(*PALETTE["accent"])
        pdf.cell(0, 6, _safe(title.upper(), unicode_ready), ln=1)
        pdf.set_draw_color(*PALETTE["border"])
        pdf.set_line_width(0.2)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
        pdf.ln(3)

    def bullet_list(items: list[str]) -> None:
        pdf.set_font(font_family, "", 10)
        pdf.set_text_color(*PALETTE["neutral"])
        for item in items:
            pdf.set_x(pdf.l_margin + 2)
            pdf.cell(4, 5, _safe("•", unicode_ready), ln=0)
            pdf.multi_cell(content_width - 6, 5, _safe(item, unicode_ready))
        pdf.ln(1)

    # Cover page
    cover_top = pdf.t_margin
    cover_bottom = pdf.h - pdf.b_margin
    cover_height = cover_bottom - cover_top
    top_end = cover_top + cover_height * 0.2
    mid_end = cover_top + cover_height * 0.8

    pdf.set_y(cover_top + 6)
    pdf.set_font(font_family, "", 10)
    pdf.set_text_color(*PALETTE["muted"])
    pdf.cell(0, 5, _safe(copy["tool_name"], unicode_ready), ln=1)
    pdf.set_font(font_family, "B", 18)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.multi_cell(content_width, 8, _safe(copy["report_title"], unicode_ready))

    module_block_h = 60
    module_top = top_end + max(0, (mid_end - top_end - module_block_h) / 2)
    pdf.set_y(max(pdf.get_y(), module_top))
    pdf.set_font(font_family, "B", 34)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.cell(0, 12, _safe(f"{probability_pct:.1f}%", unicode_ready), ln=1, align="C")
    pdf.set_font(font_family, "B", 11)
    pdf.set_text_color(*PALETTE["accent"])
    pdf.cell(0, 6, _safe(risk_name_display, unicode_ready), ln=1, align="C")

    bar_width = content_width * 0.55
    bar_x = pdf.l_margin + (content_width - bar_width) / 2
    bar_y = pdf.get_y() + 4
    bar_h = 4
    pdf.set_fill_color(*PALETTE["border"])
    pdf.rect(bar_x, bar_y, bar_width, bar_h, "F")
    fill_w = max(2, min(bar_width, bar_width * (probability_pct / 100.0)))
    pdf.set_fill_color(*PALETTE["accent"])
    pdf.rect(bar_x, bar_y, fill_w, bar_h, "F")
    pdf.set_y(bar_y + bar_h + 6)
    pdf.set_font(font_family, "", 10)
    pdf.set_text_color(*PALETTE["muted"])
    cover_note = copy["cover_interpretation"].get(risk_level, "")
    if cover_note:
        pdf.multi_cell(content_width, 5, _safe(cover_note, unicode_ready), align="C")

    pdf.set_y(mid_end + 4)
    pdf.set_font(font_family, "", 9)
    pdf.set_text_color(*PALETTE["muted"])
    cover_labels = copy["cover_meta_labels"]
    pdf.cell(
        0,
        5,
        _safe(f"{cover_labels['generated']}: {datetime.now().strftime('%Y-%m-%d %H:%M')}", unicode_ready),
        ln=1,
    )
    pdf.cell(
        0,
        5,
        _safe(f"{cover_labels['intended_use']}: {copy['cover_intended_use_value']}", unicode_ready),
        ln=1,
    )
    pdf.cell(
        0,
        5,
        _safe(f"{cover_labels['audience']}: {client_display}", unicode_ready),
        ln=1,
    )
    pdf.multi_cell(
        content_width,
        5,
        _safe(f"{cover_labels['disclaimer']}: {copy['cover_disclaimer']}", unicode_ready),
    )

    pdf.add_page()

    # Executive summary
    section_title(copy["executive_title"])
    summary_template = copy["executive_summary"].get(risk_level, "")
    summary_text = summary_template.format(
        probability=f"{probability_pct:.1f}",
        risk=risk_name_display,
    )
    pdf.set_font(font_family, "", 11)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.multi_cell(content_width, 6, _safe(summary_text, unicode_ready))
    pdf.ln(2)

    # Context
    section_title(copy["context_title"])
    context_rows = [
        (copy["context_labels"]["audience"], client_display),
        (copy["context_labels"]["language"], copy["language_names"].get(locale, locale)),
        (copy["context_labels"]["use"], copy["context_use_value"]),
    ]
    for label, value in context_rows:
        pdf.set_font(font_family, "B", 9)
        pdf.set_text_color(*PALETTE["muted"])
        pdf.cell(content_width * 0.32, 6, _safe(label, unicode_ready))
        pdf.set_font(font_family, "", 10)
        pdf.set_text_color(*PALETTE["neutral"])
        pdf.cell(content_width * 0.68, 6, _safe(value, unicode_ready), ln=1)
    pdf.ln(2)

    # Risk assessment overview
    section_title(copy["assessment_title"])
    pdf.set_font(font_family, "B", 11)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.cell(
        0,
        6,
        _safe(f"{copy['risk_category_label']}: {risk_name_display}", unicode_ready),
        ln=1,
    )
    pdf.set_font(font_family, "", 10.5)
    pdf.set_text_color(*PALETTE["muted"])
    pdf.cell(
        0,
        5,
        _safe(f"{copy['probability_label']}: {probability_pct:.1f}%", unicode_ready),
        ln=1,
    )
    pdf.set_fill_color(*PALETTE["border"])
    pdf.rect(pdf.l_margin, pdf.get_y() + 1, content_width, 4, "F")
    pdf.set_fill_color(*risk_color)
    pdf.rect(
        pdf.l_margin,
        pdf.get_y() + 1,
        max(2, min(content_width, content_width * (probability_pct / 100.0))),
        4,
        "F",
    )
    pdf.ln(7)
    assessment_note = copy["assessment_interpretation"].get(risk_level, "")
    if assessment_note:
        pdf.set_font(font_family, "", 10.5)
        pdf.set_text_color(*PALETTE["muted"])
        pdf.multi_cell(content_width, 5, _safe(assessment_note, unicode_ready))
    pdf.ln(1)

    # Labs table
    section_title(copy["labs_title"])
    col1 = content_width * 0.46
    col2 = content_width * 0.18
    col3 = content_width - col1 - col2
    pdf.set_font(font_family, "B", 9)
    pdf.set_fill_color(*PALETTE["soft"])
    pdf.set_text_color(*PALETTE["muted"])
    pdf.cell(col1, 7, _safe(copy["labs_columns"][0], unicode_ready), 0, 0, fill=True)
    pdf.cell(col2, 7, _safe(copy["labs_columns"][1], unicode_ready), 0, 0, fill=True)
    pdf.cell(col3, 7, _safe(copy["labs_columns"][2], unicode_ready), 0, 1, fill=True)
    pdf.set_font(font_family, "", 10)
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
    label_map = FEATURE_LABELS.get("en", FEATURE_LABELS["en"])
    if locale == "ru":
        label_map = RU_LAB_LABELS
    row_fill = False
    for key in feature_order:
        label = label_map.get(key.upper(), key.upper())
        raw_value = patient_inputs.get(key)
        try:
            value = f"{float(raw_value):.2f}"
        except (TypeError, ValueError):
            value = "N/A" if raw_value is None else str(raw_value)
        range_text = ""
        if key in MEDICAL_RANGES:
            min_val, max_val = MEDICAL_RANGES[key]
            range_text = f"{min_val}-{max_val}"
        if row_fill:
            pdf.set_fill_color(249, 250, 251)
        else:
            pdf.set_fill_color(255, 255, 255)
        pdf.cell(col1, 7, _safe(label, unicode_ready), 0, 0, fill=True)
        pdf.cell(col2, 7, _safe(value, unicode_ready), 0, 0, fill=True)
        pdf.cell(col3, 7, _safe(range_text, unicode_ready), 0, 1, fill=True)
        row_fill = not row_fill
    pdf.ln(1)
    pdf.set_font(font_family, "I", 9)
    pdf.set_text_color(*PALETTE["muted"])
    pdf.multi_cell(content_width, 5, _safe(copy["labs_caption"], unicode_ready))
    pdf.ln(2)

    # Explainability
    section_title(copy["explainability_title"])
    pdf.set_font(font_family, "", 9)
    pdf.set_text_color(*PALETTE["muted"])
    pdf.multi_cell(content_width, 5, _safe(copy["impact_legend"], unicode_ready))
    pdf.ln(1)
    pdf.set_font(font_family, "", 10)
    pdf.set_text_color(*PALETTE["neutral"])
    shap_values = analysis.get("shap_values") or analysis.get("shapValues") or []
    if isinstance(shap_values, dict):
        shap_values = [shap_values]
    impact_labels = copy["impact_labels"]
    direction_map = {"positive": "↑", "negative": "↓", "neutral": "•"}
    if shap_values:
        for item in shap_values[:5]:
            feature = str(item.get("feature", "Unknown"))
            label = label_map.get(feature.upper(), feature)
            impact_key = str(item.get("impact", "neutral")).lower()
            impact = impact_labels.get(impact_key, impact_labels["neutral"])
            direction = direction_map.get(impact_key, "•")
            val = item.get("value", 0)
            try:
                val_str = f"{float(val):+.3f}"
            except (TypeError, ValueError):
                val_str = str(val)
            line = f"{direction} {label}: {impact} ({val_str})"
            pdf.multi_cell(content_width, 5, _safe(line, unicode_ready))
    else:
        pdf.multi_cell(content_width, 5, _safe(copy["explainability_empty"], unicode_ready))
    pdf.ln(1)

    # AI interpretation
    section_title(copy["interpretation_title"])
    commentary_source = ""
    audience_commentaries = analysis.get("audience_commentaries") or {}
    audience_by_lang = analysis.get("audience_commentaries_by_lang") or {}
    commentary_source = (
        audience_by_lang.get(f"{locale}:{client_type}")
        or audience_commentaries.get(client_type)
        or analysis.get("ai_explanation")
        or analysis.get("aiExplanation")
        or ""
    )
    commentary = repair_text_encoding(commentary_source or "")
    pdf.set_font(font_family, "", 10)
    pdf.set_text_color(*PALETTE["neutral"])
    if commentary.strip():
        for paragraph in [p.strip() for p in commentary.split("\n") if p.strip()]:
            pdf.multi_cell(content_width, 5.5, _safe(paragraph, unicode_ready))
            pdf.ln(0.5)
    else:
        pdf.multi_cell(content_width, 5.5, _safe(copy["interpretation_empty"], unicode_ready))
    pdf.ln(1)

    # Recommendations
    section_title(copy["recommendations_title"])
    pdf.set_font(font_family, "B", 10)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.cell(0, 5, _safe(copy["recommendations_clinical"], unicode_ready), ln=1)
    bullet_list(copy["recommendations"]["clinical"].get(risk_level, []))
    pdf.set_font(font_family, "B", 10)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.cell(0, 5, _safe(copy["recommendations_research"], unicode_ready), ln=1)
    bullet_list(copy["recommendations"]["research"])

    # Follow-up framework
    section_title(copy["followup_title"])
    pdf.set_font(font_family, "", 10)
    pdf.set_text_color(*PALETTE["neutral"])
    row_fill = False
    left_w = content_width * 0.28
    right_w = content_width - left_w
    for row in copy["followup_rows"]:
        if row_fill:
            pdf.set_fill_color(249, 250, 251)
        else:
            pdf.set_fill_color(255, 255, 255)
        pdf.set_font(font_family, "B", 9.5)
        pdf.cell(left_w, 8, _safe(row["label"], unicode_ready), 0, 0, fill=True)
        pdf.set_font(font_family, "", 9.5)
        pdf.multi_cell(right_w, 8, _safe(row["text"], unicode_ready), fill=True)
        row_fill = not row_fill
    pdf.ln(1)

    # Disclaimers
    section_title(copy["disclaimers_title"])
    pdf.set_font(font_family, "", 9.5)
    pdf.set_text_color(*PALETTE["neutral"])
    pdf.multi_cell(content_width, 5.5, _safe(copy["disclaimers_text"], unicode_ready))

    pdf_bytes = pdf.output(dest="S").encode("latin-1")
    buffer = BytesIO(pdf_bytes)
    buffer.seek(0)
    return buffer
