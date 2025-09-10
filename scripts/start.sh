#!/bin/bash

# RYTHM Development Environment Startup Script
set -e

echo "🚀 Starting RYTHM development environment..."

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rythm
DB_USER=rythm_api
DB_PASSWORD=password

# JWT
JWT_SECRET=your-development-secret-key-change-in-production

# API
API_URL=http://localhost:3001
PORT=3001

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3002

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
    echo "✅ Created .env file with default development settings"
fi

# Build Docker images (only if they don't exist or if forced)
if [ "$1" = "--build" ] || [ ! "$(docker images -q rythm-api 2> /dev/null)" ]; then
    echo "🔨 Building Docker images..."
    docker-compose build
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
while ! docker-compose exec -T db pg_isready -U rythm_api -d rythm &> /dev/null; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "❌ Database failed to start within 60 seconds"
        exit 1
    fi
    sleep 1
done

# Run database migrations
echo "🗃️ Running database migrations..."
docker-compose exec -T api npm run db:migrate --workspace=@rythm/db

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Show service status
echo ""
echo "✅ RYTHM development environment is ready!"
echo ""
echo "🔗 Services:"
echo "   📊 Mobile PWA:    http://localhost:3000"
echo "    API Server:    http://localhost:3001"
echo "   🗃️  Database:      localhost:5432"
echo ""
echo "📋 Useful commands:"
echo "   Stop services:    npm run dev:down"
echo "   View all logs:    npm run dev:logs"
echo "   View API logs:    npm run dev:logs:api"
echo "   View mobile logs: npm run dev:logs:mobile"
echo "   Restart API:      npm run dev:restart:api"
echo "   Restart mobile:   npm run dev:restart:mobile"
echo "   Database shell:   npm run dev:shell:db"
echo "   API shell:        npm run dev:shell:api"
echo "   Service status:   npm run dev:status"
echo ""

# Check service health
echo "🔍 Checking service health..."
sleep 5

# Check API health
if curl -sf http://localhost:3001/health > /dev/null; then
    echo "✅ API is healthy"
else
    echo "⚠️  API health check failed - it may still be starting up"
fi

# Check if mobile app is responding
if curl -sf http://localhost:3000 > /dev/null; then
    echo "✅ Mobile app is responding"
else
    echo "⚠️  Mobile app health check failed - it may still be starting up"
fi

echo ""
echo "🎉 Setup complete! Happy coding!"