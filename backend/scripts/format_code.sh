#!/bin/bash
# Script to format code and enforce consistent styling

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Convers.me Code Formatting =====${NC}"
echo -e "${BLUE}Running code formatting to fix style issues...${NC}"

# Change to the repository root directory
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

cd "$REPO_ROOT" || exit 1

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo -e "${YELLOW}pre-commit not found. Installing...${NC}"
    pip install pre-commit
fi

# Check if pre-commit hooks are installed
if [ ! -f .git/hooks/pre-commit ]; then
    echo -e "${YELLOW}Installing pre-commit hooks...${NC}"
    pre-commit install
fi

# Run pre-commit hook on all files
echo -e "${BLUE}Running pre-commit hooks...${NC}"
pre-commit run --all-files

# Run specific format tools on backend Python files
echo -e "${BLUE}Skipping black formatting on backend Python files...${NC}"
# find ./backend -name "*.py" -exec black {} \;

echo -e "${BLUE}Running isort on backend Python files...${NC}"
find ./backend -name "*.py" -exec isort {} \;

# Format frontend code if the tools are available
if [ -d "./frontend" ]; then
    echo -e "${BLUE}Checking for frontend formatting tools...${NC}"

    if [ -f "./frontend/package.json" ] && command -v npm &> /dev/null; then
        cd ./frontend || exit 1

        if grep -q "\"prettier\"" package.json; then
            echo -e "${BLUE}Running prettier on frontend files...${NC}"
            npx prettier --write "app/**/*.{ts,tsx,js,jsx,json,css}"
        else
            echo -e "${YELLOW}Prettier not found in frontend dependencies${NC}"
        fi

        cd "$REPO_ROOT" || exit 1
    fi
fi

echo -e "${GREEN}Code formatting complete!${NC}"
echo
echo -e "${YELLOW}==== Best Practices Reminder ====${NC}"
echo -e "1. ${BLUE}Always keep f-strings on a single line when possible${NC}"
echo -e "2. ${BLUE}For multiline strings, use parentheses: f\"text {variable} (\" + \"more text)\"${NC}"
echo -e "3. ${BLUE}For long f-strings, use an explicit string join with '+' operator${NC}"
echo -e "4. ${BLUE}Run this script before committing changes${NC}"

# Ensure the script is executable
chmod +x "$0"
