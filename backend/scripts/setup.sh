#!/bin/bash
# Script to set up the development environment for the Convers.me backend
# This script now uses uv for dependency management and environment setup

set -e  # Exit on error

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Convers.me Backend Setup =====${NC}"
echo -e "${BLUE}This script will set up your development environment${NC}"

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d' ' -f2)
python_major=$(echo $python_version | cut -d'.' -f1)
python_minor=$(echo $python_version | cut -d'.' -f2)

if [ "$python_major" -lt 3 ] || [ "$python_major" -eq 3 -a "$python_minor" -lt 11 ]; then
    echo -e "${RED}Error: Python 3.11 or higher is required${NC}"
    echo -e "${RED}You have Python $python_version${NC}"
    exit 1
fi

# Check for uv
if ! command -v uv &> /dev/null; then
    echo -e "${YELLOW}uv not found. Installing...${NC}"
    pip install uv
fi

# Create virtual environment
echo -e "${BLUE}Creating virtual environment...${NC}"
uv venv --name .venv

# Activate the virtual environment
source .venv/bin/activate
echo -e "${GREEN}Virtual environment activated${NC}"

# Check if requirements.txt exists, if not generate it
if [ ! -f "requirements.txt" ] || [ ! -f "requirements-dev.txt" ]; then
    echo -e "${BLUE}Generating requirements files from pyproject.toml...${NC}"
    ./scripts/generate_requirements.sh
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
uv pip install -r requirements.txt -r requirements-dev.txt

# Check if .env exists, if not create it
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file from template...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env

        # Generate a secure secret key
        SECRET_KEY=$(openssl rand -hex 32)
        sed -i.bak "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
        rm -f .env.bak
    else
        echo -e "${YELLOW}Creating minimal .env file...${NC}"
        cat > .env << EOF
# Database settings
DATABASE_URL=postgresql://postgres:postgres@localhost:15432/conversme
# JWT settings
SECRET_KEY=$(openssl rand -hex 32)
# API settings
DEBUG=True
ALLOW_ORIGINS=*
# Celery settings
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/1
EOF
    fi

    echo -e "${GREEN}Created .env file with secure configuration${NC}"
else
    echo -e "${YELLOW}.env file already exists, skipping creation${NC}"
fi

echo -e "${GREEN}Setup complete!${NC} Next steps:"
echo -e "${BLUE}1. Check your .env file settings${NC}"
echo -e "${BLUE}2. Run ./scripts/db_setup.sh to set up your database${NC}"
echo -e "${BLUE}3. Start the app with: ./start_backend.sh${NC}"
