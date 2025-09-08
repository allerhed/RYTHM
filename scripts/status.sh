#!/bin/bash

# Check Docker environment status

echo "🔍 RYTHM Docker Environment Status"
echo "================================="
echo ""

# Check Docker
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    exit 1
else
    echo "✅ Docker is running"
fi

# Check database container
if docker-compose ps db | grep -q "Up"; then
    echo "✅ PostgreSQL container is running"
    
    # Test database connection
    if docker-compose exec -T db pg_isready -U rythm_api -d rythm &> /dev/null; then
        echo "✅ Database is accepting connections"
        
        # Show table count
        TABLE_COUNT=$(docker-compose exec -T db psql -U rythm_api -d rythm -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        echo "📊 Database has $TABLE_COUNT tables"
    else
        echo "❌ Database is not accepting connections"
    fi
else
    echo "❌ PostgreSQL container is not running"
    echo "💡 Start with: docker-compose up -d db"
fi

# Check if development servers are running
if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API server is running (http://localhost:3001)"
else
    echo "❌ API server is not running"
    echo "💡 Start with: npm run dev"
fi

if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Mobile app is running (http://localhost:3000)"
else
    echo "❌ Mobile app is not running"
    echo "💡 Start with: npm run dev"
fi

echo ""
echo "🐳 Docker Services:"
docker-compose ps 2>/dev/null || echo "No Docker services found"

echo ""
echo "📋 Useful Commands:"
echo "   Start database:      docker-compose up -d db"
echo "   Start dev servers:   npm run dev"
echo "   Stop all:            docker-compose down"
echo "   View DB logs:        docker-compose logs db"
echo "   Database shell:      docker-compose exec db psql -U rythm_api -d rythm"