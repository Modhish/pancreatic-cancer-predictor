from __future__ import annotations

import os
from datetime import datetime
from io import BytesIO
from typing import Any, Dict

from fpdf import FPDF

from core.constants import FEATURE_DEFAULTS, FEATURE_LABELS, RU_FEATURE_LABELS
from utils.text import repair_text_encoding
from .model_engine import FEATURE_NAMES

def generate_pdf_report(self, patient_inputs: Dict[str, Any], analysis: Dict[str, Any]) -> BytesIO:
        """Create a polished PDF report summarizing the diagnostic analysis."""
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=18)
        pdf.add_page()

        content_width = pdf.w - pdf.l_margin - pdf.r_margin
        language = (analysis.get('language') or 'en').upper()
        client_type = str(analysis.get('client_type') or 'patient').title()
        ru = language.startswith('RU')

        header_height = 24
        x0 = pdf.l_margin
        y0 = pdf.get_y()
        pdf.set_fill_color(23, 94, 201)
        pdf.set_draw_color(23, 94, 201)
        pdf.rect(x0, y0, content_width, header_height, 'F')

        # Unicode-capable font setup (optional). If DejaVuSans.ttf is present
        # at backend/fonts/DejaVuSans.ttf, use it to allow Cyrillic output.
        def _pdf_ensure_unicode_font(p: FPDF) -> bool:
            try:
                fonts_dir = os.path.join(os.path.dirname(__file__), 'fonts')
                ttf_path = os.path.join(fonts_dir, 'DejaVuSans.ttf')
                if os.path.exists(ttf_path):
                    p.add_font('DejaVu', '', ttf_path, uni=True)
                    return True
            except Exception:
                pass
            return False

        unicode_ok = _pdf_ensure_unicode_font(pdf)

        def _safe(txt: Any) -> str:
            s = str(txt) if txt is not None else ''
            return s if unicode_ok else s.encode('latin-1', 'ignore').decode('latin-1')

        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(x0 + 6, y0 + 6)
        if unicode_ok:
            pdf.set_font('DejaVu', '', 16)
        else:
            pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 8, _safe("Отчёт DiagnoAI" if ru else "DiagnoAI Clinical Intelligence Report"), ln=True)
        pdf.set_x(x0 + 6)
        if unicode_ok:
            pdf.set_font('DejaVu', '', 10)
        else:
            pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 6, _safe(("Сформировано " if ru else "Generated ") + datetime.now().strftime('%Y-%m-%d %H:%M:%S')), ln=True)

        pdf.set_y(y0 + header_height + 6)
        pdf.set_text_color(30, 41, 59)

        prediction_flag = analysis.get('prediction', 0)
        risk_level = (analysis.get('risk_level') or 'N/A')
        try:
            probability_pct = float(analysis.get('probability', 0)) * 100
        except (TypeError, ValueError):
            probability_pct = 0.0

        prediction_text = (
            "Высокий риск — требуется доп. обследование" if prediction_flag and ru
            else ("Низкий риск" if (not prediction_flag and ru) else (
                "High Risk - Further Evaluation Recommended" if prediction_flag else "Low Risk Assessment"
            ))
        )
        risk_palette = {
            'High': (220, 38, 38),
            'Moderate': (217, 119, 6),
            'Low': (22, 163, 74)
        }
        risk_color = risk_palette.get(risk_level, (37, 99, 235))

        cards = [
            (_safe("Уровень риска" if ru else "Risk Level"), risk_level.upper(), risk_color),
            (_safe("Вероятность" if ru else "Probability"), f"{probability_pct:.1f}%", (37, 99, 235)),
            (_safe("Аудитория" if ru else "Audience"), f"{client_type} | {language}", (30, 41, 59))
        ]

        card_gap = 4
        card_width = (content_width - (card_gap * (len(cards) - 1))) / len(cards)
        card_height = 22
        card_y = pdf.get_y()
        for idx, (label, value, accent) in enumerate(cards):
            card_x = pdf.l_margin + idx * (card_width + card_gap)
            pdf.set_xy(card_x, card_y)
            pdf.set_fill_color(248, 250, 255)
            pdf.set_draw_color(226, 232, 240)
            pdf.rect(card_x, card_y, card_width, card_height, 'DF')

            pdf.set_xy(card_x + 4, card_y + 4)
            if unicode_ok:
                pdf.set_font('DejaVu', '', 9)
            else:
                pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(100, 116, 139)
            pdf.cell(card_width - 8, 4, _safe(label.upper()))
            pdf.set_xy(card_x + 4, card_y + 10)
            if unicode_ok:
                pdf.set_font('DejaVu', '', 12)
            else:
                pdf.set_font("Helvetica", "B", 12)
            pdf.set_text_color(*accent)
            pdf.multi_cell(card_width - 8, 6, _safe(value))

        pdf.set_y(card_y + card_height + 8)
        pdf.set_text_color(30, 41, 59)
        if unicode_ok:
            pdf.set_font('DejaVu', '', 11)
        else:
            pdf.set_font("Helvetica", "", 11)
        para = (
            f"Заключение: {prediction_text}. Эта сводка объединяет лабораторные показатели, объяснимость SHAP и комментарий ИИ для поддержки решения."
            if ru else
            f"Prediction: {prediction_text}. This assessment combines laboratory analytics, SHAP explainability, and AI commentary to support clinical decision-making."
        )
        pdf.multi_cell(content_width, 6, _safe(para))
        pdf.ln(2)

        if unicode_ok:
            pdf.set_font('DejaVu', '', 13)
        else:
            pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 9, _safe("Лабораторные данные" if ru else "Laboratory Snapshot"), ln=True)
        if unicode_ok:
            pdf.set_font('DejaVu', '', 10.5)
        else:
            pdf.set_font("Helvetica", "", 10.5)

        feature_keys = ['wbc', 'rbc', 'plt', 'hgb', 'hct', 'mpv', 'pdw', 'mono', 'baso_abs', 'baso_pct', 'glucose', 'act', 'bilirubin']
        label_lang = 'ru' if str(analysis.get('language', 'en')).lower().startswith('ru') else 'en'
        lab_rows: list[tuple[str, str]] = []
        for key, label in zip(feature_keys, FEATURE_NAMES):
            raw_value = patient_inputs.get(key)
            try:
                formatted_value = f"{float(raw_value):.2f}"
            except (TypeError, ValueError):
                formatted_value = 'N/A' if raw_value is None else str(raw_value)
            lab_rows.append((label, formatted_value))

        row_fill = False
        row_height = 8
        for idx in range(0, len(lab_rows), 2):
            cells = lab_rows[idx:idx + 2]
            fill_color = (248, 250, 252) if row_fill else (255, 255, 255)
            pdf.set_fill_color(*fill_color)
            for col_idx in range(2):
                cell_width = content_width / 2
                if col_idx < len(cells):
                    label, value = cells[col_idx]
                    text = f"{label}: {value}"
                else:
                    text = ""
                pdf.cell(cell_width, row_height, _safe(text), border=0, ln=0 if col_idx == 0 else 1, fill=True)
            row_fill = not row_fill
        pdf.ln(2)

        shap_values = analysis.get('shap_values') or analysis.get('shapValues') or []
        if unicode_ok:
            pdf.set_font('DejaVu', '', 13)
        else:
            pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 9, _safe("Ключевые факторы SHAP" if ru else "Key SHAP Drivers"), ln=True)
        if unicode_ok:
            pdf.set_font('DejaVu', '', 11)
        else:
            pdf.set_font("Helvetica", "", 11)
        if shap_values:
            for idx, item in enumerate(shap_values[:5], start=1):
                feature = str(item.get('feature', 'Unknown'))
                label = FEATURE_LABELS.get(label_lang, FEATURE_LABELS['en']).get(feature.upper(), feature)
                impact = str(item.get('impact', 'neutral')).lower()
                value = item.get('value', 0)
                try:
                    value_str = f"{float(value):+.3f}"
                except (TypeError, ValueError):
                    value_str = str(value)
                pdf.multi_cell(content_width, 6, _safe(f"{idx}. {label} ({impact}): {value_str}"))
        else:
            pdf.multi_cell(content_width, 6, _safe("SHAP‑анализ недоступен." if ru else "SHAP analysis unavailable."))
        pdf.ln(2)

        commentary = analysis.get('ai_explanation') or analysis.get('aiExplanation') or ''
        if commentary:
            if unicode_ok:
                pdf.set_font('DejaVu', '', 13)
            else:
                pdf.set_font("Helvetica", "B", 13)
            pdf.cell(0, 9, _safe("Клинический анализ ИИ" if ru else "AI Clinical Commentary"), ln=True)
            if unicode_ok:
                pdf.set_font('DejaVu', '', 10.5)
            else:
                pdf.set_font("Helvetica", "", 10.5)
            pdf.set_fill_color(250, 253, 255)
            pdf.set_text_color(45, 55, 72)
            for paragraph in [segment.strip() for segment in commentary.split('\n') if segment.strip()]:
                pdf.multi_cell(content_width, 6, _safe(paragraph), border=0, fill=True)
                pdf.ln(1)
            pdf.set_text_color(30, 41, 59)
            pdf.ln(2)

        guideline_links = [
            ("NCCN v2.2024", "https://www.nccn.org/professionals/physician_gls/pdf/pancreatic.pdf"),
            ("ASCO 2023", "https://ascopubs.org/doi/full/10.1200/JCO.23.00000"),
            ("ESMO 2023", "https://www.esmo.org/guidelines/gastrointestinal-cancers/pancreatic-cancer"),
            ("CAPS 2020", "https://gut.bmj.com/content/69/1/7"),
            ("AGA 2020", "https://www.gastrojournal.org/article/S0016-5085(20)30094-6/fulltext")
        ]
        if unicode_ok:
            pdf.set_font('DejaVu', '', 12)
        else:
            pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, _safe("Ссылки на рекомендации" if ru else "Guideline References"), ln=True)
        if unicode_ok:
            pdf.set_font('DejaVu', '', 10)
        else:
            pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(37, 99, 235)
        bullet = '-'
        for label, url in guideline_links:
            pdf.cell(6, 6, _safe(bullet), ln=0)
            pdf.cell(0, 6, _safe(label), ln=1, link=url)
        pdf.set_text_color(30, 41, 59)
        pdf.ln(2)

        if unicode_ok:
            pdf.set_font('DejaVu', '', 9)
        else:
            pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(100, 116, 139)
        pdf.multi_cell(
            content_width,
            5,
            _safe(
                "DiagnoAI Pancreas — инструмент поддержки скрининга. Интерпретируйте с учётом клинического контекста и действующих рекомендаций."
                if ru else
                "DiagnoAI Pancreas provides AI-assisted screening support. Interpret alongside full clinical context and governing medical guidelines."
            )
        )

        # FPDF returns a string in Python 3 when dest='S'; encode to bytes explicitly
        pdf_bytes = pdf.output(dest='S').encode('latin-1')
        buffer = BytesIO(pdf_bytes)
        buffer.seek(0)
        return buffer



# Bind top-level functions back to the class to maintain API


# Clean Russian locale and labels override (ensures RU works correctly)
FEATURE_LABELS['ru_old_1'] = {
    'WBC': 'Ð›ÐµÐ¹ÐºÐ¾Ñ†Ð¸Ñ‚Ñ‹',
    'RBC': 'Ð­Ñ€Ð¸Ñ‚Ñ€Ð¾Ñ†Ð¸Ñ‚Ñ‹',
    'PLT': 'Ð¢Ñ€Ð¾Ð¼Ð±Ð¾Ñ†Ð¸Ñ‚Ñ‹',
    'HGB': 'Ð“ÐµÐ¼Ð¾Ð³Ð»Ð¾Ð±Ð¸Ð½',
    'HCT': 'Ð“ÐµÐ¼Ð°Ñ‚Ð¾ÐºÑ€Ð¸Ñ‚',
    'MPV': 'Ð¡Ñ€ÐµÐ´Ð½Ð¸Ð¹ Ð¾Ð±ÑŠÐµÐ¼ Ñ‚Ñ€Ð¾Ð¼Ð±Ð¾Ñ†Ð¸Ñ‚Ð¾Ð²',
    'PDW': 'Ð¨Ð¸Ñ€Ð¸Ð½Ð° Ñ€Ð°ÑÐ¿Ñ€ÐµÐ´ÐµÐ»ÐµÐ½Ð¸Ñ Ñ‚Ñ€Ð¾Ð¼Ð±Ð¾Ñ†Ð¸Ñ‚Ð¾Ð²',
    'MONO': 'ÐœÐ¾Ð½Ð¾Ñ†Ð¸Ñ‚Ñ‹',
    'BASO_ABS': 'Ð‘Ð°Ð·Ð¾Ñ„Ð¸Ð»Ñ‹ (Ð°Ð±Ñ.)',
    'BASO_PCT': 'Ð‘Ð°Ð·Ð¾Ñ„Ð¸Ð»Ñ‹ (%)',
    'GLUCOSE': 'Ð“Ð»ÑŽÐºÐ¾Ð·Ð°',
    'ACT': 'ÐÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ð¾Ðµ Ð²Ñ€ÐµÐ¼Ñ ÑÐ²ÐµÑ€Ñ‚Ñ‹Ð²Ð°Ð½Ð¸Ñ',
    'BILIRUBIN': 'ÐžÐ±Ñ‰Ð¸Ð¹ Ð±Ð¸Ð»Ð¸Ñ€ÑƒÐ±Ð¸Ð½',
}
# RU feature label alias (final mapping is defined later)
# RU_FEATURE_LABELS = FEATURE_LABELS['ru']

# Deprecated duplicated RU mapping (superseded later)
