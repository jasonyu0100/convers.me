#!/bin/bash

# Set colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Stopping all backend services...${NC}"

# Kill FastAPI server
echo -e "${BLUE}Stopping FastAPI server...${NC}"
pkill -f "python.*app.py" || echo -e "${YELLOW}No FastAPI server running.${NC}"

# Kill Celery workers and beat
echo -e "${BLUE}Stopping Celery workers and beat...${NC}"
pkill -f "celery.*-A worker" || echo -e "${YELLOW}No Celery workers running.${NC}"
pkill -f "celery.*beat" || echo -e "${YELLOW}No Celery beat running.${NC}"

echo -e "${GREEN}All backend services stopped successfully.${NC}"
