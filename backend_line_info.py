from pathlib import Path
lines = Path("backend/app.py").read_text(encoding="utf-8").splitlines()
for idx, line in enumerate(lines, 1):
    if line.strip().startswith('def rebuild_feature_vector'):
        print('rebuild', idx)
    if line.strip().startswith('def generate_pdf_report'):
        print('pdf', idx)
    if line.strip().startswith('@app.route') and 'commentary' in line:
        print('commentary', idx)
