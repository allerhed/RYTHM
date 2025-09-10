#!/bin/bash

# RYTHM Development Environment Health Check
set -e

echo "🔍 RYTHM Development Environment Health Check"
echo "=============================================="

# Check if Docker is running
echo -n "Docker daemon: "
if docker info &> /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running - Please start Docker Desktop"
    exit 1
fi

# Check if docker-compose is available
echo -n "Docker Compose: "
if command -v docker-compose &> /dev/null; then
    echo "✅ Available"
else
    echo "❌ Not installed"
    exit 1
fi

# Check Docker Compose services
echo ""
echo "📊 Service Status:"
if docker-compose ps --format table | grep -q "Up"; then
    docker-compose ps --format table
    echo ""
    
    # Check service health
    echo "🏥 Health Checks:"
    
    # Check API health
    echo -n "API Server (localhost:3001): "
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Healthy"
    else
        echo "❌ Not responding"
    fi
    
    # Check Frontend health
    echo -n "Frontend (localhost:3000): "
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Responding"
    else
        echo "❌ Not responding"
    fi
    
    # Check Database connection
    echo -n "Database connection: "
    if docker-compose exec -T db pg_isready -U rythm_api -d rythm > /dev/null 2>&1; then
        echo "✅ Connected"
    else
        echo "❌ Connection failed"
    fi
    
else
    echo "No services running. Start with: npm run dev"
fi

echo ""
echo "🔗 Service URLs:"
echo "   📊 Frontend:  http://localhost:3000"
echo "   🔌 API:       http://localhost:3001"
echo "   ❤️  API Health: http://localhost:3001/health"

echo ""
echo "📋 Quick Commands:"
echo "   Start dev:    npm run dev"
echo "   View logs:    npm run dev:logs"
echo "   Stop dev:     npm run dev:down"
echo "   Service status: npm run dev:status"