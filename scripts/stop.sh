#!/bin/bash

# RYTHM Development Environment Stop Script
set -e

echo "🛑 Stopping RYTHM development environment..."

# Stop and remove containers
echo "🐳 Stopping Docker services..."
docker-compose down

# Prompt for volume removal
read -p "🗃️ Do you want to remove database volumes? This will delete all data! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removing volumes..."
    docker-compose down -v
    echo "✅ Volumes removed"
else
    echo "📦 Database volumes preserved"
fi

# Optional: Remove images
read -p "🗑️ Do you want to remove Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removing Docker images..."
    docker-compose down --rmi all
    echo "✅ Images removed"
fi

echo ""
echo "✅ RYTHM development environment stopped"
echo ""
echo "🔗 To start again, run: ./scripts/start.sh"