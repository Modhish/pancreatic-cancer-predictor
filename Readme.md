# Pancreatic Cancer Prediction System

Machine learning-based diagnostic tool for early detection of pancreatic cancer using blood test analysis with SHAP interpretability and AI-powered explanations.

## Features

- **ML Classification**: Random Forest model with 92.59% accuracy
- **SHAP Interpretation**: Visual waterfall charts showing feature importance
- **AI Analysis**: LLM-powered explanations using Groq API
- **Web Interface**: React-based frontend with Flask backend
- **Real-time Predictions**: Instant analysis of 13 blood parameters

## Tech Stack

**Backend:**
- Python 3.11+
- Flask
- scikit-learn
- SHAP
- Groq API (LLM)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Lucide Icons

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at https://console.groq.com)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt