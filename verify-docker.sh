#!/bin/bash

# Docker Setup Verification Script
# This script verifies that all containers are running correctly

set -e

echo "🐳 Docker Containerization Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker Compose is available
echo "1. Checking Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi
if ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose v2 is not available${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker and Docker Compose are available${NC}"
echo ""

# Check if containers are running
echo "2. Checking container status..."
if ! docker compose ps | grep -q "claud-frontend.*Up"; then
    echo -e "${RED}✗ Frontend container is not running${NC}"
    exit 1
fi
if ! docker compose ps | grep -q "claud-backend.*Up"; then
    echo -e "${RED}✗ Backend container is not running${NC}"
    exit 1
fi
if ! docker compose ps | grep -q "claud-postgres.*Up.*healthy"; then
    echo -e "${RED}✗ PostgreSQL container is not running or unhealthy${NC}"
    exit 1
fi
echo -e "${GREEN}✓ All containers are running${NC}"
echo ""

# Check frontend accessibility
echo "3. Testing Frontend (http://localhost:5173)..."
if curl -s -f http://localhost:5173/ > /dev/null; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend is not accessible${NC}"
    exit 1
fi
echo ""

# Check backend API
echo "4. Testing Backend API (http://localhost:3000)..."
if curl -s -f http://localhost:3000/ > /dev/null; then
    echo -e "${GREEN}✓ Backend root endpoint is accessible${NC}"
else
    echo -e "${RED}✗ Backend is not accessible${NC}"
    exit 1
fi
echo ""

# Check backend health endpoint
echo "5. Testing Backend Health Endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    exit 1
fi
echo ""

# Check inter-container communication
echo "6. Testing inter-container communication..."
if docker exec claud-frontend sh -c "bun -e \"const res = await fetch('http://backend:3000/api/health'); console.log(await res.text());\"" 2>&1 | grep -q "healthy"; then
    echo -e "${GREEN}✓ Frontend can communicate with backend${NC}"
else
    echo -e "${RED}✗ Frontend cannot communicate with backend${NC}"
    exit 1
fi
echo ""

# Check network configuration
echo "7. Checking network configuration..."
if docker network inspect claud_claud-network &> /dev/null; then
    echo -e "${GREEN}✓ Docker network 'claud_claud-network' exists${NC}"
else
    echo -e "${RED}✗ Docker network 'claud_claud-network' not found${NC}"
    exit 1
fi
echo ""

# Check volumes
echo "8. Checking volumes..."
if docker volume inspect claud_postgres_data &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL data volume exists${NC}"
else
    echo -e "${RED}✗ PostgreSQL data volume not found${NC}"
    exit 1
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✓ All verification checks passed!${NC}"
echo ""
echo "Your Docker containerization is working correctly:"
echo "  • Frontend:  http://localhost:5173"
echo "  • Backend:   http://localhost:3000"
echo "  • Health:    http://localhost:3000/api/health"
echo "  • Database:  localhost:5432"
echo ""
echo "Tips:"
echo "  • View logs:     docker compose logs -f"
echo "  • Restart:       docker compose restart"
echo "  • Stop:          docker compose down"
echo "  • Clean slate:   docker compose down -v"
echo ""
