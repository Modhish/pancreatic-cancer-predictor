from __future__ import annotations
from typing import Any, Dict, List

FEATURE_DEFAULTS = [
    ('wbc', 5.8),
    ('rbc', 4.0),
    ('plt', 184.0),
    ('hgb', 127.0),
    ('hct', 40.0),
    ('mpv', 11.0),
    ('pdw', 16.0),
    ('mono', 0.42),
    ('baso_abs', 0.01),
    ('baso_pct', 0.2),
    ('glucose', 6.3),
    ('act', 26.0),
    ('bilirubin', 17.0)
]

def rebuild_feature_vector(values: Dict[str, Any] | None) -> list[float]:
    """Reconstruct feature vector in canonical order from a mapping of patient values."""
    vector: list[float] = []
    for key, default in FEATURE_DEFAULTS:
        if not values:
            vector.append(float(default))
            continue
        raw_value = values.get(key)
        if raw_value is None:
            vector.append(float(default))
            continue
        try:
            vector.append(float(raw_value))
        except (TypeError, ValueError):
            vector.append(float(default))
    return vector


FEATURE_LABELS = {
    'en': {
        'WBC': 'White blood cell count',
        'RBC': 'Red blood cell count',
        'PLT': 'Platelets',
        'HGB': 'Hemoglobin',
        'HCT': 'Hematocrit',
        'MPV': 'Mean platelet volume',
        'PDW': 'Platelet distribution width',
        'MONO': 'Monocytes fraction',
        'BASO_ABS': 'Basophils (absolute)',
        'BASO_PCT': 'Basophils (%)',
        'GLUCOSE': 'Fasting glucose',
        'ACT': 'Activated clotting time',
        'BILIRUBIN': 'Total bilirubin'
    },
    'ru': {
        'WBC': 'Количество белых кровяных клеток',
        'RBC': 'Количество красных кровяных клеток',
        'PLT': 'Тромбоциты',
        'HGB': 'Гемоглобин',
        'HCT': 'Гематокрит',
        'MPV': 'Средний объем тромбоцита',
        'PDW': 'Ширина распределения тромбоцитов',
        'MONO': 'Фракция моноцитов',
        'BASO_ABS': 'Базофилы (абсолютное)',
        'BASO_PCT': 'Базофилы (%)',
        'GLUCOSE': 'Глюкоза натощак',
        'ACT': 'Время активации свертывания',
        'BILIRUBIN': 'Общий билирубин'
    }
}

try:
    RU_FEATURE_LABELS  # type: ignore
except NameError:  # pragma: no cover
    RU_FEATURE_LABELS = FEATURE_LABELS.get('ru', FEATURE_LABELS['en'])

RU_FEATURE_LABELS_OLD: dict[str, str] = {
    'WBC': 'Количество белых кровяных клеток',
    'RBC': 'Количество красных кровяных клеток',
    'PLT': 'Тромбоциты',
    'HGB': 'Гемоглобин',
    'HCT': 'Гематокрит',
    'MPV': 'Средний объем тромбоцита',
    'PDW': 'Ширина распределения тромбоцитов',
    'MONO': 'Фракция моноцитов',
    'BASO_ABS': 'Базофилы (абсолютное)',
    'BASO_PCT': 'Базофилы (%)',
    'GLUCOSE': 'Глюкоза натощак',
    'ACT': 'Время активации свертывания',
    'BILIRUBIN': 'Общий билирубин',
}

FEATURE_LABELS['ru'] = RU_FEATURE_LABELS

COMMENTARY_LOCALE = {
    'en': {
        'risk_labels': {'High': 'HIGH', 'Moderate': 'MODERATE', 'Low': 'LOW'},
        'probability_label': 'Risk probability',
        'language_prompt': 'Respond in English with precise clinical terminology.',
        'professional': {
            'header_template': 'CLINICAL DOSSIER | {risk} RISK',
            'probability_label': 'Risk probability',
            'drivers_title': 'TOP SIGNAL DRIVERS',
            'impact_terms': {
                'positive': 'elevates risk',
                'negative': 'reduces risk pressure',
                'neutral': 'neutral contribution'
            },
            'default_driver': 'Additional biomarker within reference range',
            'synopsis_title': 'RESEARCH SYNOPSIS',
            'synopsis': {
                'High': 'SHAP signal clustering mirrors malignant-leaning physiology. Fast-track staging to clarify obstructive, infiltrative, or metastatic pathways. Summarize key differentials (adenocarcinoma vs. inflammatory mass) and highlight immediate safety issues (obstruction, infection, hyperglycemia). Note how lab trajectories and imaging features influence pretest probability and surgical candidacy.',
                'Moderate': 'Intermediate malignant probability with mixed attributions. Outline near-term diagnostics that would reduce uncertainty most efficiently (contrast CT/MRI, EUS-FNA) and mention contextual risks such as pancreatitis, diabetes, or cachexia. Emphasize shared decision-making and access considerations.',
                'Low': 'Attributions near baseline; low malignant probability. Recommend surveillance cadence, define clinical triggers that would prompt earlier reassessment, and underscore prevention strategies for metabolic and hereditary risk cohorts.'
            },
            'actions_title': 'RECOMMENDED INVESTIGATIONS',
            'actions': {
                'High': [
                    'Order contrast-enhanced pancreatic protocol CT or MRI within 7 days.',
                    'Arrange endoscopic ultrasound with fine-needle aspiration if cross-sectional imaging remains indeterminate.',
                    'Collect tumor markers (CA 19-9, CEA, CA-125) plus comprehensive metabolic and coagulation panels.',
                    'Screen for hereditary syndromes; counsel on germline testing (BRCA1/2, PALB2) when family history warrants.',
                    'Address biliary obstruction or pain control in parallel to diagnostics; consider stenting when indicated.'
                ],
                'Moderate': [
                    'Schedule pancreatic-focused CT or MRI within 2-4 weeks in line with symptom intensity.',
                    'Trend tumor markers and metabolic labs; repeat sooner when abnormalities evolve.',
                    'Review pancreatitis history, glycemic control, and weight shifts to refine differential diagnoses.',
                    'Document red-flag symptoms and provide expedited return precautions.',
                    'Coordinate nutrition, diabetes management, and pain strategies while workup proceeds.'
                ],
                'Low': [
                    'Maintain annual pancreatic imaging, sooner if clinical status changes.',
                    'Update comprehensive metabolic lab panel at routine visits and compare against prior baselines.',
                    'Continue lifestyle risk mitigation (tobacco cessation, moderated alcohol intake, weight optimization).',
                    'Educate on symptom triggers that justify earlier re-evaluation.',
                    'Reassess risk if family history, new diabetes, or weight loss emerges.'
                ]
            },
            'coordination_title': 'COLLABORATION & DATA',
            'coordination': {
                'High': [
                    'Engage hepatobiliary surgery and medical oncology teams for joint planning.',
                    'Loop in nutrition, pain, and psychosocial support services early.',
                    'Coordinate genetics consultation if familial aggregation or early-onset disease is suspected.',
                    'Prepare patients for shared decision-making; document preferences and access constraints.'
                ],
                'Moderate': [
                    'Share the summary with gastroenterology and primary care for integrated monitoring.',
                    'Discuss surveillance cadence with radiology to secure imaging access.',
                    'Offer supportive care referrals (nutrition, behavioral health) tailored to comorbid risks.',
                    'Ensure closed-loop communication and clear follow-up ownership.'
                ],
                'Low': [
                    'Communicate findings to primary care with emphasis on routine surveillance.',
                    'Provide educational materials outlining symptoms that merit rapid escalation.',
                    'Encourage enrollment in risk-reduction programs or registries when available.',
                    'Reconcile medications and address modifiable metabolic risk factors.'
                ]
            },
            'monitoring_title': 'FOLLOW-UP WINDOWS',
            'monitoring': {
                'High': [
                    'Day 0-7: finalize imaging and cytology pathway.',
                    'Week 2-4: review multidisciplinary findings and determine surgical versus systemic plan.',
                    'Month 2-3: complete staging workup; optimize nutrition and symptom control.',
                    'Quarterly: reassess biomarkers, glycemic profile, and cachexia indicators.'
                ],
                'Moderate': [
                    'Month 1: update labs and review the symptom trajectory.',
                    'Month 2-3: repeat imaging if biomarkers trend upward or new pain emerges.',
                    'Quarterly: reconcile risk factors and ensure access to imaging and labs.',
                    'Semiannual: formal reassessment with oncology or gastroenterology.'
                ],
                'Low': [
                    'Every 6-12 months: surveillance labs and imaging per guideline thresholds.',
                    'Each visit: screen for pancreatitis flares, diabetes shifts, or weight changes.',
                    'Re-evaluate sooner with family history updates or new high-risk exposures.'
                ]
            },
            'reminder_title': 'SAFE PRACTICE REMINDER',
            'reminder_text': 'Clinical decisions remain with the treating physician. Document shared decision-making.',
            'audience_guidance': 'Primary audience: gastroenterology, oncology, and hepatobiliary specialists. Cite guidelines (NCCN v2.2024, ASCO 2023, ESMO 2023) when recommending pathways.',
            'outline_template': (
                "Structure the answer with the exact uppercase headings shown below, separated by single blank lines. "
                "Use crisp clinical language anchored to guideline concepts (NCCN/ASCO/ESMO).\n"
                "{header}\n"
                "{probability_label}: <state probability as a percentage>\n\n"
                "TOP SIGNAL DRIVERS\n"
                "- Provide five concise bullets linking each top factor to pathophysiology, differentials, and immediate workup implications.\n\n"
                "RESEARCH SYNOPSIS\n"
                "- Deliver a 3-4 sentence synthesis referencing triage thresholds, staging considerations, and comorbid risk context.\n\n"
                "RECOMMENDED INVESTIGATIONS\n"
                "- List 4-6 action items with timing and responsible services (imaging, labs, procedures).\n\n"
                "COLLABORATION & DATA\n"
                "- Outline multidisciplinary coordination and data handoffs, including patient education.\n\n"
                "FOLLOW-UP WINDOWS\n"
                "- Present staged follow-up checkpoints tied to clinical triggers.\n\n"
                "SAFE PRACTICE REMINDER\n"
                "- End with one sentence reinforcing clinician oversight."
            )
        },
        'patient': {
            'header_template': 'PERSONAL REPORT | {risk} RISK',
            'probability_label': 'Screening probability',
            'drivers_title': 'SIGNAL HIGHLIGHTS',
            'impact_terms': {
                'positive': 'raises concern',
                'negative': 'offers protection',
                'neutral': 'steady influence'
            },
            'default_driver': 'Additional supportive marker within the normal range',
            'core_title': 'CORE MESSAGE',
            'core_message': {
                'High': 'The AI sees a high chance that something serious could be affecting the pancreas ({probability}). This is not a diagnosis, but it means follow-up testing should happen right away.',
                'Moderate': 'The AI sees a moderate chance of pancreatic issues ({probability}). Staying alert and coordinating next steps with your doctor is important.',
                'Low': 'The AI sees a low chance of pancreatic cancer right now ({probability}). That is encouraging, but keep sharing updates with your care team.'
            },
            'next_steps_title': 'NEXT STEPS',
            'next_steps': {
                'High': [
                    'Book a specialist visit within 1-2 weeks and share this report.',
                    'Expect detailed scans such as CT or MRI and possibly an endoscopic ultrasound.',
                    'Ask about blood tests (for example CA 19-9) that can clarify the picture.',
                    'Write down new symptoms, medications, and family history to discuss during the visit.'
                ],
                'Moderate': [
                    'Schedule a follow-up appointment in the coming weeks to review results.',
                    'Discuss whether imaging or repeat blood work is needed based on symptoms.',
                    'Track any digestion changes, weight shifts, or energy loss and report them.',
                    'Keep copies of prior labs and imaging to help your doctor compare trends.'
                ],
                'Low': [
                    'Share this summary during your next routine appointment.',
                    'Continue annual checkups and any imaging your doctor recommends.',
                    'Maintain healthy habits-balanced nutrition, regular activity, smoke-free living.',
                    'Stay alert to new symptoms and contact your doctor if anything changes.'
                ]
            },
            'warnings_title': 'ALERT SYMPTOMS',
            'warning_signs': [
                'Yellowing of the skin or eyes.',
                'Strong belly or back pain that does not ease.',
                'Very dark urine, pale stools, or sudden unexplained weight loss.',
                'Frequent nausea, vomiting, or a sudden spike in blood sugar levels.'
            ],
            'support_title': 'SUPPORT & RESOURCES',
            'support': [
                'Lean on family, friends, or support groups for encouragement.',
                'Focus on gentle nutrition, hydration, and rest while awaiting next steps.',
                'Call your doctor or emergency services if severe warning signs appear.'
            ],
            'reminder_title': 'CARE REMINDER',
            'reminder_text': 'Bring this report to your medical team. They will confirm the diagnosis and guide treatment.',
            'audience_guidance': 'Primary audience: patient or caregiver. Use encouraging, clear language while keeping explanations medically accurate.',
            'outline_template': (
                "Deliver the response using the exact headings below, each separated by a single blank line. "
                "Keep the tone compassionate, actionable, and easy to follow.\n"
                "{header}\n"
                "{probability_label}: <state probability as a percentage>\n\n"
                "CORE MESSAGE\n"
                "- Provide a reassuring 3-4 sentence overview in everyday language.\n\n"
                "SIGNAL HIGHLIGHTS\n"
                "- Use three bullet points to explain what each top factor means and how to respond.\n\n"
                "NEXT STEPS\n"
                "- Give a step-by-step checklist with timing and what to prepare.\n\n"
                "ALERT SYMPTOMS\n"
                "- List critical warning signs and who to contact.\n\n"
                "SUPPORT & RESOURCES\n"
                "- Share lifestyle and emotional support tips.\n\n"
                "CARE REMINDER\n"
                "- End with one sentence pointing back to the clinical team."
            )
        }
    },
    'ru': {
        'risk_labels': {'High': 'ВЫСОКИЙ', 'Moderate': 'УМЕРЕННЫЙ', 'Low': 'НИЗКИЙ'},
        'probability_label': 'Вероятность риска',
        'language_prompt': (
            'Отвечай на русском языке, используя точную клиническую терминологию и структурированный стиль.'
        ),
        'professional': {
            'header_template': 'КЛИНИЧЕСКОЕ ДОСЬЕ | {risk} РИСК',
            'probability_label': 'Вероятность риска',
            'drivers_title': 'КЛЮЧЕВЫЕ ДРАЙВЕРЫ СИГНАЛА',
            'impact_terms': {
                'positive': 'усиливает риск',
                'negative': 'снижает риск',
                'neutral': 'нейтральное влияние'
            },
            'default_driver': 'Дополнительный биомаркер в пределах референтного диапазона',
            'synopsis_title': 'НАУЧНОЕ РЕЗЮМЕ',
            'synopsis': {
                'High': 'Кластеризация сигналов SHAP отражает физиологию, близкую к злокачественному процессу. Необходимо ускоренное стадирование, чтобы уточнить обструктивную, инфильтративную или метастатическую природу. Сравните основные дифференциалы (аденокарцинома против воспалительного узла) и обозначьте немедленные риски — обструкция, инфекция, декомпенсация гликемии.',
                'Moderate': 'Вероятность злокачественного процесса промежуточная и имеет смешанные атрибуции. Опишите ближайшие тесты, которые быстрее всего снизят неопределенность (контрастное КТ/МРТ, ЭУС-ФНА), и учтите сопутствующие факторы — панкреатит, диабет, кахексию. Сделайте акцент на совместном принятии решений и доступности обследований.',
                'Low': 'Атрибуции близки к базовой линии, риск опухоли низкий. Рекомендуйте ритм наблюдения, определите клинические триггеры для раннего пересмотра и подчеркните стратегии профилактики для метаболических и наследственных групп риска.'
            },
            'actions_title': 'РЕКОМЕНДУЕМЫЕ ИССЛЕДОВАНИЯ',
            'actions': {
                'High': [
                    'Назначьте контрастное КТ или МРТ поджелудочной железы по специализированному протоколу в течение 7 дней.',
                    'Организуйте эндоскопическое УЗИ с тонкоигольной биопсией при неопределенности визуализации.',
                    'Определите CA 19-9, CEA и расширенный биохимический и коагуляционный профиль.',
                    'Рассмотрите герминальное тестирование (BRCA1/2, PALB2) при семейной отягощенности или раннем дебюте.',
                    'Параллельно контролируйте билиарную обструкцию и болевой синдром, включая стентирование при необходимости.'
                ],
                'Moderate': [
                    'Запланируйте панкреатическое КТ или МРТ в течение 2–4 недель в зависимости от выраженности симптомов.',
                    'Повторяйте онкомаркеры и метаболические анализы, ускоряйте при появлении новых отклонений.',
                    'Пересмотрите анамнез панкреатита, гликемический контроль и массу тела для уточнения дифференциального диагноза.',
                    'Фиксируйте симптомы тревоги и обеспечьте пациенту быстрый канал связи с клиникой.',
                    'Оптимизируйте питание, контроль сахара и обезболивание, пока продолжается диагностический поиск.'
                ],
                'Low': [
                    'Сохраняйте ежегодную визуализацию поджелудочной железы, ускоряя график при клинических изменениях.',
                    'Обновляйте расширенный биохимический профиль на плановых визитах и сравнивайте с базой.',
                    'Продолжайте меры по снижению риска (отказ от табака, умеренное потребление алкоголя, контроль веса).',
                    'Обучайте пациента симптомам, требующим более ранней переоценки.',
                    'Переоценивайте риск при появлении нового диабета, потери веса или семейного анамнеза.'
                ]
            },
            'coordination_title': 'КООРДИНАЦИЯ И ДАННЫЕ',
            'coordination': {
                'High': [
                    'Подключите хирурга-гепатобилиара и медицинского онколога для совместного планирования.',
                    'Раннее вовлечение служб питания, обезболивания и психосоциальной поддержки.',
                    'Назначьте генетическое консультирование при подозрении на наследственную форму или ранний дебют.',
                    'Документируйте предпочтения пациента, барьеры доступа и договоренности о совместных решениях.'
                ],
                'Moderate': [
                    'Синхронизируйте гастроэнтеролога, эндокринолога и врача первичного звена для мониторинга симптомов.',
                    'Обеспечьте оперативное распространение результатов визуализации и лабораторных трендов.',
                    'Проясните доступность программ наблюдения или телемедицинских консультаций.',
                    'Согласуйте планы по питанию и физической активности для снижения метаболических рисков.'
                ],
                'Low': [
                    'Обновляйте статус риска во время профилактических визитов и документируйте изменения.',
                    'Информируйте пациента о признаках, требующих ускоренного обращения.',
                    'Поддерживайте обмен данными между первичным звеном и специализированными службами.',
                    'Используйте электронные напоминания для контроля лабораторных показателей и посещаемости.'
                ]
            },
            'monitoring_title': 'ОКНА НАБЛЮДЕНИЯ',
            'monitoring': {
                'High': [
                    'День 0–7: завершите визуализацию и цитологический маршрут.',
                    'Недели 2–4: проведите мультидисциплинарный разбор и выберите хирургическую либо системную тактику.',
                    'Месяц 2–3: завершите стадирование, оптимизируйте питание и контроль симптомов.',
                    'Ежеквартально: пересматривайте биомаркеры, гликемию и признаки кахексии.'
                ],
                'Moderate': [
                    'Месяц 1: обновите лабораторные показатели и оцените динамику симптомов.',
                    'Месяцы 2–3: повторите визуализацию при росте маркеров или появлении новой боли.',
                    'Ежеквартально: корректируйте факторы риска и обеспечьте доступ к исследованиям.',
                    'Раз в полгода: формальный пересмотр совместно с онкологом или гастроэнтерологом.'
                ],
                'Low': [
                    'Каждые 6–12 месяцев: контрольные анализы и визуализация по показаниям.',
                    'Каждый визит: мониторинг обострений панкреатита, изменений диабета и массы тела.',
                    'Повторяйте оценку раньше при изменении семейного анамнеза или появлении новых факторов риска.'
                ]
            },
            'reminder_title': 'ПАМЯТКА ПО БЕЗОПАСНОСТИ',
            'reminder_text': (
                'Клинические решения остаются за лечащим врачом. Фиксируйте совместное обсуждение и шаги наблюдения.'
            ),
            'audience_guidance': (
                'Основная аудитория: гастроэнтерологи, онкологи и специалисты по поджелудочной железе. '
                'Ссылайтесь на NCCN/ASCO/ESMO при описании диагностических и лечебных маршрутов.'
            ),
            'outline_template': (
                "Структурируй ответ по заголовкам ниже и разделяй их одной пустой строкой.\n"
                "{header}\n"
                "{probability_label}: <укажи вероятность в процентах>\n\n"
                "КЛЮЧЕВЫЕ ДРАЙВЕРЫ СИГНАЛА\n"
                "- Пять кратких пунктов с клинической интерпретацией факторов.\n\n"
                "НАУЧНОЕ РЕЗЮМЕ\n"
                "- 3-4 предложения о патофизиологии, диагностике и рисках.\n\n"
                "РЕКОМЕНДУЕМЫЕ ИССЛЕДОВАНИЯ\n"
                "- Перечисли действия с указанием сроков и ответственных услуг.\n\n"
                "КООРДИНАЦИЯ И ДАННЫЕ\n"
                "- Опиши мультидисциплинарное взаимодействие и передачу информации.\n\n"
                "ОКНА НАБЛЮДЕНИЯ\n"
                "- Укажи контрольные точки и клинические триггеры.\n\n"
                "ПАМЯТКА ПО БЕЗОПАСНОСТИ\n"
                "- Напомни, что решения принимает лечащий врач."
            )
        },
        'patient': {
            'header_template': 'ЛИЧНЫЙ ОТЧЕТ | {risk} РИСК',
            'probability_label': 'Оценка риска',
            'drivers_title': 'ОСНОВНЫЕ СИГНАЛЫ',
            'impact_terms': {
                'positive': 'повышает риск',
                'negative': 'снижает риск',
                'neutral': 'нейтральное влияние'
            },
            'default_driver': 'Дополнительный показатель в пределах нормы',
            'core_title': 'ГЛАВНОЕ СООБЩЕНИЕ',
            'core_message': {
                'High': 'ИИ оценивает высокий риск значимого поражения поджелудочной железы ({probability}). Это не диагноз, но требуется срочно продолжить обследование вместе с врачом.',
                'Moderate': 'ИИ видит умеренный риск проблем с поджелудочной железой ({probability}). Важно оставаться начеку и согласовать дальнейшие шаги с лечащим специалистом.',
                'Low': 'ИИ показывает низкий риск рака поджелудочной железы сейчас ({probability}). Это обнадеживает, но продолжайте делиться обновлениями с медкомандой.'
            },
            'next_steps_title': 'СЛЕДУЮЩИЕ ШАГИ',
            'next_steps': {
                'High': [
                    'Запишитесь к профильному специалисту в течение 1–2 недель и поделитесь этим отчетом.',
                    'Будьте готовы к детальным исследованиям (КТ/МРТ, эндоскопическое УЗИ).',
                    'Спросите у врача о необходимых анализах крови, например CA 19-9.',
                    'Записывайте новые симптомы, прием лекарств и семейный анамнез для обсуждения на приеме.'
                ],
                'Moderate': [
                    'Назначьте повторный прием в ближайшие недели для обсуждения результатов.',
                    'Уточните, нужны ли визуализация или повторные анализы при изменении симптомов.',
                    'Следите за пищеварением, весом и уровнем энергии, фиксируйте изменения.',
                    'Соберите предыдущие анализы и снимки, чтобы врач мог сравнить динамику.'
                ],
                'Low': [
                    'Обсудите этот отчет на следующем плановом визите.',
                    'Поддерживайте регулярные профилактические обследования по рекомендациям врача.',
                    'Соблюдайте здоровый образ жизни: питание, активность, отказ от курения.',
                    'Будьте внимательны к новым симптомам и сообщайте врачу при их появлении.'
                ]
            },
            'warnings_title': 'СРОЧНО ОБРАТИТЬСЯ К ВРАЧУ',
            'warning_signs': [
                'Пожелтение кожи или глаз.',
                'Сильная боль в животе или спине, которая не проходит.',
                'Очень темная моча, светлый стул или резкая потеря веса.',
                'Частая тошнота, рвота или внезапные скачки сахара.'
            ],
            'support_title': 'ПОДДЕРЖКА И РЕСУРСЫ',
            'support': [
                'Опирайтесь на семью, друзей или группы поддержки для эмоциональной помощи.',
                'Сохраняйте мягкий рацион, пейте достаточно жидкости и отдыхайте пока ждете следующие шаги.',
                'Немедленно обращайтесь за медицинской помощью при выраженных тревожных признаках.'
            ],
            'timeline_title': 'ПЛАН НАБЛЮДЕНИЯ',
            'timeline': {
                'High': [
                    '1–2 недели: консультация специалиста и согласование полного обследования.',
                    '2–4 недели: прохождение визуализации и, при необходимости, эндоскопии и биопсии.',
                    'Каждый визит: сообщайте врачу обо всех симптомах и принимаемых препаратах.',
                    'После каждого этапа: обсуждайте результаты и следующий шаг лечения.'
                ],
                'Moderate': [
                    'Месяц 1: контрольный визит и повторные анализы по рекомендации врача.',
                    'Месяцы 2–3: при необходимости пройти визуализацию для уточнения картины.',
                    'Ежеквартально: делитесь изменениями веса, сахара и самочувствия.',
                    'При новом семейном анамнезе или симптомах: сообщите врачу сразу.'
                ],
                'Low': [
                    'Раз в 6–12 месяцев: обсуждение профилактических анализов и обследований.',
                    'Каждый плановый визит: делитесь любыми изменениями самочувствия.',
                    'При появлении новых симптомов: связывайтесь с врачом раньше плановой даты.',
                    'Ежедневно: поддерживайте здоровые привычки и контроль хронических состояний.'
                ]
            },
            'questions_title': 'ВОПРОСЫ ДЛЯ ВРАЧА',
            'questions': [
                'Какие обследования мне нужны в ближайшее время?',
                'Когда следует повторить анализы или обратиться раньше планового визита?',
                'Какие симптомы или показатели мне стоит отслеживать дома?'
            ],
            'reminder_title': 'ВАЖНО',
            'reminder_text': 'Покажите этот отчет своей медицинской команде. Только они подтверждают диагноз и выбирают лечение.',
            'audience_guidance': (
                'Основная аудитория: пациент или его близкие. Используйте поддерживающий тон и понятный язык, сохраняя медицинскую точность.'
            ),
            'outline_template': (
                "Используй заголовки ниже и отделяй их одной пустой строкой.\n"
                "{header}\n"
                "{probability_label}: <укажи вероятность в процентах>\n\n"
                "ГЛАВНОЕ СООБЩЕНИЕ\n"
                "- 3-4 предложения простым языком.\n\n"
                "ОСНОВНЫЕ СИГНАЛЫ\n"
                "- Объясни значение факторов и как на них реагировать.\n\n"
                "СЛЕДУЮЩИЕ ШАГИ\n"
                "- Чек-лист действий с примерными сроками.\n\n"
                "СРОЧНО ОБРАТИТЬСЯ К ВРАЧУ\n"
                "- Перечисли тревожные признаки и куда обращаться.\n\n"
                "ПОДДЕРЖКА И РЕСУРСЫ\n"
                "- Подскажи, где искать помощь и как заботиться о себе.\n\n"
                "ВАЖНО\n"
                "- Напомни, что окончательное слово за лечащим врачом."
            )
        }
    }
}
