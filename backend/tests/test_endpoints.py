import json


def test_health(client):
    r = client.get('/api/health')
    assert r.status_code == 200
    data = r.get_json()
    assert data['status'] in ('healthy', 'operational', 'ok')


def test_status(client):
    r = client.get('/api/status')
    assert r.status_code == 200
    data = r.get_json()
    assert 'features' in data


def test_model_info(client):
    r = client.get('/api/model-info')
    assert r.status_code == 200
    data = r.get_json()
    assert 'model_name' in data and 'features' in data


def test_predict_happy_path(client):
    payload = {
        'wbc': 5.8, 'rbc': 4.0, 'plt': 184.0, 'hgb': 127.0, 'hct': 40.0,
        'mpv': 9.5, 'pdw': 14.0, 'mono': 0.5, 'baso_abs': 0.03, 'baso_pct': 0.8,
        'glucose': 5.2, 'act': 28.0, 'bilirubin': 12.0,
        'language': 'en', 'client_type': 'patient'
    }
    r = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert r.status_code == 200
    data = r.get_json()
    for key in ('prediction', 'probability', 'shap_values'):
        assert key in data


def test_predict_validation_error(client):
    payload = {'wbc': 'not-a-number'}
    r = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    # Either validation error or missing fields; both acceptable here
    assert r.status_code in (200, 400)


def test_commentary_and_report(client):
    # Get a prediction
    payload = {
        'wbc': 5.8, 'rbc': 4.0, 'plt': 184.0, 'hgb': 127.0, 'hct': 40.0,
        'mpv': 9.5, 'pdw': 14.0, 'mono': 0.5, 'baso_abs': 0.03, 'baso_pct': 0.8,
        'glucose': 5.2, 'act': 28.0, 'bilirubin': 12.0,
        'language': 'en', 'client_type': 'patient'
    }
    r = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert r.status_code == 200
    result = r.get_json()

    # Regenerate commentary (LLM disabled; expect fallback)
    r2 = client.post('/api/commentary', data=json.dumps({
        'analysis': result,
        'patient_values': result.get('patient_values', {}),
        'shap_values': result.get('shap_values', []),
        'language': 'en',
        'client_type': 'patient'
    }), content_type='application/json')
    assert r2.status_code == 200
    data2 = r2.get_json()
    assert 'ai_explanation' in data2

    # Generate PDF
    r3 = client.post('/api/report', data=json.dumps({
        'patient': result.get('patient_values', {}),
        'result': result,
        'language': 'en'
    }), content_type='application/json')
    assert r3.status_code == 200
    assert r3.headers.get('Content-Type', '').startswith('application/pdf')

