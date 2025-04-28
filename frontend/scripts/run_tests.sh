#!/bin/bash
# Script to run frontend tests for Convers.me
# Utilizes the existing test-api.ts for API connectivity tests

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Path to app directory
APP_DIR="app"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not found${NC}"
    exit 1
fi

# Check if TS-Node is installed
if ! npx ts-node --version &> /dev/null; then
    echo -e "${YELLOW}TS-Node not found, installing...${NC}"
    npm install --save-dev ts-node
fi

# Function to run API tests
run_api_tests() {
    echo -e "${BLUE}===== Running API Connectivity Tests =====${NC}"

    if [ -f "$APP_DIR/test-api.ts" ]; then
        # Set API URL if provided
        if [ -n "$1" ]; then
            export NEXT_PUBLIC_API_URL="$1"
            echo -e "${BLUE}Using API URL: $NEXT_PUBLIC_API_URL${NC}"
        fi

        # Run the test script
        echo -e "${BLUE}Running API connectivity tests...${NC}"
        npx ts-node --project tsconfig.json "$APP_DIR/test-api.ts"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}API connectivity tests passed!${NC}"
            return 0
        else
            echo -e "${RED}API connectivity tests failed!${NC}"
            return 1
        fi
    else
        echo -e "${RED}Error: API test script not found: $APP_DIR/test-api.ts${NC}"
        return 1
    fi
}

# Function to run middleware tests
run_middleware_tests() {
    echo -e "${BLUE}===== Running API Middleware Tests =====${NC}"

    if [ -f "$APP_DIR/test-api-middleware.ts" ]; then
        echo -e "${BLUE}Running API middleware tests...${NC}"
        npx ts-node --project tsconfig.json "$APP_DIR/test-api-middleware.ts"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}API middleware tests passed!${NC}"
            return 0
        else
            echo -e "${RED}API middleware tests failed!${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}API middleware test script not found, skipping: $APP_DIR/test-api-middleware.ts${NC}"
        return 0
    fi
}

# Function to run component tests if available
run_component_tests() {
    echo -e "${BLUE}===== Running Component Tests =====${NC}"

    # Check if Jest or other test framework is configured
    if grep -q "\"test\":" package.json; then
        echo -e "${BLUE}Running component tests with npm test...${NC}"
        npm test

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Component tests passed!${NC}"
            return 0
        else
            echo -e "${RED}Component tests failed!${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}No component tests configured in package.json, skipping${NC}"
        return 0
    fi
}

# Function to run linting
run_linting() {
    echo -e "${BLUE}===== Running Linting =====${NC}"

    # Check if ESLint is configured
    if grep -q "\"lint\":" package.json; then
        echo -e "${BLUE}Running linting with npm run lint...${NC}"
        npm run lint

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Linting passed!${NC}"
            return 0
        else
            echo -e "${RED}Linting failed!${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}No linting configured in package.json, skipping${NC}"
        return 0
    fi
}

# Function to run type checking
run_type_checking() {
    echo -e "${BLUE}===== Running Type Checking =====${NC}"

    # Check if TypeScript is configured
    if [ -f "tsconfig.json" ]; then
        echo -e "${BLUE}Running TypeScript type checking...${NC}"
        npx tsc --noEmit

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Type checking passed!${NC}"
            return 0
        else
            echo -e "${RED}Type checking failed!${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}No TypeScript configuration found, skipping type checking${NC}"
        return 0
    fi
}

# Main function
run_tests() {
    echo -e "${BLUE}===== Convers.me Frontend Tests =====${NC}"

    # Initialize results
    API_RESULT=0
    MIDDLEWARE_RESULT=0
    COMPONENT_RESULT=0
    LINT_RESULT=0
    TYPE_RESULT=0

    # Parse arguments
    RUN_ALL=true
    API_URL=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --api-only)
                RUN_ALL=false
                run_api_tests "$API_URL"
                exit $?
                ;;
            --middleware-only)
                RUN_ALL=false
                run_middleware_tests
                exit $?
                ;;
            --component-only)
                RUN_ALL=false
                run_component_tests
                exit $?
                ;;
            --lint-only)
                RUN_ALL=false
                run_linting
                exit $?
                ;;
            --type-only)
                RUN_ALL=false
                run_type_checking
                exit $?
                ;;
            --api-url)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: API URL required${NC}"
                    exit 1
                fi
                API_URL="$2"
                shift
                ;;
            --help)
                echo -e "${BLUE}Usage: $0 [options]${NC}"
                echo -e "Options:"
                echo -e "  --api-only        Run only API connectivity tests"
                echo -e "  --middleware-only Run only API middleware tests"
                echo -e "  --component-only  Run only component tests"
                echo -e "  --lint-only       Run only linting"
                echo -e "  --type-only       Run only type checking"
                echo -e "  --api-url URL     Specify API URL for tests"
                echo -e "  --help            Display this help message"
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                exit 1
                ;;
        esac
        shift
    done

    # Run all tests if no specific test was requested
    if [ "$RUN_ALL" = true ]; then
        # Run API tests
        run_api_tests "$API_URL"
        API_RESULT=$?

        # Run middleware tests
        run_middleware_tests
        MIDDLEWARE_RESULT=$?

        # Run component tests
        run_component_tests
        COMPONENT_RESULT=$?

        # Run linting
        run_linting
        LINT_RESULT=$?

        # Run type checking
        run_type_checking
        TYPE_RESULT=$?

        # Print summary
        echo -e "\n${BLUE}===== Test Summary =====${NC}"
        echo -e "API Tests:        $([ $API_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
        echo -e "Middleware Tests: $([ $MIDDLEWARE_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
        echo -e "Component Tests:  $([ $COMPONENT_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
        echo -e "Linting:          $([ $LINT_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
        echo -e "Type Checking:    $([ $TYPE_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"

        # Determine overall result
        if [ $API_RESULT -eq 0 ] && [ $MIDDLEWARE_RESULT -eq 0 ] && [ $COMPONENT_RESULT -eq 0 ] && [ $LINT_RESULT -eq 0 ] && [ $TYPE_RESULT -eq 0 ]; then
            echo -e "\n${GREEN}All tests passed successfully!${NC}"
            exit 0
        else
            echo -e "\n${RED}Some tests failed. See above for details.${NC}"
            exit 1
        fi
    fi
}

# Run the tests
run_tests "$@"
