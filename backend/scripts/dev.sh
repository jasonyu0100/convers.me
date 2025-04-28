#!/bin/bash
# Set up and start the complete development environment including Redis and Tigris

set -e  # Exit on error

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Setting up Convers.me development environment =====${NC}"

# Check if the user wants to start specific services only
START_ALL=true
START_DB=false
START_REDIS=false
START_TIGRIS=false
START_API=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --db) START_DB=true; START_ALL=false ;;
        --redis) START_REDIS=true; START_ALL=false ;;
        --tigris) START_TIGRIS=true; START_ALL=false ;;
        --api) START_API=true; START_ALL=false ;;
        --help)
            echo "Usage: ./dev.sh [options]"
            echo "Options:"
            echo "  --db        Start only PostgreSQL database"
            echo "  --redis     Start only Redis"
            echo "  --tigris    Start only Tigris"
            echo "  --api       Start only API server"
            echo "  --help      Show this help message"
            echo "  (no options) Start all services"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown parameter: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
    shift
done

# Ensure Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    echo -e "Please start Docker and try again."
    exit 1
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo -e "${YELLOW}Installing uv...${NC}"
    pip install uv
fi

# Set up virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    uv venv --name .venv
fi

# Activate the virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source .venv/bin/activate

# Check if requirements.txt exists, if not generate it from pyproject.toml
if [ ! -f "requirements.txt" ] || [ ! -f "requirements-dev.txt" ]; then
    echo -e "${BLUE}Generating requirements files from pyproject.toml...${NC}"
    ./scripts/generate_requirements.sh
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
uv pip install -r requirements.txt -r requirements-dev.txt

# Create a Docker network if it doesn't exist
if ! docker network inspect conversme &> /dev/null; then
    echo -e "${BLUE}Creating Docker network 'conversme'...${NC}"
    docker network create conversme
    echo -e "${GREEN}Network created.${NC}"
else
    echo -e "${YELLOW}Network 'conversme' already exists.${NC}"
fi

# Start PostgreSQL if needed
if [ "$START_ALL" = true ] || [ "$START_DB" = true ]; then
    echo -e "${BLUE}Setting up PostgreSQL...${NC}"
    # Check if PostgreSQL container exists and is running
    if ! docker ps | grep -q postgres-conversme; then
        # Check if container exists but is not running
        if docker ps -a | grep -q postgres-conversme; then
            echo -e "${YELLOW}PostgreSQL container exists but is not running. Starting...${NC}"
            docker start postgres-conversme
        else
            echo -e "${BLUE}Creating PostgreSQL container...${NC}"
            docker run -d --name postgres-conversme \
                --network conversme \
                -e POSTGRES_PASSWORD=postgres \
                -e POSTGRES_USER=postgres \
                -e POSTGRES_DB=conversme \
                -p 15432:5432 \
                -v postgres-data:/var/lib/postgresql/data \
                postgres:16
        fi
        # Wait for PostgreSQL to be ready
        echo -e "${BLUE}Waiting for PostgreSQL to be ready...${NC}"
        sleep 5
    else
        echo -e "${GREEN}PostgreSQL is already running.${NC}"
    fi

    # Set DATABASE_URL in .env if needed
    if [ -f .env ]; then
        if ! grep -q "DATABASE_URL=" .env; then
            echo "DATABASE_URL=postgresql://postgres:postgres@localhost:15432/conversme" >> .env
            echo -e "${GREEN}Added DATABASE_URL to .env file.${NC}"
        fi
    else
        echo "DATABASE_URL=postgresql://postgres:postgres@localhost:15432/conversme" > .env
        echo -e "${GREEN}Created .env file with DATABASE_URL.${NC}"
    fi

    # Run migrations
    echo -e "${BLUE}Running database migrations...${NC}"
    alembic upgrade head
fi

# Start Redis if needed
if [ "$START_ALL" = true ] || [ "$START_REDIS" = true ]; then
    echo -e "${BLUE}Setting up Redis...${NC}"
    # Start Redis if it's not already running
    if ! docker ps | grep -q conversme-redis; then
        # Check if container exists but is not running
        if docker ps -a | grep -q conversme-redis; then
            echo -e "${YELLOW}Redis container exists but is not running. Starting...${NC}"
            docker start conversme-redis
        else
            echo -e "${BLUE}Creating Redis container...${NC}"
            docker run -d --name conversme-redis \
                --network conversme \
                -p 6379:6379 \
                -v redis-data:/data \
                redis:7-alpine redis-server --appendonly yes
        fi
    else
        echo -e "${GREEN}Redis is already running.${NC}"
    fi

    # Set Redis URL in .env if needed
    if [ -f .env ]; then
        if ! grep -q "CELERY_BROKER_URL=" .env; then
            echo "CELERY_BROKER_URL=redis://localhost:6379/1" >> .env
            echo "CELERY_RESULT_BACKEND=redis://localhost:6379/2" >> .env
            echo -e "${GREEN}Added Redis URLs to .env file.${NC}"
        fi
    else
        echo "CELERY_BROKER_URL=redis://localhost:6379/1" > .env
        echo "CELERY_RESULT_BACKEND=redis://localhost:6379/2" >> .env
        echo -e "${GREEN}Created .env file with Redis URLs.${NC}"
    fi
fi

# Start Tigris if needed
if [ "$START_ALL" = true ] || [ "$START_TIGRIS" = true ]; then
    echo -e "${BLUE}Setting up Tigris...${NC}"
    # Start Tigris if it's not already running
    if ! docker ps | grep -q conversme-tigris; then
        # Check if container exists but is not running
        if docker ps -a | grep -q conversme-tigris; then
            echo -e "${YELLOW}Tigris container exists but is not running. Starting...${NC}"
            docker start conversme-tigris
        else
            echo -e "${BLUE}Creating Tigris container...${NC}"
            docker run -d --name conversme-tigris \
                --network conversme \
                -p 8081:8081 \
                -v tigris-data:/data \
                -e TIGRIS_SERVER_HTTP_PORT=8081 \
                -e TIGRIS_SERVER_DEFAULT_PROJECT=conversme \
                -e TIGRIS_SERVER_INITIALIZE_SCHEMA=true \
                tigrisdata/tigris-local:latest
        fi
    else
        echo -e "${GREEN}Tigris is already running.${NC}"
    fi

    # Set Tigris URL in .env if needed
    if [ -f .env ]; then
        if ! grep -q "TIGRIS_URL=" .env; then
            echo "TIGRIS_URL=http://localhost:8081" >> .env
            echo "TIGRIS_PROJECT=conversme" >> .env
            echo "TIGRIS_BUCKET=media" >> .env
            echo "USE_LOCAL_STORAGE=False" >> .env
            echo -e "${GREEN}Added Tigris settings to .env file.${NC}"
        fi
    else
        echo "TIGRIS_URL=http://localhost:8081" > .env
        echo "TIGRIS_PROJECT=conversme" >> .env
        echo "TIGRIS_BUCKET=media" >> .env
        echo "USE_LOCAL_STORAGE=False" >> .env
        echo -e "${GREEN}Created .env file with Tigris settings.${NC}"
    fi
fi

# Start API server if needed
if [ "$START_ALL" = true ] || [ "$START_API" = true ]; then
    # Start the application with all services
    echo -e "${GREEN}All setup complete! Starting the application...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

    # Start the backend stack
    ./start_backend.sh
fi

echo -e "${GREEN}Development environment setup complete!${NC}"
if [ "$START_ALL" = false ] && [ "$START_API" = false ]; then
    echo -e "${BLUE}To start the API server, run: ./start_backend.sh${NC}"
fi
