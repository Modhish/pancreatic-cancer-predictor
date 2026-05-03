# DiagnoAI Pancreas

Web application for pancreatic cancer risk assessment support using laboratory indicators, Random Forest inference, SHAP-style explanations, AI commentary, and PDF reporting.

This project is a bachelor thesis prototype. It is not a diagnostic system, not a certified medical device, and not a substitute for physician judgment.

## Bachelor Research Prototype Scope

- The application estimates pancreatic cancer risk from CBC/ESR indicators; it does not diagnose cancer.
- Dataset preparation and model metrics are reproducible from `Набор данных.xlsx`, `datasets/user_cbc_dataset.csv`, and `backend/models/user_cbc_rf.metrics.json`.
- The LLM is used only to explain the already computed model result and SHAP factors. It does not predict, override probabilities, or make treatment decisions.
- Security controls are prototype-level: authentication, password hashing, bearer tokens, roles, request limits, configurable CORS, and audit events are implemented, but this is not a certified medical deployment.
- Main defense documentation is in Russian: `docs/business-logic-ru.md`, `docs/model-methodology-ru.md`, `docs/security-and-privacy-ru.md`, `docs/testing-report-ru.md`, and `docs/teacher-answers-ru.md`.

## Current Model

The current reproducible model is trained from the workbook `Набор данных.xlsx`.

Cleaned dataset:

- source rows: `1254`
- usable rows after feature cleaning: `1203`
- negative class (`нет`): `1115`
- positive class (`да`): `88`
- selected features: `18` CBC/ESR indicators

Selected features:

- `wbc`
- `rbc`
- `plt`
- `hgb`
- `hct`
- `mpv`
- `pdw`
- `neut_abs`
- `neut_pct`
- `lymph_abs`
- `lymph_pct`
- `mono_abs`
- `mono_pct`
- `eos_abs`
- `eos_pct`
- `baso_abs`
- `baso_pct`
- `esr`

Training artifacts:

- `datasets/user_cbc_dataset.csv`
- `datasets/user_cbc_dataset.metadata.json`
- `backend/models/user_cbc_rf.pkl`
- `backend/models/user_cbc_rf.metrics.json`

Holdout test metrics:

| Metric | Value |
| --- | ---: |
| Accuracy | `0.975104` |
| Precision | `0.875000` |
| Recall / Sensitivity | `0.777778` |
| Specificity | `0.991031` |
| F1-score | `0.823529` |
| ROC-AUC | `0.974963` |
| PR-AUC | `0.879479` |
| MCC | `0.811813` |
| Log loss | `0.096632` |
| Brier score | `0.025834` |

Holdout confusion matrix:

- TN: `221`
- FP: `2`
- FN: `4`
- TP: `14`

The operating threshold is `0.3`, selected on the validation split to improve screening sensitivity.

## Reproducibility

Prepare the dataset:

```powershell
python backend\training\prepare_user_excel_dataset.py
```

Train the model:

```powershell
python backend\training\train_user_rf.py
```

## Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Frontend

```powershell
cd Frontend
npm install
npm run dev
```

## Main API Endpoints

- `POST /api/predict`
- `POST /api/commentary`
- `POST /api/report`
- `GET /api/health`
- `GET /api/status`
- `GET /api/model-info`

## Implemented Controls

- account registration and login
- hashed passwords
- bearer-token authentication
- role-aware access checks
- request IDs
- audit logging
- request size limit
- rate limiting when `flask-limiter` is installed

## Important Limitations

- The model estimates risk from selected blood-test features only.
- It does not diagnose pancreatic cancer.
- It has not passed external clinical validation.
- It is not FDA approved and does not claim certified HIPAA compliance.
- Stored medical data protection must be hardened before any real deployment.

See `docs/teacher-answers-ru.md` for defense-ready answers to the teacher's questions.
