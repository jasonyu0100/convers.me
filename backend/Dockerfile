FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies - keep this layer cacheable
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    python3-dev \
    build-essential \
    libc-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster dependency installation
RUN pip install uv

# Stage for handling dependencies
FROM base AS dependencies

# Copy only requirements files to leverage Docker layer caching
COPY requirements.txt /app/
COPY requirements-dev.txt /app/

# Install dependencies using uv
RUN uv pip install --system -r requirements.txt

# Final stage
FROM dependencies AS final

# Copy project code - this stage will only rebuild when code changes
COPY . /app/

# Create necessary directories
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8080
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create a non-root user to run the application
RUN adduser --disabled-password --gecos "" appuser
RUN chown -R appuser:appuser /app

# Make scripts executable
RUN chmod +x /app/scripts/*.sh

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:$PORT/health || exit 1

# Run migrations and start application
CMD ./scripts/migrate_db.sh && \
    uvicorn app:app --host 0.0.0.0 --port $PORT --workers ${API_WORKERS:-2}
