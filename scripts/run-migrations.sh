#!/bin/bash

# Migration script for Unix/Linux/macOS

echo "Starting database migrations..."

# Check if required environment variables are set
if [ -z "$POSTGRES_HOST" ] || [ -z "$POSTGRES_DATABASE" ] || [ -z "$POSTGRES_ADMIN_LOGIN" ] || [ -z "$POSTGRES_ADMIN_PASSWORD" ]; then
    echo "Error: Required environment variables not set"
    echo "Please ensure POSTGRES_HOST, POSTGRES_DATABASE, POSTGRES_ADMIN_LOGIN, and POSTGRES_ADMIN_PASSWORD are set"
    exit 1
fi

# Create database connection string
export PGPASSWORD="$POSTGRES_ADMIN_PASSWORD"
export PGHOST="$POSTGRES_HOST"
export PGPORT="5432"
export PGUSER="$POSTGRES_ADMIN_LOGIN"
export PGDATABASE="$POSTGRES_DATABASE"

echo "Connecting to PostgreSQL server: $POSTGRES_HOST"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql not found. Please install PostgreSQL client tools."
    exit 1
fi

# Test connection
if ! psql -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Error: Could not connect to database"
    exit 1
fi

echo "Connected successfully!"

# Run migrations in order
for migration_file in packages/db/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        echo "Running migration: $(basename "$migration_file")"
        if psql -f "$migration_file"; then
            echo "✓ Migration $(basename "$migration_file") completed successfully"
        else
            echo "✗ Migration $(basename "$migration_file") failed"
            exit 1
        fi
    fi
done

echo "All migrations completed successfully!"