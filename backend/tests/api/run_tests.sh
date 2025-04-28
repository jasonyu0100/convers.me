#!/bin/bash
# Script to run API tests

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Display help
display_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -a, --all       Run all tests"
    echo "  -h, --health    Run health checks"
    echo "  -p, --public    Run public endpoint tests"
    echo "  -r, --router    Run tests for a specific router"
    echo "  -l, --list      List available routers"
    echo "  --help          Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -a                   # Run all tests"
    echo "  $0 -h                   # Run health checks"
    echo "  $0 -r processes         # Test processes router"
    echo "  $0 -p                   # Test public endpoints"
    echo "  $0 -l                   # List available routers"
}

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found"
    exit 1
fi

# Check if python and pip dependencies are installed
check_deps() {
    # Check if requests module is installed
    if ! python3 -c "import requests" &> /dev/null; then
        echo "Installing required Python dependencies..."
        pip install requests
    fi
}

# Check dependencies
check_deps

# Parse arguments
if [ $# -eq 0 ]; then
    display_help
    exit 0
fi

while [ $# -gt 0 ]; do
    case "$1" in
        -a|--all)
            echo "Running all tests..."
            python3 test_all_routes.py
            exit $?
            ;;
        -h|--health)
            echo "Running health checks..."
            python3 test_health_checks.py
            exit $?
            ;;
        -p|--public)
            echo "Testing public endpoints..."
            python3 test_public_endpoints.py
            exit $?
            ;;
        -r|--router)
            if [ -z "$2" ]; then
                echo "Error: router name required"
                exit 1
            fi
            echo "Testing router: $2"
            python3 run_router_tests.py -r "$2"
            exit $?
            ;;
        -l|--list)
            echo "Available routers:"
            python3 run_router_tests.py -l
            exit $?
            ;;
        --help)
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
