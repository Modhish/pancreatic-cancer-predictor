# Simple backend Dockerfile for local/dev use
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ /app/

# Environment defaults inside the container
ENV FLASK_DEBUG=False \
    PORT=5000

EXPOSE 5000

# Start your Flask app
CMD ["python", "app.py"]
