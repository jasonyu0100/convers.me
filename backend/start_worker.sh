#!/bin/bash
# Start Celery worker and beat scheduler

# Load environment variables
set -a
if [ -f .env ]; then
    source .env
fi
set +a

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Print information
echo -e "${BLUE}Starting Celery worker and beat scheduler...${NC}"
echo -e "${BLUE}Broker URL: ${CELERY_BROKER_URL:-redis://localhost:6379/1}${NC}"
echo -e "${BLUE}Queues: notifications, media, events, celery${NC}"

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the worker
celery -A worker.celery_app worker -l INFO -Q notifications,media,events,celery > logs/celery_worker.log 2>&1 &
WORKER_PID=$!

# Start the beat scheduler
celery -A worker.celery_app beat -l INFO > logs/celery_beat.log 2>&1 &
BEAT_PID=$!

# Start the Flower monitoring tool (if requested)
if [ "$1" == "--flower" ] || [ "$1" == "-f" ]; then
    echo -e "${BLUE}Starting Flower monitoring tool on http://localhost:5555${NC}"
    celery -A worker.celery_app flower > logs/flower.log 2>&1 &
    FLOWER_PID=$!
fi

echo -e "${GREEN}Workers started successfully!${NC}"
echo -e "${BLUE}Log files:${NC}"
echo -e "  - Celery worker: logs/celery_worker.log"
echo -e "  - Celery beat: logs/celery_beat.log"
if [ ! -z "$FLOWER_PID" ]; then
    echo -e "  - Flower: logs/flower.log"
    echo -e "  - Flower UI: http://localhost:5555"
fi

# Handler for graceful shutdown
function shutdown {
    echo -e "${GREEN}Shutting down Celery worker and beat scheduler...${NC}"
    kill -TERM $WORKER_PID 2>/dev/null
    kill -TERM $BEAT_PID 2>/dev/null
    if [ ! -z "$FLOWER_PID" ]; then
        kill -TERM $FLOWER_PID 2>/dev/null
    fi
    exit 0
}

# Register the handler
trap shutdown SIGINT SIGTERM

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for all processes to finish
wait
