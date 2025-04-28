#!/bin/bash
# Script to set up the database for Convers.me
# Supports both Docker and local PostgreSQL setups

set -e  # Exit on error

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Convers.me Database Setup =====${NC}"
echo -e "${BLUE}This script will set up your PostgreSQL database${NC}"

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo -e "${RED}Error: .env file not found. Run ./scripts/setup.sh first.${NC}"
    exit 1
fi

# Extract DB details from DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/\([^:]*\).*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/[^:]*:\([^@]*\).*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@[^:]*:\([^\/]*\).*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@[^:]*:[^\/]*\/\([^?]*\).*/\1/p')

echo -e "${BLUE}Using DB settings:${NC}"
echo -e "  ${YELLOW}Host:${NC} $DB_HOST"
echo -e "  ${YELLOW}Port:${NC} $DB_PORT"
echo -e "  ${YELLOW}Database:${NC} $DB_NAME"
echo -e "  ${YELLOW}User:${NC} $DB_USER"

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo -e "${BLUE}Docker found, setting up PostgreSQL container...${NC}"

    # Generate a container name with the app name to avoid conflicts
    CONTAINER_NAME="postgres-conversme"

    # Check if the container exists
    if ! docker ps -a --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
        echo -e "${BLUE}Creating PostgreSQL container...${NC}"
        docker run --name $CONTAINER_NAME \
            -e POSTGRES_PASSWORD=$DB_PASS \
            -e POSTGRES_USER=$DB_USER \
            -p $DB_PORT:5432 \
            -d postgres:16

        echo -e "${BLUE}Waiting for PostgreSQL to start...${NC}"
        sleep 5
    else
        # Check if the container is running
        if ! docker ps --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
            echo -e "${BLUE}Starting existing PostgreSQL container...${NC}"
            docker start $CONTAINER_NAME
            sleep 5
        else
            echo -e "${YELLOW}PostgreSQL container is already running${NC}"
        fi
    fi

    # Create the database if it doesn't exist
    echo -e "${BLUE}Creating database $DB_NAME if it doesn't exist...${NC}"
    docker exec $CONTAINER_NAME psql -U $DB_USER -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
        docker exec $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

else
    echo -e "${YELLOW}Docker not found. Trying to use local PostgreSQL...${NC}"

    # Check if psql is available
    if command -v psql &> /dev/null; then
        # Check if database exists
        if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
            echo -e "${YELLOW}Database $DB_NAME already exists${NC}"
        else
            echo -e "${BLUE}Creating database $DB_NAME...${NC}"
            createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        fi
    else
        echo -e "${RED}Error: PostgreSQL tools not found. Please install PostgreSQL or Docker.${NC}"
        exit 1
    fi
fi

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
alembic upgrade head

echo -e "${GREEN}Database setup complete!${NC}"
echo -e "${BLUE}To initialize sample data, run: ./scripts/init_data.sh${NC}"
