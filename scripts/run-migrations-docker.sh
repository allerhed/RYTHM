#!/bin/bash

# Docker migration script

echo "Starting database migrations with Docker..."

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if database container is running
if ! docker-compose ps db | grep -q "Up"; then
    echo "Error: Database container is not running. Please start it with 'docker-compose up -d db'"
    exit 1
fi

echo "Connected to Docker PostgreSQL container"

# Run migrations in order
for migration_file in packages/db/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        echo "Running migration: $(basename "$migration_file")"
        if docker-compose exec -T db psql -U rythm_api -d rythm -f "/docker-entrypoint-initdb.d/$(basename "$migration_file")"; then
            echo "✓ Migration $(basename "$migration_file") completed successfully"
        else
            echo "✗ Migration $(basename "$migration_file") failed"
            exit 1
        fi
    fi
done

echo "All migrations completed successfully!"