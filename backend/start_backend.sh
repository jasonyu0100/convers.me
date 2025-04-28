#!/bin/bash
# Start the entire backend stack: FastAPI server, Redis, Tigris, and Celery workers
# This script provides a one-command solution to start all backend services

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables
set -a
if [ -f .env ]; then
    source .env
    echo -e "${BLUE}Loaded environment variables from .env${NC}"
else
    echo -e "${YELLOW}Warning: .env file not found, using default settings${NC}"
fi
set +a

# Default settings
API_HOST=${API_HOST:-0.0.0.0}
API_PORT=${API_PORT:-8000}
REDIS_PORT=${REDIS_PORT:-6379}
TIGRIS_PORT=${TIGRIS_PORT:-8081}
USE_EXISTING_REDIS=${USE_EXISTING_REDIS:-false}
USE_EXISTING_TIGRIS=${USE_EXISTING_TIGRIS:-false}
WITH_FLOWER=${WITH_FLOWER:-false}
NETWORK_NAME="conversme"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-redis) USE_EXISTING_REDIS=true ;;
        --no-tigris) USE_EXISTING_TIGRIS=true ;;
        --flower) WITH_FLOWER=true ;;
        --port) API_PORT="$2"; shift ;;
        --help)
            echo "Usage: ./start_backend.sh [options]"
            echo "Options:"
            echo "  --no-redis    Don't start Redis container (use existing Redis)"
            echo "  --no-tigris   Don't start Tigris container (use existing Tigris)"
            echo "  --flower      Start Flower monitoring UI for Celery"
            echo "  --port PORT   Specify API server port (default: 8000)"
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

# Create log directory
mkdir -p logs

# Function to check if a port is in use
function is_port_in_use() {
    lsof -i:"$1" > /dev/null 2>&1
    return $?
}

# Function to check if Redis is running
function check_redis() {
    nc -z localhost ${REDIS_PORT} > /dev/null 2>&1
    return $?
}

# Function to check if Tigris is running
function check_tigris() {
    curl -s "http://localhost:${TIGRIS_PORT}/health" > /dev/null 2>&1
    return $?
}

# Function to gracefully shutdown all services
function cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"

    # Kill FastAPI server
    if [ ! -z "$FASTAPI_PID" ]; then
        echo "Stopping FastAPI server..."
        kill -TERM $FASTAPI_PID 2>/dev/null
    fi

    # Kill Celery worker and beat
    if [ ! -z "$WORKER_PID" ]; then
        echo "Stopping Celery worker..."
        kill -TERM $WORKER_PID 2>/dev/null
    fi

    if [ ! -z "$BEAT_PID" ]; then
        echo "Stopping Celery beat..."
        kill -TERM $BEAT_PID 2>/dev/null
    fi

    if [ ! -z "$FLOWER_PID" ]; then
        echo "Stopping Flower..."
        kill -TERM $FLOWER_PID 2>/dev/null
    fi

    # Stop Docker containers if we started them
    if [ "$STARTED_REDIS" = true ]; then
        echo "Stopping Redis container..."
        docker stop conversme-redis > /dev/null 2>&1
    fi

    if [ "$STARTED_TIGRIS" = true ]; then
        echo "Stopping Tigris container..."
        docker stop conversme-tigris > /dev/null 2>&1
    fi

    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Register the cleanup function for exit
trap cleanup SIGINT SIGTERM

# Create a Docker network if it doesn't exist
if command -v docker &> /dev/null; then
    if ! docker network inspect $NETWORK_NAME &> /dev/null; then
        echo -e "${BLUE}Creating Docker network '$NETWORK_NAME'...${NC}"
        docker network create $NETWORK_NAME
        echo -e "${GREEN}Network created.${NC}"
    fi
fi

# Step 1: Check if Redis is needed and start it if necessary
STARTED_REDIS=false

if [ "$USE_EXISTING_REDIS" = false ]; then
    echo -e "${BLUE}Checking Redis...${NC}"
    if check_redis; then
        echo -e "${YELLOW}Redis is already running on port ${REDIS_PORT}${NC}"
    else
        # Check if Docker is available
        if command -v docker &> /dev/null; then
            # First check if a container with this name exists but is stopped
            if docker ps -a | grep -q conversme-redis; then
                echo -e "${BLUE}Starting existing Redis container...${NC}"
                docker start conversme-redis > /dev/null 2>&1
            else
                echo -e "${BLUE}Starting new Redis container...${NC}"
                docker run -d --name conversme-redis \
                    --network $NETWORK_NAME \
                    -p ${REDIS_PORT}:6379 \
                    -v redis-data:/data \
                    redis:7-alpine redis-server --appendonly yes > /dev/null 2>&1
            fi

            if [ $? -eq 0 ]; then
                STARTED_REDIS=true
                echo -e "${GREEN}Redis container started successfully${NC}"

                # Wait for Redis to be ready
                echo -e "${BLUE}Waiting for Redis to be ready...${NC}"
                sleep 2
            else
                echo -e "${RED}Failed to start Redis container. Is Docker running?${NC}"
                echo -e "${YELLOW}Continuing without Redis. Background tasks will not work.${NC}"
            fi
        else
            echo -e "${RED}Docker not found. Cannot start Redis container.${NC}"
            echo -e "${YELLOW}Continuing without Redis. Background tasks will not work.${NC}"
        fi
    fi
else
    echo -e "${BLUE}Using existing Redis instance${NC}"

    # Verify Redis is accessible
    if ! check_redis; then
        echo -e "${RED}Warning: Redis is not accessible on port ${REDIS_PORT}${NC}"
        echo -e "${YELLOW}Background tasks may not work properly${NC}"
    fi
fi

# Step 2: Check if Tigris is needed and start it if necessary
STARTED_TIGRIS=false

if [ "$USE_EXISTING_TIGRIS" = false ]; then
    echo -e "${BLUE}Checking Tigris...${NC}"
    if check_tigris; then
        echo -e "${YELLOW}Tigris is already running on port ${TIGRIS_PORT}${NC}"
    else
        # Check if Docker is available
        if command -v docker &> /dev/null; then
            # First check if a container with this name exists but is stopped
            if docker ps -a | grep -q conversme-tigris; then
                echo -e "${BLUE}Starting existing Tigris container...${NC}"
                docker start conversme-tigris > /dev/null 2>&1
            else
                echo -e "${BLUE}Starting new Tigris container...${NC}"
                docker run -d --name conversme-tigris \
                    --network $NETWORK_NAME \
                    -p ${TIGRIS_PORT}:8081 \
                    -v tigris-data:/data \
                    -e TIGRIS_SERVER_HTTP_PORT=8081 \
                    -e TIGRIS_SERVER_DEFAULT_PROJECT=conversme \
                    -e TIGRIS_SERVER_INITIALIZE_SCHEMA=true \
                    tigrisdata/tigris-local:latest > /dev/null 2>&1
            fi

            if [ $? -eq 0 ]; then
                STARTED_TIGRIS=true
                echo -e "${GREEN}Tigris container started successfully${NC}"

                # Wait for Tigris to be ready
                echo -e "${BLUE}Waiting for Tigris to be ready...${NC}"
                for i in {1..10}; do
                    if check_tigris; then
                        break
                    fi
                    sleep 1
                done
            else
                echo -e "${RED}Failed to start Tigris container. Is Docker running?${NC}"
                echo -e "${YELLOW}Continuing without Tigris. File storage will use local filesystem.${NC}"
                # Set environment variable to use local storage
                export USE_LOCAL_STORAGE=True
            fi
        else
            echo -e "${RED}Docker not found. Cannot start Tigris container.${NC}"
            echo -e "${YELLOW}Continuing without Tigris. File storage will use local filesystem.${NC}"
            # Set environment variable to use local storage
            export USE_LOCAL_STORAGE=True
        fi
    fi
else
    echo -e "${BLUE}Using existing Tigris instance${NC}"

    # Verify Tigris is accessible
    if ! check_tigris; then
        echo -e "${RED}Warning: Tigris is not accessible on port ${TIGRIS_PORT}${NC}"
        echo -e "${YELLOW}File storage will fall back to local filesystem${NC}"
        # Set environment variable to use local storage
        export USE_LOCAL_STORAGE=True
    fi
fi

# Step 3: Run Alembic migrations
echo -e "${BLUE}Running database migrations...${NC}"
./scripts/manage_migrations.sh

# Step 4: Start the FastAPI server
echo -e "${BLUE}Starting FastAPI server on ${API_HOST}:${API_PORT}...${NC}"
uvicorn app:app --host $API_HOST --port $API_PORT --reload --log-level debug --access-log > logs/fastapi.log 2>&1 &
FASTAPI_PID=$!

# Check if FastAPI started successfully
sleep 2
if ! ps -p $FASTAPI_PID > /dev/null; then
    echo -e "${RED}Failed to start FastAPI server. Check logs/fastapi.log for details${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}FastAPI server started with PID ${FASTAPI_PID}${NC}"

# Step 5: Start Celery worker and beat
echo -e "${BLUE}Starting Celery worker and beat...${NC}"
celery -A worker.celery_app worker -l INFO -Q notifications,media,events,celery > logs/celery_worker.log 2>&1 &
WORKER_PID=$!

celery -A worker.celery_app beat -l INFO > logs/celery_beat.log 2>&1 &
BEAT_PID=$!

# Check if Celery processes started successfully
sleep 2
if ! ps -p $WORKER_PID > /dev/null; then
    echo -e "${RED}Failed to start Celery worker. Check logs/celery_worker.log for details${NC}"
    # Continue anyway as some functionality will still work
    WORKER_PID=""
else
    echo -e "${GREEN}Celery worker started with PID ${WORKER_PID}${NC}"
fi

if ! ps -p $BEAT_PID > /dev/null; then
    echo -e "${RED}Failed to start Celery beat. Check logs/celery_beat.log for details${NC}"
    # Continue anyway as some functionality will still work
    BEAT_PID=""
else
    echo -e "${GREEN}Celery beat started with PID ${BEAT_PID}${NC}"
fi

# Step 6: Start Flower if requested
if [ "$WITH_FLOWER" = true ]; then
    echo -e "${BLUE}Starting Flower monitoring UI...${NC}"
    celery -A worker.celery_app flower > logs/flower.log 2>&1 &
    FLOWER_PID=$!

    # Check if Flower started successfully
    sleep 2
    if ! ps -p $FLOWER_PID > /dev/null; then
        echo -e "${RED}Failed to start Flower. Check logs/flower.log for details${NC}"
        FLOWER_PID=""
    else
        echo -e "${GREEN}Flower monitoring UI started with PID ${FLOWER_PID}${NC}"
        echo -e "${GREEN}Flower UI available at: http://localhost:5555${NC}"
    fi
fi

# Step 7: Show summary
echo -e "\n${GREEN}Backend stack started successfully:${NC}"
echo -e "  - FastAPI server: http://${API_HOST}:${API_PORT} (PID: ${FASTAPI_PID})"
echo -e "  - API Documentation: http://${API_HOST}:${API_PORT}/docs"

if [ ! -z "$WORKER_PID" ]; then
    echo -e "  - Celery worker running (PID: ${WORKER_PID})"
fi

if [ ! -z "$BEAT_PID" ]; then
    echo -e "  - Celery beat running (PID: ${BEAT_PID})"
fi

if [ ! -z "$FLOWER_PID" ]; then
    echo -e "  - Flower UI: http://localhost:5555 (PID: ${FLOWER_PID})"
fi

if [ "$STARTED_REDIS" = true ]; then
    echo -e "  - Redis container: localhost:${REDIS_PORT}"
elif check_redis; then
    echo -e "  - Using Redis on localhost:${REDIS_PORT}"
else
    echo -e "  - ${RED}Redis not available. Background tasks will not work.${NC}"
fi

if [ "$STARTED_TIGRIS" = true ]; then
    echo -e "  - Tigris container: http://localhost:${TIGRIS_PORT}"
elif check_tigris; then
    echo -e "  - Using Tigris on http://localhost:${TIGRIS_PORT}"
else
    echo -e "  - ${YELLOW}Tigris not available. Using local filesystem for storage.${NC}"
fi

echo -e "\n${BLUE}Log files:${NC}"
echo -e "  - FastAPI: logs/fastapi.log"
echo -e "  - Celery worker: logs/celery_worker.log"
echo -e "  - Celery beat: logs/celery_beat.log"
if [ ! -z "$FLOWER_PID" ]; then
    echo -e "  - Flower: logs/flower.log"
fi

echo -e "\n${BLUE}Service management:${NC}"
echo -e "  - To stop all services: Press Ctrl+C or run ./scripts/kill_dev.sh"
echo -e "  - To monitor Redis: docker exec -it conversme-redis redis-cli"
echo -e "  - To view Tigris health: curl http://localhost:${TIGRIS_PORT}/health"

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for termination signal
wait
