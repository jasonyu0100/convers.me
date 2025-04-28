#!/bin/bash
# Script to deploy the Convers.me frontend to fly.io
# Includes improved error handling and colorized output

# Exit on error
set -e

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Convers.me Frontend Deployment =====${NC}"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${YELLOW}Installing flyctl...${NC}"
    curl -L https://fly.io/install.sh | sh

    # Add to PATH if needed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        export FLYCTL_INSTALL="/Users/$(whoami)/.fly"
    else
        # Linux
        export FLYCTL_INSTALL="/home/$(whoami)/.fly"
    fi
    export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

# Check if we have a Fly API token in the environment
if [ -n "$FLY_API_TOKEN" ]; then
    echo -e "${GREEN}Using FLY_API_TOKEN from environment${NC}"
else
    # Check if user is logged in
    if ! flyctl auth whoami &> /dev/null; then
        echo -e "${YELLOW}Please log in to Fly.io:${NC}"
        flyctl auth login
    fi
fi

# Get app name from environment or use default
FLY_APP_NAME=${FLY_APP_NAME:-"conversme-frontend"}

# Check if the app exists
if ! flyctl status --app $FLY_APP_NAME &> /dev/null; then
    echo -e "${BLUE}Creating Fly app '$FLY_APP_NAME'...${NC}"

    # Get region from environment or use default
    FLY_REGION=${FLY_REGION:-"sjc"}

    flyctl launch --no-deploy --name $FLY_APP_NAME --region $FLY_REGION
    echo -e "${GREEN}App created successfully${NC}"
fi

# Get backend URL from environment or prompt
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    # Check if there's a matching backend app
    BACKEND_APP="${FLY_APP_NAME/frontend/backend}"

    if flyctl status --app $BACKEND_APP &> /dev/null; then
        BACKEND_URL="https://$BACKEND_APP.fly.dev"
        echo -e "${BLUE}Found matching backend at $BACKEND_URL${NC}"
    else
        # Prompt for the backend URL
        read -p "Enter your backend API URL (e.g., https://conversme-backend.fly.dev): " BACKEND_URL
    fi

    NEXT_PUBLIC_API_URL=$BACKEND_URL
fi

# Set environment variables
echo -e "${BLUE}Setting environment variables...${NC}"
flyctl secrets set --app $FLY_APP_NAME \
    NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    NODE_ENV="production"

# Check for analytics/monitoring environment variables and set them if provided
if [ -n "$NEXT_PUBLIC_SENTRY_DSN" ]; then
    echo -e "${BLUE}Setting Sentry DSN...${NC}"
    flyctl secrets set --app $FLY_APP_NAME NEXT_PUBLIC_SENTRY_DSN="$NEXT_PUBLIC_SENTRY_DSN"
fi

# Verify Dockerfile exists
if [ ! -f Dockerfile ]; then
    echo -e "${YELLOW}Dockerfile not found in current directory${NC}"
    if [ -f ../Dockerfile ]; then
        echo -e "${BLUE}Using Dockerfile from parent directory${NC}"
        cp ../Dockerfile .
    else
        echo -e "${RED}Error: Dockerfile not found!${NC}"
        exit 1
    fi
fi

# Check uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}WARNING: You have uncommitted changes. Only committed changes will be deployed.${NC}"
    read -p "Do you want to continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled.${NC}"
        exit 1
    fi
fi

# Clean build cache first
echo -e "${BLUE}Cleaning build cache...${NC}"
flyctl builds clear --app $FLY_APP_NAME || true

# Optimize deployment strategy
echo -e "${BLUE}Deploying application with optimized build...${NC}"

# Set build memory limit
export NEXT_PUBLIC_BUILD_MEMORY_LIMIT=3584
export NEXT_PUBLIC_BUILD_OPTIMIZATION=true

# Deploy with improved arguments
flyctl deploy --app $FLY_APP_NAME \
  --strategy canary \
  --remote-only \
  --build-only=false \
  --vm-cpu-kind shared \
  --vm-memory 2048 \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_TELEMETRY_DISABLED=1 \
  --build-arg NEXT_PUBLIC_BUILD_MEMORY_LIMIT=$NEXT_PUBLIC_BUILD_MEMORY_LIMIT \
  --build-arg NEXT_PUBLIC_BUILD_OPTIMIZATION=$NEXT_PUBLIC_BUILD_OPTIMIZATION

# Get app URL
APP_URL=$(flyctl status --app $FLY_APP_NAME --json | jq -r '.Hostname' 2>/dev/null)
if [ -z "$APP_URL" ]; then
    APP_URL="$FLY_APP_NAME.fly.dev"
fi

echo -e "${GREEN}===========================${NC}"
echo -e "${GREEN}Frontend deployment complete!${NC}"
echo -e "${GREEN}Your app is available at: ${NC}${BLUE}https://$APP_URL${NC}"
echo -e "${GREEN}Backend API URL: ${NC}${BLUE}$NEXT_PUBLIC_API_URL${NC}"
echo -e "${GREEN}===========================${NC}"
echo -e "${YELLOW}To monitor your app:${NC}"
echo -e "  ${BLUE}flyctl status --app $FLY_APP_NAME  ${NC}- Check app status"
echo -e "  ${BLUE}flyctl logs --app $FLY_APP_NAME    ${NC}- View logs"
echo -e "${GREEN}===========================${NC}"
