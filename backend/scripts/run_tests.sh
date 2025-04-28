#!/bin/bash
# Comprehensive test runner for the Convers.me backend
# This script facilitates running different types of tests with various options

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Constants
TEST_DIR="tests"
API_TEST_DIR="$TEST_DIR/api"

# Check if pytest is available
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}Error: pytest is not installed${NC}"
    echo -e "${YELLOW}Please run: pip install pytest${NC}"
    exit 1
fi

# Default settings
VERBOSE=false
COVERAGE=false
PARALLEL=false
OUTPUT_FILE=""
TEST_PATH=""
MARKERS=""

# Function to display help
display_help() {
    echo -e "${BLUE}===== Convers.me Test Runner =====${NC}"
    echo -e "Usage: $0 [options] [test_path]"
    echo
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  ${GREEN}-a, --all${NC}         Run all tests"
    echo -e "  ${GREEN}-r, --router${NC} NAME  Run tests for a specific router (e.g., processes, events)"
    echo -e "  ${GREEN}-m, --marker${NC} NAME  Run tests with a specific marker (e.g., slow, auth)"
    echo -e "  ${GREEN}-v, --verbose${NC}      Enable verbose output"
    echo -e "  ${GREEN}-c, --coverage${NC}     Generate coverage report"
    echo -e "  ${GREEN}-p, --parallel${NC}     Run tests in parallel (requires pytest-xdist)"
    echo -e "  ${GREEN}-o, --output${NC} FILE  Save test results to a file"
    echo -e "  ${GREEN}-l, --list-routers${NC} List available router tests"
    echo -e "  ${GREEN}-h, --help${NC}         Display this help message"
    echo
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 -a                   # Run all tests"
    echo -e "  $0 -r processes         # Test processes router"
    echo -e "  $0 -m auth              # Run tests marked with 'auth'"
    echo -e "  $0 -v -c                # Run all tests with verbose output and coverage"
    echo -e "  $0 tests/api/test_events_endpoint.py  # Run a specific test file"
}

# Function to list available router tests
list_routers() {
    echo -e "${BLUE}Available router tests:${NC}"

    if [[ -d "$API_TEST_DIR" ]]; then
        ROUTERS=$(find "$API_TEST_DIR" -name "test_router_*.py" -exec basename {} \; | sed 's/test_router_//g' | sed 's/\.py//g' | sort)

        if [[ -z "$ROUTERS" ]]; then
            echo -e "${YELLOW}No router tests found in $API_TEST_DIR${NC}"
        else
            for router in $ROUTERS; do
                echo -e "  ${GREEN}$router${NC}"
            done
        fi
    else
        echo -e "${RED}Error: API test directory not found: $API_TEST_DIR${NC}"
    fi
}

# Function to run tests
run_tests() {
    # Start with base command
    CMD="python -m pytest"

    # Add verbosity if requested
    if [[ "$VERBOSE" = true ]]; then
        CMD="$CMD -v"
    fi

    # Add coverage if requested
    if [[ "$COVERAGE" = true ]]; then
        CMD="$CMD --cov=api --cov=services --cov=db --cov-report=term --cov-report=html"
    fi

    # Add parallel execution if requested
    if [[ "$PARALLEL" = true ]]; then
        # Check if pytest-xdist is available
        if python -c "import pytest_xdist" &> /dev/null; then
            CMD="$CMD -n auto"
        else
            echo -e "${YELLOW}Warning: pytest-xdist not installed, running sequentially${NC}"
        fi
    fi

    # Add markers if specified
    if [[ -n "$MARKERS" ]]; then
        CMD="$CMD -m \"$MARKERS\""
    fi

    # Add test path
    if [[ -n "$TEST_PATH" ]]; then
        CMD="$CMD $TEST_PATH"
    fi

    # Add output file redirection if specified
    if [[ -n "$OUTPUT_FILE" ]]; then
        CMD="$CMD | tee $OUTPUT_FILE"
    fi

    # Display the command
    echo -e "${BLUE}Running command:${NC} $CMD"

    # Run the command
    eval "$CMD"

    # Return the exit code
    return $?
}

# Parse arguments
if [[ $# -eq 0 ]]; then
    display_help
    exit 0
fi

while [[ $# -gt 0 ]]; do
    case "$1" in
        -a|--all)
            TEST_PATH="$TEST_DIR"
            shift
            ;;
        -r|--router)
            if [[ -z "$2" ]]; then
                echo -e "${RED}Error: router name required${NC}"
                exit 1
            fi
            TEST_PATH="$API_TEST_DIR/test_router_$2.py"
            if [[ ! -f "$TEST_PATH" ]]; then
                echo -e "${RED}Error: Router test file not found: $TEST_PATH${NC}"
                list_routers
                exit 1
            fi
            shift 2
            ;;
        -m|--marker)
            if [[ -z "$2" ]]; then
                echo -e "${RED}Error: marker name required${NC}"
                exit 1
            fi
            MARKERS="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -p|--parallel)
            PARALLEL=true
            shift
            ;;
        -o|--output)
            if [[ -z "$2" ]]; then
                echo -e "${RED}Error: output file name required${NC}"
                exit 1
            fi
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -l|--list-routers)
            list_routers
            exit 0
            ;;
        -h|--help)
            display_help
            exit 0
            ;;
        *)
            if [[ -f "$1" ]]; then
                TEST_PATH="$1"
            elif [[ -d "$1" ]]; then
                TEST_PATH="$1"
            else
                echo -e "${RED}Error: Unknown option or invalid path: $1${NC}"
                display_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Run the tests
echo -e "${BLUE}===== Running Tests =====${NC}"
run_tests
EXIT_CODE=$?

# Display summary
if [[ $EXIT_CODE -eq 0 ]]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"

    # Show coverage report location if generated
    if [[ "$COVERAGE" = true ]]; then
        echo -e "${BLUE}Coverage report generated in:${NC} htmlcov/index.html"
    fi
else
    echo -e "${RED}❌ Tests failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE
