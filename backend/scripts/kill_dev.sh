#!/bin/bash
# Script to kill all development services: API server, Celery worker, Redis, and Tigris

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Stopping Convers.me Development Services =====${NC}"

# Kill API server (uvicorn)
api_pid=$(pgrep -f "uvicorn app:app")
if [ -z "$api_pid" ]; then
  echo -e "${YELLOW}No running API server found.${NC}"
else
  echo -e "${BLUE}Stopping API server (PID: $api_pid)...${NC}"
  kill -9 $api_pid
  echo -e "${GREEN}API server stopped.${NC}"
fi

# Kill Celery worker and beat
celery_pid=$(pgrep -f "celery -A worker.celery_app worker")
beat_pid=$(pgrep -f "celery -A worker.celery_app beat")

if [ -n "$celery_pid" ]; then
  echo -e "${BLUE}Stopping Celery worker (PID: $celery_pid)...${NC}"
  kill -9 $celery_pid
  echo -e "${GREEN}Celery worker stopped.${NC}"
fi

if [ -n "$beat_pid" ]; then
  echo -e "${BLUE}Stopping Celery beat (PID: $beat_pid)...${NC}"
  kill -9 $beat_pid
  echo -e "${GREEN}Celery beat stopped.${NC}"
fi

# Stop Docker containers if they exist
if command -v docker &> /dev/null; then
  # Check Redis container
  if docker ps | grep -q conversme-redis; then
    echo -e "${BLUE}Stopping Redis container...${NC}"
    docker stop conversme-redis
    echo -e "${GREEN}Redis container stopped.${NC}"
  fi

  # Check Tigris container
  if docker ps | grep -q conversme-tigris; then
    echo -e "${BLUE}Stopping Tigris container...${NC}"
    docker stop conversme-tigris
    echo -e "${GREEN}Tigris container stopped.${NC}"
  fi
fi

echo -e "${GREEN}All development services stopped.${NC}"
