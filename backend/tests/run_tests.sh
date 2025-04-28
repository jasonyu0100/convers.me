#!/bin/bash
# Script to run API tests (simplified version)

# Make sure we're in the right directory
cd "$(dirname "$0")/.."

# Display help
display_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -a, --all       Run all tests"
    echo "  -p, --api       Run API tests"
    echo "  -r, --router    Run tests for a specific router (e.g. processes)"
    echo "  -v, --verbose   Run with verbose output"
    echo "  -h, --help      Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -a                   # Run all tests"
    echo "  $0 -r processes         # Test processes router"
    echo "  $0 -v -r insights       # Run insights router tests with verbose output"
}

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found"
    exit 1
fi

# Check if pytest is installed
if ! python3 -c "import pytest" &> /dev/null; then
    echo "Installing pytest..."
    pip install pytest
fi

# Parse arguments
VERBOSE=""

if [ $# -eq 0 ]; then
    display_help
    exit 0
fi

while [ $# -gt 0 ]; do
    case "$1" in
        -a|--all)
            echo "Running all tests..."
            python3 -m pytest
            exit $?
            ;;
        -p|--api)
            echo "Running API tests..."
            python3 -m pytest tests/api -v
            exit $?
            ;;
        -r|--router)
            if [ -z "$2" ]; then
                echo "Error: router name required"
                exit 1
            fi
            echo "Testing router: $2"
            python3 -m pytest tests/api/test_router_$2.py -v
            exit $?
            ;;
        -v|--verbose)
            VERBOSE="-v"
            shift
            continue
            ;;
        -h|--help)
            display_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            display_help
            exit 1
            ;;
    esac
    shift
done

# If we get here with options set, run with the specified options
python3 -m pytest $VERBOSE
