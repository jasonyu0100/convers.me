#!/bin/bash
# Script to generate requirements.txt from pyproject.toml for uv

set -e  # Exit on error

echo "===== Generating requirements.txt from pyproject.toml ====="

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "Installing uv..."
    pip install uv
fi

# Check if pyproject.toml exists
if [ ! -f pyproject.toml ]; then
    echo "Error: pyproject.toml not found"
    exit 1
fi

# Generate requirements.txt from pyproject.toml
echo "Generating requirements.txt..."
uv pip compile pyproject.toml --resolution=lowest-direct -o requirements.txt

# Generate requirements-dev.txt from pyproject.toml
echo "Generating requirements-dev.txt..."
uv pip compile pyproject.toml --resolution=lowest-direct --extra=dev -o requirements-dev.txt

echo "===== Requirements files generated successfully! ====="
