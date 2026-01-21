#!/bin/bash

# EvalEase Quick Deploy Script
# This script helps you quickly deploy EvalEase with Docker

set -e

echo "=========================================="
echo "   EvalEase Docker Quick Deploy"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
    cp .env.docker .env
    
    # Generate random secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-20)
    DB_ROOT_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-20)
    
    # Update .env file
    sed -i.bak "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEXTAUTH_SECRET|g" .env
    sed -i.bak "s|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=$DB_PASSWORD|g" .env
    sed -i.bak "s|DATABASE_ROOT_PASSWORD=.*|DATABASE_ROOT_PASSWORD=$DB_ROOT_PASSWORD|g" .env
    rm .env.bak 2>/dev/null || true
    
    echo -e "${GREEN}✓ .env file created with random secrets${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Please edit .env and set your NEXTAUTH_URL${NC}"
    echo "Example: NEXTAUTH_URL=http://your-server-ip:3000"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit and edit .env..."
fi

# Ask which compose file to use
echo ""
echo "Select deployment mode:"
echo "1) Development (with hot reload)"
echo "2) Production (basic)"
echo "3) Production (with Nginx)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        COMPOSE_FILE="docker-compose.dev.yml"
        MODE="development"
        ;;
    2)
        COMPOSE_FILE="docker-compose.yml"
        MODE="production"
        ;;
    3)
        COMPOSE_FILE="docker-compose.prod.yml"
        MODE="production with Nginx"
        ;;
    *)
        echo -e "${RED}Invalid choice. Using production mode.${NC}"
        COMPOSE_FILE="docker-compose.yml"
        MODE="production"
        ;;
esac

echo ""
echo -e "${GREEN}Starting EvalEase in $MODE mode...${NC}"
echo ""

# Pull latest images
echo "Pulling Docker images..."
docker-compose -f $COMPOSE_FILE pull

# Build and start services
echo "Building and starting services..."
docker-compose -f $COMPOSE_FILE up -d --build

# Wait for services to be healthy
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check service health
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose -f $COMPOSE_FILE ps | grep -q "healthy"; then
        break
    fi
    echo "Waiting for services... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}Services are taking longer than expected. Checking logs...${NC}"
    docker-compose -f $COMPOSE_FILE logs --tail=50
fi

echo ""
echo -e "${GREEN}✓ Services are running!${NC}"
echo ""

# Run migrations if in production mode
if [ "$MODE" != "development" ]; then
    echo "Running database migrations..."
    sleep 5
    docker-compose -f $COMPOSE_FILE exec -T app npx drizzle-kit push || echo -e "${YELLOW}Migration failed. You may need to run it manually.${NC}"
fi

# Show status
echo ""
echo "=========================================="
echo "   Deployment Status"
echo "=========================================="
docker-compose -f $COMPOSE_FILE ps
echo ""

# Show access information
echo "=========================================="
echo "   Access Information"
echo "=========================================="
if [ "$choice" == "3" ]; then
    echo -e "${GREEN}Application URL: http://localhost${NC}"
    echo -e "${GREEN}Direct App URL: http://localhost:3000${NC}"
else
    echo -e "${GREEN}Application URL: http://localhost:3000${NC}"
fi
echo ""
echo "To view logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "To stop: docker-compose -f $COMPOSE_FILE down"
echo "To restart: docker-compose -f $COMPOSE_FILE restart"
echo ""

# Ask if user wants to seed data
read -p "Do you want to seed initial data? (y/n): " seed_choice
if [ "$seed_choice" == "y" ] || [ "$seed_choice" == "Y" ]; then
    echo ""
    echo "Seeding data..."
    docker-compose -f $COMPOSE_FILE exec app npm run seed || echo -e "${YELLOW}Seeding failed. You can run it manually later.${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "   Deployment Complete! 🎉"
echo "==========================================${NC}"
echo ""
