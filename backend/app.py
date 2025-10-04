from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import shap
from groq import Groq
import os
from dotenv import load_dotenv
import os
app = Flask(__name__)
CORS(app)  


load_dotenv()  # Add this at the top

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
app = Flask(__name__)
CORS(app)

# Initialize Groq client (get free API key from console.groq.com)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", "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"))

# Load your trained model (you'll add this later)
# model = joblib.load('models/random_forest.pkl')

# For demo, we'll use mock predictions
def mock_predict(features):
    """Replace this with actual model.predict() later"""
    # Simple logic: if certain values are abnormal, predict 1 (disease)
    if features[2] > 400 or features[12] > 25:  # PLT or Bilirubin high
        return 1, 0.15  # prediction, probability
    return 0, 0.96

def calculate_shap_values(features, prediction):
    """Mock SHAP values - replace with real SHAP calculation"""
    feature_names = ['WBC', 'RBC', 'PLT', 'HGB', 'HCT', 'MPV', 'PDW', 
                     'MONO', 'BASO_ABS', 'BASO_PCT', 'Glucose', 'ACT', 'Bilirubin']
    
    # Mock SHAP values based on feature deviation
    base_values = [5.8, 4, 184, 127, 40, 11, 16, 0.42, 0.01, 0.2, 6.3, 26, 17]
    shap_values = []
    
    for i, (feat, base) in enumerate(zip(features, base_values)):
        deviation = (feat - base) / base if base != 0 else 0
        impact = 'positive' if deviation > 0 else 'negative'
        value = deviation * 0.1  # Scale factor
        shap_values.append({
            'feature': feature_names[i],
            'value': round(value, 3),
            'impact': impact
        })
    
    # Sort by absolute value
    shap_values.sort(key=lambda x: abs(x['value']), reverse=True)
    return shap_values[:9]  # Top 9 features

def get_ai_explanation(prediction, probability, shap_values, patient_data):
    """Get AI explanation using Groq LLM"""
    feature_analysis = "\n".join([
        f"- {sv['feature']}: {sv['value']:.3f} ({'положительное' if sv['impact'] == 'positive' else 'отрицательное'} влияние)"
        for sv in shap_values[:5]
    ])
    
    prompt = f"""Ты медицинский ассистент. Проанализируй результаты диагностики рака поджелудочной железы.

Результат модели: {'Подозрение на заболевание' if prediction == 1 else 'Низкий риск заболевания'}
Вероятность: {probability:.2f}

Наиболее важные показатели (SHAP анализ):
{feature_analysis}

Данные пациента:
- WBC: {patient_data[0]} (норма: 4-9)
- PLT: {patient_data[2]} (норма: 150-400)
- Билирубин: {patient_data[12]} (норма: 8.5-20.5)

Предоставь:
1. Краткое резюме (1 предложение)
2. 3-4 ключевых наблюдения
3. Рекомендацию для пациента

Ответь на русском языке, будь точным и профессиональным."""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"AI Error: {e}")
        return "Анализ недоступен. Обратитесь к врачу для интерпретации результатов."

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Extract features in correct order
        features = [
            float(data.get('wbc', 5.8)),
            float(data.get('rbc', 4)),
            float(data.get('plt', 184)),
            float(data.get('hgb', 127)),
            float(data.get('hct', 40)),
            float(data.get('mpv', 11)),
            float(data.get('pdw', 16)),
            float(data.get('mono', 0.42)),
            float(data.get('baso_abs', 0.01)),
            float(data.get('baso_pct', 0.2)),
            float(data.get('glucose', 6.3)),
            float(data.get('act', 26)),
            float(data.get('bilirubin', 17))
        ]
        
        # Get prediction
        prediction, probability = mock_predict(features)
        
        # Calculate SHAP values
        shap_values = calculate_shap_values(features, prediction)
        
        # Get AI explanation
        ai_explanation = get_ai_explanation(prediction, probability, shap_values, features)
        
        # Model metrics (from paper)
        metrics = {
            'accuracy': 0.9259,
            'recall': 0.7857,
            'precision': 0.9589,
            'f1': 0.8422,
            'log_loss': 0.2162,
            'mcc': 0.7242
        }
        
        return jsonify({
            'prediction': int(prediction),
            'probability': float(probability),
            'shapValues': shap_values,
            'metrics': metrics,
            'aiExplanation': ai_explanation
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)