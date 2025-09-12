#!/bin/bash

# Test Data Generation Script Runner for RYTHM
# This script sets up the environment and runs the test data generator

set -e

echo "🏋️  RYTHM Test Data Generator"
echo "============================"

# Check if Docker containers are running
echo "Checking Docker containers..."
if ! docker ps | grep -q "rythm-db-1"; then
    echo "❌ Database container is not running. Please start with: docker-compose up db -d"
    exit 1
fi

echo "✅ Database container is running"

# Set environment variables for database connection
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=rythm
export DB_USER=rythm_api
export DB_PASSWORD=password

echo "🔧 Environment configured"

# Check if node_modules exists in the project root
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the test data generator
echo "🚀 Running test data generator..."
echo ""

node scripts/generate-test-data.js

echo ""
echo "✅ Test data generation completed!"
echo ""
echo "You can now test the application with:"
echo "  📧 lars-olof@allerhed.com / Password123"
echo "  📧 caroline@allerhed.com / Password123"
echo ""
echo "Access the applications at:"
echo "  🌐 User App: http://localhost:3000"
echo "  ⚙️  Admin: http://localhost:3002"
echo "  🔌 API: http://localhost:3001"