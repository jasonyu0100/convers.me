#!/bin/bash

echo "Checking backend deployment status..."

# Check if running on Fly.io
if command -v flyctl &> /dev/null; then
  echo "Checking Fly.io deployment..."
  flyctl status
  flyctl logs --instance-type app
else
  echo "Fly.io CLI not found. To install: 'brew install flyctl' or visit https://fly.io/docs/hands-on/install-flyctl/"
fi

# Check local services
echo -e "\nChecking local services..."
docker-compose ps

# Check API health
echo -e "\nChecking API health..."
curl -s http://localhost:8000/health || echo "API not available locally"

echo -e "\nDeployment check complete."
