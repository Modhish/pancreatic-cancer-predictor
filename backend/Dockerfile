# Simple backend Dockerfile for local/dev use
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/

ENV FLASK_DEBUG=False \
    PORT=5000 \
    PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["python", "app.py"]

