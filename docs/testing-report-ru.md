# Отчет о тестировании

## Что проверяют backend-тесты

Backend-тесты находятся в `backend/tests/`.

Они проверяют:

- health/status/model-info endpoint'ы;
- регистрацию, bearer-аутентификацию и защищенные медицинские запросы;
- валидацию 18 лабораторных признаков;
- основной сценарий `/api/predict`;
- повторную генерацию комментария только из готового модельного контекста;
- генерацию PDF-отчета;
- batch CSV-обработку;
- SHAP-структуру;
- русскую локализацию;
- LLM guardrails против диагностических и лечебных утверждений.

## Что проверяет frontend

Frontend-проверки включают:

- JSON-валидность `Frontend/src/translations/en.json`;
- JSON-валидность `Frontend/src/translations/ru.json`;
- тесты Vitest для переводчика и пользовательского соглашения;
- production build через `npm.cmd run build`.

## Как запускать

Из корня репозитория:

```powershell
python -m pytest -q
```

Для frontend:

```powershell
cd Frontend
npm.cmd run build
```

Проверка JSON:

```powershell
python -m json.tool Frontend/src/translations/en.json
python -m json.tool Frontend/src/translations/ru.json
```

Проверка неподдержанных claims выполняется `rg` по словам из старых презентационных формулировок: старый процент качества, FDA/HIPAA, завышенный размер набора, ранняя диагностика и medical device.

## Последний результат

Последняя проверка в этой рабочей копии:

- `python -m pytest -q`: `22 passed`, есть только предупреждения Python о будущем отказе от `datetime.utcnow()`.
- `python -m json.tool Frontend/src/translations/en.json`: успешно.
- `python -m json.tool Frontend/src/translations/ru.json`: успешно.
- `npm.cmd run build`: успешно, Vite собрал production bundle; остались неблокирующие предупреждения о размере chunk и устаревшей базе Browserslist.
- Поиск неподдержанных claims: прямых утверждений о диагностике, FDA/HIPAA-соответствии, старом размере набора или старом проценте качества в пользовательских текстах не найдено. Оставшиеся совпадения относятся к отрицательным дисклеймерам, тестам guardrail или служебным/сырым файлам.

## Остаточные риски тестирования

Тесты подтверждают инженерную работоспособность прототипа, но не являются клинической валидацией. Они не доказывают безопасность модели для реальных медицинских решений и не заменяют внешнюю проверку данных, модели и инфраструктуры.
