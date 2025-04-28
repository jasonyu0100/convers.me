#!/bin/bash
# Script to update API test endpoints and refresh test data
# This automates the process of updating test files when API changes occur

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if the server is running
check_server() {
    curl -s http://localhost:8000/health > /dev/null
    return $?
}

# Start the server if it's not running
start_server() {
    echo -e "${BLUE}Starting API server for testing...${NC}"
    TEMP_LOG_FILE=$(mktemp)
    uvicorn app:app --host 0.0.0.0 --port 8000 > "$TEMP_LOG_FILE" 2>&1 &
    SERVER_PID=$!

    # Wait for the server to start
    echo -e "${BLUE}Waiting for server to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null; then
            echo -e "${GREEN}Server started successfully${NC}"
            return 0
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}Failed to start server within 30 seconds${NC}"
            echo -e "${YELLOW}Server logs:${NC}"
            cat "$TEMP_LOG_FILE"
            rm "$TEMP_LOG_FILE"
            kill $SERVER_PID 2>/dev/null
            return 1
        fi
    done
}

# Update test endpoint data
update_endpoints() {
    echo -e "${BLUE}Updating API test endpoints...${NC}"

    # Run the Python script to update route responses
    if [ -f "update_route_responses.py" ]; then
        python update_route_responses.py
    else
        echo -e "${RED}Error: update_route_responses.py not found${NC}"
        return 1
    fi

    return $?
}

# Regenerate test fixtures
regenerate_fixtures() {
    echo -e "${BLUE}Regenerating test fixtures...${NC}"

    # Call the test data initialization
    curl -s -X POST http://localhost:8000/admin/test/fixtures > /dev/null

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Test fixtures regenerated successfully${NC}"
        return 0
    else
        echo -e "${RED}Failed to regenerate test fixtures${NC}"
        return 1
    fi
}

# Run a test suite to verify the updates
verify_updates() {
    echo -e "${BLUE}Verifying API endpoint updates...${NC}"

    # Run a simple test to verify the updates
    ./scripts/run_tests.sh -r processes

    return $?
}

# Main function
main() {
    echo -e "${BLUE}===== Convers.me API Test Update =====${NC}"

    # Check if server is already running
    if check_server; then
        echo -e "${YELLOW}API server is already running${NC}"
        SERVER_RUNNING=true
    else
        # Start the server
        if ! start_server; then
            echo -e "${RED}Failed to start API server. Aborting.${NC}"
            exit 1
        fi
        SERVER_RUNNING=false
    fi

    # Update endpoints
    if ! update_endpoints; then
        echo -e "${RED}Failed to update API endpoints. Aborting.${NC}"

        # Stop the server if we started it
        if [ "$SERVER_RUNNING" = false ]; then
            echo -e "${BLUE}Stopping API server...${NC}"
            kill $SERVER_PID 2>/dev/null
        fi

        exit 1
    fi

    # Regenerate fixtures
    regenerate_fixtures

    # Verify updates
    if ! verify_updates; then
        echo -e "${YELLOW}Warning: Some tests failed after updating endpoints${NC}"
        echo -e "${YELLOW}You may need to manually update the test files${NC}"
    else
        echo -e "${GREEN}API endpoint updates verified successfully${NC}"
    fi

    # Stop the server if we started it
    if [ "$SERVER_RUNNING" = false ]; then
        echo -e "${BLUE}Stopping API server...${NC}"
        kill $SERVER_PID 2>/dev/null
    fi

    echo -e "${GREEN}API test updates completed${NC}"
}

# Run the main function
main
