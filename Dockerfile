FROM python:3.12-slim

# Install system dependencies required for GeoPandas and PostgreSQL
RUN apt-get update && apt-get install -y \
    libgdal-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install 'uv' package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency definition files
COPY pyproject.toml uv.lock ./

# Install python dependencies via uv
RUN uv sync --frozen

# Copy source code and maps
COPY backend/ backend/
COPY frontend/ frontend/
COPY import_local_maps.py ./
COPY Maps/ Maps/

# Copy our custom startup script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 8484

CMD ["./entrypoint.sh"]
