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
SKIP_SERVICES=false
REGION="sjc"
SETUP_ONLY=false
DEPLOY_ONLY=false
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

    # Configure PostgreSQL database
    echo -e "${BLUE}Setting up PostgreSQL on fly.io...${NC}"

    # Check if DB_NAME is provided or generate from app name
    if [ -z "$FLY_DB_NAME" ]; then
        FLY_DB_NAME="${FLY_APP_NAME}-db"
    fi

    echo -e "${BLUE}Creating PostgreSQL database: $FLY_DB_NAME${NC}"
    flyctl postgres create --name $FLY_DB_NAME --region $REGION --vm-size $VM_SIZE --initial-cluster-size 1

    # Get connection string
    echo -e "${BLUE}Retrieving database connection string...${NC}"
    DB_URL=$(flyctl postgres connect --app $FLY_DB_NAME --show-connection-string)

    # Set environment variables
    echo -e "${BLUE}Configuring environment variables...${NC}"

    # Generate a secure secret key
    SECRET_KEY=$(openssl rand -hex 32)

    # Determine frontend URL
    if [ -z "$FRONTEND_URL" ]; then
        # Default to using app name with -frontend suffix
        FRONTEND_URL="https://${FLY_APP_NAME%-backend}-frontend.fly.dev"
        CORS_DOMAINS="$FRONTEND_URL,https://$FLY_APP_NAME.fly.dev"
    fi

    echo -e "${BLUE}Setting secrets...${NC}"
    flyctl secrets set \
        DATABASE_URL="$DB_URL" \
        SECRET_KEY="$SECRET_KEY" \
        DEBUG="False" \
        FRONTEND_URL="$FRONTEND_URL" \
        REDIRECT_URL="${FRONTEND_URL}/auth/callback" \
        CORS_ORIGINS="$CORS_DOMAINS"

    echo -e "${GREEN}Initial setup complete.${NC}"
    echo -e "${BLUE}Creating volume for uploads...${NC}"

    # Create volume for uploaded files
    flyctl volumes create conversme_uploads --size 1 --region $REGION

    echo -e "${GREEN}Basic configuration complete.${NC}"
elif [ -f fly.toml ] && [ "$DEPLOY_ONLY" = false ]; then
    echo -e "${YELLOW}fly.toml already exists, using existing configuration${NC}"
    # Extract the app name from fly.toml
    FLY_APP_NAME=$(grep "app = " fly.toml | cut -d '"' -f 2)
    echo -e "${BLUE}Using app name: $FLY_APP_NAME${NC}"
fi

# Set up Redis and Tigris if not skipped and not in deploy-only mode
if [ "$SKIP_SERVICES" = false ] && [ "$DEPLOY_ONLY" = false ]; then
    echo -e "${BLUE}Setting up Redis and Tigris services...${NC}"

    # Create Redis instance
    echo -e "${BLUE}Creating Redis instance...${NC}"
    if flyctl redis create --name "${FLY_APP_NAME}-redis" --region $REGION --vm-size $VM_SIZE; then
        echo -e "${GREEN}Redis instance created successfully!${NC}"
    else
        echo -e "${YELLOW}Redis instance might already exist or there was an error.${NC}"
        echo -e "Checking existing Redis instances..."
        flyctl redis list
    fi

    # Attach Redis to the app
    echo -e "${BLUE}Attaching Redis to the application...${NC}"
    if flyctl redis attach "${FLY_APP_NAME}-redis" --app $FLY_APP_NAME; then
        echo -e "${GREEN}Redis attached successfully!${NC}"
    else
        echo -e "${YELLOW}Failed to attach Redis. It might already be attached.${NC}"
    fi

    # Set up Tigris (using a volume for persistent storage)
    echo -e "${BLUE}Creating Tigris volume...${NC}"
    if flyctl volumes create tigris_data --region $REGION --size 10 --app $FLY_APP_NAME; then
        echo -e "${GREEN}Tigris volume created successfully!${NC}"
    else
        echo -e "${YELLOW}Volume might already exist or there was an error.${NC}"
        echo -e "Check existing volumes with: flyctl volumes list"
    fi

    # Creating Docker file for Tigris machine
    echo -e "${BLUE}Creating Tigris Dockerfile...${NC}"
    cat > tigris.Dockerfile << EOL
FROM tigrisdata/tigris-local:latest

EXPOSE 8081

ENV TIGRIS_SERVER_HTTP_PORT=8081
ENV TIGRIS_SERVER_DEFAULT_PROJECT=conversme
ENV TIGRIS_SERVER_INITIALIZE_SCHEMA=true

VOLUME /data

HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD wget -O - http://localhost:8081/health || exit 1

CMD ["tigris-server", "--http.addr=0.0.0.0:8081", "--data.path=/data"]
EOL

    # Create a fly.toml for the Tigris service
    echo -e "${BLUE}Creating Tigris fly.toml configuration...${NC}"
    TIGRIS_APP="${FLY_APP_NAME}-tigris"
    cat > tigris.toml << EOL
app = "${TIGRIS_APP}"
primary_region = "${REGION}"

[build]
  dockerfile = "tigris.Dockerfile"

[http_service]
  internal_port = 8081
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[mounts]
  source = "tigris_data"
  destination = "/data"

[vm]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024

[[http_service.checks]]
  interval = "10s"
  timeout = "2s"
  grace_period = "5s"
  method = "GET"
  path = "/health"
  protocol = "http"
EOL

    echo -e "${BLUE}Deploying Tigris service...${NC}"
    if flyctl launch --dockerfile tigris.Dockerfile --config tigris.toml --name $TIGRIS_APP --region $REGION --no-deploy; then
        echo -e "${GREEN}Tigris configuration created!${NC}"

        # Deploy the Tigris service
        if flyctl deploy --config tigris.toml; then
            echo -e "${GREEN}Tigris service deployed successfully!${NC}"
        else
            echo -e "${RED}Failed to deploy Tigris service.${NC}"
        fi
    else
        echo -e "${RED}Failed to create Tigris configuration.${NC}"
    fi

    # Set environment variables for the backend
    echo -e "${BLUE}Setting Tigris URL environment variable...${NC}"
    TIGRIS_URL="https://${TIGRIS_APP}.fly.dev"
    if flyctl secrets set TIGRIS_URL="$TIGRIS_URL" TIGRIS_PROJECT="conversme" TIGRIS_BUCKET="media" USE_LOCAL_STORAGE="False" --app $FLY_APP_NAME; then
        echo -e "${GREEN}Tigris environment variables set successfully!${NC}"
    else
        echo -e "${RED}Failed to set Tigris environment variables.${NC}"
    fi
fi

# Exit if we're only setting up
if [ "$SETUP_ONLY" = true ]; then
    echo -e "${GREEN}Setup complete! Run with --deploy-only to deploy your application.${NC}"
    exit 0
fi

# Check for requirements.txt if not in setup-only mode
if [ ! -f requirements.txt ] && [ "$SETUP_ONLY" = false ]; then
    echo -e "${YELLOW}requirements.txt not found, generating from pyproject.toml...${NC}"

    if [ -f pyproject.toml ]; then
        if command -v uv &> /dev/null; then
            uv pip compile pyproject.toml -o requirements.txt
        else
            echo -e "${RED}Error: uv not found. Install uv or create requirements.txt manually.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: Neither requirements.txt nor pyproject.toml found.${NC}"
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
