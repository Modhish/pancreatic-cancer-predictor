# Contributing

## Local setup
- Install Python 3.11+ and Node 18+.
- Create a virtual environment in `backend` and install deps:
  ```bash
  cd backend
  python -m venv venv
  . venv/bin/activate  # on Windows: venv\Scripts\activate
  pip install -r requirements-dev.txt
  ```
- Copy `.env.example` to `.env` and fill in `GROQ_API_KEY` and any overrides for host/port.
- Install pre-commit hooks (runs formatters on commit):
  ```bash
  pre-commit install
  ```

## Running the app
- Backend API: `python app.py`
- Frontend: `cd Frontend && npm install && npm run dev`

## Tests and checks
- Backend unit/integration tests: `pytest backend/tests`
- Formatting (Black via pre-commit): `pre-commit run --all-files`
- CI runs `pytest backend/tests` on each push/PR (see `.github/workflows/ci.yml`).

## Pull request tips
- Keep changes focused; add/update tests when behavior changes.
- Prefer small, composable functions; keep controllers thin and move logic into services.
- Document new environment variables in `.env.example`.
