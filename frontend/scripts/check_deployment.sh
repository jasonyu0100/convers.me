#!/bin/bash

echo "Checking frontend deployment status..."

# Check if running on Fly.io
if command -v flyctl &> /dev/null; then
  echo "Checking Fly.io deployment..."
  flyctl status
  flyctl logs --instance-type app
else
  echo "Fly.io CLI not found. To install: 'brew install flyctl' or visit https://fly.io/docs/hands-on/install-flyctl/"
fi

# Check local Next.js service
echo -e "\nChecking local services..."
if pgrep -f "next" > /dev/null; then
  echo "Next.js is running locally"
else
  echo "Next.js is not running locally"
fi

# Check frontend health
echo -e "\nChecking frontend health..."
curl -s http://localhost:3000/health || echo "Frontend not available locally"

echo -e "\nDeployment check complete."
