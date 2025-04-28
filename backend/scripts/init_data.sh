#!/bin/bash
# Script to initialize database with sample data and service configurations

set -e  # Exit on error

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Convers.me Data Initialization =====${NC}"
echo -e "${BLUE}This script will initialize your database with sample data and configure services${NC}"

# Parse command line arguments
INIT_DB=true
INIT_REDIS=true
INIT_TIGRIS=true
PORT=8000

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-db) INIT_DB=false ;;
        --no-redis) INIT_REDIS=false ;;
        --no-tigris) INIT_TIGRIS=false ;;
        --port) PORT="$2"; shift ;;
        --help)
            echo "Usage: ./init_data.sh [options]"
            echo "Options:"
            echo "  --no-db       Skip database initialization"
            echo "  --no-redis    Skip Redis initialization"
            echo "  --no-tigris   Skip Tigris initialization"
            echo "  --port PORT   API server port (default: 8000)"
            echo "  --help        Show this help message"
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

# Initialize Redis if requested
if [ "$INIT_REDIS" = true ]; then
    echo -e "${BLUE}Checking Redis availability...${NC}"
    if command -v docker &> /dev/null; then
        if ! docker ps | grep -q conversme-redis; then
            echo -e "${YELLOW}Redis container not found. Starting Redis...${NC}"
            # Use the start_dev_services.sh script to start Redis
            ./scripts/start_dev_services.sh --redis
        else
            echo -e "${GREEN}Redis container is already running.${NC}"
        fi
    else
        echo -e "${YELLOW}Docker not found. Cannot verify Redis status.${NC}"
        echo -e "${YELLOW}Ensure Redis is running at localhost:6379${NC}"
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

# Initialize Tigris if requested
if [ "$INIT_TIGRIS" = true ]; then
    echo -e "${BLUE}Checking Tigris availability...${NC}"
    if command -v docker &> /dev/null; then
        if ! docker ps | grep -q conversme-tigris; then
            echo -e "${YELLOW}Tigris container not found. Starting Tigris...${NC}"
            # Use the start_dev_services.sh script to start Tigris
            ./scripts/start_dev_services.sh --tigris
        else
            echo -e "${GREEN}Tigris container is already running.${NC}"
        fi
    else
        echo -e "${YELLOW}Docker not found. Cannot verify Tigris status.${NC}"
        echo -e "${YELLOW}Ensure Tigris is running at localhost:8081${NC}"
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

# Initialize database if requested
if [ "$INIT_DB" = true ]; then
    # Check if the server is running
    if ! curl -s "http://localhost:$PORT/health" > /dev/null; then
        echo -e "${BLUE}Starting the API server on port $PORT...${NC}"
        uvicorn app:app --reload --host 0.0.0.0 --port $PORT &
        SERVER_PID=$!

        # Wait for the server to start
        echo -e "${BLUE}Waiting for the server to start...${NC}"
        for i in {1..30}; do
            if curl -s "http://localhost:$PORT/health" > /dev/null; then
                break
            fi
            sleep 1
            if [ $i -eq 30 ]; then
                echo -e "${RED}Error: Server failed to start within 30 seconds${NC}"
                kill $SERVER_PID 2>/dev/null
                exit 1
            fi
        done

        # Store that we started the server
        STARTED_SERVER=true
    else
        STARTED_SERVER=false
        echo -e "${GREEN}API server is already running on port $PORT${NC}"
    fi

    # Initialize the database
    echo -e "${BLUE}Initializing database with sample data...${NC}"
    curl -X POST "http://localhost:$PORT/admin/initialize"

    # If we started the server, stop it
    if [ "$STARTED_SERVER" = true ]; then
        echo -e "${BLUE}Stopping the API server...${NC}"
        kill $SERVER_PID 2>/dev/null
    fi
fi

echo -e "${GREEN}Initialization complete!${NC}"
echo -e "${BLUE}You can now start the server with: ./scripts/dev.sh${NC}"
