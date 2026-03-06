# ──────────────────────────────────────────────
#  model-service: Flask + EfficientNet-B2 Skin Classifier
# ──────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies (CPU-only PyTorch for smaller image)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Copy application code and model
COPY app.py .
COPY model/ model/

EXPOSE 5000

CMD ["python", "app.py"]
