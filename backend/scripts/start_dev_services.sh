#!/bin/bash
# Start Redis and Tigris development services using Docker

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Redis and Tigris development services...${NC}\n"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    echo -e "Please start Docker and try again."
    exit 1
fi

# Create a network for the services if it doesn't exist
if ! docker network inspect conversme &> /dev/null; then
    echo -e "${BLUE}Creating Docker network 'conversme'...${NC}"
    docker network create conversme
    echo -e "${GREEN}Network created.${NC}"
else
    echo -e "${YELLOW}Network 'conversme' already exists.${NC}"
fi

# Start Redis
echo -e "\n${BLUE}Starting Redis service...${NC}"
if ! docker ps | grep -q conversme-redis; then
    if docker run -d --name conversme-redis \
        --network conversme \
        -p 6379:6379 \
        -v redis-data:/data \
        redis:7-alpine redis-server --appendonly yes; then
        echo -e "${GREEN}Redis service started successfully!${NC}"
    else
        echo -e "${RED}Failed to start Redis service.${NC}"
        # Check if container exists but is not running
        if docker ps -a | grep -q conversme-redis; then
            echo -e "${YELLOW}Container exists but is not running. Removing and trying again...${NC}"
            docker rm conversme-redis
            docker run -d --name conversme-redis \
                --network conversme \
                -p 6379:6379 \
                -v redis-data:/data \
                redis:7-alpine redis-server --appendonly yes
            echo -e "${GREEN}Redis service started successfully!${NC}"
        fi
    fi
else
    echo -e "${YELLOW}Redis service is already running.${NC}"
fi

# Start Tigris
echo -e "\n${BLUE}Starting Tigris service...${NC}"
if ! docker ps | grep -q conversme-tigris; then
    if docker run -d --name conversme-tigris \
        --network conversme \
        -p 8081:8081 \
        -v tigris-data:/data \
        -e TIGRIS_SERVER_HTTP_PORT=8081 \
        -e TIGRIS_SERVER_DEFAULT_PROJECT=conversme \
        -e TIGRIS_SERVER_INITIALIZE_SCHEMA=true \
        tigrisdata/tigris-local:latest; then
        echo -e "${GREEN}Tigris service started successfully!${NC}"
    else
        echo -e "${RED}Failed to start Tigris service.${NC}"
        # Check if container exists but is not running
        if docker ps -a | grep -q conversme-tigris; then
            echo -e "${YELLOW}Container exists but is not running. Removing and trying again...${NC}"
            docker rm conversme-tigris
            docker run -d --name conversme-tigris \
                --network conversme \
                -p 8081:8081 \
                -v tigris-data:/data \
                -e TIGRIS_SERVER_HTTP_PORT=8081 \
                -e TIGRIS_SERVER_DEFAULT_PROJECT=conversme \
                -e TIGRIS_SERVER_INITIALIZE_SCHEMA=true \
                tigrisdata/tigris-local:latest
            echo -e "${GREEN}Tigris service started successfully!${NC}"
        fi
    fi
else
    echo -e "${YELLOW}Tigris service is already running.${NC}"
fi

# Set environment variables for local development
echo -e "\n${BLUE}Setting up environment variables...${NC}"
# Check if .env file exists
if [ -f .env ]; then
    # Check if the environment variables already exist in the .env file
    if grep -q "CELERY_BROKER_URL" .env && grep -q "CELERY_RESULT_BACKEND" .env && grep -q "TIGRIS_URL" .env; then
        echo -e "${YELLOW}Environment variables already exist in .env file.${NC}"
    else
        # Add environment variables to .env file
        echo -e "\n# Redis and Tigris configuration" >> .env
        echo "CELERY_BROKER_URL=redis://localhost:6379/1" >> .env
        echo "CELERY_RESULT_BACKEND=redis://localhost:6379/2" >> .env
        echo "TIGRIS_URL=http://localhost:8081" >> .env
        echo "TIGRIS_PROJECT=conversme" >> .env
        echo "TIGRIS_BUCKET=media" >> .env
        echo "USE_LOCAL_STORAGE=False" >> .env
        echo -e "${GREEN}Environment variables added to .env file.${NC}"
    fi
else
    # Create .env file with environment variables
    echo "# Redis and Tigris configuration" > .env
    echo "CELERY_BROKER_URL=redis://localhost:6379/1" >> .env
    echo "CELERY_RESULT_BACKEND=redis://localhost:6379/2" >> .env
    echo "TIGRIS_URL=http://localhost:8081" >> .env
    echo "TIGRIS_PROJECT=conversme" >> .env
    echo "TIGRIS_BUCKET=media" >> .env
    echo "USE_LOCAL_STORAGE=False" >> .env
    echo -e "${GREEN}.env file created with environment variables.${NC}"
fi

echo -e "\n${GREEN}Services started successfully!${NC}"
echo -e "Redis is running at: localhost:6379"
echo -e "Tigris is running at: http://localhost:8081"
echo -e "\n${YELLOW}To stop the services, run:${NC}"
echo -e "docker stop conversme-redis conversme-tigris"
