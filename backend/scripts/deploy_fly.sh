#!/bin/bash
# Script to deploy the Convers.me backend to fly.io
# Includes improved error handling, colorized output, and Redis + Tigris services

set -e  # Exit on error

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Convers.me Fly.io Deployment =====${NC}"

# Parse command line arguments
SKIP_SERVICES=true  # Skip services by default since they're already set up
REGION="sjc"
SETUP_ONLY=false
DEPLOY_ONLY=true   # Default to deploy-only since everything is already set up
VM_SIZE="shared-cpu-1x"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --skip-services) SKIP_SERVICES=true ;;
        --region) REGION="$2"; shift ;;
        --setup-only) SETUP_ONLY=true ;;
        --deploy-only) DEPLOY_ONLY=true ;;
        --vm-size) VM_SIZE="$2"; shift ;;
        --help)
            echo "Usage: ./deploy_fly.sh [options]"
            echo "Options:"
            echo "  --skip-services  Skip Redis and Tigris setup"
            echo "  --region REGION  Specify Fly.io region (default: sjc)"
            echo "  --setup-only     Only set up app without deploying"
            echo "  --deploy-only    Only deploy (skip setup if already done)"
            echo "  --vm-size SIZE   VM size (default: shared-cpu-1x)"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown parameter: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
    shift
done

# Check for flyctl
if ! command -v flyctl &> /dev/null; then
    echo -e "${YELLOW}flyctl not found. Installing...${NC}"
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
        echo -e "${YELLOW}Please log in to fly.io:${NC}"
        flyctl auth login
    fi
fi

# Initialize if needed and not in deploy-only mode
if [ ! -f fly.toml ] && [ "$DEPLOY_ONLY" = false ]; then
    echo -e "${BLUE}Initializing fly.io app...${NC}"

    # Get app name from user or use environment variable
    if [ -z "$FLY_APP_NAME" ]; then
        read -p "Enter your fly.io app name (e.g., conversme-backend): " FLY_APP_NAME
    fi

    # Copy the example fly.toml
    if [ -f fly.toml.example ]; then
        cp fly.toml.example fly.toml
        sed -i.bak "s/conversme-backend/$FLY_APP_NAME/g" fly.toml
        rm -f fly.toml.bak
        echo -e "${GREEN}Created fly.toml from template${NC}"
    else
        # Launch a new app if example not available
        flyctl launch --name $FLY_APP_NAME --no-deploy
        echo -e "${GREEN}Created a new fly.toml file${NC}"
    fi

    # Skip PostgreSQL database configuration as it's already set up
    echo -e "${BLUE}Skipping PostgreSQL setup as it's already configured.${NC}"

    echo -e "${GREEN}Initial setup complete.${NC}"

    # Skip volume creation as it's already set up
    echo -e "${BLUE}Skipping volume creation as it's already configured.${NC}"

    echo -e "${GREEN}Basic configuration complete.${NC}"
elif [ -f fly.toml ] && [ "$DEPLOY_ONLY" = false ]; then
    echo -e "${YELLOW}fly.toml already exists, using existing configuration${NC}"
    # Extract the app name from fly.toml
    FLY_APP_NAME=$(grep "app = " fly.toml | cut -d '"' -f 2)
    echo -e "${BLUE}Using app name: $FLY_APP_NAME${NC}"
fi

# Skip Redis, Tigris, and PostgreSQL setup as they are already configured
echo -e "${BLUE}Skipping Redis, Tigris, and PostgreSQL setup as they are already configured.${NC}"

# Exit if we're only setting up
if [ "$SETUP_ONLY" = true ]; then
    echo -e "${GREEN}Setup complete! Run with --deploy-only to deploy your application.${NC}"
    exit 0
fi

# Check for requirements.txt if not in setup-only mode
if [ ! -f requirements.txt ] && [ "$SETUP_ONLY" = false ]; then
    # Skip generating requirements.txt since it should already exist
    echo -e "${BLUE}Using existing requirements.txt file...${NC}"

    if [ ! -f requirements.txt ]; then
        echo -e "${YELLOW}Warning: requirements.txt not found, but continuing anyway...${NC}"
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

# Deploy
echo -e "${BLUE}Deploying to fly.io...${NC}"
flyctl deploy

# Get app URL
APP_URL=$(flyctl status --json | jq -r '.Hostname' 2>/dev/null)
if [ -z "$APP_URL" ]; then
    APP_URL=$(flyctl status | grep -oE 'https://[^ ]+')
fi

echo -e "${GREEN}===========================${NC}"
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your app is available at: ${NC}${BLUE}https://$APP_URL${NC}"
echo -e "${GREEN}API documentation: ${NC}${BLUE}https://$APP_URL/docs${NC}"
echo -e "${GREEN}===========================${NC}"
echo -e "${YELLOW}To monitor your app:${NC}"
echo -e "  ${BLUE}flyctl status  ${NC}- Check app status"
echo -e "  ${BLUE}flyctl logs    ${NC}- View logs"
echo -e "  ${BLUE}flyctl ssh console  ${NC}- SSH into the VM"
echo -e "${GREEN}===========================${NC}"
