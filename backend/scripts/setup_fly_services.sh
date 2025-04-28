#!/bin/bash
# Script to set up Redis and Tigris on Fly.io

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up Redis and Tigris services on Fly.io...${NC}\n"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}Error: flyctl is not installed.${NC}"
    echo -e "Please install the Fly.io CLI: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Check if logged in to Fly.io
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}You need to log in to Fly.io first.${NC}"
    flyctl auth login
fi

# Set up Redis
echo -e "\n${BLUE}Creating Redis instance...${NC}"
if flyctl redis create --name conversme-redis --region sjc --vm-size shared-cpu-1x; then
    echo -e "${GREEN}Redis instance created successfully!${NC}"
else
    echo -e "${YELLOW}Redis instance might already exist or there was an error.${NC}"
    echo -e "Check existing Redis instances with: flyctl redis list"
fi

# Attach Redis to the app
echo -e "\n${BLUE}Attaching Redis to the application...${NC}"
if flyctl redis attach conversme-redis --app conversme-backend; then
    echo -e "${GREEN}Redis attached successfully!${NC}"
else
    echo -e "${YELLOW}Failed to attach Redis. It might already be attached.${NC}"
fi

# Set up Tigris (using a volume for persistent storage)
echo -e "\n${BLUE}Creating Tigris volume...${NC}"
if flyctl volumes create tigris_data --region sjc --size 10 --app conversme-backend; then
    echo -e "${GREEN}Tigris volume created successfully!${NC}"
else
    echo -e "${YELLOW}Volume might already exist or there was an error.${NC}"
    echo -e "Check existing volumes with: flyctl volumes list"
fi

# Creating Docker file for Tigris machine
echo -e "\n${BLUE}Creating Tigris Dockerfile...${NC}"
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
echo -e "\n${BLUE}Creating Tigris fly.toml configuration...${NC}"
cat > tigris.toml << EOL
app = "conversme-tigris"
primary_region = "sjc"

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

echo -e "\n${BLUE}Deploying Tigris service...${NC}"
if flyctl launch --dockerfile tigris.Dockerfile --config tigris.toml --no-deploy; then
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
echo -e "\n${BLUE}Setting Tigris URL environment variable...${NC}"
TIGRIS_URL="https://conversme-tigris.fly.dev"
if flyctl secrets set TIGRIS_URL="$TIGRIS_URL" --app conversme-backend; then
    echo -e "${GREEN}Tigris URL set successfully!${NC}"
else
    echo -e "${RED}Failed to set Tigris URL.${NC}"
fi

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "Your Redis and Tigris services are now configured on Fly.io."
echo -e "Redis URL is automatically set via REDIS_URL environment variable."
echo -e "Tigris URL is set to: ${TIGRIS_URL}"
echo -e "\nYou can now deploy your application with: flyctl deploy"
