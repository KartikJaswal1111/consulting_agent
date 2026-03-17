# ── Base image ────────────────────────────────────────────────────────────────
FROM python:3.13-slim

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Install dependencies first (cached layer) ────────────────────────────────
COPY backend_py/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy application code ─────────────────────────────────────────────────────
COPY backend_py/ .

# ── Copy widget folder (served as static files) ───────────────────────────────
COPY widget/ ./widget

# ── Expose port ───────────────────────────────────────────────────────────────
EXPOSE 8000

# ── Start server ──────────────────────────────────────────────────────────────
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]